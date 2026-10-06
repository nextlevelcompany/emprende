"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileSpreadsheet,
  PlusCircle,
  Coins,
  Lock,
  Unlock,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building,
  ShieldCheck,
  Receipt,
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
  TableFooter,
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

interface FilaPlanilla {
  nroRecibo: number | null;
  socioId: string | null;
  socioNombre: string;
  socioCodigo: number | null;
  // Ingresos
  ahorro: number;
  pagoCapital: number;
  interesRecibido: number;
  acciones: number;
  tardanzaMulta: number;
  reservas: number;
  totalIngreso: number;
  // Egresos
  retiroAhorro: number;
  prestamo: number;
  interesPagado: number;
  gastoAdmin: number;
  utilidad: number;
  red: number;
  otroEgreso: number;
  totalEgreso: number;
  // IDs de operaciones para anulación
  operacionIngresoId: string | null;
  operacionEgresoId: string | null;
}

interface PlanillaData {
  periodo: {
    id: string;
    anio: number;
    mes: number;
    fechaReunion: string;
    estado: "ABIERTO" | "CERRADO";
    saldoAnterior: number;
    totalIngresos: number;
    totalEgresos: number;
    saldoFinal: number;
  };
  filas: FilaPlanilla[];
  totalesIngresos: Record<string, number>;
  totalesEgresos: Record<string, number>;
  totalIngresosMes: number;
  totalEgresosMes: number;
  saldoAnterior: number;
  saldoFinal: number;
}

interface Concepto {
  id: number;
  codigo: string;
  nombre: string;
  tipo: "INGRESO" | "EGRESO";
  requiereSocio: boolean;
  orden: number;
}

