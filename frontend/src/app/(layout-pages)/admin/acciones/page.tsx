"use client";

import * as React from "react";
import {
  Award,
  Users,
  ArrowRightLeft,
  Search,
  RefreshCw,
  Printer,
  TrendingUp,
  Info,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  ShieldCheck,
  Building2,
  Eye,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ResumenMatricula {
  totalAccionesEmitidas: number;
  totalAccionesActivas: number;
  totalAccionesDevueltas: number;
  capitalSocialActivo: number;
  totalSociosConAcciones: number;
  totalCertificadosEmitidos: number;
  maxSerieEmitida: number;
  valorNominalPorAccion?: number;
}

interface ResumenSocioAcciones {
  socioId: string;
  socioCodigo: number;
  socioNombre: string;
  socioEstado?: string;
  totalAccionesActivas: number;
  totalCapitalAportado: number;
  totalCertificados: number;
  seriesRangosTexto: string;
  porcentajeParticipacion: number;
}

interface CertificadoAccion {
  id: string;
  numeroCertificado: number;
  socioId: string | null;
  socioCodigo: number | null;
  socioNombre: string;
  serieInicio: number;
  serieFin: number;
  cantidad: number;
  valorNominal: number;
  totalMonto: number;
  fechaEmision: string;
  periodoId: string | null;
  operacionId: string | null;
  estado: "ACTIVO" | "DEVUELTO_RETIRO" | "TRANSFERIDO";
  tipoOrigen: string;
  certificadoOrigenId: string | null;
  observaciones: string | null;
}

interface TransferenciaAccion {
  id: string;
  numeroTransferencia: number;
  socioOrigenId: string | null;
  socioOrigenCodigo: number | null;
  socioOrigenNombre: string;
  socioDestinoId: string | null;
  socioDestinoCodigo: number | null;
  socioDestinoNombre: string;
  certificadoOrigenId: string | null;
  certificadoOrigenNumero: number | null;
  certificadoDestinoId: string | null;
  certificadoDestinoNumero: number | null;
  serieInicio: number;
  serieFin: number;
  cantidad: number;
  precioUnitario: number;
  totalMonto: number;
  fecha: string;
  motivo: string;
  documentoActa: string | null;
  observaciones: string | null;
}

export default function AccionesPage() {
  const [resumen, setResumen] = React.useState<ResumenMatricula | null>(null);
  const [socios, setSocios] = React.useState<ResumenSocioAcciones[]>([]);
  const [certificados, setCertificados] = React.useState<CertificadoAccion[]>([]);
  const [transferencias, setTransferencias] = React.useState<TransferenciaAccion[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filtros
  const [searchSocio, setSearchSocio] = React.useState("");
  const [searchCert, setSearchCert] = React.useState("");
  const [filtroEstadoCert, setFiltroEstadoCert] = React.useState<string>("TODOS");
  const [activeTab, setActiveTab] = React.useState("socios");

  // Modal de Transferencia
  const [modalTransferencia, setModalTransferencia] = React.useState(false);
  const [guardandoTransferencia, setGuardandoTransferencia] = React.useState(false);
  const [socioOrigenSeleccionado, setSocioOrigenSeleccionado] = React.useState<string>("");
  const [certificadosOrigenDisponibles, setCertificadosOrigenDisponibles] = React.useState<CertificadoAccion[]>([]);
  const [formTransferencia, setFormTransferencia] = React.useState({
    certificadoOrigenId: "",
    socioDestinoId: "",
    cantidad: 1,
    precioUnitario: 30.0,
    fecha: new Date().toISOString().split("T")[0],
    motivo: "VENTA_ENTRE_SOCIOS",
    documentoActa: "",
    observaciones: "",
  });

  // Modal Ver Certificado Formal
  const [certificadoSeleccionado, setCertificadoSeleccionado] = React.useState<CertificadoAccion | null>(null);

  const cargarDatos = React.useCallback(async () => {
    try {
      setLoading(true);
      const [resResumen, resSocios, resCerts, resTrans] = await Promise.all([
        fetch("/api/acciones/resumen").then((r) => r.json()),
        fetch("/api/acciones/socios").then((r) => r.json()),
        fetch("/api/acciones/certificados").then((r) => r.json()),
        fetch("/api/acciones/transferencias").then((r) => r.json()),
      ]);

      if (resResumen && !resResumen.detail) setResumen(resResumen);
      if (Array.isArray(resSocios)) {
        const totalActivas = resResumen?.totalAccionesActivas || 2246;
        const mapped: ResumenSocioAcciones[] = resSocios.map((s: any) => ({
          socioId: s.socioId,
          socioCodigo: s.socioCodigo,
          socioNombre: s.socioNombre,
          socioEstado: s.socioEstado,
          totalAccionesActivas: s.totalAcciones ?? 0,
          totalCapitalAportado: s.capitalSocial ?? 0,
          totalCertificados: s.totalCertificados ?? 0,
          seriesRangosTexto: Array.isArray(s.rangosSeries) ? s.rangosSeries.join(", ") : "",
          porcentajeParticipacion: totalActivas > 0 ? ((s.totalAcciones ?? 0) / totalActivas) * 100 : 0,
        }));
        setSocios(mapped);
      }
      if (Array.isArray(resCerts)) setCertificados(resCerts);
      if (Array.isArray(resTrans)) setTransferencias(resTrans);
    } catch (err: any) {
      toast.error("Error al cargar datos de matrícula de acciones");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Al cambiar el socio de origen en el modal, filtrar sus certificados activos
  React.useEffect(() => {
    if (!socioOrigenSeleccionado) {
      setCertificadosOrigenDisponibles([]);
      setFormTransferencia((prev) => ({ ...prev, certificadoOrigenId: "" }));
      return;
    }
    const certs = certificados.filter(
      (c) => c.socioId === socioOrigenSeleccionado && c.estado === "ACTIVO"
    );
    setCertificadosOrigenDisponibles(certs);
    if (certs.length > 0) {
      setFormTransferencia((prev) => ({
        ...prev,
        certificadoOrigenId: certs[0].id,
        cantidad: Math.min(prev.cantidad || 1, certs[0].cantidad),
      }));
    } else {
      setFormTransferencia((prev) => ({ ...prev, certificadoOrigenId: "" }));
    }
  }, [socioOrigenSeleccionado, certificados]);

  const certOrigenActual = React.useMemo(() => {
    return certificadosOrigenDisponibles.find((c) => c.id === formTransferencia.certificadoOrigenId);
  }, [certificadosOrigenDisponibles, formTransferencia.certificadoOrigenId]);

  const handleCrearTransferencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTransferencia.certificadoOrigenId) {
      toast.error("Seleccione el certificado de origen");
      return;
    }
    if (!formTransferencia.socioDestinoId) {
      toast.error("Seleccione el socio adquirente/destino");
      return;
    }
    if (socioOrigenSeleccionado === formTransferencia.socioDestinoId) {
      toast.error("El socio de origen y destino no pueden ser el mismo");
      return;
    }
    if (!certOrigenActual || formTransferencia.cantidad > certOrigenActual.cantidad || formTransferencia.cantidad <= 0) {
      toast.error(`Cantidad inválida. Máximo disponible en este certificado: ${certOrigenActual?.cantidad || 0}`);
      return;
    }

    try {
      setGuardandoTransferencia(true);
      const res = await fetch("/api/acciones/transferencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificadoOrigenId: formTransferencia.certificadoOrigenId,
          socioDestinoId: formTransferencia.socioDestinoId,
          cantidad: Number(formTransferencia.cantidad),
          precioUnitario: Number(formTransferencia.precioUnitario),
          fecha: formTransferencia.fecha,
          motivo: formTransferencia.motivo,
          documentoActa: formTransferencia.documentoActa || null,
          observaciones: formTransferencia.observaciones || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || "Error al registrar transferencia");

      toast.success(`Transferencia #${data.numeroTransferencia} registrada exitosamente`);
      setModalTransferencia(false);
      await cargarDatos();
    } catch (err: any) {
      toast.error(err.message || "Error al procesar transferencia");
    } finally {
      setGuardandoTransferencia(false);
    }
  };

  const sociosFiltrados = React.useMemo(() => {
    if (!searchSocio.trim()) return socios;
    const term = searchSocio.toLowerCase();
    return socios.filter(
      (s) =>
        s.socioNombre.toLowerCase().includes(term) ||
        s.socioCodigo.toString().includes(term) ||
        s.seriesRangosTexto.toLowerCase().includes(term)
    );
  }, [socios, searchSocio]);

  const certificadosFiltrados = React.useMemo(() => {
    return certificados.filter((c) => {
      const matchEstado = filtroEstadoCert === "TODOS" || c.estado === filtroEstadoCert;
      const matchSearch =
        !searchCert.trim() ||
        c.socioNombre.toLowerCase().includes(searchCert.toLowerCase()) ||
        c.numeroCertificado.toString().includes(searchCert) ||
        `#${c.serieInicio} - #${c.serieFin}`.includes(searchCert);
      return matchEstado && matchSearch;
    });
  }, [certificados, filtroEstadoCert, searchCert]);

  const formatMoneda = (val: number | null | undefined) => {
    return `S/ ${Number(val || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 p-2 md:p-6 pb-16">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Award className="size-8 text-primary" />
              Matrícula y Control de Acciones
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Correlativo Fijo
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Libro oficial de aportaciones de capital, series correlativas fijas (#1 al #{resumen?.maxSerieEmitida || 3261}) y trazabilidad de certificados por transferencias.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={cargarDatos} disabled={loading} className="gap-2">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Actualizar
          </Button>

          <Button
            size="sm"
            onClick={() => setModalTransferencia(true)}
            className="gap-2 bg-primary text-primary-foreground shadow"
          >
            <ArrowRightLeft className="size-4" />
            Registrar Traspaso / Venta
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Acciones en Circulación</span>
              <Coins className="size-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {resumen?.totalAccionesActivas?.toLocaleString("es-PE") ?? "..."} <span className="text-sm font-normal text-muted-foreground">acciones</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="size-3.5" />
              Capital Social: {formatMoneda(resumen?.capitalSocialActivo)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              En poder de {resumen?.totalSociosConAcciones ?? 0} socios activos
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Acciones Canceladas / Devueltas</span>
              <Building2 className="size-4 text-rose-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {resumen?.totalAccionesDevueltas?.toLocaleString("es-PE") ?? "..."} <span className="text-sm font-normal text-muted-foreground">acciones</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-medium text-rose-600 dark:text-rose-400">
              Valor Liquidado: {formatMoneda((resumen?.totalAccionesDevueltas || 0) * 30)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Títulos rescatados y devueltos a la Caja por socios que se retiraron
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Series Emitidas</span>
              <ShieldCheck className="size-4 text-blue-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              #1 al #{resumen?.maxSerieEmitida ?? "3,261"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Total Histórico: {formatMoneda((resumen?.totalAccionesEmitidas || 0) * 30)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {resumen?.totalAccionesEmitidas ?? 0} acciones nominales emitidas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Valor Estatutario</span>
              <Info className="size-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              S/ {Number(resumen?.valorNominalPorAccion || 30.0).toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-medium text-muted-foreground">
              1 Acción = S/ 30.00
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Indivisible y con derecho a voz, voto y utilidades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border">
          <TabsTrigger value="socios" className="gap-2">
            <Users className="size-4" />
            Matrícula por Socio ({socios.length})
          </TabsTrigger>
          <TabsTrigger value="certificados" className="gap-2">
            <FileCheck className="size-4" />
            Certificados Emitidos ({certificados.length})
          </TabsTrigger>
          <TabsTrigger value="transferencias" className="gap-2">
            <ArrowRightLeft className="size-4" />
            Historial de Transferencias ({transferencias.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Matrícula por Socio */}
        <TabsContent value="socios" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Padrón de Accionistas y Participación</CardTitle>
                  <CardDescription>
                    Distribución de acciones activas, capital aportado y rangos de series de cada socio.
                  </CardDescription>
                </div>
                <div className="w-full sm:w-72">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por socio o serie..."
                      value={searchSocio}
                      onChange={(e) => setSearchSocio(e.target.value)}
                      className="pl-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-16 text-center">Cód.</TableHead>
                      <TableHead>Socio Accionista</TableHead>
                      <TableHead className="text-right">Acciones Activas</TableHead>
                      <TableHead className="text-right">% Participación</TableHead>
                      <TableHead className="text-right">Capital Total (S/)</TableHead>
                      <TableHead className="text-center">Certificados</TableHead>
                      <TableHead>Series Asignadas</TableHead>
                      <TableHead className="text-center w-28">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Cargando matrícula de acciones...
                        </TableCell>
                      </TableRow>
                    ) : sociosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No se encontraron socios con los filtros indicados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sociosFiltrados.map((s) => (
                        <TableRow key={s.socioId} className="hover:bg-muted/30">
                          <TableCell className="text-center font-mono text-xs font-semibold">
                            #{s.socioCodigo}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">{s.socioNombre}</div>
                            {s.socioEstado === "RETIRADO" && (
                              <Badge variant="outline" className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 mt-0.5">
                                RETIRADO (ACCIONES DEVUELTAS)
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {s.totalAccionesActivas > 0 ? (
                              s.totalAccionesActivas.toLocaleString("es-PE")
                            ) : (
                              <span className="text-xs text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.totalAccionesActivas > 0 ? (
                              <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                                {Number(s.porcentajeParticipacion || 0).toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">0.00%</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {formatMoneda(s.totalCapitalAportado)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">
                              {s.totalCertificados} cert.
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground max-w-xs truncate" title={s.seriesRangosTexto}>
                            {s.totalAccionesActivas > 0 ? (
                              s.seriesRangosTexto
                            ) : (
                              <span className="text-xs text-rose-500 italic">Acciones liquidadas a Tesorería</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {s.totalAccionesActivas > 0 ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs gap-1"
                                onClick={() => {
                                  setSocioOrigenSeleccionado(s.socioId);
                                  setModalTransferencia(true);
                                }}
                              >
                                <ArrowRightLeft className="size-3.5" />
                                Traspasar
                              </Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">Liquidado</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Certificados Emitidos */}
        <TabsContent value="certificados" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Registro de Certificados de Acciones</CardTitle>
                  <CardDescription>
                    Certificados nominativos emitidos, rangos de series de cada título y estado legal.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Select value={filtroEstadoCert} onValueChange={setFiltroEstadoCert}>
                    <SelectTrigger className="w-36 text-xs h-9">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="ACTIVO">Activos</SelectItem>
                      <SelectItem value="DEVUELTO_RETIRO">Cancelados / Devueltos</SelectItem>
                      <SelectItem value="TRANSFERIDO">Transferidos</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por socio o N° cert..."
                      value={searchCert}
                      onChange={(e) => setSearchCert(e.target.value)}
                      className="pl-8 text-sm h-9"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-24">N° Certificado</TableHead>
                      <TableHead>Titular / Socio</TableHead>
                      <TableHead className="text-center">Series Comprendidas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                      <TableHead className="text-right">Total (S/)</TableHead>
                      <TableHead className="text-center">Fecha Emisión</TableHead>
                      <TableHead className="text-center">Origen</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center w-20">Ver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Cargando certificados...
                        </TableCell>
                      </TableRow>
                    ) : certificadosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No se encontraron certificados con los filtros aplicados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      certificadosFiltrados.map((c) => (
                        <TableRow key={c.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs font-bold text-foreground">
                            CERT-{c.numeroCertificado.toString().padStart(6, "0")}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">{c.socioNombre}</div>
                            {c.socioCodigo && (
                              <div className="text-[11px] text-muted-foreground">Código #{c.socioCodigo}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs font-semibold">
                            <span className="bg-muted px-2 py-0.5 rounded border">
                              #{c.serieInicio} al #{c.serieFin}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {c.cantidad}
                          </TableCell>
                          <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {formatMoneda(c.totalMonto)}
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {c.fechaEmision}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {c.tipoOrigen.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {c.estado === "ACTIVO" ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                                ACTIVO
                              </Badge>
                            ) : c.estado === "DEVUELTO_RETIRO" ? (
                              <Badge variant="outline" className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-xs font-semibold">
                                CANCELADO / DEVUELTO
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-xs">
                                TRANSFERIDO
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Ver Certificado Imprimible"
                              onClick={() => setCertificadoSeleccionado(c)}
                            >
                              <Eye className="size-4 text-primary" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Historial de Transferencias */}
        <TabsContent value="transferencias" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Libro de Trazabilidad y Transferencias</CardTitle>
              <CardDescription>
                Historial cronológico de cesiones, liquidaciones por retiro y ventas de acciones entre socios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-24">N° Transf.</TableHead>
                      <TableHead className="text-center">Fecha</TableHead>
                      <TableHead>Socio Cedente (Origen)</TableHead>
                      <TableHead>Socio Adquirente (Destino)</TableHead>
                      <TableHead className="text-center">Series Cedidas</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Monto (S/)</TableHead>
                      <TableHead>Motivo / Observación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Cargando historial de transferencias...
                        </TableCell>
                      </TableRow>
                    ) : transferencias.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No hay transferencias registradas todavía.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transferencias.map((t) => (
                        <TableRow key={t.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs font-bold text-foreground">
                            TRF-{t.numeroTransferencia.toString().padStart(6, "0")}
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {t.fecha}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {t.socioOrigenNombre}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {t.socioDestinoNombre}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs font-semibold">
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                              #{t.serieInicio} al #{t.serieFin}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {t.cantidad} acc.
                          </TableCell>
                          <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {formatMoneda(t.totalMonto)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={t.observaciones || t.motivo}>
                            <Badge variant="outline" className="text-[10px] mr-1">
                              {t.motivo}
                            </Badge>
                            {t.observaciones}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: Registrar Transferencia de Acciones */}
      <Dialog open={modalTransferencia} onOpenChange={setModalTransferencia}>
        <DialogContent className="max-w-xl">
          <form onSubmit={handleCrearTransferencia}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowRightLeft className="size-5 text-primary" />
                Registrar Traspaso / Venta de Acciones
              </DialogTitle>
              <DialogDescription>
                Transfiere títulos y series de un socio a otro manteniendo la correlación numérica fija del libro de acciones.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Socio Origen */}
              <div className="grid gap-2">
                <Label htmlFor="socioOrigen">Socio Cedente (Vendedor / Origen) *</Label>
                <Select
                  value={socioOrigenSeleccionado}
                  onValueChange={(val) => setSocioOrigenSeleccionado(val)}
                >
                  <SelectTrigger id="socioOrigen">
                    <SelectValue placeholder="Seleccione el socio que transfiere..." />
                  </SelectTrigger>
                  <SelectContent>
                    {socios.map((s) => (
                      <SelectItem key={s.socioId} value={s.socioId}>
                        #{s.socioCodigo} - {s.socioNombre} ({s.totalAccionesActivas} acciones disponibles)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Certificado de Origen */}
              {socioOrigenSeleccionado && (
                <div className="grid gap-2">
                  <Label htmlFor="certOrigen">Certificado a transferir *</Label>
                  <Select
                    value={formTransferencia.certificadoOrigenId}
                    onValueChange={(val) => {
                      const c = certificadosOrigenDisponibles.find((item) => item.id === val);
                      setFormTransferencia((prev) => ({
                        ...prev,
                        certificadoOrigenId: val,
                        cantidad: c ? Math.min(prev.cantidad || 1, c.cantidad) : 1,
                      }));
                    }}
                  >
                    <SelectTrigger id="certOrigen">
                      <SelectValue placeholder="Seleccione certificado..." />
                    </SelectTrigger>
                    <SelectContent>
                      {certificadosOrigenDisponibles.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          CERT-{c.numeroCertificado.toString().padStart(6, "0")} — {c.cantidad} acciones (Series #{c.serieInicio} al #{c.serieFin})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {certOrigenActual && (
                    <p className="text-xs text-muted-foreground">
                      Rango total del título: <strong>#{certOrigenActual.serieInicio}</strong> al <strong>#{certOrigenActual.serieFin}</strong> ({certOrigenActual.cantidad} acciones).
                    </p>
                  )}
                </div>
              )}

              {/* Socio Destino */}
              <div className="grid gap-2">
                <Label htmlFor="socioDestino">Socio Adquirente (Comprador / Destino) *</Label>
                <Select
                  value={formTransferencia.socioDestinoId}
                  onValueChange={(val) => setFormTransferencia((prev) => ({ ...prev, socioDestinoId: val }))}
                >
                  <SelectTrigger id="socioDestino">
                    <SelectValue placeholder="Seleccione el socio que recibe las acciones..." />
                  </SelectTrigger>
                  <SelectContent>
                    {socios
                      .filter((s) => s.socioId !== socioOrigenSeleccionado)
                      .map((s) => (
                        <SelectItem key={s.socioId} value={s.socioId}>
                          #{s.socioCodigo} - {s.socioNombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cantidad y Precio */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cantidad">Cantidad de Acciones *</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min={1}
                    max={certOrigenActual?.cantidad || 1000}
                    value={formTransferencia.cantidad}
                    onChange={(e) =>
                      setFormTransferencia((prev) => ({
                        ...prev,
                        cantidad: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                  {certOrigenActual && formTransferencia.cantidad < certOrigenActual.cantidad && (
                    <p className="text-[11px] text-blue-600 dark:text-blue-400">
                      ℹ Desdoblamiento automático: el cedente retendrá {certOrigenActual.cantidad - formTransferencia.cantidad} acciones.
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="precioUnitario">Precio Unitario (S/) *</Label>
                  <Input
                    id="precioUnitario"
                    type="number"
                    step="0.01"
                    min={1}
                    value={formTransferencia.precioUnitario}
                    onChange={(e) =>
                      setFormTransferencia((prev) => ({
                        ...prev,
                        precioUnitario: parseFloat(e.target.value) || 30.0,
                      }))
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Total: {formatMoneda(formTransferencia.cantidad * formTransferencia.precioUnitario)}
                  </p>
                </div>
              </div>

              {/* Fecha y Motivo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fecha">Fecha de Operación *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formTransferencia.fecha}
                    onChange={(e) => setFormTransferencia((prev) => ({ ...prev, fecha: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="motivo">Motivo *</Label>
                  <Select
                    value={formTransferencia.motivo}
                    onValueChange={(val) => setFormTransferencia((prev) => ({ ...prev, motivo: val }))}
                  >
                    <SelectTrigger id="motivo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VENTA_ENTRE_SOCIOS">Venta entre Socios</SelectItem>
                      <SelectItem value="CESION_DERECHOS">Cesión de Derechos</SelectItem>
                      <SelectItem value="REASIGNACION_RETIRO">Reasignación por Retiro</SelectItem>
                      <SelectItem value="ACUERDO_ASAMBLEA">Acuerdo de Asamblea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="acta">N° Acta / Documento de Respaldo</Label>
                <Input
                  id="acta"
                  placeholder="Ej: Acta Asamblea General Ordinaria 12-2026"
                  value={formTransferencia.documentoActa}
                  onChange={(e) => setFormTransferencia((prev) => ({ ...prev, documentoActa: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="observaciones">Observaciones adicionales</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Detalles sobre el acuerdo de compraventa..."
                  rows={2}
                  value={formTransferencia.observaciones}
                  onChange={(e) => setFormTransferencia((prev) => ({ ...prev, observaciones: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalTransferencia(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardandoTransferencia}>
                {guardandoTransferencia ? "Procesando..." : "Confirmar y Transferir"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Visualización de Certificado Formal (Diploma Imprimible) */}
      <Dialog open={!!certificadoSeleccionado} onOpenChange={(open) => !open && setCertificadoSeleccionado(null)}>
        <DialogContent className="max-w-2xl print:m-0 print:p-0 print:border-none print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center justify-between">
              <span>Certificado de Aportación Nominativa</span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => window.print()}
              >
                <Printer className="size-4" />
                Imprimir
              </Button>
            </DialogTitle>
          </DialogHeader>

          {certificadoSeleccionado && (
            <div className="border-4 border-double border-primary/40 bg-card p-6 md:p-8 rounded-lg shadow-sm text-center relative overflow-hidden my-2">
              {/* Marca de Agua de Fondo */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <Building2 className="w-96 h-96" />
              </div>

              {/* Sello de Título Cancelado / Devuelto */}
              {certificadoSeleccionado.estado === "DEVUELTO_RETIRO" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-22deg] border-4 border-rose-600/80 text-rose-600 px-6 py-2.5 rounded-lg font-bold text-2xl md:text-3xl tracking-widest uppercase pointer-events-none z-20 shadow-lg bg-rose-50/85 dark:bg-rose-950/85 backdrop-blur-[1px]">
                  CANCELADO / DEVUELTO
                </div>
              )}

              <div className="border-b-2 border-primary/20 pb-4 mb-6">
                <h2 className="text-xl md:text-2xl font-serif font-bold tracking-wide text-foreground uppercase">
                  Caja Comunal Emprende Chambala
                </h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">
                  Asociación Comunal de Ahorro y Crédito
                </p>
                <div className="mt-3 inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider">
                  CERTIFICADO DE ACCIONES N° {certificadoSeleccionado.numeroCertificado.toString().padStart(6, "0")}
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic mb-4">
                El presente título certifica que
              </p>

              <h3 className="text-xl md:text-2xl font-bold text-foreground font-serif border-b border-muted pb-2 mb-4 mx-8">
                {certificadoSeleccionado.socioNombre}
              </h3>

              <p className="text-xs md:text-sm text-muted-foreground mb-4">
                es titular legítimo de <span className="font-bold text-foreground">{certificadoSeleccionado.cantidad} ({certificadoSeleccionado.cantidad == 1 ? "UNA ACCIÓN" : `${certificadoSeleccionado.cantidad} ACCIONES`})</span> nominativas, de un valor nominal de <span className="font-semibold text-foreground">S/ {Number(certificadoSeleccionado.valorNominal).toFixed(2)} cada una</span>, que representan un capital social aportado de:
              </p>

              <div className="bg-muted/50 border border-primary/20 rounded-md py-3 px-6 my-4 inline-block">
                <span className="text-2xl md:text-3xl font-bold font-mono text-primary">
                  {formatMoneda(certificadoSeleccionado.totalMonto)}
                </span>
              </div>

              <div className="my-4 text-xs font-mono bg-muted/30 p-2.5 rounded border inline-block">
                Series Asignadas: <strong>#{certificadoSeleccionado.serieInicio}</strong> a la <strong>#{certificadoSeleccionado.serieFin}</strong>
              </div>

              <p className="text-[11px] text-muted-foreground mt-2 max-w-lg mx-auto">
                Las presentes acciones otorgan a su titular todos los derechos corporativos, de voz, voto y derecho a utilidades conforme a los estatutos sociales de la Caja.
              </p>

              <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-foreground/30 pt-2">
                  <div className="font-medium text-foreground">Presidente / Administrador</div>
                  <div className="text-[10px] text-muted-foreground">Caja Comunal Chambala</div>
                </div>
                <div className="border-t border-foreground/30 pt-2">
                  <div className="font-medium text-foreground">Tesorero General</div>
                  <div className="text-[10px] text-muted-foreground">Caja Comunal Chambala</div>
                </div>
              </div>

              <div className="mt-6 text-[10px] text-muted-foreground">
                Fecha de Emisión: {certificadoSeleccionado.fechaEmision} &bull; Estado:{" "}
                {certificadoSeleccionado.estado === "DEVUELTO_RETIRO" ? (
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    CANCELADO / DEVUELTO A TESORERÍA POR RETIRO DE SOCIO
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {certificadoSeleccionado.estado}
                  </span>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => setCertificadoSeleccionado(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
