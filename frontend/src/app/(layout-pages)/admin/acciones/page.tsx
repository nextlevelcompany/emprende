"use client";
import { getErrorMessage } from "@/lib/error-message";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  Users,
  ArrowRightLeft,
  Search,
  RefreshCw,
  TrendingUp,
  Calendar,
  Coins,
  ShieldCheck,
  Building2,
  FileCheck,
  FileDown,
  FileText,
  Info,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatFecha } from "@/lib/utils";
import {
  descargarCertificadoPDF,
  descargarCertificadosSocioPDF,
  descargarLoteCertificadosPDF,
  descargarReporteAccionesPorFechasPDF,
  type EmpresaPDFData,
} from "@/lib/certificados-pdf";

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

interface SocioAccionesApi {
  socioId: string;
  socioCodigo: number;
  socioNombre: string;
  socioEstado: string;
  totalAcciones?: number;
  capitalSocial?: number;
  totalCertificados?: number;
  rangosSeries?: string[];
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
  socioDocumentoTipo?: string | null;
  socioDocumentoNumero?: string | null;
}

interface Periodo {
  id: string;
  anio: number;
  mes: number;
  fechaReunion?: string;
  estado?: "ABIERTO" | "CERRADO" | string;
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Setiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

interface DirectivaCargo {
  id?: string;
  cargo: string;
  cargoTitulo: string;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  activo: boolean;
  orden: number;
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
  const [periodos, setPeriodos] = React.useState<Periodo[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filtros
  const [searchSocio, setSearchSocio] = React.useState("");
  const [searchCert, setSearchCert] = React.useState("");
  const [filtroEstadoCert, setFiltroEstadoCert] = React.useState<string>("TODOS");
  const [filtroFechaDesde, setFiltroFechaDesde] = React.useState<string>("");
  const [filtroFechaHasta, setFiltroFechaHasta] = React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState("socios");

  // Modal Descarga (General, Periodo Contable, Accionista)
  const [modalDescarga, setModalDescarga] = React.useState(false);
  const [descargaAlcance, setDescargaAlcance] = React.useState<"GENERAL" | "PERIODO" | "SOCIO">("GENERAL");
  const [selectedPeriodoId, setSelectedPeriodoId] = React.useState<string>("");
  const [selectedSocioId, setSelectedSocioId] = React.useState<string>("");
  const [searchSocioModal, setSearchSocioModal] = React.useState<string>("");
  const [descargaTipoModal, setDescargaTipoModal] = React.useState<"CERTIFICADOS" | "PADRON">("CERTIFICADOS");
  const [modalFechaDesde, setModalFechaDesde] = React.useState<string>("");
  const [modalFechaHasta, setModalFechaHasta] = React.useState<string>("");
  const [modalEstadoFiltro, setModalEstadoFiltro] = React.useState<string>("TODOS");

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

  const [directiva, setDirectiva] = React.useState<DirectivaCargo[]>([]);
  const [empresa, setEmpresa] = React.useState<EmpresaPDFData | null>(null);

  const cargarDatos = React.useCallback(async () => {
    try {
      setLoading(true);
      const t = Date.now();
      const [resResumen, resSocios, resCerts, resTrans, resDirectiva, resEmpresa, resPeriodos] = await Promise.all([
        fetch(`/api/acciones/resumen?t=${t}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/acciones/socios?t=${t}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/acciones/certificados?t=${t}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/acciones/transferencias?t=${t}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/directiva?soloActivos=true&t=${t}`, { cache: "no-store" }).then((r) => r.json()).catch(() => []),
        fetch(`/api/empresa?t=${t}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch(`/api/periodos?t=${t}`, { cache: "no-store" }).then((r) => r.json()).catch(() => []),
      ]);

      if (resResumen && !resResumen.detail) setResumen(resResumen);
      if (Array.isArray(resSocios)) {
        const totalActivas = Number(resResumen?.totalAccionesActivas) || 2246;
        const mapped: ResumenSocioAcciones[] = (resSocios as SocioAccionesApi[]).map((s) => ({
          socioId: s.socioId,
          socioCodigo: s.socioCodigo,
          socioNombre: s.socioNombre,
          socioEstado: s.socioEstado,
          totalAccionesActivas: Number(s.totalAcciones) || 0,
          totalCapitalAportado: Number(s.capitalSocial) || 0,
          totalCertificados: Number(s.totalCertificados) || 0,
          seriesRangosTexto: Array.isArray(s.rangosSeries) ? s.rangosSeries.join(", ") : "",
          porcentajeParticipacion: totalActivas > 0 ? ((Number(s.totalAcciones) || 0) / totalActivas) * 100 : 0,
        }));
        setSocios(mapped);
      }
      if (Array.isArray(resCerts)) setCertificados(resCerts);
      if (Array.isArray(resTrans)) setTransferencias(resTrans);
      if (Array.isArray(resDirectiva)) setDirectiva(resDirectiva);
      if (resEmpresa && !resEmpresa.detail) setEmpresa(resEmpresa);
      if (Array.isArray(resPeriodos)) {
        const sorted = [...resPeriodos].sort((a, b) => {
          if (b.anio !== a.anio) return b.anio - a.anio;
          return b.mes - a.mes;
        });
        setPeriodos(sorted);
        if (sorted.length > 0) {
          setSelectedPeriodoId((prev) => prev || sorted[0].id);
        }
      }
    } catch {
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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error al procesar transferencia"));
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
      const matchFechaDesde = !filtroFechaDesde || (c.fechaEmision && c.fechaEmision >= filtroFechaDesde);
      const matchFechaHasta = !filtroFechaHasta || (c.fechaEmision && c.fechaEmision <= filtroFechaHasta);
      return matchEstado && matchSearch && matchFechaDesde && matchFechaHasta;
    });
  }, [certificados, filtroEstadoCert, searchCert, filtroFechaDesde, filtroFechaHasta]);

  const certificadosModal = React.useMemo(() => {
    return certificados.filter((c) => {
      const matchEstado = modalEstadoFiltro === "TODOS" || c.estado === modalEstadoFiltro;
      if (!matchEstado) return false;

      if (descargaAlcance === "PERIODO") {
        if (!selectedPeriodoId) return false;
        const p = periodos.find((per) => per.id === selectedPeriodoId);
        const matchPeriodoId = c.periodoId === selectedPeriodoId;
        const matchPeriodoFecha =
          p && c.fechaEmision && c.fechaEmision.startsWith(`${p.anio}-${String(p.mes).padStart(2, "0")}`);
        return matchPeriodoId || matchPeriodoFecha;
      }

      if (descargaAlcance === "SOCIO") {
        if (!selectedSocioId) return false;
        return c.socioId === selectedSocioId;
      }

      const matchDesde = !modalFechaDesde || (c.fechaEmision && c.fechaEmision >= modalFechaDesde);
      const matchHasta = !modalFechaHasta || (c.fechaEmision && c.fechaEmision <= modalFechaHasta);
      return matchDesde && matchHasta;
    });
  }, [
    certificados,
    descargaAlcance,
    selectedPeriodoId,
    selectedSocioId,
    modalEstadoFiltro,
    modalFechaDesde,
    modalFechaHasta,
    periodos,
  ]);

  const handleDescargarModal = () => {
    if (descargaAlcance === "GENERAL" && modalFechaDesde && modalFechaHasta && modalFechaDesde > modalFechaHasta) {
      toast.error("La fecha inicial no puede ser posterior a la fecha final");
      return;
    }
    if (descargaAlcance === "PERIODO" && !selectedPeriodoId) {
      toast.error("Seleccione un periodo contable");
      return;
    }
    if (descargaAlcance === "SOCIO" && !selectedSocioId) {
      toast.error("Seleccione un accionista / socio");
      return;
    }
    if (certificadosModal.length === 0) {
      toast.warning("No se encontraron certificados con los criterios seleccionados");
      return;
    }

    try {
      let tituloReporte = "Certificados_Acciones_General";
      let subtitulo = "Histórico general acumulado de certificados de acciones";

      if (descargaAlcance === "PERIODO") {
        const p = periodos.find((per) => per.id === selectedPeriodoId);
        const nombreMes = p ? MESES[p.mes - 1] : "Periodo";
        const anio = p ? p.anio : "";
        tituloReporte = `Certificados_Acciones_${nombreMes}_${anio}`;
        subtitulo = `Periodo Contable: ${nombreMes} ${anio}${p?.fechaReunion ? ` (Reunión: ${formatFecha(p.fechaReunion)})` : ""}`;
      } else if (descargaAlcance === "SOCIO") {
        const s = socios.find((soc) => soc.socioId === selectedSocioId);
        const nombreSocio = s?.socioNombre || "Socio";
        tituloReporte = `Certificados_Acciones_Socio_${s?.socioCodigo || ""}_${nombreSocio}`;
        subtitulo = `Accionista: ${nombreSocio} (Cód. #${s?.socioCodigo || "—"})`;
      } else if (modalFechaDesde || modalFechaHasta) {
        tituloReporte = `Certificados_Acciones_${modalFechaDesde || "inicio"}_al_${modalFechaHasta || "actual"}`;
        subtitulo = `Período de emisión: ${modalFechaDesde ? formatFecha(modalFechaDesde) : "Inicio"} al ${modalFechaHasta ? formatFecha(modalFechaHasta) : "Actual"}`;
      }

      if (descargaTipoModal === "CERTIFICADOS") {
        descargarLoteCertificadosPDF(certificadosModal, directiva, tituloReporte, empresa);
        toast.success(
          `Se descargó el lote de ${certificadosModal.length} certificados oficiales en PDF`
        );
      } else {
        const tituloPadron = tituloReporte.replace("Certificados_", "Padron_");
        descargarReporteAccionesPorFechasPDF(
          certificadosModal,
          directiva,
          modalFechaDesde || undefined,
          modalFechaHasta || undefined,
          empresa,
          tituloPadron,
          subtitulo
        );
        toast.success(
          "Padrón y reporte de matrícula de acciones descargado exitosamente en PDF"
        );
      }
      setModalDescarga(false);
    } catch (err: unknown) {
      toast.error("Error al generar el archivo PDF: " + getErrorMessage(err, "error desconocido"));
    }
  };

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
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/admin/directiva">
              <UserCheck className="size-4" />
              Firmas Directiva
            </Link>
          </Button>

          <Button variant="outline" size="sm" onClick={cargarDatos} disabled={loading} className="gap-2">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Actualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDescargaAlcance("GENERAL");
              setModalFechaDesde(filtroFechaDesde || "");
              setModalFechaHasta(filtroFechaHasta || "");
              setModalDescarga(true);
            }}
            className="gap-2 border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold shadow-xs"
          >
            <FileDown className="size-4 text-emerald-600" />
            Descargar Certificados / Padrón
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
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                s.totalCertificados > 0 &&
                                  "cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors"
                              )}
                              title={
                                s.totalCertificados > 0
                                  ? "Ver certificados de este socio en pestaña de Certificados"
                                  : undefined
                              }
                              onClick={() => {
                                if (s.totalCertificados === 0) return;
                                setActiveTab("certificados");
                                setSearchCert(s.socioNombre);
                              }}
                            >
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
                            <div className="flex items-center justify-center gap-1.5">
                              {s.totalCertificados > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2.5 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10 shadow-sm font-medium"
                                  title="Descargar Certificado(s) de Acciones en PDF"
                                  onClick={() => {
                                    const certsDelSocio = certificados.filter(
                                      (c) => c.socioId === s.socioId
                                    );
                                    if (certsDelSocio.length === 0) {
                                      toast.error("No se encontraron certificados para este socio");
                                      return;
                                    }
                                    try {
                                      const nombreSocio = s.socioNombre || certsDelSocio[0]?.socioNombre || "Socio";
                                      const certsConNombre = certsDelSocio.map((c) => ({
                                        ...c,
                                        socioNombre: nombreSocio,
                                      }));
                                      descargarCertificadosSocioPDF(nombreSocio, certsConNombre, directiva, empresa);
                                      toast.success(
                                        certsConNombre.length === 1
                                          ? `Certificado de ${nombreSocio} descargado en PDF`
                                          : `${certsConNombre.length} certificados de ${nombreSocio} descargados en PDF`
                                      );
                                    } catch {
                                      toast.error("Error al generar el PDF del certificado");
                                    }
                                  }}
                                >
                                  <FileDown className="size-3.5" />
                                  <span>Descargar PDF</span>
                                </Button>
                              )}
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
                                !s.totalCertificados && (
                                  <span className="text-[11px] text-muted-foreground italic">Liquidado</span>
                                )
                              )}
                            </div>
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
                    Certificados nominativos oficiales con fecha institucional ({empresa?.fechaFundacion ? formatFecha(empresa.fechaFundacion) : "08/06/2021"}), rangos de series de cada título y estado legal.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Selector Fecha Desde */}
                  <div className="flex items-center gap-1.5 bg-background border rounded-md px-2.5 py-1 text-xs shadow-2xs">
                    <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground font-medium">Desde:</span>
                    <input
                      type="date"
                      value={filtroFechaDesde}
                      onChange={(e) => setFiltroFechaDesde(e.target.value)}
                      className="bg-transparent text-xs border-none focus:outline-none cursor-pointer"
                      title="Filtrar por fecha de emisión desde"
                    />
                  </div>

                  {/* Selector Fecha Hasta */}
                  <div className="flex items-center gap-1.5 bg-background border rounded-md px-2.5 py-1 text-xs shadow-2xs">
                    <span className="text-[11px] text-muted-foreground font-medium">Hasta:</span>
                    <input
                      type="date"
                      value={filtroFechaHasta}
                      onChange={(e) => setFiltroFechaHasta(e.target.value)}
                      className="bg-transparent text-xs border-none focus:outline-none cursor-pointer"
                      title="Filtrar por fecha de emisión hasta"
                    />
                  </div>

                  {(filtroFechaDesde || filtroFechaHasta) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFiltroFechaDesde("");
                        setFiltroFechaHasta("");
                      }}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      title="Limpiar filtro de fechas"
                    >
                      <X className="size-3.5 mr-1" />
                      Limpiar
                    </Button>
                  )}

                  <Select value={filtroEstadoCert} onValueChange={setFiltroEstadoCert}>
                    <SelectTrigger className="w-32 text-xs h-9">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="ACTIVO">Activos</SelectItem>
                      <SelectItem value="DEVUELTO_RETIRO">Cancelados</SelectItem>
                      <SelectItem value="TRANSFERIDO">Transferidos</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative w-full sm:w-52">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar socio o N°..."
                      value={searchCert}
                      onChange={(e) => setSearchCert(e.target.value)}
                      className="pl-8 text-sm h-9"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs gap-1.5 border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold shadow-2xs"
                    title="Abrir opciones de descarga"
                    disabled={certificadosFiltrados.length === 0}
                    onClick={() => {
                      setDescargaAlcance("GENERAL");
                      setModalFechaDesde(filtroFechaDesde);
                      setModalFechaHasta(filtroFechaHasta || "");
                      setModalEstadoFiltro(filtroEstadoCert);
                      setModalDescarga(true);
                    }}
                  >
                    <FileDown className="size-3.5 text-emerald-600" />
                    <span>Descargar Lote ({certificadosFiltrados.length})</span>
                  </Button>
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
                      <TableHead className="text-center w-36">Descarga PDF</TableHead>
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
                          <TableCell className="text-center text-xs font-mono text-muted-foreground">
                            {c.fechaEmision ? formatFecha(c.fechaEmision) : (empresa?.fechaFundacion ? formatFecha(empresa.fechaFundacion) : "—")}
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
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 font-medium shadow-sm"
                              title="Descargar Certificado Oficial en PDF"
                              onClick={() => {
                                try {
                                  descargarCertificadoPDF(c, directiva, empresa);
                                  toast.success(
                                    `Certificado CERT-${String(c.numeroCertificado).padStart(6, "0")} descargado en PDF`
                                  );
                                } catch {
                                  toast.error("Error al generar el PDF del certificado");
                                }
                              }}
                            >
                              <FileDown className="size-3.5" />
                              <span>Descargar PDF</span>
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

      {/* MODAL: Descargar Acciones (General, Periodo Contable, Accionista) */}
      <Dialog open={modalDescarga} onOpenChange={setModalDescarga}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileDown className="size-5 text-emerald-600" />
              Descargar Certificados de Acciones y Padrón
            </DialogTitle>
            <DialogDescription className="text-xs">
              Seleccione el alcance de descarga (general, por periodo contable o por accionista) y el formato del documento en PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* 1. Selector de Alcance */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Criterio o Alcance de Descarga</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDescargaAlcance("GENERAL")}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all text-center gap-1",
                    descargaAlcance === "GENERAL"
                      ? "border-primary bg-primary/10 text-primary shadow-xs font-semibold"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <Building2 className="size-4" />
                  <span>General</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Todo el padrón</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDescargaAlcance("PERIODO")}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all text-center gap-1",
                    descargaAlcance === "PERIODO"
                      ? "border-primary bg-primary/10 text-primary shadow-xs font-semibold"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <Calendar className="size-4" />
                  <span>Por Periodo</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Mes contable</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDescargaAlcance("SOCIO")}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all text-center gap-1",
                    descargaAlcance === "SOCIO"
                      ? "border-primary bg-primary/10 text-primary shadow-xs font-semibold"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <Users className="size-4" />
                  <span>Por Accionista</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Socio individual</span>
                </button>
              </div>
            </div>

            {/* 2. Filtro específico según el alcance */}
            {descargaAlcance === "GENERAL" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-2.5 rounded-lg border border-border/50">
                <div className="grid gap-1.5">
                  <Label htmlFor="modalDesde" className="text-xs font-semibold">
                    Fecha Inicial (Opcional)
                  </Label>
                  <Input
                    id="modalDesde"
                    type="date"
                    value={modalFechaDesde}
                    onChange={(e) => setModalFechaDesde(e.target.value)}
                    className="text-xs h-9 bg-background"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="modalHasta" className="text-xs font-semibold">
                    Fecha Final (Opcional)
                  </Label>
                  <Input
                    id="modalHasta"
                    type="date"
                    value={modalFechaHasta}
                    onChange={(e) => setModalFechaHasta(e.target.value)}
                    className="text-xs h-9 bg-background"
                  />
                </div>
              </div>
            )}

            {descargaAlcance === "PERIODO" && (
              <div className="grid gap-1.5 bg-muted/20 p-2.5 rounded-lg border border-border/50">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Seleccionar Periodo Contable</span>
                  {periodos.length > 0 && (
                    <span className="text-[11px] text-muted-foreground font-normal">
                      {periodos.length} periodos registrados
                    </span>
                  )}
                </Label>
                <Select value={selectedPeriodoId} onValueChange={setSelectedPeriodoId}>
                  <SelectTrigger className="text-xs h-9 bg-background">
                    <SelectValue placeholder="Seleccione un periodo contable" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((p) => {
                      const certsCount = certificados.filter(
                        (c) =>
                          c.periodoId === p.id ||
                          (c.fechaEmision && c.fechaEmision.startsWith(`${p.anio}-${String(p.mes).padStart(2, "0")}`))
                      ).length;
                      return (
                        <SelectItem key={p.id} value={p.id}>
                          {MESES[p.mes - 1]} {p.anio} {p.fechaReunion ? `— Reunión: ${formatFecha(p.fechaReunion)}` : ""} ({certsCount} certs)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {descargaAlcance === "SOCIO" && (
              <div className="grid gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/50">
                <Label className="text-xs font-semibold">Seleccionar Accionista / Socio</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre o código de socio..."
                    value={searchSocioModal}
                    onChange={(e) => setSearchSocioModal(e.target.value)}
                    className="text-xs h-8 pl-8 bg-background"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto rounded-md border border-border divide-y text-xs bg-background">
                  {socios
                    .filter((s) => {
                      if (!searchSocioModal.trim()) return true;
                      const q = searchSocioModal.toLowerCase();
                      return (
                        s.socioNombre.toLowerCase().includes(q) ||
                        s.socioCodigo.toString().includes(q)
                      );
                    })
                    .map((s) => {
                      const isSelected = selectedSocioId === s.socioId;
                      const certsCount = certificados.filter((c) => c.socioId === s.socioId).length;
                      return (
                        <div
                          key={s.socioId}
                          onClick={() => setSelectedSocioId(s.socioId)}
                          className={cn(
                            "p-2 flex items-center justify-between cursor-pointer transition-colors",
                            isSelected
                              ? "bg-primary/10 text-primary font-semibold"
                              : "hover:bg-muted/50 text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-muted-foreground text-[11px]">#{s.socioCodigo}</span>
                            <span className="truncate max-w-[200px]">{s.socioNombre}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-[10px]">
                              {certsCount} {certsCount === 1 ? "cert." : "certs."}
                            </Badge>
                            <span className="text-muted-foreground font-mono">
                              {s.totalAccionesActivas} acc.
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 3. Filtro de Estado Opcional */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Filtro de Estado</Label>
              <Select value={modalEstadoFiltro} onValueChange={setModalEstadoFiltro}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Estado de certificados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los estados (Activos, Cancelados, etc.)</SelectItem>
                  <SelectItem value="ACTIVO">Solo títulos Activos</SelectItem>
                  <SelectItem value="DEVUELTO_RETIRO">Solo Cancelados / Devueltos por retiro</SelectItem>
                  <SelectItem value="TRANSFERIDO">Solo Transferidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 4. Formato de Descarga */}
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Formato de Documento en PDF</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  onClick={() => setDescargaTipoModal("CERTIFICADOS")}
                  className={cn(
                    "cursor-pointer border-2 rounded-lg p-3 transition-all",
                    descargaTipoModal === "CERTIFICADOS"
                      ? "border-primary bg-primary/5 text-foreground shadow-2xs"
                      : "border-border/60 hover:border-border text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                    <FileCheck className="size-4 text-primary" />
                    <span>Certificados Oficiales</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Compilado de títulos nominativos individuales (diplomas estilo A4) listos para imprimir.
                  </p>
                </div>

                <div
                  onClick={() => setDescargaTipoModal("PADRON")}
                  className={cn(
                    "cursor-pointer border-2 rounded-lg p-3 transition-all",
                    descargaTipoModal === "PADRON"
                      ? "border-primary bg-primary/5 text-foreground shadow-2xs"
                      : "border-border/60 hover:border-border text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                    <FileText className="size-4 text-emerald-600" />
                    <span>Libro / Padrón Oficial</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Reporte tabular con detalle de socios, cantidades, montos, series y firmas de directiva.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Resumen dinámico del filtro */}
            <div className="rounded-lg bg-muted/40 border border-border/60 p-3 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Certificados encontrados:</span>
                <strong className="text-foreground font-mono text-sm">
                  {certificadosModal.length} títulos
                </strong>
              </div>
              <div className="flex items-center justify-between text-muted-foreground mt-1">
                <span>Total acciones representadas:</span>
                <strong className="text-foreground font-mono">
                  {certificadosModal.reduce((sum, c) => sum + (c.cantidad || 0), 0).toLocaleString("es-PE")} acc.
                </strong>
              </div>
              <div className="flex items-center justify-between text-muted-foreground mt-1">
                <span>Capital total representado:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                  {formatMoneda(certificadosModal.reduce((sum, c) => sum + Number(c.totalMonto || 0), 0))}
                </strong>
              </div>

              {certificadosModal.length === 0 && (
                <p className="text-rose-500 text-xs mt-2 font-medium">
                  ⚠️ No existen certificados registrados con los criterios seleccionados.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setModalDescarga(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDescargarModal}
              disabled={certificadosModal.length === 0}
              className="gap-2 bg-primary text-primary-foreground shadow"
            >
              <FileDown className="size-4" />
              Descargar {descargaTipoModal === "CERTIFICADOS" ? "Certificados" : "Padrón"} en PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