interface SocioMini {
  id: string;
  codigo: number;
  nombreCompleto: string;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function PlanillaMensualPage() {
  const params = useParams();
  const router = useRouter();
  const periodoId = params?.id as string;

  const [data, setData] = React.useState<PlanillaData | null>(null);
  const [conceptos, setConceptos] = React.useState<Concepto[]>([]);
  const [socios, setSocios] = React.useState<SocioMini[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modales
  const [modalOperacion, setModalOperacion] = React.useState(false);
  const [modalArqueo, setModalArqueo] = React.useState(false);
  const [modalCierre, setModalCierre] = React.useState(false);
  const [modalAnular, setModalAnular] = React.useState<{ id: string; socio: string } | null>(null);

  // Form states
  const [tipoFlujo, setTipoFlujo] = React.useState<"INGRESO" | "EGRESO">("INGRESO");
  const [socioSeleccionado, setSocioSeleccionado] = React.useState<string>("");
  const [nroReciboManual, setNroReciboManual] = React.useState<string>("");
  const [fechaOperacion, setFechaOperacion] = React.useState<string>("");
  const [descripcionOperacion, setDescripcionOperacion] = React.useState<string>("");
  const [montosConcepto, setMontosConcepto] = React.useState<Record<number, string>>({});

  // Arqueo form
  const [efectivoContado, setEfectivoContado] = React.useState<string>("0.00");
  const [depositosBancos, setDepositosBancos] = React.useState<string>("0.00");
  const [observacionArqueo, setObservacionArqueo] = React.useState<string>("");

  // Anulación form
  const [motivoAnulacion, setMotivoAnulacion] = React.useState<string>("");

  const [procesando, setProcesando] = React.useState(false);

  const cargarPlanilla = React.useCallback(async () => {
    if (!periodoId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/periodos/${periodoId}/planilla`);
      if (!res.ok) throw new Error("Error al obtener planilla");
      const respData = await res.json();
      setData(respData);
      if (respData.periodo?.fechaReunion) {
        setFechaOperacion(respData.periodo.fechaReunion);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cargar planilla mensual");
    } finally {
      setLoading(false);
    }
  }, [periodoId]);

  const cargarCatalogos = React.useCallback(async () => {
    try {
      const [resConc, resSoc] = await Promise.all([
        fetch("/api/conceptos"),
        fetch("/api/socios"),
      ]);
      if (resConc.ok) {
        const concData = await resConc.json();
        setConceptos(Array.isArray(concData) ? concData : []);
      }
      if (resSoc.ok) {
        const socData = await resSoc.json();
        const listaSoc = Array.isArray(socData) ? socData : socData.content || [];
        setSocios(
          listaSoc.map((s: any) => ({
            id: s.id,
            codigo: s.codigo,
            nombreCompleto: s.nombreCompleto,
          }))
        );
      }
    } catch (err) {
      console.error("Error al cargar catálogos", err);
    }
  }, []);

  React.useEffect(() => {
    cargarPlanilla();
    cargarCatalogos();
  }, [cargarPlanilla, cargarCatalogos]);

  // Handlers
  const handleOperacionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const detalles = Object.entries(montosConcepto)
      .map(([conceptoIdStr, montoStr]) => {
        const monto = parseFloat(montoStr);
        return {
          conceptoId: parseInt(conceptoIdStr),
          monto: isNaN(monto) ? 0 : monto,
        };
      })
      .filter((d) => d.monto > 0);

    if (detalles.length === 0) {
      toast.error("Debe ingresar al menos un concepto con monto mayor a cero");
      return;
    }

    try {
      setProcesando(true);
      const payload = {
        socioId: socioSeleccionado || null,
        tipo: tipoFlujo,
        fecha: fechaOperacion,
        nroRecibo: nroReciboManual ? parseInt(nroReciboManual) : null,
        descripcion: descripcionOperacion || null,
        detalles,
      };

      const res = await fetch(`/api/periodos/${periodoId}/operaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.detail || resData.message || "Error al registrar");

      toast.success("Operación registrada en la planilla");
      setModalOperacion(false);
      setMontosConcepto({});
      setDescripcionOperacion("");
      setNroReciboManual("");
      cargarPlanilla();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleArqueoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProcesando(true);
      const res = await fetch(`/api/periodos/${periodoId}/arqueo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          efectivo: parseFloat(efectivoContado) || 0,
          depositosBancos: parseFloat(depositosBancos) || 0,
          observacion: observacionArqueo || null,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.detail || resData.message || "Error al guardar arqueo");
      toast.success("Arqueo de caja registrado correctamente");
      setModalArqueo(false);
      cargarPlanilla();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarPeriodo = async () => {
    try {
      setProcesando(true);
      const res = await fetch(`/api/periodos/${periodoId}/cerrar`, {
        method: "POST",
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.detail || resData.message || "Error al cerrar periodo");
      toast.success("Periodo cerrado exitosamente con foto de integridad SHA-256");
      setModalCierre(false);
      cargarPlanilla();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleAnularSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAnular) return;
    if (!motivoAnulacion.trim()) {
      toast.error("Debe especificar el motivo de anulación");
      return;
    }
    try {
      setProcesando(true);
      const res = await fetch(`/api/operaciones/${modalAnular.id}/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: motivoAnulacion }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.detail || resData.message || "Error al anular operación");
      toast.success("Operación anulada lógicamente (inmutable)");
      setModalAnular(null);
      setMotivoAnulacion("");
      cargarPlanilla();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const conceptosFiltrados = conceptos.filter((c) => c.tipo === tipoFlujo);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando libro mensual estilo Excel...</p>
      </div>
    );
  }

  const p = data.periodo;
  const esCerrado = p.estado === "CERRADO";

  // Arqueo cálculos
  const totalArqueoFisico = (parseFloat(efectivoContado) || 0) + (parseFloat(depositosBancos) || 0);
  const diferenciaArqueo = totalArqueoFisico - data.saldoFinal;

  return (
    <div className="space-y-6">
      {/* Encabezado y Barra de Acciones */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
              <Link href="/admin/periodos" title="Volver a periodos">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              Planilla Mensual: {MESES[p.mes - 1]} {p.anio}
            </h1>
            {esCerrado ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" /> Cerrado (Inmutable)
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1">
                <Unlock className="h-3 w-3" /> En Curso
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Réplica exacta del libro contable de 14 columnas &bull; Fecha de asamblea: {p.fechaReunion}
          </p>
        </div>

        {/* Botonera */}
        <div className="flex flex-wrap items-center gap-2">
          {!esCerrado && (
            <>
              <Button
                onClick={() => {
                  setMontosConcepto({});
                  setModalOperacion(true);
                }}
                className="gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                Registrar Operación
              </Button>
              <Button
                variant="outline"
                onClick={() => setModalArqueo(true)}
                className="gap-1.5"
              >
                <Coins className="h-4 w-4 text-amber-500" />
                Arqueo de Caja
              </Button>
              <Button
                variant="destructive"
                onClick={() => setModalCierre(true)}
                className="gap-1.5"
              >
                <Lock className="h-4 w-4" />
                Cerrar Periodo
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => cargarPlanilla()}
            title="Refrescar datos"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* KPI Cards Financieros */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs uppercase font-medium text-muted-foreground">Saldo Anterior</p>
              <h3 className="text-2xl font-bold mt-1">S/. {Number(data.saldoAnterior).toFixed(2)}</h3>
              <p className="text-xs text-muted-foreground mt-1">Proveniente del mes previo</p>
            </div>
            <div className="rounded-xl bg-muted p-3 text-muted-foreground">
              <Building className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs uppercase font-medium text-emerald-600 dark:text-emerald-400">Total Ingresos</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                + S/. {Number(data.totalIngresosMes).toFixed(2)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Ahorro, pagos, intereses, multas</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs uppercase font-medium text-destructive">Total Egresos</p>
              <h3 className="text-2xl font-bold mt-1 text-destructive">
                - S/. {Number(data.totalEgresosMes).toFixed(2)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Préstamos, retiros y gastos</p>
            </div>
            <div className="rounded-xl bg-destructive/10 p-3 text-destructive">
              <TrendingDown className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs uppercase font-medium text-primary">Saldo en Caja</p>
              <h3 className="text-2xl font-bold mt-1 text-primary">
                S/. {Number(data.saldoFinal).toFixed(2)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Saldo acumulado del periodo</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matriz de 14 Columnas Excel con Componentes de la Plantilla */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b py-4">
          <div>
            <CardTitle className="text-lg">Planilla de Asistencia y Movimientos</CardTitle>
            <CardDescription>
              Estructura canónica de 14 columnas contables con balance en vivo
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {data.filas.length} registros
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-xs whitespace-nowrap">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead rowSpan={2} className="w-14 text-center font-bold border-r">Recibo</TableHead>
                  <TableHead rowSpan={2} className="w-48 font-bold border-r">Socio / Concepto</TableHead>
                  <TableHead colSpan={7} className="text-center font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-r">
                    INGRESOS (S/.)
                  </TableHead>
                  <TableHead colSpan={8} className="text-center font-bold bg-destructive/10 text-destructive border-r">
                    EGRESOS (S/.)
                  </TableHead>
                  <TableHead rowSpan={2} className="text-center font-bold w-16">Acciones</TableHead>
                </TableRow>
                <TableRow className="bg-muted/30">
                  {/* Ingresos (7 columnas) */}
                  <TableHead className="text-right">Ahorro</TableHead>
                  <TableHead className="text-right">Cap. Cobrado</TableHead>
                  <TableHead className="text-right">Interés Rec.</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                  <TableHead className="text-right">Tardanza</TableHead>
                  <TableHead className="text-right">Reserva</TableHead>
                  <TableHead className="text-right font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-r">Total Ing.</TableHead>

                  {/* Egresos (8 columnas) */}
                  <TableHead className="text-right">Ret. Ahorro</TableHead>
                  <TableHead className="text-right">Préstamo</TableHead>
                  <TableHead className="text-right">Interés Pag.</TableHead>
                  <TableHead className="text-right">Gasto Adm.</TableHead>
                  <TableHead className="text-right">Utilidad</TableHead>
                  <TableHead className="text-right">Red</TableHead>
                  <TableHead className="text-right">Otro Egr.</TableHead>
                  <TableHead className="text-right font-bold bg-destructive/10 text-destructive border-r">Total Egr.</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.filas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center py-12 text-muted-foreground">
                      No hay operaciones registradas aún en este periodo. Utilice "Registrar Operación" para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.filas.map((f, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/40">
                      <TableCell className="text-center font-mono text-muted-foreground border-r">
                        {f.nroRecibo ? `#${f.nroRecibo}` : "-"}
                      </TableCell>
                      <TableCell className="font-medium text-foreground border-r">
                        <div className="flex items-center gap-1.5">
                          {f.socioCodigo && (
                            <span className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded text-muted-foreground">
                              #{f.socioCodigo}
                            </span>
                          )}
                          <span>{f.socioNombre}</span>
                        </div>
                      </TableCell>

                      {/* Ingresos */}
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.ahorro > 0 ? f.ahorro.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.pagoCapital > 0 ? f.pagoCapital.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.interesRecibido > 0 ? f.interesRecibido.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.acciones > 0 ? f.acciones.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.tardanzaMulta > 0 ? f.tardanzaMulta.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.reservas > 0 ? f.reservas.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-r">
                        {f.totalIngreso > 0 ? f.totalIngreso.toFixed(2) : "-"}
                      </TableCell>

                      {/* Egresos */}
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.retiroAhorro > 0 ? f.retiroAhorro.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.prestamo > 0 ? f.prestamo.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.interesPagado > 0 ? f.interesPagado.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.gastoAdmin > 0 ? f.gastoAdmin.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.utilidad > 0 ? f.utilidad.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.red > 0 ? f.red.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.otroEgreso > 0 ? f.otroEgreso.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-destructive bg-destructive/5 border-r">
                        {f.totalEgreso > 0 ? f.totalEgreso.toFixed(2) : "-"}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-center">
                        {!esCerrado && (f.operacionIngresoId || f.operacionEgresoId) ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const opId = f.operacionIngresoId || f.operacionEgresoId!;
                              setModalAnular({ id: opId, socio: f.socioNombre });
                            }}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            title="Anular operación"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground/40">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>

              {/* Fila de Totales en Pie de Tabla */}
              <TableFooter className="font-bold text-xs bg-muted/80">
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-bold uppercase tracking-wider border-r">
                    TOTALES DEL MES:
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(data.totalesIngresos["Ahorro"] || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(data.totalesIngresos["Pago Capital"] || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(data.totalesIngresos["Interés Recibido"] || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(data.totalesIngresos["Acciones"] || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(data.totalesIngresos["Tardanza / Multa"] || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(data.totalesIngresos["Reservas"] || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-r">
                    {Number(data.totalIngresosMes).toFixed(2)}
                  </TableCell>

                  {/* Totales Egresos */}
                  <TableCell className="text-right font-mono">
                    {Number(data.totalesEgresos["Retiro Ahorro"] || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(data.totalesEgresos["Préstamo Otorgado"] || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(data.totalesEgresos["Interés Pagado"] || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(data.totalesEgresos["Gasto Administrativo"] || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(data.totalesEgresos["Utilidad Repartida"] || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(data.totalesEgresos["Red"] || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(data.totalesEgresos["Otro Egreso"] || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-extrabold text-destructive bg-destructive/10 border-r">
                    {Number(data.totalEgresosMes).toFixed(2)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* DIALOG: Registrar Operación */}
      <Dialog open={modalOperacion} onOpenChange={setModalOperacion}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary" />
              Registrar Operación Contable
            </DialogTitle>
            <DialogDescription>
              Asigne los importes correspondientes a la asamblea mensual. El recibo se autonumera en orden correlativo estricto.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleOperacionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Movimiento *</Label>
                <Select
                  value={tipoFlujo}
                  onValueChange={(val: "INGRESO" | "EGRESO") => {
                    setTipoFlujo(val);
                    setMontosConcepto({});
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INGRESO">Entrada / Ingreso a Caja</SelectItem>
                    <SelectItem value="EGRESO">Salida / Egreso de Caja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Fecha de Operación *</Label>
                <Input
                  type="date"
                  required
                  value={fechaOperacion}
                  onChange={(e) => setFechaOperacion(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Socio o Tercero Comunal</Label>
                <Select
                  value={socioSeleccionado}
                  onValueChange={setSocioSeleccionado}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccione un socio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {socios.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        #{String(s.codigo).padStart(3, "0")} - {s.nombreCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">N° Recibo Manual (Opcional - autonumerado por defecto)</Label>
                <Input
                  type="number"
                  placeholder="Automático"
                  value={nroReciboManual}
                  onChange={(e) => setNroReciboManual(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Desglose por conceptos de la plantilla */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-semibold">Desglose de Conceptos (S/.)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1">
                {conceptosFiltrados.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-muted/30">
                    <span className="text-xs font-medium text-foreground truncate">{c.nombre}</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={montosConcepto[c.id] || ""}
                      onChange={(e) => {
                        setMontosConcepto({
                          ...montosConcepto,
                          [c.id]: e.target.value,
                        });
                      }}
                      className="w-28 h-8 text-right font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Descripción / Glosa</Label>
              <Input
                placeholder="Ej. Cuota mensual regular..."
                value={descripcionOperacion}
                onChange={(e) => setDescripcionOperacion(e.target.value)}
                className="h-9"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOperacion(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={procesando}>
                {procesando ? "Guardando..." : "Registrar Operación"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Arqueo Físico de Caja */}
      <Dialog open={modalArqueo} onOpenChange={setModalArqueo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              Arqueo Físico de Caja
            </DialogTitle>
            <DialogDescription>
              Confrontación del efectivo en mano y cuentas bancarias frente al saldo proyectado del sistema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleArqueoSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Efectivo Físico (S/.) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={efectivoContado}
                  onChange={(e) => setEfectivoContado(e.target.value)}
                  className="font-mono text-right h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Depósitos Bancarios (S/.) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={depositosBancos}
                  onChange={(e) => setDepositosBancos(e.target.value)}
                  className="font-mono text-right h-9"
                />
              </div>
            </div>

            {/* Comparativa */}
            <div className="p-3 rounded-lg border bg-muted/40 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Físico + Bancos:</span>
                <span className="font-mono font-bold">S/. {totalArqueoFisico.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo Según Sistema:</span>
                <span className="font-mono font-bold">S/. {data.saldoFinal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span className="font-medium">Diferencia:</span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    diferenciaArqueo === 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : diferenciaArqueo > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-destructive"
                  )}
                >
                  {diferenciaArqueo === 0
                    ? "Cuadre Exacto (S/. 0.00)"
                    : `S/. ${diferenciaArqueo.toFixed(2)} (${diferenciaArqueo > 0 ? "Sobrante" : "Faltante"})`}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observaciones</Label>
              <Textarea
                rows={2}
                placeholder="Notas de arqueo..."
                value={observacionArqueo}
                onChange={(e) => setObservacionArqueo(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalArqueo(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={procesando}>
                {procesando ? "Guardando..." : "Guardar Arqueo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Cerrar Periodo */}
      <Dialog open={modalCierre} onOpenChange={setModalCierre}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Lock className="h-5 w-5" />
              Cierre Inmutable del Periodo
            </DialogTitle>
            <DialogDescription>
              Al cerrar el periodo, se calculará un <strong>hash criptográfico SHA-256</strong> del balance y no se permitirán más modificaciones sin justificación de auditoría formal.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg border bg-destructive/10 text-xs space-y-1">
            <p className="font-semibold text-destructive">Resumen para firma criptográfica:</p>
            <p>Saldo Inicial: S/. {Number(data.saldoAnterior).toFixed(2)}</p>
            <p>Total Ingresos: S/. {Number(data.totalIngresosMes).toFixed(2)}</p>
            <p>Total Egresos: S/. {Number(data.totalEgresosMes).toFixed(2)}</p>
            <p className="font-bold">Saldo Final a Congelar: S/. {Number(data.saldoFinal).toFixed(2)}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalCierre(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleCerrarPeriodo} disabled={procesando}>
              {procesando ? "Cerrando..." : "Confirmar Cierre SHA-256"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Anular Operación */}
      <Dialog open={!!modalAnular} onOpenChange={(open) => !open && setModalAnular(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Anular Operación
            </DialogTitle>
            <DialogDescription>
              La operación quedará marcada como anulada en el libro contable inmutable para preservar la trazabilidad fiscal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAnularSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Motivo de Anulación (Justificación) *</Label>
              <Textarea
                rows={3}
                required
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Ej. Error en digitación de monto acordado en asamblea..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalAnular(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={procesando}>
                {procesando ? "Anulando..." : "Confirmar Anulación"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
