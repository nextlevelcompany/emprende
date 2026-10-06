"use client";

import * as React from "react";
import Link from "next/link";
import {
  Coins,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  ArrowRight,
  ShieldCheck,
  Send,
  RefreshCw,
  Calculator,
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

interface Prestamo {
  id: string;
  cajaId: string;
  socioId: string;
  socioCodigo: number | null;
  socioNombreCompleto: string;
  socioDocumento: string;
  numero: number;
  montoPrincipal: number;
  tasaMensual: number;
  nroCuotas: number;
  metodoAmortizacion: string;
  fechaDesembolso: string;
  fechaPrimeraCuota: string;
  estado: "SOLICITADO" | "APROBADO" | "VIGENTE" | "CANCELADO" | "CASTIGADO" | "RECHAZADO";
  proposito: string | null;
  capitalPagado: number;
  saldoCapital: number;
  interesPagado: number;
  cuotasPagadas: number;
  cuotasVencidas: number;
  createdAt: string;
}

interface ResumenCartera {
  totalPrestamos: number;
  vigentes: number;
  cancelados: number;
  solicitados: number;
  saldoCapitalColocado: number;
  totalCapitalCobrado: number;
  totalInteresesGanados: number;
  cuotasVencidasTotal: number;
}

interface SocioSimple {
  id: string;
  codigo: number;
  nombreCompleto: string;
  documentoTipo: string;
  estado: string;
}

interface PeriodoSimple {
  id: string;
  anio: number;
  mes: number;
  estado: "ABIERTO" | "CERRADO";
  fechaReunion: string;
}

interface CuotaSimulada {
  nroCuota: number;
  fechaVencimiento: string;
  capitalProgramado: number;
  interesProgramado: number;
  cuotaProgramada: number;
  saldoRestante: number;
}

interface SimulacionResponse {
  montoPrincipal: number;
  tasaMensual: number;
  tasaPorcentaje: number;
  nroCuotas: number;
  totalInteres: number;
  totalPagar: number;
  cronograma: CuotaSimulada[];
}

export default function PrestamosPage() {
  const [prestamos, setPrestamos] = React.useState<Prestamo[]>([]);
  const [resumen, setResumen] = React.useState<ResumenCartera | null>(null);
  const [socios, setSocios] = React.useState<SocioSimple[]>([]);
  const [periodos, setPeriodos] = React.useState<PeriodoSimple[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [estadoFiltro, setEstadoFiltro] = React.useState<string>("TODOS");

  // Modales
  const [modalNuevo, setModalNuevo] = React.useState(false);
  const [modalDesembolsar, setModalDesembolsar] = React.useState<Prestamo | null>(null);
  const [modalAprobar, setModalAprobar] = React.useState<Prestamo | null>(null);

  // Formulario Solicitud y Simulación
  const [formSocioId, setFormSocioId] = React.useState("");
  const [formMonto, setFormMonto] = React.useState("1000");
  const [formTasa, setFormTasa] = React.useState("0.05");
  const [formCuotas, setFormCuotas] = React.useState("4");
  const [formFechaDesembolso, setFormFechaDesembolso] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [formFecha1raCuota, setFormFecha1raCuota] = React.useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-08`;
  });
  const [formProposito, setFormProposito] = React.useState("");

  const [simulacion, setSimulacion] = React.useState<SimulacionResponse | null>(null);
  const [simulando, setSimulando] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);

  // Formulario Desembolso
  const [desembolsoPeriodoId, setDesembolsoPeriodoId] = React.useState("");
  const [desembolsoFecha, setDesembolsoFecha] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [desembolsando, setDesembolsando] = React.useState(false);

  const cargarDatos = React.useCallback(async () => {
    setLoading(true);
    try {
      const [resPrestamos, resResumen, resSocios, resPeriodos] = await Promise.all([
        fetch("/api/prestamos?size=100"),
        fetch("/api/prestamos/resumen"),
        fetch("/api/socios/activos"),
        fetch("/api/periodos"),
      ]);

      if (resPrestamos.ok) {
        const data = await resPrestamos.json();
        setPrestamos(data.content || []);
      }
      if (resResumen.ok) {
        setResumen(await resResumen.json());
      }
      if (resSocios.ok) {
        setSocios(await resSocios.json());
      }
      if (resPeriodos.ok) {
        const pers = await resPeriodos.json();
        setPeriodos(pers || []);
        // Preseleccionar el periodo abierto actual si existe
        const abierto = (pers || []).find((p: PeriodoSimple) => p.estado === "ABIERTO");
        if (abierto) {
          setDesembolsoPeriodoId(abierto.id);
        }
      }
    } catch {
      toast.error("Error al cargar datos del módulo de préstamos");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Simulación de cronograma en vivo
  const handleSimular = async () => {
    const monto = parseFloat(formMonto);
    const tasa = parseFloat(formTasa);
    const cuotas = parseInt(formCuotas);

    if (isNaN(monto) || monto <= 0) {
      toast.error("Ingrese un monto válido mayor a 0");
      return;
    }
    if (isNaN(tasa) || tasa < 0) {
      toast.error("Ingrese una tasa mensual válida");
      return;
    }
    if (isNaN(cuotas) || cuotas < 1 || cuotas > 60) {
      toast.error("El número de cuotas debe estar entre 1 y 60");
      return;
    }

    setSimulando(true);
    try {
      const res = await fetch("/api/prestamos/simular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montoPrincipal: monto,
          tasaMensual: tasa,
          nroCuotas: cuotas,
          fechaDesembolso: formFechaDesembolso,
          fechaPrimeraCuota: formFecha1raCuota,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al simular cronograma");
      }

      const data = await res.json();
      setSimulacion(data);
      toast.success("Cronograma simulado calculado con éxito");
    } catch (e: any) {
      toast.error(e.message || "Error al generar simulación");
    } finally {
      setSimulando(false);
    }
  };

  // Guardar solicitud de préstamo
  const handleCrearSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSocioId) {
      toast.error("Seleccione un socio titular del préstamo");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch("/api/prestamos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socioId: formSocioId,
          montoPrincipal: parseFloat(formMonto),
          tasaMensual: parseFloat(formTasa),
          nroCuotas: parseInt(formCuotas),
          fechaDesembolso: formFechaDesembolso,
          fechaPrimeraCuota: formFecha1raCuota,
          proposito: formProposito || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo registrar la solicitud");
      }

      toast.success("Solicitud de préstamo registrada exitosamente");
      setModalNuevo(false);
      setSimulacion(null);
      setFormProposito("");
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message || "Error al registrar el préstamo");
    } finally {
      setGuardando(false);
    }
  };

  // Aprobar préstamo
  const handleConfirmarAprobacion = async () => {
    if (!modalAprobar) return;
    try {
      const res = await fetch(`/api/prestamos/${modalAprobar.id}/aprobar`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al aprobar el préstamo");
      }
      toast.success(`Préstamo #${modalAprobar.numero} aprobado por directiva`);
      setModalAprobar(null);
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Desembolsar préstamo
  const handleConfirmarDesembolso = async () => {
    if (!modalDesembolsar || !desembolsoPeriodoId) {
      toast.error("Seleccione el periodo contable activo");
      return;
    }

    setDesembolsando(true);
    try {
      const res = await fetch(`/api/prestamos/${modalDesembolsar.id}/desembolsar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodoId: desembolsoPeriodoId,
          fechaDesembolso: desembolsoFecha,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al desembolsar el préstamo");
      }

      toast.success(`Préstamo #${modalDesembolsar.numero} desembolsado. Se generó el egreso en caja.`);
      setModalDesembolsar(null);
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDesembolsando(false);
    }
  };

  const prestamosFiltrados = prestamos.filter((p) => {
    const matchSearch =
      search === "" ||
      p.numero.toString().includes(search) ||
      p.socioNombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
      (p.socioCodigo && p.socioCodigo.toString().includes(search));

    const matchEstado =
      estadoFiltro === "TODOS" || p.estado === estadoFiltro;

    return matchSearch && matchEstado;
  });

  const getBadgeEstado = (estado: Prestamo["estado"]) => {
    switch (estado) {
      case "VIGENTE":
        return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/30">Vigente</Badge>;
      case "SOLICITADO":
        return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-500/30">Solicitado</Badge>;
      case "APROBADO":
        return <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-500/30">Aprobado</Badge>;
      case "CANCELADO":
        return <Badge className="bg-neutral-500/15 text-neutral-700 hover:bg-neutral-500/25 border-neutral-500/30">Cancelado</Badge>;
      case "RECHAZADO":
        return <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 border-rose-500/30">Rechazado</Badge>;
      case "CASTIGADO":
        return <Badge className="bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 border-purple-500/30">Castigado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Préstamos y Créditos Comunales
          </h1>
          <p className="text-sm text-muted-foreground">
            Simulación, aprobación, desembolso e historial de cartera con amortización mensual.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarDatos}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSimulacion(null);
              setModalNuevo(true);
            }}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Nuevo Préstamo
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas de Cartera */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartera Colocada</CardTitle>
            <Coins className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/. {(resumen?.saldoCapitalColocado ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumen?.vigentes ?? 0} créditos vigentes en amortización
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Recuperado</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/. {(resumen?.totalCapitalCobrado ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumen?.cancelados ?? 0} préstamos totalmente cancelados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intereses Cobrados</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/. {(resumen?.totalInteresesGanados ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rendimiento acumulado de la caja comunal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuotas Vencidas / Mora</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {resumen?.cuotasVencidasTotal ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumen?.solicitados ?? 0} créditos pendientes de aprobación
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Buscador */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por socio, N° de préstamo o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="w-full md:w-56">
              <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Estado de préstamo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los Estados</SelectItem>
                  <SelectItem value="SOLICITADO">Solicitado</SelectItem>
                  <SelectItem value="APROBADO">Aprobado</SelectItem>
                  <SelectItem value="VIGENTE">Vigente</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                  <SelectItem value="CASTIGADO">Castigado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Préstamos */}
      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Listado de Créditos</CardTitle>
              <CardDescription>
                Registro oficial con cronograma de pagos e historial de cobros
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground">
              Total: {prestamosFiltrados.length} préstamo(s)
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">N°</TableHead>
                  <TableHead>Socio Titular</TableHead>
                  <TableHead className="text-right">Monto Principal</TableHead>
                  <TableHead className="text-center">Tasa Mes</TableHead>
                  <TableHead className="text-center">Plazo</TableHead>
                  <TableHead className="text-right">Saldo Capital</TableHead>
                  <TableHead className="text-right">Interés Cobrado</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando préstamos...
                    </TableCell>
                  </TableRow>
                ) : prestamosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron préstamos con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                ) : (
                  prestamosFiltrados.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold text-primary">
                        #{p.numero}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {p.socioNombreCompleto}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.socioCodigo ? `Socio #${p.socioCodigo}` : "Cliente Externo"} • {p.socioDocumento}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        S/. {Number(p.montoPrincipal).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {(p.tasaMensual * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {p.nroCuotas} cuota{p.nroCuotas > 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-rose-600">
                        S/. {Number(p.saldoCapital).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        S/. {Number(p.interesPagado).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        {getBadgeEstado(p.estado)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.estado === "SOLICITADO" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs text-blue-600 hover:text-blue-700"
                              onClick={() => setModalAprobar(p)}
                            >
                              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                              Aprobar
                            </Button>
                          )}
                          {(p.estado === "APROBADO" || p.estado === "SOLICITADO") && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => setModalDesembolsar(p)}
                            >
                              <Send className="h-3.5 w-3.5 mr-1" />
                              Desembolsar
                            </Button>
                          )}
                          <Link href={`/admin/prestamos/${p.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs">
                              <FileText className="h-3.5 w-3.5 mr-1" />
                              Cronograma
                            </Button>
                          </Link>
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

      {/* Modal: Nuevo Préstamo y Simulación Proforma */}
      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Simulación y Registro de Nuevo Préstamo
            </DialogTitle>
            <DialogDescription>
              Calcule las cuotas mensuales bajo el Sistema Alemán (Capital Fijo + Interés sobre saldo deudor) antes de solicitar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrearSolicitud} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="socioId">Socio Titular *</Label>
                <Select value={formSocioId} onValueChange={setFormSocioId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el socio titular..." />
                  </SelectTrigger>
                  <SelectContent>
                    {socios.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        #{s.codigo} - {s.nombreCompleto} ({s.documentoTipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto">Monto Principal (S/.) *</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  min="1"
                  value={formMonto}
                  onChange={(e) => setFormMonto(e.target.value)}
                  placeholder="Ej: 1000.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tasa">Tasa Mensual (0.05 = 5%) *</Label>
                <Select value={formTasa} onValueChange={setFormTasa}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tasa..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.05">5.0% mensual (Estándar)</SelectItem>
                    <SelectItem value="0.03">3.0% mensual (Preferencial)</SelectItem>
                    <SelectItem value="0.02">2.0% mensual (Especial)</SelectItem>
                    <SelectItem value="0.01">1.0% mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuotas">Plazo en Cuotas Mensuales *</Label>
                <Input
                  id="cuotas"
                  type="number"
                  min="1"
                  max="60"
                  value={formCuotas}
                  onChange={(e) => setFormCuotas(e.target.value)}
                  placeholder="Ej: 4"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaDesembolso">Fecha Estimada de Desembolso</Label>
                <Input
                  id="fechaDesembolso"
                  type="date"
                  value={formFechaDesembolso}
                  onChange={(e) => setFormFechaDesembolso(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha1ra">Fecha Vencimiento 1ra Cuota (Día 8)</Label>
                <Input
                  id="fecha1ra"
                  type="date"
                  value={formFecha1raCuota}
                  onChange={(e) => setFormFecha1raCuota(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="proposito">Propósito o Destino del Préstamo</Label>
                <Input
                  id="proposito"
                  value={formProposito}
                  onChange={(e) => setFormProposito(e.target.value)}
                  placeholder="Ej: Compra de mercadería / Capital de trabajo"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleSimular}
                disabled={simulando}
              >
                <Calculator className="h-4 w-4 mr-1 text-primary" />
                {simulando ? "Calculando..." : "Simular Cronograma"}
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalNuevo(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando ? "Registrando..." : "Registrar Solicitud"}
                </Button>
              </div>
            </div>
          </form>

          {/* Tabla de Simulación en Vivo */}
          {simulacion && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="flex flex-wrap items-center justify-between bg-muted/40 p-3 rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground">Principal: </span>
                  <span className="font-semibold">S/. {simulacion.montoPrincipal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Interés: </span>
                  <span className="font-semibold text-emerald-600">S/. {simulacion.totalInteres.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total a Pagar: </span>
                  <span className="font-semibold text-primary">S/. {simulacion.totalPagar.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tasa: </span>
                  <Badge variant="outline">{simulacion.tasaPorcentaje}% mensual</Badge>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">N°</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead className="text-right">Capital</TableHead>
                      <TableHead className="text-right">Interés</TableHead>
                      <TableHead className="text-right">Cuota Total</TableHead>
                      <TableHead className="text-right">Saldo Restante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {simulacion.cronograma.map((c) => (
                      <TableRow key={c.nroCuota}>
                        <TableCell className="text-center font-medium">{c.nroCuota}</TableCell>
                        <TableCell>{c.fechaVencimiento}</TableCell>
                        <TableCell className="text-right">S/. {c.capitalProgramado.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-emerald-600">S/. {c.interesProgramado.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">S/. {c.cuotaProgramada.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">S/. {c.saldoRestante.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Aprobar Préstamo */}
      <Dialog open={!!modalAprobar} onOpenChange={() => setModalAprobar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar Solicitud de Préstamo #{modalAprobar?.numero}</DialogTitle>
            <DialogDescription>
              ¿Confirma que la directiva ha evaluado y aprobado este crédito para {modalAprobar?.socioNombreCompleto}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Monto Solicitado:</span>
              <span className="font-semibold">S/. {modalAprobar?.montoPrincipal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Plazo:</span>
              <span>{modalAprobar?.nroCuotas} cuotas mensuales</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Tasa mensual:</span>
              <span>{modalAprobar ? (modalAprobar.tasaMensual * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAprobar(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarAprobacion}>
              Aprobar Crédito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Desembolsar Préstamo con Impacto en Caja */}
      <Dialog open={!!modalDesembolsar} onOpenChange={() => setModalDesembolsar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-600" />
              Desembolso de Préstamo #{modalDesembolsar?.numero}
            </DialogTitle>
            <DialogDescription>
              Esta acción generará automáticamente el egreso contable en el libro de caja del periodo activo y activará el cronograma de cobro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/40 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Titular:</span>
                <span className="font-medium">{modalDesembolsar?.socioNombreCompleto}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto a Desembolsar:</span>
                <span className="font-bold text-emerald-600">
                  S/. {modalDesembolsar?.montoPrincipal?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cuotas a Generar:</span>
                <span>{modalDesembolsar?.nroCuotas} cuotas mensuales</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodo">Periodo Contable de Imputación *</Label>
              <Select value={desembolsoPeriodoId} onValueChange={setDesembolsoPeriodoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el periodo contable..." />
                </SelectTrigger>
                <SelectContent>
                  {periodos
                    .filter((p) => p.estado === "ABIERTO")
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.mes}/{p.anio} (Asamblea: {p.fechaReunion}) - Abierto
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaDesembolso">Fecha Efectiva del Desembolso</Label>
              <Input
                id="fechaDesembolso"
                type="date"
                value={desembolsoFecha}
                onChange={(e) => setDesembolsoFecha(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalDesembolsar(null)}
              disabled={desembolsando}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmarDesembolso}
              disabled={desembolsando}
            >
              {desembolsando ? "Procesando Egreso..." : "Confirmar y Desembolsar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
