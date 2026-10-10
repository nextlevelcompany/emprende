"use client";

import * as React from "react";
import {
  FileText,
  Printer,
  Search,
  User,
  Calendar,
  Building2,
  Coins,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatFecha } from "@/lib/utils";

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

interface PeriodoItem {
  id: string;
  anio: number;
  mes: number;
  fechaReunion: string;
  estado: string;
}

interface SocioItem {
  id: string;
  codigo: number;
  nombreCompleto: string;
  documentoTipo: string;
}

interface ReporteAsamblea {
  cabecera: {
    periodoId: string;
    anio: number;
    mes: number;
    nombreMes: string;
    fechaReunion: string;
    estado: string;
    saldoAnterior: number;
    totalIngresos: number;
    totalEgresos: number;
    saldoFinal: number;
    cerradoAt: string | null;
    cerradoPor: string | null;
  };
  ingresosDesglose: {
    depositoAhorros: number;
    pagosCapital: number;
    interesesRecibidos: number;
    acciones: number;
    otrosTardanza: number;
    reservas: number;
    totalIngresos: number;
  };
  egresosDesglose: {
    retirosAhorros: number;
    prestamos: number;
    interesPagado: number;
    gastosAdmin: number;
    utilidadDistribuida: number;
    red: number;
    otrosEgresos: number;
    totalEgresos: number;
  };
  operaciones: Array<{
    id: string;
    nroRecibo: number | null;
    fecha: string;
    socioCodigo: number | null;
    socioNombre: string | null;
    tipo: string;
    concepto: string;
    monto: number;
    descripcion: string | null;
  }>;
  arqueo: {
    efectivo: number;
    depositosBancos: number;
    totalContado: number;
    saldoSistema: number;
    diferencia: number;
    observacion: string | null;
  } | null;
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
  }>;
  movimientos: Array<{
    fecha: string;
    nroRecibo: number | null;
    tipo: string;
    concepto: string;
    monto: number;
    descripcion: string | null;
  }>;
}

