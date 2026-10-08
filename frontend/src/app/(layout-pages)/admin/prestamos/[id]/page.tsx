"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Coins,
  DollarSign,
  User,
  CreditCard,
  Receipt,
  RefreshCw,
  TrendingUp,
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

interface Cuota {
  id: string;
  nroCuota: number;
  fechaVencimiento: string;
  capitalProgramado: number;
  interesProgramado: number;
  cuotaProgramada: number;
  capitalPagado: number;
  interesPagado: number;
  moraPagada: number;
  saldoCapital: number;
  saldoInteres: number;
  totalPendiente: number;
  estado: "PENDIENTE" | "PARCIAL" | "PAGADA" | "VENCIDA";
  fechaPago: string | null;
  updatedAt: string;
}

interface PrestamoDetalle {
  prestamo: {
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
  };
  cronograma: Cuota[];
}

interface PeriodoSimple {
  id: string;
  anio: number;
  mes: number;
  estado: "ABIERTO" | "CERRADO";
  fechaReunion: string;
}

export default function PrestamoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = React.useState<PrestamoDetalle | null>(null);
  const [periodos, setPeriodos] = React.useState<PeriodoSimple[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modal Cobranza
  const [cuotaACobrar, setCuotaACobrar] = React.useState<Cuota | null>(null);
  const [periodoCobroId, setPeriodoCobroId] = React.useState("");
  const [montoCapital, setMontoCapital] = React.useState("");
  const [montoInteres, setMontoInteres] = React.useState("");
  const [montoMora, setMontoMora] = React.useState("0.00");
  const [fechaPago, setFechaPago] = React.useState(new Date().toISOString().split("T")[0]);
  const [observacion, setObservacion] = React.useState("");
  const [cobrando, setCobrando] = React.useState(false);

  const cargarDetalle = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [resPrestamo, resPeriodos] = await Promise.all([
        fetch(`/api/prestamos/${id}`),
        fetch("/api/periodos"),
      ]);

      if (!resPrestamo.ok) {
        throw new Error("No se pudo cargar la información del crédito");
      }

      const pData = await resPrestamo.json();
      setData(pData);

      if (resPeriodos.ok) {
        const pers = await resPeriodos.json();
        setPeriodos(pers || []);
        const abierto = (pers || []).find((p: PeriodoSimple) => p.estado === "ABIERTO");
        if (abierto) {
          setPeriodoCobroId(abierto.id);
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Error al cargar préstamo");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const abrirModalCobro = (cuota: Cuota) => {
    setCuotaACobrar(cuota);
    setMontoCapital(cuota.saldoCapital.toFixed(2));
    setMontoInteres(cuota.saldoInteres.toFixed(2));
    setMontoMora("0.00");
    setFechaPago(new Date().toISOString().split("T")[0]);
    setObservacion("");
  };

  const handleConfirmarCobro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuotaACobrar || !periodoCobroId) {
      toast.error("Seleccione el periodo contable activo");
      return;
    }

    const c = parseFloat(montoCapital);
    const i = parseFloat(montoInteres);
    const m = parseFloat(montoMora) || 0;

    if (isNaN(c) || c < 0) {
      toast.error("Monto de capital inválido");
      return;
    }
    if (isNaN(i) || i < 0) {
      toast.error("Monto de interés inválido");
      return;
    }
    if (c + i + m <= 0) {
      toast.error("El monto total a cobrar debe ser mayor a S/. 0.00");
      return;
    }

    setCobrando(true);
    try {
      const res = await fetch(`/api/prestamos/${id}/cuotas/${cuotaACobrar.id}/pagar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodoId: periodoCobroId,
          fechaPago,
          montoCapital: c,
          montoInteres: i,
          montoMora: m,
          observacion: observacion || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al registrar el cobro de la cuota");
      }

      toast.success(`Cuota #${cuotaACobrar.nroCuota} cobrada con éxito. Se generó el ingreso en caja.`);
      setCuotaACobrar(null);
      cargarDetalle();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCobrando(false);
    }
  };

  const getBadgeEstadoCuota = (estado: Cuota["estado"]) => {
    switch (estado) {
      case "PAGADA":
        return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/30">Pagada</Badge>;
      case "PARCIAL":
        return <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-500/30">Parcial</Badge>;
      case "VENCIDA":
        return <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 border-rose-500/30">Vencida</Badge>;
      case "PENDIENTE":
        return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-500/30">Pendiente</Badge>;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando cronograma del préstamo...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/admin/prestamos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Préstamos
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No se encontró el préstamo solicitado
          </CardContent>
        </Card>
      </div>
    );
  }

  const { prestamo, cronograma } = data;

  const totalCapitalProgramado = cronograma.reduce((s, c) => s + Number(c.capitalProgramado), 0);
  const totalInteresProgramado = cronograma.reduce((s, c) => s + Number(c.interesProgramado), 0);
  const totalCuotaProgramada = totalCapitalProgramado + totalInteresProgramado;

  const totalCapitalPagado = cronograma.reduce((s, c) => s + Number(c.capitalPagado), 0);
  const totalInteresPagado = cronograma.reduce((s, c) => s + Number(c.interesPagado), 0);

  return (
    <div className="space-y-6">
      {/* Botón Volver y Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/prestamos">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Préstamo #{prestamo.numero}
              </h1>
              <Badge variant="outline" className="text-xs">
                {prestamo.estado}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Titular: <span className="font-semibold text-foreground">{prestamo.socioNombreCompleto}</span> ({prestamo.socioCodigo ? `Socio #${prestamo.socioCodigo}` : "Externo"})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={cargarDetalle}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero del Crédito */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Principal Otorgado</CardTitle>
            <Coins className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/. {Number(prestamo.montoPrincipal).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Desembolsado: {formatFecha(prestamo.fechaDesembolso)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Capital Deudor</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              S/. {Number(prestamo.saldoCapital).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Amortizado: S/. {Number(prestamo.capitalPagado).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intereses Cobrados</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              S/. {Number(prestamo.interesPagado).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasa: {(prestamo.tasaMensual * 100).toFixed(1)}% mensual sobre saldo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso de Cuotas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prestamo.cuotasPagadas} / {prestamo.nroCuotas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {prestamo.cuotasVencidas > 0 ? (
                <span className="text-rose-600 font-semibold">{prestamo.cuotasVencidas} cuota(s) vencida(s)</span>
              ) : (
                "Al día en pagos"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Propósito y Condiciones */}
      {prestamo.proposito && (
        <Card className="bg-muted/30">
          <CardContent className="py-3 px-4 text-sm flex items-center justify-between">
            <div>
              <span className="font-semibold text-foreground">Destino del Crédito: </span>
              <span className="text-muted-foreground">{prestamo.proposito}</span>
            </div>
            <Badge variant="outline">
              Método: {prestamo.metodoAmortizacion}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Tabla Oficial del Cronograma de Pagos */}
      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Cronograma Oficial de Pagos</CardTitle>
              <CardDescription>
                Detalle mensual de amortización, cobros aplicados y saldos pendientes
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground">
              Total Cuotas: {cronograma.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 text-center">Cuota</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead className="text-right">Capital Prog.</TableHead>
                  <TableHead className="text-right">Interés Prog.</TableHead>
                  <TableHead className="text-right">Total Cuota</TableHead>
                  <TableHead className="text-right">Capital Pagado</TableHead>
                  <TableHead className="text-right">Interés Pagado</TableHead>
                  <TableHead className="text-right">Saldo Deuda</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Fecha Pago</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cronograma.map((c) => {
                  const pagada = c.estado === "PAGADA";
                  return (
                    <TableRow key={c.id} className={cn(pagada && "bg-muted/10")}>
                      <TableCell className="text-center font-bold text-foreground">
                        #{c.nroCuota}
                      </TableCell>
                      <TableCell className="font-medium font-mono text-xs">
                        {formatFecha(c.fechaVencimiento)}
                      </TableCell>
                      <TableCell className="text-right">
                        S/. {Number(c.capitalProgramado).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600">
                        S/. {Number(c.interesProgramado).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        S/. {Number(c.cuotaProgramada).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600 font-medium">
                        S/. {Number(c.capitalPagado).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        S/. {Number(c.interesPagado).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-rose-600">
                        S/. {Number(c.totalPendiente).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getBadgeEstadoCuota(c.estado)}
                      </TableCell>
                      <TableCell className="text-center text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {formatFecha(c.fechaPago)}
                      </TableCell>
                      <TableCell className="text-right">
                        {!pagada && prestamo.estado === "VIGENTE" && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => abrirModalCobro(c)}
                          >
                            <Receipt className="h-3.5 w-3.5 mr-1" />
                            Cobrar
                          </Button>
                        )}
                        {pagada && (
                          <span className="text-xs text-emerald-600 flex items-center justify-end font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Al día
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Resumen Total al Pie del Cronograma */}
        <div className="p-4 bg-muted/20 border-t flex flex-wrap items-center justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Total Capital Programado: </span>
            <span className="font-bold">S/. {totalCapitalProgramado.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Interés Programado: </span>
            <span className="font-bold text-emerald-600">S/. {totalInteresProgramado.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Crédito: </span>
            <span className="font-bold text-primary">S/. {totalCuotaProgramada.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Recaudación Real: </span>
            <span className="font-bold text-blue-600">S/. {(totalCapitalPagado + totalInteresPagado).toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Modal Cobrar Cuota */}
      <Dialog open={!!cuotaACobrar} onOpenChange={() => setCuotaACobrar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Cobro de Cuota #{cuotaACobrar?.nroCuota} (Préstamo #{prestamo.numero})
            </DialogTitle>
            <DialogDescription>
              El pago se registrará de forma atómica en el Libro de Caja del periodo seleccionado con los conceptos de Pago Capital e Interés Recibido.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmarCobro} className="space-y-4">
            <div className="p-3 bg-muted/40 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Titular:</span>
                <span className="font-semibold">{prestamo.socioNombreCompleto}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vencimiento:</span>
                <span className="font-mono font-medium">{formatFecha(cuotaACobrar?.fechaVencimiento)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo Pendiente Cuota:</span>
                <span className="font-bold text-rose-600">
                  S/. {cuotaACobrar?.totalPendiente?.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodoCobro">Periodo Contable de Imputación *</Label>
              <Select value={periodoCobroId} onValueChange={setPeriodoCobroId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione periodo abierto..." />
                </SelectTrigger>
                <SelectContent>
                  {periodos
                    .filter((p) => p.estado === "ABIERTO")
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.mes < 10 ? `0${p.mes}` : p.mes}/{p.anio} (Asamblea: {formatFecha(p.fechaReunion)}) - Abierto
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="montoCapital">Amortización Capital (S/.) *</Label>
                <Input
                  id="montoCapital"
                  type="number"
                  step="0.01"
                  min="0"
                  max={cuotaACobrar?.saldoCapital}
                  value={montoCapital}
                  onChange={(e) => setMontoCapital(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="montoInteres">Interés Recibido (S/.) *</Label>
                <Input
                  id="montoInteres"
                  type="number"
                  step="0.01"
                  min="0"
                  max={cuotaACobrar?.saldoInteres}
                  value={montoInteres}
                  onChange={(e) => setMontoInteres(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="montoMora">Mora / Recargo (S/.)</Label>
                <Input
                  id="montoMora"
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoMora}
                  onChange={(e) => setMontoMora(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaPago">Fecha de Pago</Label>
                <Input
                  id="fechaPago"
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacion">Observación / Recibo Físico</Label>
              <Input
                id="observacion"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Ej: Pago en asamblea mensual"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCuotaACobrar(null)}
                disabled={cobrando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={cobrando}
              >
                {cobrando ? "Registrando Cobro..." : "Confirmar Cobro"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
