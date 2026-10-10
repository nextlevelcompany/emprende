"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  User,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  CreditCard,
  Coins,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  BarChart3,
  ExternalLink,
  Award,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Filter,
  Edit,
  FileCheck,
  Upload,
  Download,
  Eye,
  XCircle,
  FileText,
  Image as ImageIcon,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { descargarExpedientePrestamoCompletoPDF } from "@/lib/prestamo-documento-pdf";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

import { cn, formatFecha, formatSoles } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModalEditarDatosPersonales } from "@/components/socios/modal-editar-datos-personales";
import {
  parseFichaSocio,
  extraerObservaciones,
  formatTamanoArchivo,
  DocumentoAdjunto,
} from "@/lib/socios-datos-personales";

// Interfaces
interface SocioItem {
  id: string;
  codigo: number;
  nombres?: string;
  apellidos?: string;
  nombreCompleto: string;
  documentoTipo?: string;
  documentoEnmascarado?: string;
  estado: string;
  tipo: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  fechaIngreso: string;
  fechaRetiro: string | null;
  notas: string | null;
  tieneAccesoWeb: boolean;
}

interface ReporteSocio {
  socio: {
    id: string;
    codigo: number;
    nombres: string;
    apellidos: string;
    nombreCompleto: string;
    documentoTipo: string;
    documentoNumero: string;
    telefono: string | null;
    estado: string;
    fechaIngreso: string;
  };
  resumenFinanciero: {
    nroAcciones: number;
    capitalAcciones: number;
    saldoAhorros: number;
    totalPrestamosSolicitados: number;
    saldoPrestamosPendiente: number;
    totalUtilidadesRecibidas: number;
  };
  prestamos: Array<{
    prestamoId: string;
    numero: number;
    fechaDesembolso: string;
    montoPrincipal: number;
    tasaMensual: number;
    nroCuotas: number;
    estado: string;
    saldoCapital: number;
  }>;
  utilidades: Array<{
    ejercicio: number;
    acciones: number;
    monto: number;
    fechaPago: string | null;
    capitalSocial?: number;
    capitalDevuelto?: number;
    totalCobrado?: number;
    estadoAcciones?: string;
    modalidad?: string;
    montoCobrado?: number;
    montoReinvertido?: number;
    accionesCompradas?: number;
  }>;
  movimientos: Array<{
    fecha: string;
    nroRecibo: number | null;
    tipo: "INGRESO" | "EGRESO";
    concepto: string;
    monto: number;
    descripcion: string | null;
  }>;
}

const COLORS_PIE = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