export default function ReportesPage() {
  const [activeTab, setActiveTab] = React.useState<string>("asamblea");

  // Estados Tab Asamblea
  const [periodos, setPeriodos] = React.useState<PeriodoItem[]>([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = React.useState<string>("");
  const [reporteAsamblea, setReporteAsamblea] = React.useState<ReporteAsamblea | null>(null);
  const [isLoadingAsamblea, setIsLoadingAsamblea] = React.useState<boolean>(false);

  // Estados Tab Socio
  const [socios, setSocios] = React.useState<SocioItem[]>([]);
  const [selectedSocioId, setSelectedSocioId] = React.useState<string>("");
  const [reporteSocio, setReporteSocio] = React.useState<ReporteSocio | null>(null);
  const [isLoadingSocio, setIsLoadingSocio] = React.useState<boolean>(false);
  const [busquedaSocio, setBusquedaSocio] = React.useState<string>("");

  // Cargar lista de periodos
  const loadPeriodos = React.useCallback(async () => {
    try {
      const res = await fetch("/api/periodos");
      if (res.ok) {
        const data = await res.json();
        const lista: PeriodoItem[] = Array.isArray(data) ? data : data?.content || [];
        setPeriodos(lista);
        if (lista.length > 0 && !selectedPeriodoId) {
          // Seleccionar por defecto el periodo abierto o el primero
          const abierto = lista.find((p: PeriodoItem) => p.estado === "ABIERTO") || lista[0];
          setSelectedPeriodoId(abierto.id);
        }
      }
    } catch (e) {
      console.error("Error al cargar periodos", e);
    }
  }, [selectedPeriodoId]);

  // Cargar lista de socios
  const loadSocios = React.useCallback(async () => {
    try {
      const res = await fetch("/api/socios");
      if (res.ok) {
        const data = await res.json();
        const lista: SocioItem[] = Array.isArray(data) ? data : data?.content || [];
        setSocios(lista);
        if (lista.length > 0 && !selectedSocioId) {
          setSelectedSocioId(lista[0].id);
        }
      }
    } catch (e) {
      console.error("Error al cargar socios", e);
    }
  }, [selectedSocioId]);

  React.useEffect(() => {
    loadPeriodos();
    loadSocios();
  }, [loadPeriodos, loadSocios]);

  // Cargar reporte de asamblea cuando cambia el periodo seleccionado
  React.useEffect(() => {
    if (!selectedPeriodoId) return;
    const fetchAsamblea = async () => {
      setIsLoadingAsamblea(true);
      try {
        const res = await fetch(`/api/reportes/asamblea/${selectedPeriodoId}`);
        if (!res.ok) throw new Error("Error al obtener reporte de asamblea");
        const json = await res.json();
        setReporteAsamblea(json);
      } catch (e: any) {
        toast.error(e.message || "Error al cargar reporte de asamblea");
      } finally {
        setIsLoadingAsamblea(false);
      }
    };
    fetchAsamblea();
  }, [selectedPeriodoId]);

  // Cargar reporte de socio cuando cambia el socio seleccionado
  React.useEffect(() => {
    if (!selectedSocioId) return;
    const fetchSocio = async () => {
      setIsLoadingSocio(true);
      try {
        const res = await fetch(`/api/reportes/socio/${selectedSocioId}`);
        if (!res.ok) throw new Error("Error al obtener estado de cuenta");
        const json = await res.json();
        setReporteSocio(json);
      } catch (e: any) {
        toast.error(e.message || "Error al cargar estado de cuenta");
      } finally {
        setIsLoadingSocio(false);
      }
    };
    fetchSocio();
  }, [selectedSocioId]);

  const handlePrint = () => {
    window.print();
  };

  const formatSoles = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "S/. 0.00";
    return `S/. ${val.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const listaSocios = Array.isArray(socios) ? socios : [];
  const sociosFiltrados = listaSocios.filter((s) => {
    if (!busquedaSocio) return true;
    const q = busquedaSocio.toLowerCase();
    return (
      (s.nombreCompleto && s.nombreCompleto.toLowerCase().includes(q)) ||
      (s.codigo !== undefined && s.codigo !== null && s.codigo.toString().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Encabezado sin imprimir en papel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Reportes Oficiales</h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Asamblea y Socios
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Libro de caja consolidado para rendición de cuentas en asamblea y estados de cuenta individuales.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir Reporte
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 print:hidden">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="asamblea" className="gap-2">
            <FileText className="h-4 w-4" />
            Libro de Caja (Asamblea)
          </TabsTrigger>
          <TabsTrigger value="socio" className="gap-2">
            <User className="h-4 w-4" />
            Estado de Cuenta por Socio
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ========================================================= */}
      {/* SECCIÓN 1: REPORTE OFICIAL DE ASAMBLEA */}
      {/* ========================================================= */}
      {activeTab === "asamblea" && (
        <div className="space-y-6">
          {/* Selector de Periodo (oculto al imprimir) */}
          <Card className="print:hidden">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-full sm:w-72">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Seleccionar Periodo de Asamblea
                  </label>
                  <Select value={selectedPeriodoId} onValueChange={setSelectedPeriodoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.mes < 10 ? `0${p.mes}` : p.mes}/{p.anio} - Reunión {formatFecha(p.fechaReunion)} ({p.estado})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isLoadingAsamblea && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 sm:pt-0">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    Cargando acta oficial...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* DOCUMENTO OFICIAL PARA ASAMBLEA (APTO PARA IMPRESIÓN) */}
          {reporteAsamblea && (
            <div className="bg-card text-card-foreground p-6 md:p-8 rounded-lg border shadow-sm print:border-none print:shadow-none print:p-0 space-y-6">
              {/* Encabezado Formal del Acta */}
              <div className="border-b pb-4 text-center space-y-1">
                <h2 className="text-xl font-bold uppercase tracking-wider">
                  Caja Comunal "Emprende Chambala"
                </h2>
                <h3 className="text-sm font-semibold text-primary uppercase">
                  Libro de Caja y Balance Mensual de Asamblea General
                </h3>
                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-1">
                  <span>
                    <strong>Periodo:</strong> {reporteAsamblea.cabecera.nombreMes}
                  </span>
                  <span>
                    <strong>Fecha de Asamblea:</strong> {formatFecha(reporteAsamblea.cabecera.fechaReunion)}
                  </span>
                  <span>
                    <strong>Estado:</strong>{" "}
                    <Badge variant={reporteAsamblea.cabecera.estado === "ABIERTO" ? "default" : "secondary"} className="text-[10px]">
                      {reporteAsamblea.cabecera.estado}
                    </Badge>
                  </span>
                </div>
              </div>

              {/* Resumen Contable Principal (4 Cuadros) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded p-3 text-center bg-muted/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">SALDO INICIAL</span>
                  <span className="text-base font-bold font-mono">
                    {formatSoles(reporteAsamblea.cabecera.saldoAnterior)}
                  </span>
                </div>
                <div className="border rounded p-3 text-center bg-emerald-50/50 dark:bg-emerald-950/20">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-medium">(+) TOTAL INGRESOS</span>
                  <span className="text-base font-bold font-mono text-emerald-600">
                    {formatSoles(reporteAsamblea.cabecera.totalIngresos)}
                  </span>
                </div>
                <div className="border rounded p-3 text-center bg-rose-50/50 dark:bg-rose-950/20">
                  <span className="text-[11px] text-rose-700 dark:text-rose-400 block font-medium">(-) TOTAL EGRESOS</span>
                  <span className="text-base font-bold font-mono text-rose-600">
                    {formatSoles(reporteAsamblea.cabecera.totalEgresos)}
                  </span>
                </div>
                <div className="border rounded p-3 text-center bg-primary/10">
                  <span className="text-[11px] text-primary block font-medium">(=) SALDO FINAL EN CAJA</span>
                  <span className="text-base font-bold font-mono text-primary">
                    {formatSoles(reporteAsamblea.cabecera.saldoFinal)}
                  </span>
                </div>
              </div>

              {/* Cuadro Comparativo Detallado de Rubros Oficiales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Desglose de Ingresos */}
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-emerald-100 dark:bg-emerald-950/40 px-4 py-2 border-b">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                      Desglose de Ingresos de la Asamblea
                    </span>
                  </div>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-xs">Depósitos de Ahorros</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatSoles(reporteAsamblea.ingresosDesglose.depositoAhorros)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Pagos de Capital de Préstamos</TableCell>
                        <TableCell className="text-xs text-right font-mono font-medium">{formatSoles(reporteAsamblea.ingresosDesglose.pagosCapital)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Intereses Recibidos</TableCell>
                        <TableCell className="text-xs text-right font-mono font-medium text-emerald-600">{formatSoles(reporteAsamblea.ingresosDesglose.interesesRecibidos)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Aportes por Acciones</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatSoles(reporteAsamblea.ingresosDesglose.acciones)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Multas y Tardanzas</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatSoles(reporteAsamblea.ingresosDesglose.otrosTardanza)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Reservas</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatSoles(reporteAsamblea.ingresosDesglose.reservas)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/40 font-bold">
                        <TableCell className="text-xs">TOTAL INGRESOS DEL MES</TableCell>
                        <TableCell className="text-xs text-right font-mono text-emerald-600 font-bold">
                          {formatSoles(reporteAsamblea.ingresosDesglose.totalIngresos)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Desglose de Egresos */}
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-rose-100 dark:bg-rose-950/40 px-4 py-2 border-b">
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">
                      Desglose de Egresos de la Asamblea
                    </span>
                  </div>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-xs">Préstamos Nuevos Desembolsados</TableCell>
                        <TableCell className="text-xs text-right font-mono font-medium">{formatSoles(reporteAsamblea.egresosDesglose.prestamos)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Utilidades y Dividendos Distribuidos</TableCell>
                        <TableCell className="text-xs text-right font-mono font-medium text-purple-600">{formatSoles(reporteAsamblea.egresosDesglose.utilidadDistribuida)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Gastos Administrativos / Operativos</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatSoles(reporteAsamblea.egresosDesglose.gastosAdmin)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Retiros de Ahorros</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatSoles(reporteAsamblea.egresosDesglose.retirosAhorros)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Intereses Pagados</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatSoles(reporteAsamblea.egresosDesglose.interesPagado)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Red Comunal / Otros</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatSoles(reporteAsamblea.egresosDesglose.red)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/40 font-bold">
                        <TableCell className="text-xs">TOTAL EGRESOS DEL MES</TableCell>
                        <TableCell className="text-xs text-right font-mono text-rose-600 font-bold">
                          {formatSoles(reporteAsamblea.egresosDesglose.totalEgresos)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Arqueo de Caja si existe */}
              {reporteAsamblea.arqueo && (
                <div className="border rounded-md p-4 bg-muted/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Wallet className="h-4 w-4" />
                    Arqueo y Cuadratura de Bóveda
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Efectivo en Bóveda:</span>
                      <span className="font-mono font-bold">{formatSoles(reporteAsamblea.arqueo.efectivo)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Depósitos Bancarios:</span>
                      <span className="font-mono font-bold">{formatSoles(reporteAsamblea.arqueo.depositosBancos)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Total Contado:</span>
                      <span className="font-mono font-bold">{formatSoles(reporteAsamblea.arqueo.totalContado)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Diferencia de Caja:</span>
                      <span className={cn("font-mono font-bold", reporteAsamblea.arqueo.diferencia === 0 ? "text-emerald-600" : "text-destructive")}>
                        {formatSoles(reporteAsamblea.arqueo.diferencia)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detalle de Movimientos Individuales */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">
                  Padrón de Transacciones Registradas en Asamblea ({(reporteAsamblea.operaciones || []).length} movimientos)
                </h4>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Recibo</TableHead>
                        <TableHead className="w-[70px]">Cód.</TableHead>
                        <TableHead>Socio</TableHead>
                        <TableHead className="w-[90px]">Tipo</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(reporteAsamblea.operaciones || []).map((op, idx) => {
                        const isIngreso = op.tipo === "INGRESO";
                        return (
                          <TableRow key={`${op.id || "op"}-${idx}`} className="text-xs hover:bg-muted/40">
                            <TableCell className="font-mono font-medium">{op.nroRecibo || "-"}</TableCell>
                            <TableCell className="font-mono">{op.socioCodigo || "-"}</TableCell>
                            <TableCell className="font-medium">{op.socioNombre || "ASAMBLEA GENERAL"}</TableCell>
                            <TableCell>
                              <Badge variant={isIngreso ? "default" : "destructive"} className="text-[9px] py-0">
                                {op.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell>{op.concepto}</TableCell>
                            <TableCell className={cn("text-right font-mono font-semibold", isIngreso ? "text-emerald-600" : "text-rose-600")}>
                              {isIngreso ? "+" : "-"}{formatSoles(op.monto)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Sección de Firmas de la Junta Directiva */}
              <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs">
                <div className="border-t border-muted-foreground/40 pt-2">
                  <p className="font-semibold">Presidente</p>
                  <p className="text-muted-foreground text-[10px]">Caja Comunal Emprende Chambala</p>
                </div>
                <div className="border-t border-muted-foreground/40 pt-2">
                  <p className="font-semibold">Tesorero(a)</p>
                  <p className="text-muted-foreground text-[10px]">Control de Bóveda y Libro</p>
                </div>
                <div className="border-t border-muted-foreground/40 pt-2">
                  <p className="font-semibold">Secretario(a)</p>
                  <p className="text-muted-foreground text-[10px]">Fe de Asamblea y Acta</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECCIÓN 2: ESTADO DE CUENTA INDIVIDUAL POR SOCIO */}
      {/* ========================================================= */}
      {activeTab === "socio" && (
        <div className="space-y-6">
          {/* Selector y Buscador de Socio */}
          <Card className="print:hidden">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Seleccionar Socio
                  </label>
                  <Select value={selectedSocioId} onValueChange={setSelectedSocioId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un socio" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {sociosFiltrados.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          Socio #{s.codigo} - {s.nombreCompleto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Buscar Socio por Código o Nombre
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Ej. Cirilo, 1, Laime..."
                      value={busquedaSocio}
                      onChange={(e) => setBusquedaSocio(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DOCUMENTO DE ESTADO DE CUENTA INDIVIDUAL */}
          {reporteSocio && (
            <div className="bg-card text-card-foreground p-6 md:p-8 rounded-lg border shadow-sm print:border-none print:shadow-none print:p-0 space-y-6">
              {/* Encabezado del Socio */}
              <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold uppercase">
                    Estado de Cuenta Individual
                  </h2>
                  <p className="text-sm font-semibold text-primary">
                    Socio #{reporteSocio.socio.codigo} - {reporteSocio.socio.nombreCompleto}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span><strong>Doc:</strong> {reporteSocio.socio.documentoTipo}</span>
                    <span><strong>Teléfono:</strong> {reporteSocio.socio.telefono || "-"}</span>
                    <span><strong>Ingreso:</strong> {formatFecha(reporteSocio.socio.fechaIngreso)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50 text-xs">
                    Socio {reporteSocio.socio.estado}
                  </Badge>
                  <p className="text-[11px] text-muted-foreground mt-1">Caja Comunal Emprende Chambala</p>
                </div>
              </div>

              {/* 4 Tarjetas de Resumen Financiero del Socio */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded p-3 text-center bg-amber-50/50 dark:bg-amber-950/20">
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 block font-medium">CAPITAL EN ACCIONES</span>
                  <span className="text-base font-bold font-mono text-amber-600">
                    {formatSoles(reporteSocio.resumenFinanciero.capitalAcciones)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {reporteSocio.resumenFinanciero.nroAcciones} acciones (S/. 30.00 c/u)
                  </span>
                </div>

                <div className="border rounded p-3 text-center bg-blue-50/50 dark:bg-blue-950/20">
                  <span className="text-[11px] text-blue-700 dark:text-blue-400 block font-medium">SALDO EN AHORROS</span>
                  <span className="text-base font-bold font-mono text-blue-600">
                    {formatSoles(reporteSocio.resumenFinanciero.saldoAhorros)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Fondo voluntario disponible
                  </span>
                </div>

                <div className="border rounded p-3 text-center bg-purple-50/50 dark:bg-purple-950/20">
                  <span className="text-[11px] text-purple-700 dark:text-purple-400 block font-medium">UTILIDADES COBRADAS</span>
                  <span className="text-base font-bold font-mono text-purple-600">
                    {formatSoles(reporteSocio.resumenFinanciero.totalUtilidadesRecibidas)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Dividendos históricos
                  </span>
                </div>

                <div className="border rounded p-3 text-center bg-rose-50/50 dark:bg-rose-950/20">
                  <span className="text-[11px] text-rose-700 dark:text-rose-400 block font-medium">DEUDA DE PRÉSTAMOS</span>
                  <span className="text-base font-bold font-mono text-rose-600">
                    {formatSoles(reporteSocio.resumenFinanciero.saldoPrestamosPendiente)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Capital pendiente por pagar
                  </span>
                </div>
              </div>

              {/* Historial de Créditos del Socio */}
              {(reporteSocio.prestamos || []).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    Historial de Créditos Otorgados
                  </h4>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">N° Crédito</TableHead>
                          <TableHead>Fecha Desembolso</TableHead>
                          <TableHead className="text-right">Monto Principal</TableHead>
                          <TableHead className="text-center">Cuotas</TableHead>
                          <TableHead className="text-right">Saldo Pendiente</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(reporteSocio.prestamos || []).map((p) => (
                          <TableRow key={p.prestamoId} className="text-xs">
                            <TableCell className="font-mono font-medium">CR-{p.numero}</TableCell>
                            <TableCell className="font-mono text-xs">{formatFecha(p.fechaDesembolso)}</TableCell>
                            <TableCell className="text-right font-mono">{formatSoles(p.montoPrincipal)}</TableCell>
                            <TableCell className="text-center font-mono">{p.nroCuotas}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-rose-600">{formatSoles(p.saldoCapital)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={p.estado === "CANCELADO" ? "outline" : "default"} className="text-[10px]">
                                {p.estado}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Historial de Utilidades del Socio */}
              {(reporteSocio.utilidades || []).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Coins className="h-4 w-4" />
                    Dividendos y Utilidades Cobradas
                  </h4>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ejercicio Fiscal</TableHead>
                          <TableHead className="text-center">Acciones Participantes</TableHead>
                          <TableHead className="text-right">Dividendo Cobrado</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(reporteSocio.utilidades || []).map((u) => (
                          <TableRow key={u.ejercicio} className="text-xs">
                            <TableCell className="font-semibold">Ejercicio {u.ejercicio}</TableCell>
                            <TableCell className="text-center font-mono">{u.acciones} acciones</TableCell>
                            <TableCell className="text-right font-mono font-bold text-purple-600">{formatSoles(u.monto)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50 text-[10px]">
                                Liquidado
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Registro Histórico de Movimientos en Caja */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Registro de Movimientos en Caja ({(reporteSocio.movimientos || []).length} transacciones)
                </h4>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Fecha</TableHead>
                        <TableHead className="w-[80px]">Recibo</TableHead>
                        <TableHead className="w-[90px]">Tipo</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(reporteSocio.movimientos || []).map((m, idx) => {
                        const isIngreso = m.tipo === "INGRESO";
                        return (
                          <TableRow key={idx} className="text-xs hover:bg-muted/40">
                            <TableCell className="font-mono text-xs text-muted-foreground">{formatFecha(m.fecha)}</TableCell>
                            <TableCell className="font-mono font-medium">{m.nroRecibo || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={isIngreso ? "default" : "destructive"} className="text-[9px] py-0">
                                {m.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{m.concepto}</TableCell>
                            <TableCell className="text-muted-foreground truncate max-w-[200px]">{m.descripcion || "-"}</TableCell>
                            <TableCell className={cn("text-right font-mono font-semibold", isIngreso ? "text-emerald-600" : "text-rose-600")}>
                              {isIngreso ? "+" : "-"}{formatSoles(m.monto)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
