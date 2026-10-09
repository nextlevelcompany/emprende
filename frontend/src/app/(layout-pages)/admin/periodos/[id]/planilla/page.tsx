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
  Save,
  RotateCcw,
  Check,
  X,
  Info,
  ChevronDown,
  Pencil,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatFecha } from "@/lib/utils";

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

interface CuotaSimuladaLocal {
  nroCuota: number;
  fechaVencimiento: string;
  capital: number;
  interes: number;
  totalCuota: number;
  saldoRestante: number;
}

function calcularCronogramaLocal(
  principal: number,
  tasaMensualPct: number,
  nroCuotas: number,
  fecha1raCuota: string
): CuotaSimuladaLocal[] {
  if (principal <= 0 || nroCuotas <= 0 || !fecha1raCuota) return [];

  const tasaDecimal = tasaMensualPct / 100;
  const baseCap = Math.floor((principal / nroCuotas) * 100) / 100;
  const sumaCapAsignado = baseCap * (nroCuotas - 1);
  const capUltima = Math.round((principal - sumaCapAsignado) * 100) / 100;

  const resultado: CuotaSimuladaLocal[] = [];
  let saldo = principal;

  const partes = fecha1raCuota.split("-");
  if (partes.length < 3) return [];
  const y = parseInt(partes[0]);
  const m = parseInt(partes[1]);
  const d = parseInt(partes[2]);

  for (let i = 1; i <= nroCuotas; i++) {
    const capCuota = i === nroCuotas ? capUltima : baseCap;
    const intCuota = Math.round(saldo * tasaDecimal * 100) / 100;
    const total = Math.round((capCuota + intCuota) * 100) / 100;
    const nuevoSaldo = Math.max(0, Math.round((saldo - capCuota) * 100) / 100);

    const dt = new Date(y, m - 1 + (i - 1), d);
    const fechaVenc = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

    resultado.push({
      nroCuota: i,
      fechaVencimiento: fechaVenc,
      capital: capCuota,
      interes: intCuota,
      totalCuota: total,
      saldoRestante: nuevoSaldo,
    });

    saldo = nuevoSaldo;
  }

  return resultado;
}

