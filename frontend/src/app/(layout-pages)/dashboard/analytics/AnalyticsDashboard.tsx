"use client";
import { getErrorMessage } from "@/lib/error-message";

import * as React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Coins,
  Users,
  RefreshCw,
  FileText,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardData {
  kpis: {
    saldoCajaActual: number;
    totalIngresosHistorico: number;
    totalEgresosHistorico: number;
    totalInteresesCobrados: number;
    sociosActivos: number;
    totalAcciones: number;
    capitalSocialTotal: number;
    carteraColocada: number;
    carteraSaldoPendiente: number;
    utilidadUltimoEjercicio: number;
    dividendoPorAccionUltimo: number;
  };
  evolucionMensual: Array<{
    periodoId: string;
    anio: number;
    mes: number;
    etiqueta: string;
    estado: string;
    ingresos: number;
    egresos: number;
    saldoAnterior: number;
    saldoFinal: number;
    intereses: number;
    prestamos: number;
    pagosCapital: number;
    acciones: number;
    utilidadDistribuida: number;
  }>;
  conceptosIngreso: Array<{
    codigo: string;
    nombre: string;
    total: number;
  }>;
  conceptosEgreso: Array<{
    codigo: string;
    nombre: string;
    total: number;
  }>;
  cartera: {
    totalPrestamos: number;
    vigentes: number;
    cancelados: number;
    montoTotalColocado: number;
    montoTotalRecuperado: number;
    montoSaldoPendiente: number;
    porcentajeRecuperacion: number;
  };
}