function DetalleSocioContent() {
  const searchParams = useSearchParams();
  const urlSocioId = searchParams.get("id");

  const [socios, setSocios] = React.useState<SocioItem[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [reporte, setReporte] = React.useState<ReporteSocio | null>(null);
  const [loadingSocios, setLoadingSocios] = React.useState(true);
  const [loadingReporte, setLoadingReporte] = React.useState(false);
  const [busqueda, setBusqueda] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("pagos");
  const [filtroAnio, setFiltroAnio] = React.useState<string>("TODOS");
  const [filtroTexto, setFiltroTexto] = React.useState("");

  const [modalEditar, setModalEditar] = React.useState(false);
  const [docParaVer, setDocParaVer] = React.useState<DocumentoAdjunto | null>(null);

  // Cargar lista de socios
  const fetchSocios = React.useCallback(async () => {
    try {
      setLoadingSocios(true);
      const res = await fetch(`/api/socios?size=100&t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error al cargar lista de socios");
      const data = await res.json();
      const lista: SocioItem[] = Array.isArray(data) ? data : data.content || [];
      setSocios(lista);

      if (lista.length > 0) {
        setSelectedId((current) => {
          if (current && lista.some((s) => s.id === current)) return current;
          if (urlSocioId && lista.some((s) => s.id === urlSocioId)) return urlSocioId;
          return lista[0].id;
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Error al obtener socios");
    } finally {
      setLoadingSocios(false);
    }
  }, [urlSocioId]);

  React.useEffect(() => {
    fetchSocios();
  }, [fetchSocios]);

  // Cargar reporte del socio seleccionado
  const cargarReporte = React.useCallback(async (socioId: string) => {
    if (!socioId) return;
    try {
      setLoadingReporte(true);
      const res = await fetch(`/api/reportes/socio/${socioId}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al cargar estado de cuenta del socio");
      }
      const data: ReporteSocio = await res.json();
      setReporte(data);
    } catch (err: any) {
      toast.error(err.message || "Error al cargar expediente del socio");
      setReporte(null);
    } finally {
      setLoadingReporte(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedId) {
      cargarReporte(selectedId);
    }
  }, [selectedId, cargarReporte]);

  // Socio seleccionado en la lista local para datos extras
  const socioInfoExtra = React.useMemo(() => {
    return socios.find((s) => s.id === selectedId);
  }, [socios, selectedId]);

  // Socio adaptado para modal y ficha
  const socioParaEditar = React.useMemo(() => {
    if (!socioInfoExtra && !reporte?.socio) return null;
    return {
      id: selectedId,
      codigo: reporte?.socio.codigo || socioInfoExtra?.codigo || 0,
      nombres: reporte?.socio.nombres || socioInfoExtra?.nombres || "",
      apellidos: reporte?.socio.apellidos || socioInfoExtra?.apellidos || "",
      nombreCompleto: reporte?.socio.nombreCompleto || socioInfoExtra?.nombreCompleto || "",
      telefono: reporte?.socio.telefono || socioInfoExtra?.telefono || null,
      email: socioInfoExtra?.email || null,
      direccion: socioInfoExtra?.direccion || null,
      documentoTipo: reporte?.socio.documentoTipo || socioInfoExtra?.documentoTipo || "DNI",
      documentoNumero: reporte?.socio.documentoNumero || "",
      documentoEnmascarado: socioInfoExtra?.documentoEnmascarado || "",
      notas: socioInfoExtra?.notas || null,
    };
  }, [selectedId, socioInfoExtra, reporte]);

  const fichaDatos = React.useMemo(() => {
    return parseFichaSocio(socioParaEditar);
  }, [socioParaEditar]);

  const handleDescargarDoc = (doc: DocumentoAdjunto) => {
    try {
      const link = document.createElement("a");
      link.href = doc.data;
      link.download = doc.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("No se pudo descargar el archivo");
    }
  };

  // Filtrado de socios para el selector rápido
  const sociosFiltrados = React.useMemo(() => {
    if (!busqueda.trim()) return socios;
    const term = busqueda.toLowerCase();
    return socios.filter(
      (s) =>
        s.nombreCompleto.toLowerCase().includes(term) ||
        s.codigo.toString().includes(term)
    );
  }, [socios, busqueda]);

  // ==========================================
  // LISTAS ESPECÍFICAS DE HISTORIAL SOLICITADAS
  // ==========================================

  // 1. Historial de Pagos (amortización de capital e intereses consolidados por fecha/asamblea)
  const listaPagosConsolidados = React.useMemo(() => {
    if (!reporte?.movimientos) return [];
    const map = new Map<
      string,
      {
        fecha: string;
        nroRecibo: number | null;
        descripcion: string;
        capital: number;
        interes: number;
        total: number;
      }
    >();

    for (const m of reporte.movimientos) {
      if (m.tipo !== "INGRESO") continue;
      const conc = m.concepto.toLowerCase();
      // Excluir compras de acciones
      if (conc.includes("accion") || conc.includes("acciones")) continue;

      const isCapital = conc.includes("capital") || (conc.includes("pago") && !conc.includes("interes"));
      const isInteres = conc.includes("interes");

      if (isCapital || isInteres) {
        const key = m.fecha;
        if (!map.has(key)) {
          map.set(key, {
            fecha: m.fecha,
            nroRecibo: m.nroRecibo || null,
            descripcion: m.descripcion || "Cuota mensual en asamblea",
            capital: 0,
            interes: 0,
            total: 0,
          });
        }
        const item = map.get(key)!;
        const montoNum = Number(m.monto);
        if (isCapital) {
          item.capital += montoNum;
        } else if (isInteres) {
          item.interes += montoNum;
        }
        item.total = item.capital + item.interes;
        if (m.nroRecibo && !item.nroRecibo) {
          item.nroRecibo = m.nroRecibo;
        }
      }
    }

    return Array.from(map.values())
      .filter((p) => {
        if (filtroAnio !== "TODOS" && !p.fecha.startsWith(filtroAnio)) return false;
        if (filtroTexto.trim()) {
          const t = filtroTexto.toLowerCase();
          const matchesDesc = p.descripcion.toLowerCase().includes(t);
          const matchesFecha = p.fecha.includes(t);
          const matchesRecibo = p.nroRecibo ? p.nroRecibo.toString().includes(t) : false;
          const matchesCapital = t.includes("capital") && p.capital > 0;
          const matchesInteres = t.includes("interes") && p.interes > 0;
          return matchesDesc || matchesFecha || matchesRecibo || matchesCapital || matchesInteres;
        }
        return true;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [reporte, filtroAnio, filtroTexto]);

  const totalCapitalPagado = React.useMemo(() => {
    return listaPagosConsolidados.reduce((sum, p) => sum + p.capital, 0);
  }, [listaPagosConsolidados]);

  const totalInteresesPagados = React.useMemo(() => {
    return listaPagosConsolidados.reduce((sum, p) => sum + p.interes, 0);
  }, [listaPagosConsolidados]);

  const totalPagosGeneral = React.useMemo(() => {
    return listaPagosConsolidados.reduce((sum, p) => sum + p.total, 0);
  }, [listaPagosConsolidados]);

  // 2. Historial de Retiro de Dinero y Desembolsos
  const listaRetiros = React.useMemo(() => {
    if (!reporte?.movimientos) return [];
    const retirosMovs = reporte.movimientos
      .filter((m) =>
        m.tipo === "EGRESO" ||
        m.concepto.toLowerCase().includes("retiro") ||
        m.concepto.toLowerCase().includes("prestamo") ||
        m.concepto.toLowerCase().includes("devolucion") ||
        m.concepto.toLowerCase().includes("capital")
      )
      .map((m) => ({
        fecha: m.fecha,
        nroRecibo: m.nroRecibo,
        tipo: "EGRESO",
        categoria: m.concepto.toLowerCase().includes("prestamo")
          ? "Desembolso de Préstamo"
          : (m.concepto.toLowerCase().includes("capital") || m.concepto.toLowerCase().includes("devolucion")
              ? "Devolución de Capital Social"
              : "Retiro de Dinero"),
        concepto: m.concepto,
        monto: Number(m.monto),
        descripcion: m.descripcion || "Entrega de fondos en asamblea",
      }));

    // Añadir utilidades cobradas en efectivo (asamblea de junio de cada año)
    const utilidadesCobros = (reporte.utilidades || []).map((u) => {
      const anio = u.ejercicio;
      const fechaAsambleaDefault = `${anio}-06-08`;
      let fechaIso = fechaAsambleaDefault;
      if (u.fechaPago) {
        const fp = u.fechaPago.substring(0, 10);
        if (fp.startsWith(String(anio)) && /^\d{4}-\d{2}-\d{2}$/.test(fp)) {
          fechaIso = fp;
        }
      }

      return {
        fecha: fechaIso,
        nroRecibo: null,
        tipo: "EGRESO",
        categoria: "Cobro de Utilidades",
        concepto: `Utilidad Ejercicio ${u.ejercicio}`,
        monto: Number(u.monto),
        descripcion: `Ganancias anuales cobradas en asamblea (${u.acciones} acciones)`,
      };
    });

    return [...retirosMovs, ...utilidadesCobros]
      .filter((m) => {
        if (filtroAnio !== "TODOS" && !m.fecha.startsWith(filtroAnio)) return false;
        if (filtroTexto.trim()) {
          const t = filtroTexto.toLowerCase();
          return (
            m.categoria.toLowerCase().includes(t) ||
            m.concepto.toLowerCase().includes(t) ||
            (m.descripcion && m.descripcion.toLowerCase().includes(t)) ||
            (m.nroRecibo && m.nroRecibo.toString().includes(t))
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [reporte, filtroAnio, filtroTexto]);

  const totalRetirosDesembolsos = React.useMemo(() => {
    return listaRetiros
      .filter((m) => m.categoria.includes("Préstamo"))
      .reduce((sum, m) => sum + Number(m.monto), 0);
  }, [listaRetiros]);

  const totalRetirosUtilidades = React.useMemo(() => {
    return listaRetiros
      .filter((m) => m.categoria.includes("Utilidades"))
      .reduce((sum, m) => sum + Number(m.monto), 0);
  }, [listaRetiros]);

  const totalRetirosCapital = React.useMemo(() => {
    return listaRetiros
      .filter((m) => m.categoria.includes("Capital Social") || m.concepto.toLowerCase().includes("capital"))
      .reduce((sum, m) => sum + Number(m.monto), 0);
  }, [listaRetiros]);

  const totalRetirosGeneral = React.useMemo(() => {
    return listaRetiros.reduce((sum, m) => sum + Number(m.monto), 0);
  }, [listaRetiros]);

  // 3. Historial de Compra de Acciones y Aportes de Capital
  const listaAcciones = React.useMemo(() => {
    if (!reporte?.movimientos) return [];
    return reporte.movimientos
      .filter((m) =>
        m.concepto.toLowerCase().includes("accion") ||
        m.concepto.toLowerCase().includes("acciones")
      )
      .map((m) => {
        const montoNum = Number(m.monto);
        const cantidadAcciones = Math.round(montoNum / 30);
        return {
          fecha: m.fecha,
          nroRecibo: m.nroRecibo,
          acciones: cantidadAcciones,
          valorUnitario: 30,
          monto: montoNum,
          descripcion: m.descripcion || `Aporte de ${cantidadAcciones} acciones en asamblea`,
        };
      })
      .filter((a) => {
        if (filtroAnio !== "TODOS" && !a.fecha.startsWith(filtroAnio)) return false;
        if (filtroTexto.trim()) {
          const t = filtroTexto.toLowerCase();
          return (
            a.descripcion.toLowerCase().includes(t) ||
            (a.nroRecibo && a.nroRecibo.toString().includes(t))
          );
        }
        return true;
      });
  }, [reporte, filtroAnio, filtroTexto]);

  const totalAccionesCompradas = React.useMemo(() => {
    return listaAcciones.reduce((sum, a) => sum + a.acciones, 0);
  }, [listaAcciones]);

  const totalMontoAcciones = React.useMemo(() => {
    return listaAcciones.reduce((sum, a) => sum + a.monto, 0);
  }, [listaAcciones]);

  // 4. Todos los movimientos generales
  const movimientosGenerales = React.useMemo(() => {
    if (!reporte?.movimientos) return [];
    return reporte.movimientos.filter((m) => {
      if (filtroAnio !== "TODOS" && !m.fecha.startsWith(filtroAnio)) return false;
      if (filtroTexto.trim()) {
        const t = filtroTexto.toLowerCase();
        return (
          m.concepto.toLowerCase().includes(t) ||
          (m.descripcion && m.descripcion.toLowerCase().includes(t)) ||
          (m.nroRecibo && m.nroRecibo.toString().includes(t))
        );
      }
      return true;
    });
  }, [reporte, filtroAnio, filtroTexto]);

  // Gráfica de torta/desglose
  const pieData = React.useMemo(() => {
    if (!reporte) return [];
    const items = [];
    if (reporte.resumenFinanciero.capitalAcciones > 0) {
      items.push({
        name: "Capital Social (Acciones)",
        value: Number(reporte.resumenFinanciero.capitalAcciones),
      });
    }
    if (reporte.resumenFinanciero.saldoPrestamosPendiente > 0) {
      items.push({
        name: "Deuda Créditos Pendiente",
        value: Number(reporte.resumenFinanciero.saldoPrestamosPendiente),
      });
    }
    if (reporte.resumenFinanciero.totalUtilidadesRecibidas > 0) {
      items.push({
        name: "Utilidades Cobradas",
        value: Number(reporte.resumenFinanciero.totalUtilidadesRecibidas),
      });
    }
    return items;
  }, [reporte]);

  // Gráfica de préstamos
  const prestamosChartData = React.useMemo(() => {
    if (!reporte?.prestamos) return [];
    return [...reporte.prestamos]
      .reverse()
      .map((p) => ({
        name: `Crédito #${p.numero}`,
        Solicitado: Number(p.montoPrincipal),
        Saldo: Number(p.saldoCapital),
      }));
  }, [reporte]);

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Barra Superior con Navegación y Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/admin/socios">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Padrón General
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Detalle y Estado de Cuenta del Socio
            </h1>
            <p className="text-xs text-muted-foreground">
              Historial con fechas de pagos, retiros de dinero, compra de acciones y créditos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedId && cargarReporte(selectedId)}
            disabled={loadingReporte}
            title="Refrescar datos"
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", loadingReporte && "animate-spin")} />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={() => setModalEditar(true)}
            disabled={!socioParaEditar}
            className="gap-1.5 shadow-sm"
          >
            <Edit className="h-4 w-4" />
            Editar Datos Personales
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Imprimir Ficha
          </Button>
        </div>
      </div>

      {/* Selector Rápido de Socio */}
      <Card className="print:hidden w-full min-w-0 max-w-full shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Seleccionar Socio / Integrante
              </label>
              <Select
                value={selectedId}
                onValueChange={(val) => setSelectedId(val)}
                disabled={loadingSocios}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Seleccione un socio..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {sociosFiltrados.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-sm">
                      <span className="font-mono font-bold mr-2 text-primary">
                        #{String(s.codigo).padStart(3, "0")}
                      </span>
                      <span>{s.nombreCompleto}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({s.estado})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Filtrar por Nombre o Código
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ej. Cirilo, Moran, 1, Laime..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cargando o Reporte */}
      {loadingReporte ? (
        <Card className="w-full">
          <CardContent className="py-20 text-center text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm font-medium">Cargando expediente contable del socio...</p>
          </CardContent>
        </Card>
      ) : !reporte ? (
        <Card className="w-full">
          <CardContent className="py-16 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="text-base font-semibold text-foreground">No se pudo cargar la información del socio</p>
            <p className="text-xs mt-1">Selecciona otro socio o verifica la conexión con el servidor.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Ficha de Identidad del Socio */}
          <Card className="w-full min-w-0 max-w-full overflow-hidden shadow-sm border-t-4 border-t-primary">
            <CardHeader className="bg-muted/20 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg font-mono shrink-0">
                    #{String(reporte.socio.codigo).padStart(3, "0")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold tracking-tight text-foreground">
                        {reporte.socio.nombreCompleto}
                      </h2>
                      {reporte.socio.estado === "ACTIVO" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                          Socio Activo
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          Retirado
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {socioInfoExtra?.tipo || "SOCIO"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {reporte.socio.documentoTipo}: {reporte.socio.documentoNumero}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModalEditar(true)}
                    className="gap-1.5 shadow-sm text-xs bg-background h-8"
                  >
                    <Edit className="h-3.5 w-3.5 text-primary" />
                    Editar Datos Personales
                  </Button>
                  <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-background border px-3 py-1 rounded-md h-8">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>Primer Aporte / Ingreso: <strong>{formatFecha(reporte.socio.fechaIngreso)}</strong></span>
                  </div>
                  {socioInfoExtra?.fechaRetiro && (
                    <div className="text-[11px] text-destructive font-mono mt-1 sm:mt-0">
                      Fecha de Baja: {formatFecha(socioInfoExtra.fechaRetiro)}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Datos de contacto y acceso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> Teléfono
                  </span>
                  <p className="font-medium text-foreground">{fichaDatos.telefono || reporte.socio.telefono || "No registrado"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> Correo Electrónico
                  </span>
                  <p className="font-medium text-foreground truncate">{fichaDatos.email || socioInfoExtra?.email || "No registrado"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Domicilio / Residencia
                  </span>
                  <p className="font-medium text-foreground truncate">{fichaDatos.direccion || socioInfoExtra?.direccion || "Chambala, Huancayo"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> Acceso Web al Portal
                  </span>
                  <p className="font-medium">
                    {socioInfoExtra?.tieneAccesoWeb ? (
                      <span className="text-emerald-600 font-semibold">Habilitado</span>
                    ) : (
                      <span className="text-muted-foreground">Sin cuenta activa</span>
                    )}
                  </p>
                </div>
              </div>

              {/* SECCIÓN: DATOS PERSONALES DE LA FICHA OFICIAL */}
              <div className="rounded-lg border bg-muted/20 p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      DATOS PERSONALES (FICHA OFICIAL DEL PADRÓN)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setModalEditar(true)}
                    className="h-7 text-xs gap-1 bg-background"
                  >
                    <Edit className="h-3 w-3 text-primary" />
                    Editar Ficha
                  </Button>
                </div>

                {/* Campos: Edad, Sexo, Estado Civil, Ocupación */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Edad</span>
                    <p className="font-medium text-foreground">
                      {fichaDatos.edad ? `${fichaDatos.edad} años` : "No registrada"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Sexo</span>
                    <p className="font-medium text-foreground">
                      {fichaDatos.sexo ? (fichaDatos.sexo === "MASCULINO" ? "Masculino" : "Femenino") : "No registrado"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Estado Civil</span>
                    <p className="font-medium text-foreground">
                      {fichaDatos.estadoCivil || "No registrado"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Ocupación</span>
                    <p className="font-medium text-foreground">
                      {fichaDatos.ocupacion || "No registrada"}
                    </p>
                  </div>
                </div>

                {/* Carga Familiar y Documentación Adjunta */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Nº de personas que viven en casa</span>
                    <p className="font-medium text-foreground">
                      {fichaDatos.personasEnCasa ? `${fichaDatos.personasEnCasa} persona(s)` : "No registrado"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Copia de DNI</span>
                    <div className="mt-0.5">
                      {fichaDatos.adjuntaDni ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 text-[11px]">
                          <CheckCircle2 className="h-3 w-3" /> Sí adjunta
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground gap-1 text-[11px]">
                          <XCircle className="h-3 w-3" /> No adjunta
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Copia de recibo de agua, luz o tel.</span>
                    <div className="mt-0.5">
                      {fichaDatos.adjuntaRecibo ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 text-[11px]">
                          <CheckCircle2 className="h-3 w-3" /> Sí adjunta
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground gap-1 text-[11px]">
                          <XCircle className="h-3 w-3" /> No adjunta
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {fichaDatos.adjuntaOtros && (
                  <div className="pt-1 text-xs">
                    <span className="text-muted-foreground text-[11px]">Otros documentos adjuntos: </span>
                    <span className="font-medium text-foreground">{fichaDatos.adjuntaOtros}</span>
                  </div>
                )}

                {/* Documentos Digitales Adjuntos */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                      <FileCheck className="h-3.5 w-3.5 text-primary" />
                      Documentos Digitales Adjuntos ({fichaDatos.documentos.length})
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setModalEditar(true)}
                      className="h-6 text-[11px] gap-1 text-primary hover:text-primary"
                    >
                      <Upload className="h-3 w-3" />
                      Subir archivo
                    </Button>
                  </div>

                  {fichaDatos.documentos.length === 0 ? (
                    <div className="p-3 rounded border border-dashed bg-background/50 text-center text-xs text-muted-foreground">
                      No hay archivos digitales adjuntos (copia de DNI o recibos). Puede digitalizarlos pulsando en "Subir archivo".
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {fichaDatos.documentos.map((doc) => {
                        const isPdf =
                          doc.tipo === "application/pdf" || doc.nombre.toLowerCase().endsWith(".pdf");
                        const isImg =
                          doc.tipo.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(doc.nombre);
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-2 rounded border bg-background text-xs shadow-sm hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                {isPdf ? (
                                  <FileText className="h-3.5 w-3.5 text-destructive" />
                                ) : isImg ? (
                                  <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                                ) : (
                                  <FileText className="h-3.5 w-3.5 text-primary" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate text-[11px]" title={doc.nombre}>
                                  {doc.nombre}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {formatTamanoArchivo(doc.tamano)} &bull; {doc.fecha}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => setDocParaVer(doc)}
                                title="Ver documento"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => handleDescargarDoc(doc)}
                                title="Descargar documento"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {extraerObservaciones(socioInfoExtra?.notas) && (
                <div className="p-3 bg-muted/40 rounded-md border text-xs">
                  <span className="font-semibold text-foreground mr-1">Observaciones / Historial de Asambleas:</span>
                  <span className={cn(
                    socioInfoExtra?.estado === "RETIRADO" ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"
                  )}>
                    {extraerObservaciones(socioInfoExtra?.notas)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tarjetas KPI de Resumen Financiero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-medium text-muted-foreground">Acciones Vigentes (Ciclo Actual)</p>
                  <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 font-mono">
                    {reporte.socio.estado === "RETIRADO" ? 0 : reporte.resumenFinanciero.nroAcciones} acc.
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {reporte.socio.estado === "RETIRADO" ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">Liquidado por Retiro (S/. 0.00)</span>
                    ) : (
                      <>Capital Activo: <strong>{formatSoles(reporte.resumenFinanciero.capitalAcciones)}</strong></>
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 shrink-0">
                  <Coins className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-medium text-muted-foreground">Préstamos Otorgados</p>
                  <h3 className="text-2xl font-bold mt-1 text-foreground font-mono">
                    {formatSoles(reporte.resumenFinanciero.totalPrestamosSolicitados)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {reporte.prestamos.length} crédito(s) en cartera
                  </p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3 text-primary shrink-0">
                  <CreditCard className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-medium text-muted-foreground">Saldo Pendiente</p>
                  <h3 className={cn(
                    "text-2xl font-bold mt-1 font-mono",
                    reporte.resumenFinanciero.saldoPrestamosPendiente > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"
                  )}>
                    {formatSoles(reporte.resumenFinanciero.saldoPrestamosPendiente)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {reporte.resumenFinanciero.saldoPrestamosPendiente > 0 ? "Deuda activa vigente" : "Al día / Sin deuda"}
                  </p>
                </div>
                <div className={cn(
                  "rounded-xl p-3 shrink-0",
                  reporte.resumenFinanciero.saldoPrestamosPendiente > 0 ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"
                )}>
                  <Wallet className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-medium text-muted-foreground">Utilidades Cobradas</p>
                  <h3 className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400 font-mono">
                    {formatSoles(reporte.resumenFinanciero.totalUtilidadesRecibidas)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {reporte.utilidades.length} ejercicio(s) repartidos
                  </p>
                </div>
                <div className="rounded-xl bg-purple-500/10 p-3 text-purple-600 shrink-0">
                  <Award className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficas Visuales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0 max-w-full">
            <Card className="shadow-sm w-full overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-primary" />
                  Composición Financiera
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribución entre capital de acciones, saldo de créditos y utilidades
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {pieData.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
                    Sin información suficiente para el gráfico
                  </div>
                ) : (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatSoles(value)} />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm w-full overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Evolución de Créditos y Amortización
                </CardTitle>
                <CardDescription className="text-xs">
                  Monto solicitado vs saldo capital pendiente por crédito
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {prestamosChartData.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
                    Este socio no registra créditos solicitados a la caja.
                  </div>
                ) : (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prestamosChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" fontSize={11} tickLine={false} />
                        <YAxis fontSize={11} tickLine={false} />
                        <Tooltip formatter={(value: any) => formatSoles(value)} />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Bar dataKey="Solicitado" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Monto Prestado" />
                        <Bar dataKey="Saldo" fill="#ef4444" radius={[4, 4, 0, 0]} name="Saldo Pendiente" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ======================================================== */}
          {/* SECCIÓN ESPECIAL: HISTORIAL CON FECHAS (PAGOS, RETIROS, ACCIONES) */}
          {/* ======================================================== */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Historial Cronológico de Operaciones con Fechas
                </h3>
                <p className="text-xs text-muted-foreground">
                  Filtra entre pagos de cuotas, retiros de dinero, compras de acciones o consulta el libro general
                </p>
              </div>

              {/* Filtros de Año y Texto */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-background border rounded-md px-2.5 py-1">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Año:</span>
                  <Select value={filtroAnio} onValueChange={setFiltroAnio}>
                    <SelectTrigger className="h-7 w-28 text-xs border-none shadow-none focus:ring-0 p-0 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos los Años</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative w-44 sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar concepto..."
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    className="pl-8 h-8 text-xs bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Pestañas Principales */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0 max-w-full">
              <TabsList className="grid grid-cols-2 sm:grid-cols-6 w-full h-auto p-1 bg-muted/60">
                <TabsTrigger value="pagos" className="text-xs py-2 gap-1.5 data-[state=active]:bg-background data-[state=active]:font-semibold">
                  <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Historial de Pagos ({listaPagosConsolidados.length})</span>
                </TabsTrigger>

                <TabsTrigger value="retiros" className="text-xs py-2 gap-1.5 data-[state=active]:bg-background data-[state=active]:font-semibold">
                  <ArrowDownCircle className="h-3.5 w-3.5 text-rose-600" />
                  <span>Retiro de Dinero ({listaRetiros.length})</span>
                </TabsTrigger>

                <TabsTrigger value="acciones" className="text-xs py-2 gap-1.5 data-[state=active]:bg-background data-[state=active]:font-semibold">
                  <Coins className="h-3.5 w-3.5 text-amber-600" />
                  <span>Compra de Acciones ({listaAcciones.length})</span>
                </TabsTrigger>

                <TabsTrigger value="prestamos" className="text-xs py-2 gap-1.5 data-[state=active]:bg-background data-[state=active]:font-semibold">
                  <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                  <span>Créditos ({reporte.prestamos.length})</span>
                </TabsTrigger>

                <TabsTrigger value="utilidades" className="text-xs py-2 gap-1.5 data-[state=active]:bg-background data-[state=active]:font-semibold">
                  <Award className="h-3.5 w-3.5 text-purple-600" />
                  <span>Utilidades ({reporte.utilidades.length})</span>
                </TabsTrigger>

                <TabsTrigger value="movimientos" className="text-xs py-2 gap-1.5 data-[state=active]:bg-background data-[state=active]:font-semibold">
                  <Receipt className="h-3.5 w-3.5 text-neutral-600" />
                  <span>Todos ({movimientosGenerales.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* ======================================================== */}
              {/* TAB 1: HISTORIAL DE PAGOS */}
              {/* ======================================================== */}
              <TabsContent value="pagos" className="mt-4 space-y-4">
                {/* Banner explicativo del desglose en una sola línea */}
                <div className="flex items-start gap-3 p-3 bg-muted/40 border rounded-lg text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">
                      Desglose Consolidado por Cuota de Asamblea
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Cada fila consolida la asamblea mensual con el desglose exacto: la <strong>Amortización de Capital</strong> (monto que amortiza y reduce tu saldo adeudado), el <strong>Interés Pagado</strong> (interés compensatorio abonado al fondo) y el <strong>Total Cuota Pagada</strong>.
                    </p>
                  </div>
                </div>

                {/* Resumen de Pagos - 3 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-none">
                    <CardContent className="p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                          Amortización de Capital Pagado
                        </p>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded">
                          Disminuye deuda
                        </span>
                      </div>
                      <h4 className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                        {formatSoles(totalCapitalPagado)}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Abono acumulado directo al saldo adeudado
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-500/5 border-blue-500/20 shadow-none">
                    <CardContent className="p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                          Intereses de Cuota Pagados
                        </p>
                        <span className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold px-1.5 py-0.5 rounded">
                          Interés cuota
                        </span>
                      </div>
                      <h4 className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                        {formatSoles(totalInteresesPagados)}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Interés aportado para utilidad de la caja
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30 border shadow-none">
                    <CardContent className="p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
                          Total General Pagado en Cuotas
                        </p>
                        <span className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded">
                          {listaPagosConsolidados.length} cuotas
                        </span>
                      </div>
                      <h4 className="text-xl font-bold font-mono text-foreground mt-1">
                        {formatSoles(totalPagosGeneral)}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Suma total de cuotas canceladas (Capital + Interés)
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="w-full min-w-0 max-w-full overflow-hidden shadow-sm">
                  <CardHeader className="py-3 px-4 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          Detalle de Cuotas Mensuales Pagadas
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Desglose en una sola línea de amortización de capital, interés pagado y cuota total por asamblea
                        </CardDescription>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {listaPagosConsolidados.length} cuota(s) registrada(s)
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto w-full">
                    <Table className="w-full min-w-[760px]">
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-28">Fecha de Pago</TableHead>
                          <TableHead className="w-20 text-center">Recibo</TableHead>
                          <TableHead>Detalle / Glosa de la Asamblea</TableHead>
                          <TableHead className="text-right w-40 text-emerald-700 dark:text-emerald-400 font-semibold">
                            Amortización Capital
                          </TableHead>
                          <TableHead className="text-right w-36 text-blue-700 dark:text-blue-400 font-semibold">
                            Interés Pagado
                          </TableHead>
                          <TableHead className="text-right w-36 pr-4 font-bold">
                            Total Cuota
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listaPagosConsolidados.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                              No se registran pagos de cuotas para el periodo o criterio seleccionado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          listaPagosConsolidados.map((p, idx) => (
                            <TableRow key={idx} className="hover:bg-muted/40 text-xs transition-colors">
                              <TableCell className="font-mono font-medium">
                                <div className="inline-flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded text-[11px]">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {formatFecha(p.fecha)}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-mono font-semibold text-muted-foreground">
                                <Badge variant="outline" className="text-[11px] font-mono font-normal">
                                  #{p.nroRecibo || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-sm truncate" title={p.descripcion}>
                                <span className="font-medium text-foreground">{p.descripcion}</span>
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                {p.capital > 0 ? `+${formatSoles(p.capital)}` : <span className="text-muted-foreground font-normal">S/. 0.00</span>}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                                {p.interes > 0 ? `+${formatSoles(p.interes)}` : <span className="text-muted-foreground font-normal">S/. 0.00</span>}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-foreground pr-4">
                                <span className="inline-block bg-muted/60 px-2 py-0.5 rounded text-[11px]">
                                  {formatSoles(p.total)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                      {listaPagosConsolidados.length > 0 && (
                        <TableFooter className="bg-muted/30 font-semibold text-xs border-t-2">
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-bold text-muted-foreground uppercase text-[11px] tracking-wider">
                              Total Acumulado ({listaPagosConsolidados.length} cuotas):
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatSoles(totalCapitalPagado)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                              {formatSoles(totalInteresesPagados)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-extrabold text-foreground pr-4">
                              <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {formatSoles(totalPagosGeneral)}
                              </span>
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      )}
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ======================================================== */}
              {/* TAB 2: RETIRO DE DINERO Y DESEMBOLSOS */}
              {/* ======================================================== */}
              <TabsContent value="retiros" className="mt-4 space-y-4">
                {/* Resumen de Retiros */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="bg-rose-500/5 border-rose-500/20 shadow-none">
                    <CardContent className="p-3">
                      <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase">
                        Desembolsos de Créditos Recibidos
                      </p>
                      <h4 className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                        {formatSoles(totalRetirosDesembolsos)}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Dinero en mano entregado al socio por préstamos
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-500/5 border-purple-500/20 shadow-none">
                    <CardContent className="p-3">
                      <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase">
                        Cobro de Utilidades en Efectivo
                      </p>
                      <h4 className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">
                        {formatSoles(totalRetirosUtilidades)}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Ganancias liquidadas y retiradas en asamblea
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-amber-500/5 border-amber-500/20 shadow-none">
                    <CardContent className="p-3">
                      <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase">
                        Devolución de Capital Social
                      </p>
                      <h4 className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                        {formatSoles(totalRetirosCapital)}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Capital entregado por liquidación/retiro
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30 border shadow-none">
                    <CardContent className="p-3">
                      <p className="text-[11px] font-semibold text-foreground uppercase">
                        Total Dinero Entregado al Socio
                      </p>
                      <h4 className="text-xl font-bold font-mono text-foreground mt-0.5">
                        {formatSoles(totalRetirosGeneral)}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {listaRetiros.length} egresos/desembolsos registrados
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="w-full min-w-0 max-w-full overflow-hidden shadow-sm">
                  <CardHeader className="py-3 px-4 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        Detalle de Retiros de Dinero y Desembolsos por Fecha
                      </CardTitle>
                      <span className="text-xs text-muted-foreground font-mono">
                        {listaRetiros.length} retiro(s) registrado(s)
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto w-full">
                    <Table className="w-full min-w-[700px]">
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-28">Fecha de Retiro</TableHead>
                          <TableHead className="w-36">Tipo de Operación</TableHead>
                          <TableHead className="w-32">Concepto</TableHead>
                          <TableHead>Detalle / Glosa de la Entrega</TableHead>
                          <TableHead className="text-right pr-4">Monto Entregado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listaRetiros.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-xs">
                              No se registran retiros de dinero ni desembolsos en este periodo.
                            </TableCell>
                          </TableRow>
                        ) : (
                          listaRetiros.map((m, idx) => (
                            <TableRow key={idx} className="hover:bg-muted/40 text-xs">
                              <TableCell className="font-mono font-medium">
                                <div className="inline-flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded text-[11px]">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {formatFecha(m.fecha)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    "text-[10px] px-2 py-0.5",
                                    m.categoria.includes("Préstamo")
                                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                                      : "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30"
                                  )}
                                >
                                  {m.categoria}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-foreground">
                                {m.concepto}
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-sm truncate" title={m.descripcion || ""}>
                                {m.descripcion || "Entrega de fondos autorizada en asamblea"}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-rose-600 dark:text-rose-400 pr-4">
                                -{formatSoles(m.monto)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ======================================================== */}
              {/* TAB 3: COMPRA DE ACCIONES Y APORTES DE CAPITAL */}
              {/* ======================================================== */}
              <TabsContent value="acciones" className="mt-4 space-y-4">
                {/* Resumen de Acciones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className={cn(
                    "shadow-none",
                    reporte.socio.estado === "RETIRADO"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-emerald-500/5 border-emerald-500/20"
                  )}>
                    <CardContent className="p-3">
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                        Acciones Vigentes en Caja
                      </p>
                      <h4 className={cn(
                        "text-xl font-bold font-mono mt-0.5",
                        reporte.socio.estado === "RETIRADO" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {reporte.socio.estado === "RETIRADO" ? 0 : reporte.resumenFinanciero.nroAcciones} acciones
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {reporte.socio.estado === "RETIRADO" ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Liquidado y devuelto por retiro</span>
                        ) : (
                          <>Capital Activo: <strong>{formatSoles(reporte.resumenFinanciero.capitalAcciones)}</strong></>
                        )}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-amber-500/5 border-amber-500/20 shadow-none">
                    <CardContent className="p-3">
                      <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase">
                        Total Acciones Adquiridas (Histórico)
                      </p>
                      <h4 className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                        {totalAccionesCompradas} acciones
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Acciones ordinarias suscritas y pagadas
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-none">
                    <CardContent className="p-3">
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
                        Capital Social Histórico
                      </p>
                      <h4 className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatSoles(totalMontoAcciones)}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Valor nominal: S/. 30.00 por acción
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30 border shadow-none">
                    <CardContent className="p-3">
                      <p className="text-[11px] font-semibold text-foreground uppercase">
                        Operaciones de Compra
                      </p>
                      <h4 className="text-xl font-bold font-mono text-foreground mt-0.5">
                        {listaAcciones.length} asambleas
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Aportes mensuales de capital social
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {reporte.socio.estado === "RETIRADO" && (
                  <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <span className="font-semibold">Socio Liquidado por Retiro:</span> El capital social aportado históricamente ({totalAccionesCompradas} acciones por un total de {formatSoles(totalMontoAcciones)}) fue liquidado y devuelto en su totalidad junto con sus utilidades en la asamblea de cierre. Por tanto, sus <strong>acciones vigentes en caja son 0</strong>.
                    </div>
                  </div>
                )}

                <Card className="w-full min-w-0 max-w-full overflow-hidden shadow-sm">
                  <CardHeader className="py-3 px-4 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        Detalle de Compra de Acciones por Fecha de Asamblea
                      </CardTitle>
                      <span className="text-xs text-muted-foreground font-mono">
                        {listaAcciones.length} compras(s) registrada(s)
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto w-full">
                    <Table className="w-full min-w-[700px]">
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-28">Fecha de Compra</TableHead>
                          <TableHead className="w-20 text-center">Recibo</TableHead>
                          <TableHead className="w-32 text-center">Acciones Compradas</TableHead>
                          <TableHead className="w-28 text-center">Valor Unitario</TableHead>
                          <TableHead>Asamblea / Detalle</TableHead>
                          <TableHead className="text-right pr-4">Monto Aportado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listaAcciones.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                              No se registran compras de acciones para el periodo seleccionado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          listaAcciones.map((a, idx) => (
                            <TableRow key={idx} className="hover:bg-muted/40 text-xs">
                              <TableCell className="font-mono font-medium">
                                <div className="inline-flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded text-[11px]">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {formatFecha(a.fecha)}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-mono font-semibold text-muted-foreground">
                                #{a.nroRecibo || "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-mono text-[11px]">
                                  +{a.acciones} acciones
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center font-mono text-muted-foreground">
                                S/. 30.00
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-sm truncate" title={a.descripcion}>
                                {a.descripcion}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 pr-4">
                                +{formatSoles(a.monto)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ======================================================== */}
              {/* TAB 4: PRÉSTAMOS Y CRÉDITOS */}
              {/* ======================================================== */}
              <TabsContent value="prestamos" className="mt-4">
                <Card className="w-full min-w-0 max-w-full overflow-hidden shadow-sm">
                  <CardHeader className="py-4 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Historial de Créditos del Socio</CardTitle>
                        <CardDescription className="text-xs">
                          Cronograma de préstamos desembolsados, tasa de interés y amortización
                        </CardDescription>
                      </div>
                      {reporte.socio.estado === "ACTIVO" && (
                        <Link href="/admin/prestamos">
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Nuevo Crédito
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto w-full">
                    <Table className="w-full min-w-[750px]">
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-16 text-center">N°</TableHead>
                          <TableHead>Fecha Desembolso</TableHead>
                          <TableHead className="text-right">Monto Principal</TableHead>
                          <TableHead className="text-center">Tasa Mensual</TableHead>
                          <TableHead className="text-center">Plazo</TableHead>
                          <TableHead className="text-right">Saldo Pendiente</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                          <TableHead className="text-right pr-4">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reporte.prestamos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-xs">
                              Este integrante no registra préstamos en el historial.
                            </TableCell>
                          </TableRow>
                        ) : (
                          reporte.prestamos.map((p) => (
                            <TableRow key={p.prestamoId} className="hover:bg-muted/40">
                              <TableCell className="text-center font-mono font-bold text-primary">
                                #{p.numero}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {formatFecha(p.fechaDesembolso)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                {formatSoles(p.montoPrincipal)}
                              </TableCell>
                              <TableCell className="text-center font-mono text-xs">
                                {p.tasaMensual}%
                              </TableCell>
                              <TableCell className="text-center text-xs">
                                {p.nroCuotas} mes(es)
                              </TableCell>
                              <TableCell className={cn(
                                "text-right font-mono font-bold",
                                p.saldoCapital > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"
                              )}>
                                {formatSoles(p.saldoCapital)}
                              </TableCell>
                              <TableCell className="text-center">
                                {p.estado === "VIGENTE" ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px]">
                                    Vigente
                                  </Badge>
                                ) : p.estado === "CANCELADO" ? (
                                  <Badge variant="outline" className="text-neutral-500 text-[11px]">
                                    Cancelado
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[11px]">
                                    {p.estado}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right pr-4">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1 font-medium"
                                    title="Descargar Documento Oficial de Crédito, Pagaré y Firmas en PDF"
                                    onClick={async () => {
                                      try {
                                        toast.loading("Generando documento oficial de crédito...");
                                        await descargarExpedientePrestamoCompletoPDF(p.prestamoId);
                                        toast.dismiss();
                                        toast.success("Documento de crédito, pagaré y firmas descargado con éxito");
                                      } catch (err: any) {
                                        toast.dismiss();
                                        toast.error(err?.message || "Error al descargar el PDF");
                                      }
                                    }}
                                  >
                                    <FileDown className="h-3 w-3" />
                                    <span>PDF</span>
                                  </Button>
                                  <Link href={`/admin/prestamos/${p.prestamoId}`}>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
                                      Ver Cuotas <ArrowUpRight className="h-3 w-3" />
                                    </Button>
                                  </Link>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ======================================================== */}
              {/* TAB 5: UTILIDADES */}
              {/* ======================================================== */}
              <TabsContent value="utilidades" className="mt-4 space-y-4">
                {/* Banner Explicativo Regla de Distribución de Utilidades */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Regla Oficial de la UNICA Chambala:</span> Tras cada cierre de ejercicio anual, las acciones de los socios activos <strong>permanecen en la caja</strong> generando rentabilidad; en la asamblea de junio se entrega y cobra únicamente la <strong>Utilidad Neta</strong> ganada. El <strong>Capital Social</strong> de acciones solo se devuelve y liquida en el año en que el socio se retira formalmente de la asociación.
                  </div>
                </div>

                <Card className="w-full min-w-0 max-w-full overflow-hidden shadow-sm">
                  <CardHeader className="py-4 border-b bg-muted/20">
                    <CardTitle className="text-base">Distribución Anual de Utilidades y Dividendos</CardTitle>
                    <CardDescription className="text-xs">
                      Detalle de utilidades aprobadas y abonadas por ejercicio. El capital social de acciones permanece activo en la caja, salvo en el año de retiro del socio.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto w-full">
                    <Table className="w-full min-w-[780px]">
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-20 text-center">Ejercicio</TableHead>
                          <TableHead className="text-center">Acciones Participantes</TableHead>
                          <TableHead className="text-right">Utilidad Ganada</TableHead>
                          <TableHead className="text-right">Capital Social Devuelto</TableHead>
                          <TableHead className="text-right font-bold">Total Entregado</TableHead>
                          <TableHead className="text-center">Fecha Asamblea</TableHead>
                          <TableHead className="text-center">Destino de Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reporte.utilidades.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-xs">
                              No registra distribuciones de utilidades en ejercicios cerrados.
                            </TableCell>
                          </TableRow>
                        ) : (
                          reporte.utilidades.map((u) => {
                            const capitalSocial = u.capitalSocial ?? (u.acciones * 30);
                            const capitalDevuelto = u.capitalDevuelto ?? 0;
                            const totalCobrado = u.totalCobrado ?? (Number(u.monto) + capitalDevuelto);
                            const esRetiro = capitalDevuelto > 0 || u.estadoAcciones === "DEVUELTO_POR_RETIRO";
                            const tieneReinv = (u.montoReinvertido ?? 0) > 0;

                            return (
                              <TableRow key={u.ejercicio} className="hover:bg-muted/40">
                                <TableCell className="text-center font-bold font-mono text-primary">
                                  {u.ejercicio}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="font-mono font-medium">{u.acciones} acc.</span>
                                  <span className="text-[11px] text-muted-foreground block">
                                    ({formatSoles(capitalSocial)})
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-mono font-semibold text-emerald-600 block">
                                    {formatSoles(u.monto)}
                                  </span>
                                  {tieneReinv && (
                                    <span className="text-[10px] text-blue-600 block">
                                      Efect: {formatSoles(u.montoCobrado)} | Reinv: {formatSoles(u.montoReinvertido)} (+{u.accionesCompradas} acc)
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                  {esRetiro ? (
                                    <div>
                                      <span className="font-bold text-amber-600 dark:text-amber-400">
                                        {formatSoles(capitalDevuelto)}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground block">
                                        Devuelto por retiro
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      S/. 0.00 <span className="text-[10px] block text-muted-foreground/75">(Permanece en Caja)</span>
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-foreground">
                                  <div className="inline-flex flex-col items-end">
                                    <span className={cn(
                                      "text-xs px-2 py-0.5 rounded font-mono font-bold",
                                      esRetiro ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    )}>
                                      {formatSoles(totalCobrado)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground mt-0.5">
                                      {esRetiro ? "Utilidad + Capital Devuelto" : "Solo Utilidad Cobrada"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center font-mono text-xs">
                                  {formatFecha(u.fechaPago || `${u.ejercicio}-06-08`)}
                                </TableCell>
                                <TableCell className="text-center">
                                  {esRetiro ? (
                                    <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 text-[10px]">
                                      Liquidado por Retiro
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 text-[10px]">
                                      Acciones Permanecen
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ======================================================== */}
              {/* TAB 6: TODOS LOS MOVIMIENTOS */}
              {/* ======================================================== */}
              <TabsContent value="movimientos" className="mt-4">
                <Card className="w-full min-w-0 max-w-full overflow-hidden shadow-sm">
                  <CardHeader className="py-4 border-b bg-muted/20">
                    <CardTitle className="text-base">Libro Diario Cronológico Completo</CardTitle>
                    <CardDescription className="text-xs">
                      Todos los asientos de entrada y salida registrados con fecha y número de recibo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto w-full">
                    <Table className="w-full min-w-[700px]">
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-28">Fecha</TableHead>
                          <TableHead className="w-20 text-center">Recibo</TableHead>
                          <TableHead className="w-24 text-center">Tipo</TableHead>
                          <TableHead className="w-40">Concepto</TableHead>
                          <TableHead>Descripción / Glosa</TableHead>
                          <TableHead className="text-right pr-4">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movimientosGenerales.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">
                              No se encontraron operaciones con los filtros aplicados.
                            </TableCell>
                          </TableRow>
                        ) : (
                          movimientosGenerales.map((m, idx) => {
                            const isIngreso = m.tipo === "INGRESO";
                            return (
                              <TableRow key={idx} className="hover:bg-muted/40 text-xs">
                                <TableCell className="font-mono font-medium">
                                  <div className="inline-flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded text-[11px]">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    {formatFecha(m.fecha)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center font-mono font-medium">
                                  #{m.nroRecibo || "-"}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={isIngreso ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                                    {m.tipo}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium text-foreground">
                                  {m.concepto}
                                </TableCell>
                                <TableCell className="text-muted-foreground max-w-sm truncate" title={m.descripcion || ""}>
                                  {m.descripcion || "-"}
                                </TableCell>
                                <TableCell className={cn(
                                  "text-right font-mono font-bold pr-4",
                                  isIngreso ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                  )}>
                                  {isIngreso ? "+" : "-"}{formatSoles(m.monto)}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {/* MODAL: Editar Datos Personales del Socio */}
      <ModalEditarDatosPersonales
        open={modalEditar}
        onOpenChange={setModalEditar}
        socio={socioParaEditar}
        onSuccess={() => {
          if (selectedId) cargarReporte(selectedId);
          fetchSocios();
        }}
      />

      {/* DIALOG: Previsualización de Documento */}
      <Dialog open={!!docParaVer} onOpenChange={(open) => !open && setDocParaVer(null)}>
        <DialogContent className="w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-sm sm:text-base pr-6">
              <span className="truncate">{docParaVer?.nombre}</span>
              {docParaVer && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDescargarDoc(docParaVer)}
                  className="h-7 gap-1 text-xs shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 flex items-center justify-center">
            {docParaVer?.tipo.startsWith("image/") ||
            /\.(jpe?g|png|webp|gif)$/i.test(docParaVer?.nombre || "") ? (
              <img
                src={docParaVer?.data}
                alt={docParaVer?.nombre}
                className="max-h-[75vh] w-auto max-w-full rounded border object-contain shadow-sm"
              />
            ) : docParaVer?.tipo === "application/pdf" ||
              docParaVer?.nombre.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={docParaVer?.data}
                title={docParaVer?.nombre}
                className="w-full h-[75vh] rounded border shadow-sm"
              />
            ) : (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <FileText className="h-12 w-12 mx-auto text-primary" />
                <p className="text-sm font-medium">Formato no previsualizable directamente</p>
                <p className="text-xs">Puede descargarlo para verlo en su equipo.</p>
                <Button
                  size="sm"
                  onClick={() => docParaVer && handleDescargarDoc(docParaVer)}
                  className="mt-2"
                >
                  Descargar Archivo
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DetalleSocioPage() {
  return (
    <React.Suspense fallback={
      <div className="py-20 text-center text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
        <p className="text-sm">Cargando expediente...</p>
      </div>
    }>
      <DetalleSocioContent />
    </React.Suspense>
  );
}