interface DetalleCuotaPlanilla {
  prestamoId: string;
  prestamoNumero: number;
  cuotaId: string;
  cuotaNro: number;
  cuotasTotal: number;
  fechaVencimiento: string;
  capitalProgramado: number;
  interesProgramado: number;
  capitalPagado: number;
  interesPagado: number;
  esAdelanto: boolean;
  estado: string;
}

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
  prestamoId?: string | null;
  // Campos interactivos para validación y edición
  accionesPagado?: boolean;
  cuotaPagada?: boolean;
  cuotaCapitalProgramado?: number;
  cuotaInteresProgramado?: number;
  cuotaId?: string | null;
  cuotaNro?: number | null;
  cuotasTotal?: number | null;
  prestamoNumero?: number | null;
  detallesPrestamos?: DetalleCuotaPlanilla[];
  cuotasDisponiblesAdelanto?: DetalleCuotaPlanilla[];
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

  // Modal Desglose de Préstamos y Adelanto de Cuotas
  const [modalDetallePrestamos, setModalDetallePrestamos] = React.useState(false);
  const [socioDetalleActivo, setSocioDetalleActivo] = React.useState<FilaPlanilla | null>(null);
  const [socioDetalleFilaIdx, setSocioDetalleFilaIdx] = React.useState<number | null>(null);
  const [cuotasAdelantoSeleccionadas, setCuotasAdelantoSeleccionadas] = React.useState<string[]>([]);

  // Estado para expandir/colapsar detalles de préstamos por socio en la planilla
  const [filasDetalleExpandido, setFilasDetalleExpandido] = React.useState<Record<string, boolean>>({});

  const toggleDetalleFila = (key: string) => {
    setFilasDetalleExpandido((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Modal Otorgar Préstamo en Asamblea
  const [modalPrestamo, setModalPrestamo] = React.useState(false);
  const [prestamoSocioId, setPrestamoSocioId] = React.useState("");
  const [prestamoMonto, setPrestamoMonto] = React.useState("");
  const [prestamoCuotas, setPrestamoCuotas] = React.useState("6");
  const [prestamoTasa, setPrestamoTasa] = React.useState("2.0");
  const [prestamoFechaDesembolso, setPrestamoFechaDesembolso] = React.useState("");
  const [prestamoFecha1raCuota, setPrestamoFecha1raCuota] = React.useState("");
  const [prestamoProposito, setPrestamoProposito] = React.useState("Préstamo otorgado en asamblea");
  const [prestamoOpEgresoId, setPrestamoOpEgresoId] = React.useState<string | null>(null);

  // Estados para Edición de Préstamo en Asamblea
  const [modalEditarPrestamo, setModalEditarPrestamo] = React.useState(false);
  const [editPrestamoId, setEditPrestamoId] = React.useState<string | null>(null);
  const [editPrestamoNumero, setEditPrestamoNumero] = React.useState<number | null>(null);
  const [editPrestamoSocioNombre, setEditPrestamoSocioNombre] = React.useState<string>("");
  const [editPrestamoMonto, setEditPrestamoMonto] = React.useState<string>("");
  const [editPrestamoCuotas, setEditPrestamoCuotas] = React.useState<string>("6");
  const [editPrestamoTasa, setEditPrestamoTasa] = React.useState<string>("2.0");
  const [editPrestamoFecha1raCuota, setEditPrestamoFecha1raCuota] = React.useState<string>("");
  const [editPrestamoProposito, setEditPrestamoProposito] = React.useState<string>("");
  const [editPrestamoObservacion, setEditPrestamoObservacion] = React.useState<string>("");

  // Estados para Eliminación de Préstamo en Asamblea
  const [modalEliminarPrestamo, setModalEliminarPrestamo] = React.useState(false);
  const [eliminarPrestamoId, setEliminarPrestamoId] = React.useState<string | null>(null);
  const [eliminarPrestamoNumero, setEliminarPrestamoNumero] = React.useState<number | null>(null);
  const [eliminarPrestamoSocio, setEliminarPrestamoSocio] = React.useState<string>("");
  const [eliminarPrestamoMonto, setEliminarPrestamoMonto] = React.useState<number>(0);
  const [motivoEliminacionPrestamo, setMotivoEliminacionPrestamo] = React.useState<string>("");

  // Estados para Modificación / Reprogramación de Cuotas
  const [modalModificarCuotas, setModalModificarCuotas] = React.useState(false);
  const [modCuotasPrestamoId, setModCuotasPrestamoId] = React.useState<string | null>(null);
  const [modCuotasNumero, setModCuotasNumero] = React.useState<number | null>(null);
  const [modCuotasSocio, setModCuotasSocio] = React.useState<string>("");
  const [modCuotasPrincipal, setModCuotasPrincipal] = React.useState<number>(0);
  const [modCuotasLista, setModCuotasLista] = React.useState<{
    id: string;
    nroCuota: number;
    fechaVencimiento: string;
    capitalProgramado: number;
    interesProgramado: number;
    capitalPagado: number;
    interesPagado: number;
    estado: string;
  }[]>([]);
  const [modCuotasObservacion, setModCuotasObservacion] = React.useState<string>("");

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

  // Estados de edición inline en planilla
  const [filasEditables, setFilasEditables] = React.useState<FilaPlanilla[]>([]);
  const [isDirty, setIsDirty] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [precargando, setPrecargando] = React.useState(false);

  // Totales por columna calculados dinámicamente sumando las filas editables activas
  const totalesCalculados = React.useMemo(() => {
    const filasParaSumar = filasEditables.length > 0 ? filasEditables : (data?.filas || []);
    if (filasParaSumar.length === 0) return null;
    return filasParaSumar.reduce(
      (acc, f) => {
        const ahorro = Number(f.ahorro) || 0;
        const pagoCapital = f.cuotaPagada ? (Number(f.pagoCapital) || 0) : 0;
        const interesRecibido = f.cuotaPagada ? (Number(f.interesRecibido) || 0) : 0;
        const acciones = f.accionesPagado ? (Number(f.acciones) || 0) : 0;
        const tardanzaMulta = Number(f.tardanzaMulta) || 0;
        const reservas = Number(f.reservas) || 0;
        const totalIngreso = ahorro + pagoCapital + interesRecibido + acciones + tardanzaMulta + reservas;

        const accEst = f.socioId ? (Number(f.acciones) > 0 ? Number(f.acciones) : 30) : 0;
        const capEst = Number(f.cuotaCapitalProgramado) || (Number(f.pagoCapital) || 0);
        const intEst = Number(f.cuotaInteresProgramado) || (Number(f.interesRecibido) || 0);
        const estimadoFila = accEst + capEst + intEst;

        const retiroAhorro = Number(f.retiroAhorro) || 0;
        const prestamo = Number(f.prestamo) || 0;
        const interesPagado = Number(f.interesPagado) || 0;
        const gastoAdmin = Number(f.gastoAdmin) || 0;
        const utilidad = Number(f.utilidad) || 0;
        const red = Number(f.red) || 0;
        const otroEgreso = Number(f.otroEgreso) || 0;
        const totalEgreso = retiroAhorro + prestamo + interesPagado + gastoAdmin + utilidad + red + otroEgreso;

        return {
          ahorro: acc.ahorro + ahorro,
          pagoCapital: acc.pagoCapital + pagoCapital,
          interesRecibido: acc.interesRecibido + interesRecibido,
          acciones: acc.acciones + acciones,
          tardanzaMulta: acc.tardanzaMulta + tardanzaMulta,
          reservas: acc.reservas + reservas,
          totalIngreso: acc.totalIngreso + totalIngreso,
          totalEstimado: acc.totalEstimado + estimadoFila,
          retiroAhorro: acc.retiroAhorro + retiroAhorro,
          prestamo: acc.prestamo + prestamo,
          interesPagado: acc.interesPagado + interesPagado,
          gastoAdmin: acc.gastoAdmin + gastoAdmin,
          utilidad: acc.utilidad + utilidad,
          red: acc.red + red,
          otroEgreso: acc.otroEgreso + otroEgreso,
          totalEgreso: acc.totalEgreso + totalEgreso,
        };
      },
      {
        ahorro: 0,
        pagoCapital: 0,
        interesRecibido: 0,
        acciones: 0,
        tardanzaMulta: 0,
        reservas: 0,
        totalIngreso: 0,
        totalEstimado: 0,
        retiroAhorro: 0,
        prestamo: 0,
        interesPagado: 0,
        gastoAdmin: 0,
        utilidad: 0,
        red: 0,
        otroEgreso: 0,
        totalEgreso: 0,
      }
    );
  }, [filasEditables, data?.filas]);

  const cronogramaSimuladoNuevo = React.useMemo(() => {
    const p = parseFloat(prestamoMonto) || 0;
    const t = parseFloat(prestamoTasa) || 0;
    const n = parseInt(prestamoCuotas) || 0;
    return calcularCronogramaLocal(p, t, n, prestamoFecha1raCuota);
  }, [prestamoMonto, prestamoTasa, prestamoCuotas, prestamoFecha1raCuota]);

  const cronogramaSimuladoEdit = React.useMemo(() => {
    const p = parseFloat(editPrestamoMonto) || 0;
    const t = parseFloat(editPrestamoTasa) || 0;
    const n = parseInt(editPrestamoCuotas) || 0;
    return calcularCronogramaLocal(p, t, n, editPrestamoFecha1raCuota);
  }, [editPrestamoMonto, editPrestamoTasa, editPrestamoCuotas, editPrestamoFecha1raCuota]);

  const cargarPlanilla = React.useCallback(async () => {
    if (!periodoId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/periodos/${periodoId}/planilla`);
      if (!res.ok) throw new Error("Error al obtener planilla");
      const respData = await res.json();
      setData(respData);
      setFilasEditables(
        respData.filas
          ? respData.filas.map((f: any) => ({
              ...f,
              acciones: Number(f.acciones) > 0 ? Number(f.acciones) : 30,
              pagoCapital: Number(f.pagoCapital) > 0 ? Number(f.pagoCapital) : (Number(f.cuotaCapitalProgramado) || 0),
              interesRecibido: Number(f.interesRecibido) > 0 ? Number(f.interesRecibido) : (Number(f.cuotaInteresProgramado) || 0),
              accionesPagado: Boolean(f.accionesPagado),
              cuotaPagada: Boolean(f.cuotaPagada),
            }))
          : []
      );
      setIsDirty(false);
      if (respData.periodo?.fechaReunion) {
        setFechaOperacion(respData.periodo.fechaReunion);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cargar planilla mensual");
    } finally {
      setLoading(false);
    }
  }, [periodoId]);

  const handleCellChange = (idx: number, campo: keyof FilaPlanilla, valor: any) => {
    setFilasEditables((prev) => {
      const copy = [...prev];
      const f = { ...copy[idx], [campo]: valor };

      if (campo === "acciones" && Number(valor) > 0 && !f.accionesPagado) {
        f.accionesPagado = true;
      }
      if ((campo === "pagoCapital" || campo === "interesRecibido") && Number(valor) > 0 && !f.cuotaPagada) {
        f.cuotaPagada = true;
      }

      const acc = f.accionesPagado ? (Number(f.acciones) || 0) : 0;
      const cuo = f.cuotaPagada ? ((Number(f.pagoCapital) || 0) + (Number(f.interesRecibido) || 0)) : 0;
      f.totalIngreso = acc + cuo + (Number(f.ahorro) || 0) + (Number(f.tardanzaMulta) || 0) + (Number(f.reservas) || 0);

      copy[idx] = f;
      return copy;
    });
    setIsDirty(true);
  };

  const handleToggleAcciones = (idx: number) => {
    setFilasEditables((prev) => {
      const copy = [...prev];
      const f = { ...copy[idx] };
      const nuevoEstado = !f.accionesPagado;
      f.accionesPagado = nuevoEstado;
      if (nuevoEstado && Number(f.acciones) <= 0) {
        f.acciones = 30;
      }

      const acc = f.accionesPagado ? (Number(f.acciones) || 0) : 0;
      const cuo = f.cuotaPagada ? ((Number(f.pagoCapital) || 0) + (Number(f.interesRecibido) || 0)) : 0;
      f.totalIngreso = acc + cuo + (Number(f.ahorro) || 0) + (Number(f.tardanzaMulta) || 0) + (Number(f.reservas) || 0);

      copy[idx] = f;
      return copy;
    });
    setIsDirty(true);
  };

  const handleToggleCuota = (idx: number) => {
    setFilasEditables((prev) => {
      const copy = [...prev];
      const f = { ...copy[idx] };
      const nuevoEstado = !f.cuotaPagada;
      f.cuotaPagada = nuevoEstado;

      if (nuevoEstado && Number(f.pagoCapital) <= 0 && Number(f.interesRecibido) <= 0) {
        if (f.cuotaCapitalProgramado && f.cuotaCapitalProgramado > 0) {
          f.pagoCapital = f.cuotaCapitalProgramado;
          f.interesRecibido = f.cuotaInteresProgramado || 0;
        }
      }

      const acc = f.accionesPagado ? (Number(f.acciones) || 0) : 0;
      const cuo = f.cuotaPagada ? ((Number(f.pagoCapital) || 0) + (Number(f.interesRecibido) || 0)) : 0;
      f.totalIngreso = acc + cuo + (Number(f.ahorro) || 0) + (Number(f.tardanzaMulta) || 0) + (Number(f.reservas) || 0);

      copy[idx] = f;
      return copy;
    });
    setIsDirty(true);
  };

  const abrirModalDetallePrestamos = (fila: FilaPlanilla, idx: number) => {
    setSocioDetalleActivo(fila);
    setSocioDetalleFilaIdx(idx);
    const yaAdelantadas = (fila.detallesPrestamos || [])
      .filter((d) => d.esAdelanto && (d.capitalPagado > 0 || d.interesPagado > 0 || fila.cuotaPagada))
      .map((d) => d.cuotaId);
    setCuotasAdelantoSeleccionadas(yaAdelantadas);
    setModalDetallePrestamos(true);
  };

  const toggleSeleccionAdelanto = (cuotaId: string) => {
    setCuotasAdelantoSeleccionadas((prev) =>
      prev.includes(cuotaId) ? prev.filter((id) => id !== cuotaId) : [...prev, cuotaId]
    );
  };

  const handleAplicarDetallePrestamos = () => {
    if (socioDetalleFilaIdx === null || !socioDetalleActivo) return;

    const fila = { ...socioDetalleActivo };
    const cuotasRegulares = (fila.detallesPrestamos || []).filter((d) => !d.esAdelanto);
    const todasFuturas = [
      ...(fila.detallesPrestamos || []).filter((d) => d.esAdelanto),
      ...(fila.cuotasDisponiblesAdelanto || []),
    ];
    const futurasUnicas = Array.from(
      new Map(todasFuturas.map((c) => [c.cuotaId, c])).values()
    );

    const cuotasAdelanto = futurasUnicas.filter((c) =>
      cuotasAdelantoSeleccionadas.includes(c.cuotaId)
    );

    const capRegular = cuotasRegulares.reduce((acc, c) => acc + (Number(c.capitalProgramado) || 0), 0);
    const intRegular = cuotasRegulares.reduce((acc, c) => acc + (Number(c.interesProgramado) || 0), 0);

    const capAdelanto = cuotasAdelanto.reduce((acc, c) => acc + (Number(c.capitalProgramado) || 0), 0);
    const intAdelanto = cuotasAdelanto.reduce((acc, c) => acc + (Number(c.interesProgramado) || 0), 0);

    const nuevoCap = capRegular + capAdelanto;
    const nuevoInt = intRegular + intAdelanto;

    const nuevosDetalles: DetalleCuotaPlanilla[] = [
      ...cuotasRegulares.map((c) => ({
        ...c,
        capitalPagado: c.capitalProgramado,
        interesPagado: c.interesProgramado,
      })),
      ...cuotasAdelanto.map((c) => ({
        ...c,
        esAdelanto: true,
        capitalPagado: c.capitalProgramado,
        interesPagado: c.interesProgramado,
      })),
    ];

    const nuevasDisponibles = futurasUnicas.filter(
      (c) => !cuotasAdelantoSeleccionadas.includes(c.cuotaId)
    );

    setFilasEditables((prev) => {
      const copy = [...prev];
      const target = { ...copy[socioDetalleFilaIdx] };
      target.pagoCapital = nuevoCap;
      target.interesRecibido = nuevoInt;
      target.cuotaPagada = true;
      target.detallesPrestamos = nuevosDetalles;
      target.cuotasDisponiblesAdelanto = nuevasDisponibles;

      const acc = target.accionesPagado ? (Number(target.acciones) || 0) : 0;
      target.totalIngreso = acc + nuevoCap + nuevoInt + (Number(target.ahorro) || 0) + (Number(target.tardanzaMulta) || 0) + (Number(target.reservas) || 0);

      copy[socioDetalleFilaIdx] = target;
      return copy;
    });

    setIsDirty(true);
    setModalDetallePrestamos(false);
    toast.success(
      `Se aplicaron las cuotas para ${fila.socioNombre}: S/. ${nuevoCap.toFixed(2)} de capital y S/. ${nuevoInt.toFixed(2)} de interés. Recuerde hacer clic en "Guardar Planilla".`
    );
  };

  const handleValidarTodos = () => {
    setFilasEditables((prev) =>
      prev.map((f) => {
        if (!f.socioId) return f;
        const accionesVal = Number(f.acciones) > 0 ? Number(f.acciones) : 30;
        const capVal = f.cuotaCapitalProgramado ? Number(f.cuotaCapitalProgramado) : (Number(f.pagoCapital) || 0);
        const intVal = f.cuotaInteresProgramado ? Number(f.cuotaInteresProgramado) : (Number(f.interesRecibido) || 0);
        const tieneDeuda = Boolean(f.cuotaId || capVal > 0 || intVal > 0);
        const total = accionesVal + (tieneDeuda ? (capVal + intVal) : 0) + (Number(f.ahorro) || 0) + (Number(f.tardanzaMulta) || 0) + (Number(f.reservas) || 0);
        return {
          ...f,
          acciones: accionesVal,
          accionesPagado: true,
          pagoCapital: capVal,
          interesRecibido: intVal,
          cuotaPagada: tieneDeuda,
          totalIngreso: total,
        };
      })
    );
    setIsDirty(true);
    toast.info("Se marcaron todos los cobros sugeridos como validados.");
  };

  const handleDesmarcarTodos = () => {
    setFilasEditables((prev) =>
      prev.map((f) => {
        if (!f.socioId) return f;
        const total = (Number(f.ahorro) || 0) + (Number(f.tardanzaMulta) || 0) + (Number(f.reservas) || 0);
        return {
          ...f,
          accionesPagado: false,
          cuotaPagada: false,
          totalIngreso: total,
        };
      })
    );
    setIsDirty(true);
    toast.info("Se desmarcaron todos los cobros (quedan como No Cobrados).");
  };

  const handleGuardarPlanilla = async () => {
    if (!data || !periodoId) return;
    try {
      setGuardando(true);
      const payload = {
        filas: filasEditables
          .filter((f) => f.socioId)
          .map((f) => ({
            socioId: f.socioId,
            ahorro: Number(f.ahorro) || 0,
            pagoCapital: f.cuotaPagada ? Number(f.pagoCapital) || 0 : 0,
            interesRecibido: f.cuotaPagada ? Number(f.interesRecibido) || 0 : 0,
            acciones: f.accionesPagado ? Number(f.acciones) || 0 : 0,
            tardanzaMulta: Number(f.tardanzaMulta) || 0,
            reservas: Number(f.reservas) || 0,
            accionesPagado: Boolean(f.accionesPagado),
            cuotaPagada: Boolean(f.cuotaPagada),
            cuotaId: f.cuotaId || null,
            prestamoId: f.prestamoId || null,
            cuotasSeleccionadasIds: f.cuotaPagada
              ? (f.detallesPrestamos && f.detallesPrestamos.length > 0
                  ? f.detallesPrestamos.map((d: any) => d.cuotaId)
                  : (f.cuotaId ? [f.cuotaId] : []))
              : [],
          })),
      };

      const res = await fetch(`/api/periodos/${periodoId}/planilla`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const respData = await res.json();
      if (!res.ok) {
        throw new Error(respData.detail || respData.message || respData.error || "Error al guardar planilla");
      }

      setData(respData);
      setFilasEditables(
        respData.filas
          ? respData.filas.map((f: any) => ({
              ...f,
              acciones: Number(f.acciones) > 0 ? Number(f.acciones) : 30,
              pagoCapital: Number(f.pagoCapital) > 0 ? Number(f.pagoCapital) : (Number(f.cuotaCapitalProgramado) || 0),
              interesRecibido: Number(f.interesRecibido) > 0 ? Number(f.interesRecibido) : (Number(f.cuotaInteresProgramado) || 0),
              accionesPagado: Boolean(f.accionesPagado),
              cuotaPagada: Boolean(f.cuotaPagada),
            }))
          : []
      );
      setIsDirty(false);
      toast.success("Planilla guardada exitosamente. Se sincronizaron las cuotas e ingresos.");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar planilla");
    } finally {
      setGuardando(false);
    }
  };

  const handlePrecargarPlanilla = async () => {
    if (!periodoId) return;
    if (
      !confirm(
        "¿Desea restablecer los valores sugeridos por defecto (1 acción = S/ 30 por socio y cuotas programadas de deudas)? Se sobreescribirán los ingresos de los socios."
      )
    ) {
      return;
    }
    try {
      setPrecargando(true);
      const res = await fetch(`/api/periodos/${periodoId}/planilla/precargar`, {
        method: "POST",
      });
      const respData = await res.json();
      if (!res.ok) {
        throw new Error(respData.detail || respData.message || respData.error || "Error al pre-cargar planilla");
      }
      setData(respData);
      setFilasEditables(
        respData.filas
          ? respData.filas.map((f: any) => ({
              ...f,
              acciones: Number(f.acciones) > 0 ? Number(f.acciones) : 30,
              pagoCapital: Number(f.pagoCapital) > 0 ? Number(f.pagoCapital) : (Number(f.cuotaCapitalProgramado) || 0),
              interesRecibido: Number(f.interesRecibido) > 0 ? Number(f.interesRecibido) : (Number(f.cuotaInteresProgramado) || 0),
              accionesPagado: Boolean(f.accionesPagado),
              cuotaPagada: Boolean(f.cuotaPagada),
            }))
          : []
      );
      setIsDirty(false);
      toast.success("Valores sugeridos cargados: 1 acción por socio y cuotas de préstamos del mes.");
    } catch (err: any) {
      toast.error(err.message || "Error al pre-cargar planilla");
    } finally {
      setPrecargando(false);
    }
  };

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

  const abrirModalPrestamo = (
    socioId?: string,
    montoSugerido?: number,
    operacionEgresoExistenteId?: string
  ) => {
    if (!data) return;
    const anio = data.periodo.anio;
    const mes = data.periodo.mes;
    const nextM = mes === 12 ? 1 : mes + 1;
    const nextY = mes === 12 ? anio + 1 : anio;
    const def1ra = `${nextY}-${String(nextM).padStart(2, "0")}-08`;
    setPrestamoFechaDesembolso(data.periodo.fechaReunion || "");
    setPrestamoFecha1raCuota(def1ra);

    if (socioId) {
      setPrestamoSocioId(socioId);
    } else {
      setPrestamoSocioId("");
    }

    if (montoSugerido && montoSugerido > 0) {
      setPrestamoMonto(montoSugerido.toFixed(2));
    } else if (data.saldoFinal > 0) {
      setPrestamoMonto(data.saldoFinal.toFixed(2));
    } else {
      setPrestamoMonto("");
    }

    setPrestamoOpEgresoId(operacionEgresoExistenteId || null);
    setModalPrestamo(true);
  };

  const handleOtorgarPrestamoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prestamoSocioId) {
      toast.error("Seleccione el socio beneficiario");
      return;
    }
    const monto = parseFloat(prestamoMonto);
    if (!monto || monto <= 0) {
      toast.error("El monto a prestar debe ser mayor a cero");
      return;
    }
    const cuotas = parseInt(prestamoCuotas);
    if (!cuotas || cuotas <= 0) {
      toast.error("El número de cuotas debe ser al menos 1");
      return;
    }
    const tasa = parseFloat(prestamoTasa);
    if (isNaN(tasa) || tasa < 0) {
      toast.error("La tasa mensual debe ser válida");
      return;
    }

    try {
      setProcesando(true);
      // 1. Crear Solicitud de Préstamo
      const createRes = await fetch("/api/prestamos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socioId: prestamoSocioId,
          montoPrincipal: monto,
          tasaMensual: tasa / 100,
          nroCuotas: cuotas,
          metodoAmortizacion: "CAPITAL_FIJO_INTERES_SOBRE_SALDO",
          fechaDesembolso: prestamoFechaDesembolso || data?.periodo.fechaReunion,
          fechaPrimeraCuota: prestamoFecha1raCuota,
          proposito: prestamoProposito || "Préstamo en asamblea",
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.detail || createData.error || createData.message || "Error al crear el préstamo");
      }

      const pId = createData.id || createData.prestamo?.id;
      if (!pId) {
        throw new Error("No se pudo obtener el identificador del préstamo creado");
      }

      // 2. Aprobar Préstamo
      const aprobarRes = await fetch(`/api/prestamos/${pId}/aprobar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observacion: "Aprobado en asamblea mensual" }),
      });
      if (!aprobarRes.ok) {
        const aprErr = await aprobarRes.json().catch(() => ({}));
        throw new Error(aprErr.detail || aprErr.message || aprErr.error || "Error al aprobar el préstamo");
      }

      // Si formalizamos un egreso previo sin cuotas, anular la operación genérica para evitar duplicar egresos
      if (prestamoOpEgresoId) {
        await fetch(`/api/operaciones/${prestamoOpEgresoId}/anular`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motivo: `Convertido a préstamo formal #${createData.numero || ""} con cronograma de cuotas e intereses`,
          }),
        });
      }

      // 3. Desembolsar en este Periodo Contable (crea el EGRESO oficial en la planilla vinculado al préstamo)
      const desembolsoRes = await fetch(`/api/prestamos/${pId}/desembolsar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodoId,
          fechaDesembolso: prestamoFechaDesembolso || data?.periodo.fechaReunion,
        }),
      });
      if (!desembolsoRes.ok) {
        const desErr = await desembolsoRes.json().catch(() => ({}));
        throw new Error(desErr.detail || desErr.message || desErr.error || "Error al desembolsar el préstamo en caja");
      }

      toast.success(
        `Préstamo otorgado con éxito por S/. ${monto.toFixed(2)}. Se generó el egreso en caja y el cronograma de ${cuotas} cuotas.`
      );
      setModalPrestamo(false);
      setPrestamoOpEgresoId(null);
      setPrestamoMonto("");
      cargarPlanilla();
    } catch (err: any) {
      toast.error(err.message || "Error al otorgar préstamo");
    } finally {
      setProcesando(false);
    }
  };

  // Handlers para Edición, Eliminación y Reprogramación de Préstamos en Asamblea
  const abrirModalEditarPrestamo = async (prestamoId: string) => {
    try {
      setProcesando(true);
      const res = await fetch(`/api/prestamos/${prestamoId}`);
      if (!res.ok) throw new Error("No se pudo cargar la información del préstamo");
      const pData = await res.json();
      const p = pData.prestamo || pData;
      setEditPrestamoId(p.id);
      setEditPrestamoNumero(p.numero);
      setEditPrestamoSocioNombre(p.socioNombreCompleto || "Socio");
      setEditPrestamoMonto(String(p.montoPrincipal || ""));
      setEditPrestamoCuotas(String(p.nroCuotas || "6"));
      setEditPrestamoTasa(String(((p.tasaMensual || 0) * 100).toFixed(2)));
      setEditPrestamoFecha1raCuota(p.fechaPrimeraCuota || "");
      setEditPrestamoProposito(p.proposito || "");
      setEditPrestamoObservacion("");
      setModalEditarPrestamo(true);
    } catch (err: any) {
      toast.error(err.message || "Error al abrir edición de préstamo");
    } finally {
      setProcesando(false);
    }
  };

  const handleEditarPrestamoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrestamoId || !periodoId) return;
    const monto = parseFloat(editPrestamoMonto);
    if (!monto || monto <= 0) {
      toast.error("El monto debe ser mayor a cero");
      return;
    }
    const cuotas = parseInt(editPrestamoCuotas);
    if (!cuotas || cuotas <= 0) {
      toast.error("El número de cuotas debe ser al menos 1");
      return;
    }
    const tasa = parseFloat(editPrestamoTasa);
    if (isNaN(tasa) || tasa < 0) {
      toast.error("La tasa mensual debe ser válida");
      return;
    }
    if (!editPrestamoObservacion || editPrestamoObservacion.trim().length < 5) {
      toast.error("Debe ingresar una observación justificando la edición (mínimo 5 caracteres)");
      return;
    }

    try {
      setProcesando(true);
      const res = await fetch(`/api/prestamos/${editPrestamoId}/asamblea`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodoId,
          montoPrincipal: monto,
          tasaMensual: tasa / 100,
          nroCuotas: cuotas,
          fechaDesembolso: data?.periodo.fechaReunion,
          fechaPrimeraCuota: editPrestamoFecha1raCuota,
          proposito: editPrestamoProposito || "Préstamo en asamblea",
          observacion: editPrestamoObservacion.trim(),
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.detail || resData.error || resData.message || "Error al editar préstamo");
      }
      toast.success("Préstamo modificado correctamente y cronograma recalculado.");
      setModalEditarPrestamo(false);
      cargarPlanilla();
    } catch (err: any) {
      toast.error(err.message || "Error al editar préstamo");
    } finally {
      setProcesando(false);
    }
  };

  const abrirModalEliminarPrestamo = (prestamoId: string, numero: number, socioNombre: string, monto: number) => {
    setEliminarPrestamoId(prestamoId);
    setEliminarPrestamoNumero(numero);
    setEliminarPrestamoSocio(socioNombre);
    setEliminarPrestamoMonto(monto);
    setMotivoEliminacionPrestamo("");
    setModalEliminarPrestamo(true);
  };

  const handleEliminarPrestamoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eliminarPrestamoId || !periodoId) return;
    if (!motivoEliminacionPrestamo || motivoEliminacionPrestamo.trim().length < 5) {
      toast.error("El comentario con el motivo de eliminación debe tener al menos 5 caracteres");
      return;
    }

    try {
      setProcesando(true);
      const res = await fetch(`/api/prestamos/${eliminarPrestamoId}/asamblea`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodoId,
          motivo: motivoEliminacionPrestamo.trim(),
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.detail || resData.error || resData.message || "Error al eliminar préstamo");
      }
      toast.success("Préstamo eliminado exitosamente. El egreso contable fue anulado y el saldo regresó a caja.");
      setModalEliminarPrestamo(false);
      cargarPlanilla();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar préstamo");
    } finally {
      setProcesando(false);
    }
  };

  const abrirModalModificarCuotas = async (prestamoId: string) => {
    try {
      setProcesando(true);
      const res = await fetch(`/api/prestamos/${prestamoId}`);
      if (!res.ok) throw new Error("No se pudo cargar la información del préstamo");
      const pData = await res.json();
      const p = pData.prestamo || pData;
      const cronograma = pData.cronograma || [];
      setModCuotasPrestamoId(p.id);
      setModCuotasNumero(p.numero);
      setModCuotasSocio(p.socioNombreCompleto || "Socio");
      setModCuotasPrincipal(Number(p.montoPrincipal) || 0);
      setModCuotasLista(
        cronograma.map((c: any) => ({
          id: c.id,
          nroCuota: c.nroCuota,
          fechaVencimiento: c.fechaVencimiento,
          capitalProgramado: Number(c.capitalProgramado) || 0,
          interesProgramado: Number(c.interesProgramado) || 0,
          capitalPagado: Number(c.capitalPagado) || 0,
          interesPagado: Number(c.interesPagado) || 0,
          estado: c.estado,
        }))
      );
      setModCuotasObservacion("");
      setModalModificarCuotas(true);
    } catch (err: any) {
      toast.error(err.message || "Error al abrir reprogramación de cuotas");
    } finally {
      setProcesando(false);
    }
  };

  const handleModificarCuotasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modCuotasPrestamoId) return;
    if (!modCuotasObservacion || modCuotasObservacion.trim().length < 5) {
      toast.error("Debe ingresar una observación justificando la reprogramación de cuotas (mínimo 5 caracteres)");
      return;
    }

    const sumaCapital = modCuotasLista.reduce((acc, c) => acc + (Number(c.capitalProgramado) || 0), 0);
    const diff = Math.abs(sumaCapital - modCuotasPrincipal);
    if (diff > 0.05) {
      toast.error(
        `La suma de los capitales programados (S/. ${sumaCapital.toFixed(2)}) debe coincidir con el monto principal del préstamo (S/. ${modCuotasPrincipal.toFixed(2)}). Diferencia: S/. ${diff.toFixed(2)}`
      );
      return;
    }

    try {
      setProcesando(true);
      const payload = {
        cuotas: modCuotasLista
          .filter((c) => c.estado !== "PAGADA")
          .map((c) => ({
            cuotaId: c.id,
            capitalProgramado: Number(c.capitalProgramado),
            interesProgramado: Number(c.interesProgramado),
            fechaVencimiento: c.fechaVencimiento,
          })),
        observacion: modCuotasObservacion.trim(),
      };

      const res = await fetch(`/api/prestamos/${modCuotasPrestamoId}/cuotas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.detail || resData.error || resData.message || "Error al reprogramar cuotas");
      }
      toast.success("Cuotas reprogramadas exitosamente con justificación registrada.");
      setModalModificarCuotas(false);
      cargarPlanilla();
    } catch (err: any) {
      toast.error(err.message || "Error al reprogramar cuotas");
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarPeriodo = async () => {
    if (!data) return;
    if (Number(data.saldoFinal) !== 0) {
      toast.error(
        `No se puede cerrar la caja. Existe un saldo disponible de S/. ${Number(data.saldoFinal).toFixed(2)}. Todo el saldo debe colocarse en préstamos hasta llegar a cero (S/. 0.00).`
      );
      return;
    }
    try {
      setProcesando(true);
      const res = await fetch(`/api/periodos/${periodoId}/cerrar`, {
        method: "POST",
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.detail || resData.message || resData.error || "Error al cerrar periodo");
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
  const filasRender = filasEditables.length > 0 ? filasEditables : data.filas;

  const filasConPrestamos = filasRender.filter(
    (f) => (f.detallesPrestamos && f.detallesPrestamos.length > 0) || Boolean(f.cuotaId)
  );
  const algunoExpandido = filasConPrestamos.some((f, idx) =>
    Boolean(filasDetalleExpandido[f.socioId || `sin-socio-${idx}`])
  );

  const toggleExpandirTodos = () => {
    if (algunoExpandido) {
      setFilasDetalleExpandido({});
    } else {
      const all: Record<string, boolean> = {};
      filasRender.forEach((f, idx) => {
        const key = f.socioId || `sin-socio-${idx}`;
        if ((f.detallesPrestamos && f.detallesPrestamos.length > 0) || Boolean(f.cuotaId)) {
          all[key] = true;
        }
      });
      setFilasDetalleExpandido(all);
    }
  };

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
            Réplica exacta del libro contable de 14 columnas &bull; Fecha de asamblea: {formatFecha(p.fechaReunion)}
          </p>
        </div>

        {/* Botonera */}
        <div className="flex flex-wrap items-center gap-2">
          {!esCerrado && (
            <>
              <Button
                onClick={handleGuardarPlanilla}
                disabled={guardando || !isDirty}
                className={cn(
                  "gap-1.5 shadow-sm transition-all",
                  isDirty
                    ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
                title="Guarda todos los cobros validados en el libro contable"
              >
                {guardando ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Guardar Planilla</span>
                {isDirty && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-amber-200 text-amber-900 font-semibold">
                    Modificado
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleValidarTodos}
                className="gap-1.5 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
                title="Marca todas las cuotas y aportes sugeridos como cobrados"
              >
                <Check className="h-4 w-4 text-emerald-600" />
                Cobrar Todo
              </Button>
              <Button
                variant="outline"
                onClick={handleDesmarcarTodos}
                className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                title="Marca todas las cuotas y aportes como no cobrados"
              >
                <X className="h-4 w-4 text-destructive" />
                Desmarcar Todo
              </Button>
              <Button
                variant="outline"
                onClick={handlePrecargarPlanilla}
                disabled={precargando}
                className="gap-1.5"
                title="Restablece la estimación sugerida (1 acción y cuotas programadas)"
              >
                {precargando ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 text-blue-500" />
                )}
                Restablecer
              </Button>
              <Button
                onClick={() => {
                  setMontosConcepto({});
                  setModalOperacion(true);
                }}
                variant="secondary"
                className="gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                Operación Manual
              </Button>
              <Button
                onClick={() => abrirModalPrestamo()}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Coins className="h-4 w-4" />
                Otorgar Préstamo
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              <p className="text-xs uppercase font-medium text-emerald-600 dark:text-emerald-400">Total Cobrado (En Caja)</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                + S/. {(totalesCalculados?.totalIngreso ?? Number(data.totalIngresosMes)).toFixed(2)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Recaudado validado en asamblea</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs uppercase font-medium text-blue-600 dark:text-blue-400">Estimado a Cobrar</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                S/. {(totalesCalculados?.totalEstimado ?? 0).toFixed(2)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Pendiente: S/. {Math.max(0, (totalesCalculados?.totalEstimado ?? 0) - (totalesCalculados?.totalIngreso ?? 0)).toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs uppercase font-medium text-destructive">Total Egresos</p>
              <h3 className="text-2xl font-bold mt-1 text-destructive">
                - S/. {(totalesCalculados?.totalEgreso ?? Number(data.totalEgresosMes)).toFixed(2)}
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
                S/. {(
                  Number(data.saldoAnterior) +
                  (totalesCalculados
                    ? (totalesCalculados.totalIngreso - totalesCalculados.totalEgreso)
                    : (Number(data.totalIngresosMes) - Number(data.totalEgresosMes)))
                ).toFixed(2)}
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
          <div className="flex items-center gap-2">
            {!esCerrado && isDirty && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                Cambios pendientes de guardar
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {filasRender.length} registros
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table
            className="text-xs whitespace-nowrap"
            containerClassName="overflow-auto max-h-[calc(100vh-220px)] min-h-[460px]"
          >
            <TableHeader className="sticky top-0 z-30 bg-muted shadow-xs">
              <TableRow className="bg-muted border-b h-8">
                <TableHead
                  rowSpan={2}
                  className="w-[56px] min-w-[56px] max-w-[56px] text-center font-bold border-r sticky top-0 left-0 z-50 bg-muted"
                >
                  Recibo
                </TableHead>
                <TableHead
                  rowSpan={2}
                  className="w-[300px] min-w-[300px] max-w-[300px] font-bold border-r-2 border-border sticky top-0 left-[56px] z-50 bg-muted shadow-[4px_0_10px_-2px_rgba(0,0,0,0.12)] dark:shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Socio / Concepto</span>
                    {filasConPrestamos.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleExpandirTodos}
                        className="text-[10px] font-normal text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/60 hover:bg-muted/80 transition-colors cursor-pointer"
                        title={algunoExpandido ? "Colapsar todos los préstamos" : "Ver todos los detalles de préstamos"}
                      >
                        <span>{algunoExpandido ? "Colapsar" : "Detalles"}</span>
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            algunoExpandido && "rotate-180"
                          )}
                        />
                      </button>
                    )}
                  </div>
                </TableHead>
                <TableHead colSpan={7} className="h-8 py-1 text-center font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-r sticky top-0 z-30 bg-muted">
                  INGRESOS (S/.)
                </TableHead>
                <TableHead colSpan={8} className="h-8 py-1 text-center font-bold bg-destructive/15 text-destructive border-r sticky top-0 z-30 bg-muted">
                  EGRESOS (S/.)
                </TableHead>
                <TableHead rowSpan={2} className="text-center font-bold w-16 sticky top-0 z-30 bg-muted border-l">
                  Acciones
                </TableHead>
              </TableRow>
              <TableRow className="bg-muted/95 border-b-2 border-border shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
                {/* Ingresos (7 columnas) */}
                <TableHead className="text-right sticky top-8 z-30 bg-muted">Ahorro</TableHead>
                <TableHead className="text-right min-w-[130px] sticky top-8 z-30 bg-muted">Cap. Cobrado</TableHead>
                <TableHead className="text-right min-w-[90px] sticky top-8 z-30 bg-muted">Interés Rec.</TableHead>
                <TableHead className="text-right min-w-[110px] sticky top-8 z-30 bg-muted">Acciones</TableHead>
                <TableHead className="text-right min-w-[70px] sticky top-8 z-30 bg-muted">Tardanza</TableHead>
                <TableHead className="text-right min-w-[70px] sticky top-8 z-30 bg-muted">Reserva</TableHead>
                <TableHead className="text-right font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-r sticky top-8 z-30 bg-muted">Total Ing.</TableHead>

                {/* Egresos (8 columnas) */}
                <TableHead className="text-right sticky top-8 z-30 bg-muted">Ret. Ahorro</TableHead>
                <TableHead className="text-right sticky top-8 z-30 bg-muted">Préstamo</TableHead>
                <TableHead className="text-right sticky top-8 z-30 bg-muted">Interés Pag.</TableHead>
                <TableHead className="text-right sticky top-8 z-30 bg-muted">Gasto Adm.</TableHead>
                <TableHead className="text-right sticky top-8 z-30 bg-muted">Utilidad</TableHead>
                <TableHead className="text-right sticky top-8 z-30 bg-muted">Red</TableHead>
                <TableHead className="text-right sticky top-8 z-30 bg-muted">Otro Egr.</TableHead>
                <TableHead className="text-right font-bold bg-destructive/15 text-destructive border-r sticky top-8 z-30 bg-muted">Total Egr.</TableHead>
              </TableRow>
            </TableHeader>

              <TableBody>
                {filasRender.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center py-12 text-muted-foreground">
                      No hay operaciones registradas aún en este periodo. Utilice "Pre-cargar Sugeridos" o "Registrar Operación" para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filasRender.map((f, idx) => {
                    const esFilaEditable = !esCerrado && Boolean(f.socioId);
                    const tieneDeuda = Boolean(
                      f.cuotaId ||
                      (f.cuotaCapitalProgramado && f.cuotaCapitalProgramado > 0) ||
                      f.pagoCapital > 0 ||
                      f.interesRecibido > 0
                    );

                    const rowKey = f.socioId || `sin-socio-${idx}`;
                    const isExpanded = Boolean(filasDetalleExpandido[rowKey]);
                    const tienePrestamoInfo = (f.detallesPrestamos && f.detallesPrestamos.length > 0) || Boolean(f.cuotaId);
                    const cantPrestamos = f.detallesPrestamos?.length ?? (f.cuotaId ? 1 : 0);
                    const adelantosDisponibles = f.cuotasDisponiblesAdelanto?.length ?? 0;

                    return (
                      <TableRow key={rowKey} className="group hover:bg-muted/40 transition-colors">
                        <TableCell className="w-[56px] min-w-[56px] max-w-[56px] text-center font-mono text-muted-foreground border-r sticky left-0 z-10 bg-card group-hover:bg-muted/60 transition-colors">
                          {f.nroRecibo ? `#${f.nroRecibo}` : "-"}
                        </TableCell>
                        <TableCell className="w-[300px] min-w-[300px] max-w-[300px] font-medium text-foreground border-r-2 border-border sticky left-[56px] z-10 bg-card group-hover:bg-muted/60 transition-colors shadow-[4px_0_10px_-2px_rgba(0,0,0,0.12)] dark:shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)]">
                          <div className="flex flex-col gap-1 whitespace-normal">
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {f.socioCodigo && (
                                  <span className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded text-muted-foreground shrink-0">
                                    #{f.socioCodigo}
                                  </span>
                                )}
                                <span className="truncate max-w-[170px]" title={f.socioNombre}>
                                  {f.socioNombre}
                                </span>
                              </div>

                              {/* Botón flecha abajo para desplegar detalles de préstamo */}
                              {tienePrestamoInfo && (
                                <button
                                  type="button"
                                  onClick={() => toggleDetalleFila(rowKey)}
                                  className={cn(
                                    "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border transition-colors shrink-0 cursor-pointer shadow-2xs",
                                    isExpanded
                                      ? "bg-primary/10 text-primary border-primary/30"
                                      : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted border-border/60"
                                  )}
                                  title={isExpanded ? "Ocultar detalles de préstamo" : "Ver detalles de cuotas y préstamos"}
                                >
                                  <Coins className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>
                                    {cantPrestamos} {cantPrestamos === 1 ? "prést." : "prést."}
                                  </span>
                                  {adelantosDisponibles > 0 && (
                                    <span className="bg-blue-600 text-white font-bold px-1 py-0.1 rounded-full text-[9px] leading-tight">
                                      +{adelantosDisponibles}
                                    </span>
                                  )}
                                  <ChevronDown
                                    className={cn(
                                      "h-3 w-3 text-muted-foreground transition-transform duration-200",
                                      isExpanded && "rotate-180"
                                    )}
                                  />
                                </button>
                              )}
                            </div>

                            {/* Detalle de préstamos y cuotas desplegable */}
                            {isExpanded && tienePrestamoInfo && (
                              <div className="flex flex-col gap-1.5 mt-1 pt-1.5 border-t border-border/50 animate-in fade-in-50 duration-150">
                                {f.detallesPrestamos && f.detallesPrestamos.length > 0 ? (
                                  <>
                                    {f.detallesPrestamos.map((d, dIdx) => (
                                      <div
                                        key={`${d.cuotaId}-${dIdx}`}
                                        className={cn(
                                          "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border leading-normal shadow-2xs",
                                          d.esAdelanto
                                            ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/40"
                                            : "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 border-emerald-500/30"
                                        )}
                                      >
                                        <Coins className="h-3.5 w-3.5 shrink-0" />
                                        <span>
                                          {d.esAdelanto ? (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 mr-1 bg-amber-500 text-white dark:text-black font-bold border-amber-600">
                                              ADELANTO
                                            </Badge>
                                          ) : null}
                                          <strong>Préstamo #{d.prestamoNumero} (Cuota {d.cuotaNro}/{d.cuotasTotal}):</strong>{" "}
                                          <span className="font-mono font-semibold">
                                            Cap S/ {(f.cuotaPagada ? (d.capitalPagado > 0 ? d.capitalPagado : d.capitalProgramado) : d.capitalProgramado).toFixed(2)} + Int S/ {(f.cuotaPagada ? (d.interesPagado > 0 ? d.interesPagado : d.interesProgramado) : d.interesProgramado).toFixed(2)}
                                          </span>
                                        </span>
                                      </div>
                                    ))}

                                    {/* Botón para abrir modal de desglose / adelanto */}
                                    <button
                                      type="button"
                                      onClick={() => abrirModalDetallePrestamos(f, idx)}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-1 rounded-md transition-colors w-fit shadow-2xs cursor-pointer"
                                    >
                                      <Coins className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                      <span>Ver Desglose / Adelantar Cuotas</span>
                                      {adelantosDisponibles > 0 && (
                                        <span className="bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                                          +{adelantosDisponibles} disp.
                                        </span>
                                      )}
                                    </button>
                                  </>
                                ) : f.cuotaId ? (
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                        {f.prestamoNumero ? `Prést. #${f.prestamoNumero}: ` : ""}Cuota {f.cuotaNro ?? 1}/{f.cuotasTotal ?? "-"}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => abrirModalDetallePrestamos(f, idx)}
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors w-fit cursor-pointer"
                                    >
                                      <Coins className="h-3 w-3 text-blue-600" />
                                      <span>Ver Desglose / Adelantar</span>
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Ingresos */}
                        {esFilaEditable ? (
                          <>
                            {/* Ahorro editable */}
                            <TableCell className="text-right p-1 font-mono">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={f.ahorro !== undefined && f.ahorro !== 0 ? f.ahorro : ""}
                                placeholder="0.00"
                                onChange={(e) =>
                                  handleCellChange(idx, "ahorro", e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)
                                }
                                className="h-7 w-20 text-right text-xs px-1.5 font-mono ml-auto"
                              />
                            </TableCell>

                            {/* Pago Capital editable con toggle de cuota */}
                            <TableCell className="text-right p-1 font-mono">
                              {tieneDeuda ? (
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCuota(idx)}
                                    className={cn(
                                      "px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-0.5 shrink-0",
                                      f.cuotaPagada
                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-emerald-500/20"
                                    )}
                                    title={f.cuotaPagada ? "Cuota Cobrada. Clic para marcar No Cobrado" : "Cuota No Cobrada. Clic para marcar Cobrado"}
                                  >
                                    {f.cuotaPagada ? <Check className="h-3 w-3 text-emerald-600" /> : <X className="h-3 w-3 text-amber-600" />}
                                    <span>
                                      {f.detallesPrestamos && f.detallesPrestamos.length > 1
                                        ? `${f.detallesPrestamos.length} Préstamos`
                                        : f.cuotaNro
                                        ? `C#${f.cuotaNro}`
                                        : "Cuota"}{" "}
                                      {f.cuotaPagada ? "Cobrado" : "No Cobrado"}
                                    </span>
                                  </button>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={f.pagoCapital !== undefined && f.pagoCapital !== 0 ? f.pagoCapital : (f.cuotaCapitalProgramado || "")}
                                    placeholder="0.00"
                                    title={!f.cuotaPagada ? `Estimado programado: S/. ${(f.cuotaCapitalProgramado || 0).toFixed(2)} (No Cobrado)` : "Capital Cobrado"}
                                    onChange={(e) =>
                                      handleCellChange(idx, "pagoCapital", e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)
                                    }
                                    className={cn(
                                      "h-7 w-20 text-right text-xs px-1.5 font-mono ml-auto",
                                      f.cuotaPagada
                                        ? "border-emerald-500/50 text-foreground font-semibold"
                                        : "border-dashed text-muted-foreground bg-muted/20"
                                    )}
                                  />
                                </div>
                              ) : (
                                <span className="text-muted-foreground pr-2">-</span>
                              )}
                            </TableCell>

                            {/* Interés Recibido editable */}
                            <TableCell className="text-right p-1 font-mono">
                              {tieneDeuda ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={f.interesRecibido !== undefined && f.interesRecibido !== 0 ? f.interesRecibido : (f.cuotaInteresProgramado || "")}
                                  placeholder="0.00"
                                  title={!f.cuotaPagada ? `Estimado programado: S/. ${(f.cuotaInteresProgramado || 0).toFixed(2)} (No Cobrado)` : "Interés Cobrado"}
                                  onChange={(e) =>
                                    handleCellChange(idx, "interesRecibido", e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)
                                  }
                                  className={cn(
                                    "h-7 w-20 text-right text-xs px-1.5 font-mono ml-auto",
                                    f.cuotaPagada
                                      ? "border-emerald-500/50 text-foreground font-semibold"
                                      : "border-dashed text-muted-foreground bg-muted/20"
                                  )}
                                />
                              ) : (
                                <span className="text-muted-foreground pr-2">-</span>
                              )}
                            </TableCell>

                            {/* Acciones editable con toggle de aporte */}
                            <TableCell className="text-right p-1 font-mono">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAcciones(idx)}
                                  className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-0.5 shrink-0",
                                    f.accionesPagado
                                      ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/25"
                                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-blue-500/20"
                                  )}
                                  title={f.accionesPagado ? "Aporte de acción Cobrado. Clic para marcar No Cobrado" : "Aporte No Cobrado. Clic para marcar Cobrado"}
                                >
                                  {f.accionesPagado ? <Check className="h-3 w-3 text-blue-600" /> : <X className="h-3 w-3 text-amber-600" />}
                                  <span>{f.accionesPagado ? "Cobrado" : "No Cobrado"}</span>
                                </button>
                                <Input
                                  type="number"
                                  step="30"
                                  min="0"
                                  value={f.acciones !== undefined && f.acciones !== 0 ? f.acciones : 30}
                                  placeholder="30.00"
                                  title={!f.accionesPagado ? "Estimado sugerido: S/. 30.00 (1 acción - No Cobrado)" : "Acciones Cobradas"}
                                  onChange={(e) =>
                                    handleCellChange(idx, "acciones", e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)
                                  }
                                  className={cn(
                                    "h-7 w-16 text-right text-xs px-1.5 font-mono ml-auto",
                                    f.accionesPagado
                                      ? "border-blue-500/50 text-foreground font-semibold"
                                      : "border-dashed text-muted-foreground bg-muted/20"
                                  )}
                                />
                              </div>
                            </TableCell>

                            {/* Tardanza / Multa editable */}
                            <TableCell className="text-right p-1 font-mono">
                              <Input
                                type="number"
                                step="1"
                                min="0"
                                value={f.tardanzaMulta !== undefined && f.tardanzaMulta !== 0 ? f.tardanzaMulta : ""}
                                placeholder="0.00"
                                onChange={(e) =>
                                  handleCellChange(idx, "tardanzaMulta", e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)
                                }
                                className="h-7 w-16 text-right text-xs px-1.5 font-mono ml-auto"
                              />
                            </TableCell>

                            {/* Reservas editable */}
                            <TableCell className="text-right p-1 font-mono">
                              <Input
                                type="number"
                                step="1"
                                min="0"
                                value={f.reservas !== undefined && f.reservas !== 0 ? f.reservas : ""}
                                placeholder="0.00"
                                onChange={(e) =>
                                  handleCellChange(idx, "reservas", e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)
                                }
                                className="h-7 w-16 text-right text-xs px-1.5 font-mono ml-auto"
                              />
                            </TableCell>

                            {/* Total Ingreso fila */}
                            <TableCell className={cn(
                              "text-right font-mono font-bold border-r px-2",
                              f.totalIngreso > 0
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                                : "text-muted-foreground/60"
                            )}>
                              {f.totalIngreso > 0 ? f.totalIngreso.toFixed(2) : "S/. 0.00"}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            {/* Ingresos en modo lectura (Caja general o cerrado) */}
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
                          </>
                        )}

                        {/* Egresos */}
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {f.retiroAhorro > 0 ? f.retiroAhorro.toFixed(2) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {f.prestamo > 0 ? (
                            <div className="flex items-center justify-end gap-1">
                              {f.prestamoId ? (
                                <>
                                  <Link
                                    href={`/admin/prestamos/${f.prestamoId}`}
                                    className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline mr-1"
                                    title="Ver detalle completo del préstamo, cronograma e intereses"
                                  >
                                    <Coins className="h-3.5 w-3.5" />
                                    <span>{f.prestamo.toFixed(2)}</span>
                                  </Link>
                                  {!esCerrado && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => abrirModalEditarPrestamo(f.prestamoId!)}
                                        className="p-1 rounded hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                                        title="Editar condiciones del préstamo antes del cierre"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          abrirModalEliminarPrestamo(
                                            f.prestamoId!,
                                            f.prestamoNumero || 0,
                                            f.socioNombre,
                                            f.prestamo
                                          )
                                        }
                                        className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                                        title="Eliminar préstamo antes del cierre (requiere comentario)"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => abrirModalModificarCuotas(f.prestamoId!)}
                                    className="p-1 rounded hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                                    title="Modificar o reprogramar cuotas del préstamo (requiere observación)"
                                  >
                                    <CalendarClock className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              ) : !esCerrado ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirModalPrestamo(
                                      f.socioId || undefined,
                                      f.prestamo,
                                      f.operacionEgresoId || undefined
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-500/20 transition-colors cursor-pointer"
                                  title="Egreso registrado sin cronograma. Clic para generar el préstamo formal, sus cuotas y su tasa de interés"
                                >
                                  <Coins className="h-3 w-3" />
                                  <span>{f.prestamo.toFixed(2)}</span>
                                  <span className="text-[10px] font-normal underline">Generar</span>
                                </button>
                              ) : (
                                <span className="text-muted-foreground">{f.prestamo.toFixed(2)}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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
                          <div className="flex items-center justify-center gap-1">
                            {!esCerrado && f.socioId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  abrirModalPrestamo(
                                    f.socioId || undefined,
                                    f.prestamo > 0 ? f.prestamo : undefined,
                                    f.operacionEgresoId || undefined
                                  )
                                }
                                className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                                title={
                                  f.prestamo > 0 && !f.prestamoId
                                    ? "Generar préstamo, cuotas y tasa de interés para este egreso"
                                    : "Otorgar préstamo a este socio"
                                }
                              >
                                <Coins className="h-3.5 w-3.5" />
                              </Button>
                            )}
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
                            ) : null}
                            {esCerrado && !f.prestamoId && !f.operacionIngresoId && !f.operacionEgresoId && (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>

              {/* Fila de Totales en Pie de Tabla */}
              <TableFooter className="font-bold text-xs bg-muted sticky bottom-0 z-20 border-t-2 border-border shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.08)]">
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="sticky bottom-0 left-0 z-30 bg-muted text-right font-bold uppercase tracking-wider border-r-2 border-border shadow-[4px_0_10px_-2px_rgba(0,0,0,0.12)] dark:shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)] min-w-[356px] max-w-[356px]"
                  >
                    TOTALES DEL MES:
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(totalesCalculados?.ahorro ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(totalesCalculados?.pagoCapital ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(totalesCalculados?.interesRecibido ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(totalesCalculados?.acciones ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(totalesCalculados?.tardanzaMulta ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(totalesCalculados?.reservas ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-r">
                    {(totalesCalculados?.totalIngreso ?? Number(data.totalIngresosMes)).toFixed(2)}
                  </TableCell>

                  {/* Totales Egresos */}
                  <TableCell className="text-right font-mono">
                    {(totalesCalculados?.retiroAhorro ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(totalesCalculados?.prestamo ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(totalesCalculados?.interesPagado ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(totalesCalculados?.gastoAdmin ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(totalesCalculados?.utilidad ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(totalesCalculados?.red ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(totalesCalculados?.otroEgreso ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-extrabold text-destructive bg-destructive/10 border-r">
                    {(totalesCalculados?.totalEgreso ?? Number(data.totalEgresosMes)).toFixed(2)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
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
            {tipoFlujo === "EGRESO" && (
              <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <Coins className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="space-y-0.5">
                  <p className="font-semibold">¿Va a otorgar un préstamo a un socio?</p>
                  <p className="text-[11px] text-muted-foreground">
                    Para registrar un préstamo formal con su cronograma de cuotas mensuales y cálculo de intereses, recomendamos utilizar directamente la opción <strong>"Otorgar Préstamo"</strong>.
                  </p>
                </div>
              </div>
            )}
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

      {/* DIALOG: Otorgar Préstamo en Asamblea (Ampliación y Vista Completa) */}
      <Dialog open={modalPrestamo} onOpenChange={setModalPrestamo}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-lg">
              <Coins className="h-5 w-5" />
              Otorgar Préstamo en Asamblea
            </DialogTitle>
            <DialogDescription>
              Colocación de fondos de la asamblea comunal. Genera automáticamente el egreso contable en la planilla y el cronograma de amortización oficial con intereses sobre saldo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleOtorgarPrestamoSubmit} className="space-y-4">
            {/* Saldo disponible banner */}
            <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Saldo disponible en caja para prestar:</span>
              <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                S/. {Number(data.saldoFinal).toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Formulario (5 columnas) */}
              <div className="lg:col-span-5 space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Socio Beneficiario *</Label>
                  <Select value={prestamoSocioId} onValueChange={setPrestamoSocioId} required>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Seleccione el socio titular..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {socios.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          #{String(s.codigo).padStart(3, "0")} - {s.nombreCompleto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Monto a Prestar (S/.) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="0.00"
                      value={prestamoMonto}
                      onChange={(e) => setPrestamoMonto(e.target.value)}
                      className="h-9 font-mono font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Plazo (Meses / Cuotas) *</Label>
                    <Select value={prestamoCuotas} onValueChange={setPrestamoCuotas}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} {n === 1 ? "mes (1 cuota)" : `meses (${n} cuotas)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tasa Interés Mensual (%) *</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        value={prestamoTasa}
                        onChange={(e) => setPrestamoTasa(e.target.value)}
                        className="h-9 font-mono pr-8"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Fecha 1ra Cuota *</Label>
                    <Input
                      type="date"
                      required
                      value={prestamoFecha1raCuota}
                      onChange={(e) => setPrestamoFecha1raCuota(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Destino / Propósito del Crédito</Label>
                  <Input
                    placeholder="Ej. Capital de trabajo, comercio, siembra..."
                    value={prestamoProposito}
                    onChange={(e) => setPrestamoProposito(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Resumen Financiero */}
                {cronogramaSimuladoNuevo.length > 0 && (
                  <div className="p-3 rounded-lg border bg-muted/40 space-y-1.5 text-xs">
                    <p className="font-semibold text-foreground">Totales Proyectados:</p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capital Colocado:</span>
                      <span className="font-mono font-bold">
                        S/. {(parseFloat(prestamoMonto) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Intereses Proyectados:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        S/. {cronogramaSimuladoNuevo.reduce((acc, c) => acc + c.interes, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="font-semibold text-foreground">Total a Devolver:</span>
                      <span className="font-mono font-bold text-foreground">
                        S/. {cronogramaSimuladoNuevo.reduce((acc, c) => acc + c.totalCuota, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cronograma en Vivo (7 columnas) */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Cronograma de Pagos Oficial</p>
                    <p className="text-[11px] text-muted-foreground">Método: Capital Fijo con Interés Decreciente sobre Saldo</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {cronogramaSimuladoNuevo.length} cuotas
                  </Badge>
                </div>

                {cronogramaSimuladoNuevo.length > 0 ? (
                  <div className="mt-2 border rounded-lg overflow-hidden flex-1 flex flex-col">
                    <div className="max-h-72 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 text-[11px]">
                            <TableHead className="w-12 text-center h-8 px-2 font-bold">N°</TableHead>
                            <TableHead className="h-8 px-2 font-bold">Vencimiento</TableHead>
                            <TableHead className="text-right h-8 px-2 font-bold">Capital</TableHead>
                            <TableHead className="text-right h-8 px-2 font-bold">Interés</TableHead>
                            <TableHead className="text-right h-8 px-2 font-bold text-emerald-600 dark:text-emerald-400">Cuota</TableHead>
                            <TableHead className="text-right h-8 px-2 font-bold text-muted-foreground">Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cronogramaSimuladoNuevo.map((c) => (
                            <TableRow key={c.nroCuota} className="text-xs hover:bg-muted/30">
                              <TableCell className="text-center font-mono py-1.5 px-2 font-bold">{c.nroCuota}</TableCell>
                              <TableCell className="py-1.5 px-2 font-mono text-[11px]">{formatFecha(c.fechaVencimiento)}</TableCell>
                              <TableCell className="text-right font-mono py-1.5 px-2">S/. {c.capital.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-mono py-1.5 px-2 text-emerald-600 dark:text-emerald-400">
                                S/. {c.interes.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-mono py-1.5 px-2 font-bold">S/. {c.totalCuota.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-mono py-1.5 px-2 text-muted-foreground">
                                S/. {c.saldoRestante.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-muted/50 p-2.5 border-t mt-auto flex items-center justify-between text-xs font-mono font-bold">
                      <span>Total Cronograma:</span>
                      <div className="flex gap-4">
                        <span>Cap: S/. {cronogramaSimuladoNuevo.reduce((acc, c) => acc + c.capital, 0).toFixed(2)}</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Int: S/. {cronogramaSimuladoNuevo.reduce((acc, c) => acc + c.interes, 0).toFixed(2)}
                        </span>
                        <span>Total: S/. {cronogramaSimuladoNuevo.reduce((acc, c) => acc + c.totalCuota, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border rounded-lg border-dashed p-6 text-center text-muted-foreground text-xs mt-2">
                    <Coins className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="font-medium">Ingrese el monto y plazo para visualizar el cronograma detallado</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setModalPrestamo(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={procesando} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {procesando ? "Otorgando..." : "Confirmar y Desembolsar Préstamo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Editar Préstamo en Asamblea (Permitido antes de cerrar el periodo) */}
      <Dialog open={modalEditarPrestamo} onOpenChange={setModalEditarPrestamo}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-lg">
              <Pencil className="h-5 w-5" />
              Editar Préstamo en Asamblea #{editPrestamoNumero} - {editPrestamoSocioNombre}
            </DialogTitle>
            <DialogDescription>
              Modificación de las condiciones del crédito antes del cierre del periodo. Recalcula el cronograma de cuotas y actualiza automáticamente el monto del egreso en el libro de caja.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditarPrestamoSubmit} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Formulario (5 columnas) */}
              <div className="lg:col-span-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Monto Principal (S/.) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="0.00"
                      value={editPrestamoMonto}
                      onChange={(e) => setEditPrestamoMonto(e.target.value)}
                      className="h-9 font-mono font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Plazo (Cuotas) *</Label>
                    <Select value={editPrestamoCuotas} onValueChange={setEditPrestamoCuotas}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} {n === 1 ? "mes (1 cuota)" : `meses (${n} cuotas)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tasa Mensual (%) *</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        value={editPrestamoTasa}
                        onChange={(e) => setEditPrestamoTasa(e.target.value)}
                        className="h-9 font-mono pr-8"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Fecha 1ra Cuota *</Label>
                    <Input
                      type="date"
                      required
                      value={editPrestamoFecha1raCuota}
                      onChange={(e) => setEditPrestamoFecha1raCuota(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Destino / Propósito</Label>
                  <Input
                    placeholder="Ej. Modificación de propósito..."
                    value={editPrestamoProposito}
                    onChange={(e) => setEditPrestamoProposito(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Observación / Justificación Obligatoria *
                  </Label>
                  <Textarea
                    rows={2}
                    required
                    placeholder="Indique el motivo de la corrección o acuerdo en asamblea (mínimo 5 caracteres)..."
                    value={editPrestamoObservacion}
                    onChange={(e) => setEditPrestamoObservacion(e.target.value)}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Obligatorio para el registro inmutable de auditoría contable.
                  </p>
                </div>

                {cronogramaSimuladoEdit.length > 0 && (
                  <div className="p-3 rounded-lg border bg-muted/40 space-y-1.5 text-xs">
                    <p className="font-semibold text-foreground">Totales Recalculados:</p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capital:</span>
                      <span className="font-mono font-bold">
                        S/. {(parseFloat(editPrestamoMonto) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Intereses:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        S/. {cronogramaSimuladoEdit.reduce((acc, c) => acc + c.interes, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="font-semibold text-foreground">Total a Pagar:</span>
                      <span className="font-mono font-bold">
                        S/. {cronogramaSimuladoEdit.reduce((acc, c) => acc + c.totalCuota, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cronograma Recalculado (7 columnas) */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Nuevo Cronograma Proyectado</p>
                    <p className="text-[11px] text-muted-foreground">Sustituye las cuotas anteriores tras confirmación</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {cronogramaSimuladoEdit.length} cuotas
                  </Badge>
                </div>

                {cronogramaSimuladoEdit.length > 0 ? (
                  <div className="mt-2 border rounded-lg overflow-hidden flex-1 flex flex-col">
                    <div className="max-h-72 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 text-[11px]">
                            <TableHead className="w-12 text-center h-8 px-2 font-bold">N°</TableHead>
                            <TableHead className="h-8 px-2 font-bold">Vencimiento</TableHead>
                            <TableHead className="text-right h-8 px-2 font-bold">Capital</TableHead>
                            <TableHead className="text-right h-8 px-2 font-bold">Interés</TableHead>
                            <TableHead className="text-right h-8 px-2 font-bold text-emerald-600 dark:text-emerald-400">Cuota</TableHead>
                            <TableHead className="text-right h-8 px-2 font-bold text-muted-foreground">Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cronogramaSimuladoEdit.map((c) => (
                            <TableRow key={c.nroCuota} className="text-xs hover:bg-muted/30">
                              <TableCell className="text-center font-mono py-1.5 px-2 font-bold">{c.nroCuota}</TableCell>
                              <TableCell className="py-1.5 px-2 font-mono text-[11px]">{formatFecha(c.fechaVencimiento)}</TableCell>
                              <TableCell className="text-right font-mono py-1.5 px-2">S/. {c.capital.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-mono py-1.5 px-2 text-emerald-600 dark:text-emerald-400">
                                S/. {c.interes.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-mono py-1.5 px-2 font-bold">S/. {c.totalCuota.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-mono py-1.5 px-2 text-muted-foreground">
                                S/. {c.saldoRestante.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-muted/50 p-2.5 border-t mt-auto flex items-center justify-between text-xs font-mono font-bold">
                      <span>Total:</span>
                      <div className="flex gap-4">
                        <span>Cap: S/. {cronogramaSimuladoEdit.reduce((acc, c) => acc + c.capital, 0).toFixed(2)}</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Int: S/. {cronogramaSimuladoEdit.reduce((acc, c) => acc + c.interes, 0).toFixed(2)}
                        </span>
                        <span>Total: S/. {cronogramaSimuladoEdit.reduce((acc, c) => acc + c.totalCuota, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border rounded-lg border-dashed p-6 text-center text-muted-foreground text-xs mt-2">
                    <p>Complete los datos para generar el nuevo cronograma</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setModalEditarPrestamo(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={procesando || editPrestamoObservacion.trim().length < 5}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {procesando ? "Guardando..." : "Guardar Modificaciones"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Eliminar Préstamo en Asamblea (Permitido solo antes de cerrar el periodo) */}
      <Dialog open={modalEliminarPrestamo} onOpenChange={setModalEliminarPrestamo}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-lg">
              <Trash2 className="h-5 w-5" />
              Eliminar Préstamo en Asamblea
            </DialogTitle>
            <DialogDescription>
              Esta acción solo está permitida antes del cierre del periodo contable. Revertirá la colocación y reintegrará el efectivo al saldo de caja.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEliminarPrestamoSubmit} className="space-y-4">
            <div className="p-3.5 rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-500/10 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Préstamo #{eliminarPrestamoNumero} - {eliminarPrestamoSocio}</span>
              </div>
              <p className="text-muted-foreground">
                Monto colocado: <strong className="font-mono text-foreground">S/. {eliminarPrestamoMonto.toFixed(2)}</strong>.
              </p>
              <p className="text-muted-foreground">
                Al confirmar, se anulará la operación de egreso en el libro de caja, se cancelarán las cuotas programadas y el dinero volverá a estar disponible para colocación en este periodo.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Comentario / Motivo de Eliminación Obligatorio *
              </Label>
              <Textarea
                rows={3}
                required
                placeholder="Explique el motivo del error en la solicitud o asamblea (ej: 'Error en monto solicitado, corregido en acta comunal'). Mínimo 5 caracteres..."
                value={motivoEliminacionPrestamo}
                onChange={(e) => setMotivoEliminacionPrestamo(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Este comentario quedará registrado de forma permanente en la auditoría contable.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalEliminarPrestamo(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={procesando || motivoEliminacionPrestamo.trim().length < 5}
              >
                {procesando ? "Eliminando..." : "Confirmar Eliminación del Préstamo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Modificar Cuotas / Reprogramación (Permitido incluso si el periodo está cerrado) */}
      <Dialog open={modalModificarCuotas} onOpenChange={setModalModificarCuotas}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-lg">
              <CalendarClock className="h-5 w-5" />
              Reprogramar Cuotas de Préstamo #{modCuotasNumero} - {modCuotasSocio}
            </DialogTitle>
            <DialogDescription>
              Ajuste de fechas de vencimiento y montos de cuotas pendientes. Permitido incluso con periodos cerrados para reflejar acuerdos comunales de reprogramación.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleModificarCuotasSubmit} className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-xs">
              <div>
                <span className="text-muted-foreground">Monto Principal del Crédito: </span>
                <span className="font-mono font-bold text-sm">S/. {modCuotasPrincipal.toFixed(2)}</span>
              </div>
              <div>
                {(() => {
                  const sumaCap = modCuotasLista.reduce((acc, c) => acc + (Number(c.capitalProgramado) || 0), 0);
                  const diff = Math.abs(sumaCap - modCuotasPrincipal);
                  if (diff <= 0.05) {
                    return (
                      <Badge className="bg-emerald-600 text-white text-[11px]">
                        <Check className="h-3 w-3 mr-1" /> Cuadre Financiero Exacto (S/. {sumaCap.toFixed(2)})
                      </Badge>
                    );
                  }
                  return (
                    <Badge variant="destructive" className="text-[11px]">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Diferencia de Capital: S/. {diff.toFixed(2)} (Suma: S/. {sumaCap.toFixed(2)})
                    </Badge>
                  );
                })()}
              </div>
            </div>

            {/* Tabla interactiva de cuotas */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-[11px]">
                      <TableHead className="w-12 text-center h-8 font-bold">N°</TableHead>
                      <TableHead className="h-8 font-bold">Estado</TableHead>
                      <TableHead className="h-8 font-bold">Vencimiento</TableHead>
                      <TableHead className="text-right h-8 font-bold">Capital Programado (S/.)</TableHead>
                      <TableHead className="text-right h-8 font-bold">Interés Programado (S/.)</TableHead>
                      <TableHead className="text-right h-8 font-bold">Cuota Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modCuotasLista.map((c, cIdx) => {
                      const esPagada = c.estado === "PAGADA";
                      return (
                        <TableRow key={c.id} className="text-xs hover:bg-muted/30">
                          <TableCell className="text-center font-mono font-bold py-1.5">{c.nroCuota}</TableCell>
                          <TableCell className="py-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                esPagada
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : "bg-blue-500/10 text-blue-600 border-blue-500/30"
                              )}
                            >
                              {c.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1.5">
                            {esPagada ? (
                              <span className="font-mono text-muted-foreground">{formatFecha(c.fechaVencimiento)}</span>
                            ) : (
                              <Input
                                type="date"
                                value={c.fechaVencimiento}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setModCuotasLista((prev) => {
                                    const copy = [...prev];
                                    copy[cIdx] = { ...copy[cIdx], fechaVencimiento: val };
                                    return copy;
                                  });
                                }}
                                className="h-7 w-32 text-xs font-mono"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right py-1.5">
                            {esPagada ? (
                              <span className="font-mono font-semibold">S/. {c.capitalProgramado.toFixed(2)}</span>
                            ) : (
                              <Input
                                type="number"
                                step="0.01"
                                min={c.capitalPagado}
                                value={c.capitalProgramado}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setModCuotasLista((prev) => {
                                    const copy = [...prev];
                                    copy[cIdx] = { ...copy[cIdx], capitalProgramado: val };
                                    return copy;
                                  });
                                }}
                                className="h-7 w-28 text-right text-xs font-mono ml-auto"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right py-1.5">
                            {esPagada ? (
                              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                S/. {c.interesProgramado.toFixed(2)}
                              </span>
                            ) : (
                              <Input
                                type="number"
                                step="0.01"
                                min={c.interesPagado}
                                value={c.interesProgramado}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setModCuotasLista((prev) => {
                                    const copy = [...prev];
                                    copy[cIdx] = { ...copy[cIdx], interesProgramado: val };
                                    return copy;
                                  });
                                }}
                                className="h-7 w-24 text-right text-xs font-mono ml-auto text-emerald-600 dark:text-emerald-400"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold py-1.5">
                            S/. {(c.capitalProgramado + c.interesProgramado).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Observación Obligatoria de la Reprogramación *
              </Label>
              <Textarea
                rows={2}
                required
                placeholder="Indique el motivo o acta de la reprogramación de cuotas (mínimo 5 caracteres)..."
                value={modCuotasObservacion}
                onChange={(e) => setModCuotasObservacion(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Requerido para auditoría formal de reprogramación de créditos.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalModificarCuotas(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  procesando ||
                  modCuotasObservacion.trim().length < 5 ||
                  Math.abs(modCuotasLista.reduce((acc, c) => acc + (Number(c.capitalProgramado) || 0), 0) - modCuotasPrincipal) > 0.05
                }
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {procesando ? "Guardando..." : "Guardar Reprogramación de Cuotas"}
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

          {/* Alerta de Cuadre Obligatorio */}
          {Number(data.saldoFinal) !== 0 ? (
            <div className="p-3.5 rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-500/10 text-xs space-y-1.5 text-rose-700 dark:text-rose-400">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>Caja No Cuadrada (Saldo: S/. {Number(data.saldoFinal).toFixed(2)})</span>
              </div>
              <p>
                En la metodología de Caja Comunal (UNICA), no se puede cerrar la caja si existe saldo disponible. Todo el dinero recaudado en la asamblea debe colocarse en préstamos a los socios hasta que el saldo final llegue exactamente a <strong>S/. 0.00</strong>.
              </p>
              <p className="font-semibold text-foreground">
                Utilice el botón verde "Otorgar Préstamo" para colocar los S/. {Number(data.saldoFinal).toFixed(2)} restantes antes de congelar el periodo.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-500/10 text-xs space-y-1 text-emerald-700 dark:text-emerald-400">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Cuadre Perfecto: Saldo S/. 0.00</span>
              </div>
              <p>
                Todos los ingresos recaudados fueron colocados en préstamos y egresos de asamblea. La caja está lista para ser firmada criptográficamente con SHA-256.
              </p>
            </div>
          )}

          <div className="p-3 rounded-lg border bg-muted/40 text-xs space-y-1 font-mono">
            <p className="font-semibold font-sans text-muted-foreground">Resumen de Cierre:</p>
            <div className="flex justify-between">
              <span>Saldo Inicial:</span>
              <span>S/. {Number(data.saldoAnterior).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Total Ingresos:</span>
              <span>+S/. {Number(data.totalIngresosMes).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Total Egresos (Préstamos):</span>
              <span>-S/. {Number(data.totalEgresosMes).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t font-bold">
              <span>Saldo Final:</span>
              <span className={Number(data.saldoFinal) === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 font-bold"}>
                S/. {Number(data.saldoFinal).toFixed(2)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalCierre(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCerrarPeriodo}
              disabled={procesando || Number(data.saldoFinal) !== 0}
              title={
                Number(data.saldoFinal) !== 0
                  ? "Debe asignar todo el saldo a préstamos (saldo 0.00) para poder cerrar"
                  : "Cerrar periodo inmutable"
              }
            >
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

      {/* DIALOG: Desglose de Préstamos y Adelanto de Cuotas */}
      <Dialog open={modalDetallePrestamos} onOpenChange={setModalDetallePrestamos}>
        <DialogContent className="max-w-5xl md:max-w-5xl lg:max-w-6xl w-[96vw] max-h-[92vh] overflow-y-auto p-6 md:p-8">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="flex items-center gap-2.5 text-xl md:text-2xl font-bold">
              <Coins className="h-6 w-6 text-emerald-600" />
              <span>Desglose de Préstamos y Adelanto de Cuotas</span>
            </DialogTitle>
            <DialogDescription className="text-sm md:text-base mt-1">
              {socioDetalleActivo && (
                <span>
                  Socio: <strong className="text-foreground font-bold text-base md:text-lg">{socioDetalleActivo.socioNombre}</strong>{" "}
                  {socioDetalleActivo.socioCodigo ? `(Código #${socioDetalleActivo.socioCodigo})` : ""}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {socioDetalleActivo && (() => {
            const regulares = (socioDetalleActivo.detallesPrestamos || []).filter((d) => !d.esAdelanto);
            const todasFuturas = [
              ...(socioDetalleActivo.detallesPrestamos || []).filter((d) => d.esAdelanto),
              ...(socioDetalleActivo.cuotasDisponiblesAdelanto || []),
            ];
            const futurasUnicas = Array.from(
              new Map(todasFuturas.map((c) => [c.cuotaId, c])).values()
            );

            const selCuotas = futurasUnicas.filter((c) =>
              cuotasAdelantoSeleccionadas.includes(c.cuotaId)
            );

            const capReg = regulares.reduce((a, b) => a + (Number(b.capitalProgramado) || 0), 0);
            const intReg = regulares.reduce((a, b) => a + (Number(b.interesProgramado) || 0), 0);

            const capAde = selCuotas.reduce((a, b) => a + (Number(b.capitalProgramado) || 0), 0);
            const intAde = selCuotas.reduce((a, b) => a + (Number(b.interesProgramado) || 0), 0);

            const totalCap = capReg + capAde;
            const totalInt = intReg + intAde;
            const totalGeneral = totalCap + totalInt;

            return (
              <div className="space-y-6 py-3">
                {/* 1. Cuotas Regulares del Periodo */}
                <div>
                  <h4 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Cuotas Regulares Exigibles de este Periodo ({MESES[p.mes - 1]} {p.anio})</span>
                  </h4>
                  {regulares.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic bg-muted/40 p-3 rounded-lg border">
                      El socio no tiene cuotas regulares programadas o exigibles para este mes.
                    </p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden shadow-xs">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/70 text-xs font-bold uppercase tracking-wider">
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3">Préstamo</TableHead>
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3">Cuota</TableHead>
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3">Vencimiento</TableHead>
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3 text-right">Capital Programado</TableHead>
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3 text-right">Interés Programado</TableHead>
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3 text-right">Total Cuota</TableHead>
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3 text-center">Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {regulares.map((c) => (
                            <TableRow key={c.cuotaId} className="text-sm hover:bg-muted/30 border-b">
                              <TableCell className="py-3 px-3 font-bold text-sm text-emerald-700 dark:text-emerald-400">
                                Préstamo #{c.prestamoNumero}
                              </TableCell>
                              <TableCell className="py-3 px-3 text-sm font-semibold">
                                Cuota {c.cuotaNro} / {c.cuotasTotal}
                              </TableCell>
                              <TableCell className="py-3 px-3 font-mono text-xs font-medium text-muted-foreground">
                                {formatFecha(c.fechaVencimiento)}
                              </TableCell>
                              <TableCell className="py-3 px-3 text-right font-mono text-sm font-semibold">
                                S/. {Number(c.capitalProgramado).toFixed(2)}
                              </TableCell>
                              <TableCell className="py-3 px-3 text-right font-mono text-sm font-semibold">
                                S/. {Number(c.interesProgramado).toFixed(2)}
                              </TableCell>
                              <TableCell className="py-3 px-3 text-right font-mono text-sm font-bold text-foreground">
                                S/. {(Number(c.capitalProgramado) + Number(c.interesProgramado)).toFixed(2)}
                              </TableCell>
                              <TableCell className="py-3 px-3 text-center">
                                <Badge variant="outline" className={cn(
                                  "text-xs px-2.5 py-0.5",
                                  c.estado === "PAGADA" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold" : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                )}>
                                  {c.estado}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* 2. Adelanto de Cuotas Futuras */}
                <div>
                  <h4 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    <span>Adelanto de Cuotas Futuras (Seleccionar cuotas a amortizar anticipadamente)</span>
                  </h4>
                  {futurasUnicas.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic bg-muted/40 p-3 rounded-lg border">
                      No hay cuotas futuras pendientes para adelantar en los préstamos activos de este socio.
                    </p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden shadow-xs">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/70 text-xs font-bold uppercase tracking-wider">
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3 text-center w-28">Adelantar</TableHead>
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3">Préstamo</TableHead>
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3">Cuota</TableHead>
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3">Vencimiento</TableHead>
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3 text-right">Capital Programado</TableHead>
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3 text-right">Interés Programado</TableHead>
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3 text-right">Total Cuota</TableHead>
                            <TableHead className="h-10 text-xs font-bold py-2.5 px-3 text-center">Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {futurasUnicas.map((c) => {
                            const isSelected = cuotasAdelantoSeleccionadas.includes(c.cuotaId);
                            return (
                              <TableRow
                                key={c.cuotaId}
                                className={cn(
                                  "text-sm cursor-pointer transition-colors border-b",
                                  isSelected ? "bg-amber-500/15 font-semibold" : "hover:bg-muted/30"
                                )}
                                onClick={() => !esCerrado && toggleSeleccionAdelanto(c.cuotaId)}
                              >
                                <TableCell className="text-center p-3" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={esCerrado}
                                    onChange={() => toggleSeleccionAdelanto(c.cuotaId)}
                                    className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed mx-auto block"
                                  />
                                </TableCell>
                                <TableCell className="py-3 px-3 font-bold text-sm text-blue-700 dark:text-blue-400">
                                  Préstamo #{c.prestamoNumero}
                                </TableCell>
                                <TableCell className="py-3 px-3 text-sm font-semibold">
                                  Cuota {c.cuotaNro} / {c.cuotasTotal}
                                </TableCell>
                                <TableCell className="py-3 px-3 font-mono text-xs font-medium text-muted-foreground">
                                  {formatFecha(c.fechaVencimiento)}
                                </TableCell>
                                <TableCell className="py-3 px-3 text-right font-mono text-sm font-semibold">
                                  S/. {Number(c.capitalProgramado).toFixed(2)}
                                </TableCell>
                                <TableCell className="py-3 px-3 text-right font-mono text-sm font-semibold">
                                  S/. {Number(c.interesProgramado).toFixed(2)}
                                </TableCell>
                                <TableCell className="py-3 px-3 text-right font-mono text-sm font-bold text-foreground">
                                  S/. {(Number(c.capitalProgramado) + Number(c.interesProgramado)).toFixed(2)}
                                </TableCell>
                                <TableCell className="py-3 px-3 text-center">
                                  {isSelected ? (
                                    <Badge variant="outline" className="text-xs px-2.5 py-0.5 bg-amber-500 text-white dark:text-black border-amber-600 font-bold shadow-xs">
                                      ADELANTO SELECCIONADO
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                                      {c.estado}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Resumen Total */}
                <div className="bg-muted/50 p-5 rounded-xl border-2 border-primary/20 space-y-4 shadow-sm">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Resumen del Pago Calculado para esta Asamblea:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-background p-3.5 rounded-lg border shadow-xs">
                      <span className="text-xs text-muted-foreground font-semibold">Cap. Regular:</span>
                      <p className="font-mono text-base md:text-lg font-bold text-foreground mt-1">S/. {capReg.toFixed(2)}</p>
                    </div>
                    <div className="bg-background p-3.5 rounded-lg border border-amber-500/30 shadow-xs">
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Cap. Adelantado:</span>
                      <p className="font-mono text-base md:text-lg font-bold text-amber-600 mt-1">S/. {capAde.toFixed(2)}</p>
                    </div>
                    <div className="bg-background p-3.5 rounded-lg border shadow-xs">
                      <span className="text-xs text-muted-foreground font-semibold">Int. Regular:</span>
                      <p className="font-mono text-base md:text-lg font-bold text-foreground mt-1">S/. {intReg.toFixed(2)}</p>
                    </div>
                    <div className="bg-background p-3.5 rounded-lg border border-amber-500/30 shadow-xs">
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Int. Adelantado:</span>
                      <p className="font-mono text-base md:text-lg font-bold text-amber-600 mt-1">S/. {intAde.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="border-t pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-background/80 p-4 rounded-lg border">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Desglose que se cargará en la fila de planilla:</span>
                      <div className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Capital: S/. {totalCap.toFixed(2)} &bull; Interés: S/. {totalInt.toFixed(2)}
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Total Cuota a Cobrar:</span>
                      <div className="text-2xl md:text-3xl font-mono font-black text-foreground">
                        S/. {totalGeneral.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button variant="outline" className="h-10 px-5 text-sm font-semibold" onClick={() => setModalDetallePrestamos(false)}>
              {esCerrado ? "Cerrar" : "Cancelar"}
            </Button>
            {!esCerrado && (
              <Button
                onClick={handleAplicarDetallePrestamos}
                className="h-10 px-6 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
              >
                <Check className="h-4.5 w-4.5" />
                Aplicar a Planilla
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