const chartConfigEvolucion = {
  ingresos: {
    label: "Ingresos",
    color: "hsl(142, 71%, 45%)",
  },
  egresos: {
    label: "Egresos",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig;

export default function AnalyticsDashboard() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard/metrics");
      if (!res.ok) {
        throw new Error("Error al obtener indicadores del dashboard");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error al cargar datos"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const formatSoles = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "S/. 0.00";
    return `S/. ${val.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando métricas financieras de la Caja Comunal...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive font-medium">No se pudieron cargar los datos del dashboard.</p>
        <Button variant="outline" className="mt-4" onClick={loadData}>
          Reintentar
        </Button>
      </div>
    );
  }

  const { kpis, evolucionMensual, conceptosIngreso, conceptosEgreso, cartera } = data;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Panel Financiero & Analítica</h1>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-600 border-emerald-500">
              Datos Oficiales en Vivo
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
             Caja Comunal &quot;Emprende Chambala&quot; - Balance consolidado de ejercicios 2024 y 2025.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Actualizar
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href="/admin/reportes">
              <FileText className="h-4 w-4" />
              Reportes de Asamblea
            </Link>
          </Button>
        </div>
      </div>

      {/* 6 Tarjetas KPI Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Saldo en Caja */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium flex items-center justify-between">
              <span>Saldo en Caja</span>
              <Wallet className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-xl font-bold">
              {formatSoles(kpis.saldoCajaActual)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              Periodo Abierto Activo
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Ingresos Históricos */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium flex items-center justify-between">
              <span>Total Ingresos</span>
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-xl font-bold text-emerald-600">
              {formatSoles(kpis.totalIngresosHistorico)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              Aportes, cuotas e intereses
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Egresos Históricos */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium flex items-center justify-between">
              <span>Total Egresos</span>
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </CardDescription>
            <CardTitle className="text-xl font-bold text-destructive">
              {formatSoles(kpis.totalEgresosHistorico)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              Créditos colocados y dividendos
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Intereses Ganados */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium flex items-center justify-between">
              <span>Intereses Cobrados</span>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardDescription>
            <CardTitle className="text-xl font-bold text-blue-600">
              {formatSoles(kpis.totalInteresesCobrados)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              Rendimiento financiero
            </p>
          </CardContent>
        </Card>

        {/* KPI 5: Capital Social */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium flex items-center justify-between">
              <span>Capital Social</span>
              <Coins className="h-4 w-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-xl font-bold text-amber-600">
              {formatSoles(kpis.capitalSocialTotal)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              {kpis.totalAcciones} acciones (S/. 30.00 c/u)
            </p>
          </CardContent>
        </Card>

        {/* KPI 6: Socios Activos */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium flex items-center justify-between">
              <span>Socios Activos</span>
              <Users className="h-4 w-4 text-purple-500" />
            </CardDescription>
            <CardTitle className="text-xl font-bold text-purple-600">
              {kpis.sociosActivos}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              Padrón habilitado 100%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Principal: Evolución Mensual (Ingresos vs Egresos) */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                Evolución Histórica de Flujo de Caja (2024 - 2025)
              </CardTitle>
              <CardDescription>
                Comparativa mensual de Ingresos totales vs. Egresos ejecutados por asamblea.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                Ingresos
              </span>
              <span className="flex items-center gap-1 text-rose-600">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
                Egresos
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full pt-4">
            <ChartContainer config={chartConfigEvolucion} className="h-full w-full">
              <AreaChart data={evolucionMensual} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="etiqueta"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                  tickFormatter={(val) => `S/. ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIngresos)"
                />
                <Area
                  type="monotone"
                  dataKey="egresos"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEgresos)"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Fila con Desglose de Conceptos & Tarjetas de Cartera y Utilidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desglose de Fuentes de Ingreso */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Composición de Ingresos</CardTitle>
            <CardDescription>Principales conceptos generadores de liquidez comunal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conceptosIngreso.map((c) => {
                const totalIng = kpis.totalIngresosHistorico || 1;
                const pct = ((c.total / totalIng) * 100).toFixed(1);
                return (
                  <div key={c.codigo} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{c.nombre}</span>
                      <span className="font-mono text-muted-foreground">
                        {formatSoles(c.total)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(2, Number(pct)))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Desglose de Destinos de Egreso */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Composición de Egresos</CardTitle>
            <CardDescription>Destino de colocación de fondos y retornos comunales.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conceptosEgreso.map((c) => {
                const totalEg = kpis.totalEgresosHistorico || 1;
                const pct = ((c.total / totalEg) * 100).toFixed(1);
                return (
                  <div key={c.codigo} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{c.nombre}</span>
                      <span className="font-mono text-muted-foreground">
                        {formatSoles(c.total)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(2, Number(pct)))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fila de Tarjetas Gerenciales: Cartera & Dividendos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cartera de Préstamos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Gestión de Cartera Crediticia</span>
              <Badge variant="outline" className="border-primary text-primary">
                Tasa Mensual: 5.0%
              </Badge>
            </CardTitle>
            <CardDescription>
              Seguimiento de amortización de préstamos a socios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg text-center">
              <div>
                <span className="text-[11px] text-muted-foreground block">Colocado Histórico</span>
                <span className="text-base font-bold text-foreground font-mono">
                  {formatSoles(cartera.montoTotalColocado)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Capital Recuperado</span>
                <span className="text-base font-bold text-emerald-600 font-mono">
                  {formatSoles(cartera.montoTotalRecuperado)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Saldo Pendiente</span>
                <span className="text-base font-bold text-amber-600 font-mono">
                  {formatSoles(cartera.montoSaldoPendiente)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tasa de Recuperación Efectiva</span>
                <span className="font-semibold text-foreground">{cartera.porcentajeRecuperacion}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, cartera.porcentajeRecuperacion)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {cartera.vigentes} créditos vigentes | {cartera.cancelados} cancelados
              </span>
              <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                <Link href="/admin/prestamos">Administrar Créditos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Distribución Anual de Dividendos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Distribución de Utilidades Anuales</span>
              <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50">
                Ejercicio 2024 Liquidado
              </Badge>
            </CardTitle>
            <CardDescription>
              Retorno patrimonial por acción para los socios de la caja.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg text-center">
              <div>
                <span className="text-[11px] text-muted-foreground block">Utilidad 2024 Distribuida</span>
                <span className="text-base font-bold text-foreground font-mono">
                  {formatSoles(kpis.utilidadUltimoEjercicio)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Dividendo por Acción</span>
                <span className="text-base font-bold text-emerald-600 font-mono">
                  S/. {kpis.dividendoPorAccionUltimo.toFixed(6)}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Las utilidades se liquidaron automáticamente en el periodo activo Octubre 2025 mediante 29 egresos de caja con trazabilidad completa de recibos y cuadratura exacta al centavo.
            </p>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                290 acciones liquidadas al 100%
              </span>
              <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                <Link href="/admin/utilidades">Ver Distribución</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Resumen de Periodos Contables */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Historial Consolidado por Periodo Contable</span>
            <span className="text-xs font-normal text-muted-foreground">
              Total: {evolucionMensual.length} periodos registrados
            </span>
          </CardTitle>
          <CardDescription>
            Saldos iniciales, flujos mensuales de efectivo y balances acumulados de cierre.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Saldo Anterior</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Egresos</TableHead>
                  <TableHead className="text-right">Saldo Final</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evolucionMensual.map((p) => {
                  const isAbierto = p.estado === "ABIERTO";
                  return (
                    <TableRow key={p.periodoId} className={cn(isAbierto && "bg-primary/5 font-medium")}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {p.etiqueta}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isAbierto ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {p.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatSoles(p.saldoAnterior)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-emerald-600 font-semibold">
                        +{formatSoles(p.ingresos)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-rose-600 font-semibold">
                        -{formatSoles(p.egresos)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">
                        {formatSoles(p.saldoFinal)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                          <Link href={`/admin/periodos/${p.periodoId}`}>Detalle</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
