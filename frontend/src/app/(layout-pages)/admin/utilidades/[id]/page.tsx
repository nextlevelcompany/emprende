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
  TrendingUp,
  RefreshCw,
  Send,
  ShieldCheck,
  FileText,
  User,
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
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DetalleDistribucion {
  socioId: string;
  socioCodigo: number | null;
  socioNombreCompleto: string;
  socioDocumento: string;
  acciones: number;
  porcentajeParticipacion: number;
  monto: number;
  operacionId: string | null;
}

interface Distribucion {
  id: string;
  cajaId: string;
  ejercicio: number;
  fechaCorte: string;
  utilidadTotal: number;
  totalAcciones: number;
  valorPorAccion: number;
  estado: "BORRADOR" | "APROBADA" | "PAGADA";
  detalles: DetalleDistribucion[];
  createdAt: string;
  updatedAt: string;
}

interface PeriodoSimple {
  id: string;
  anio: number;
  mes: number;
  estado: "ABIERTO" | "CERRADO";
  fechaReunion: string;
}

export default function DistribucionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [dist, setDist] = React.useState<Distribucion | null>(null);
  const [periodos, setPeriodos] = React.useState<PeriodoSimple[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modales
  const [modalPagar, setModalPagar] = React.useState(false);
  const [pagoPeriodoId, setPagoPeriodoId] = React.useState("");
  const [pagoFecha, setPagoFecha] = React.useState(new Date().toISOString().split("T")[0]);
  const [procesando, setProcesando] = React.useState(false);

  const cargarDatos = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [resDist, resPeriodos] = await Promise.all([
        fetch(`/api/utilidades/${id}`),
        fetch("/api/periodos"),
      ]);

      if (!resDist.ok) {
        throw new Error("No se pudo cargar la distribución solicitada");
      }

      setDist(await resDist.json());

      if (resPeriodos.ok) {
        const pers = await resPeriodos.json();
        setPeriodos(pers || []);
        const abierto = (pers || []).find((p: PeriodoSimple) => p.estado === "ABIERTO");
        if (abierto) {
          setPagoPeriodoId(abierto.id);
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleAprobar = async () => {
    if (!dist) return;
    setProcesando(true);
    try {
      const res = await fetch(`/api/utilidades/${dist.id}/aprobar`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al aprobar distribución");
      }
      toast.success("Distribución ratificada y aprobada oficialmente");
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleConfirmarPago = async () => {
    if (!dist || !pagoPeriodoId) {
      toast.error("Seleccione el periodo contable activo");
      return;
    }

    setProcesando(true);
    try {
      const res = await fetch(`/api/utilidades/${dist.id}/pagar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodoId: pagoPeriodoId,
          fechaPago: pagoFecha,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al registrar el pago de utilidades");
      }

      toast.success("Utilidades pagadas y asentadas en el Libro de Caja");
      setModalPagar(false);
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setProcesando(false);
    }
  };

  const getBadgeEstado = (estado: Distribucion["estado"]) => {
    switch (estado) {
      case "PAGADA":
        return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/30">Pagada</Badge>;
      case "APROBADA":
        return <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-500/30">Aprobada</Badge>;
      case "BORRADOR":
        return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-500/30">Borrador</Badge>;
    }
  };

  if (loading && !dist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando distribución de utilidades...</p>
      </div>
    );
  }

  if (!dist) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/admin/utilidades")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Distribuciones
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No se encontró la distribución solicitada
          </CardContent>
        </Card>
      </div>
    );
  }

  const sumaRepartida = dist.detalles.reduce((acc, d) => acc + Number(d.monto), 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/utilidades">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Liquidación de Utilidades Ejercicio {dist.ejercicio}
              </h1>
              {getBadgeEstado(dist.estado)}
            </div>
            <p className="text-sm text-muted-foreground">
              Fecha de Corte: {dist.fechaCorte} • Padrón de {dist.detalles.length} socios participantes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dist.estado === "BORRADOR" && (
            <Button
              variant="default"
              size="sm"
              onClick={handleAprobar}
              disabled={procesando}
            >
              <ShieldCheck className="h-4 w-4 mr-1" />
              Aprobar Oficialmente
            </Button>
          )}
          {dist.estado === "APROBADA" && (
            <Button
              variant="default"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setModalPagar(true)}
              disabled={procesando}
            >
              <Send className="h-4 w-4 mr-1" />
              Liquidar y Pagar en Caja
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={cargarDatos}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero del Reparto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilidad Total Aprobada</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              S/. {Number(dist.utilidadTotal).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Repartición de excedentes del ejercicio {dist.ejercicio}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Acciones</CardTitle>
            <Coins className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dist.totalAcciones}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Acciones con derecho a dividendos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dividendo por Acción</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              S/. {Number(dist.valorPorAccion).toFixed(6)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cómputo a 6 decimales de precisión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuadratura Contable</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              S/. {sumaRepartida.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {sumaRepartida === Number(dist.utilidadTotal) ? "100% Exacto al centavo" : "Ajustado"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Oficial de Liquidación por Socio */}
      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Padrón de Liquidación de Dividendos</CardTitle>
              <CardDescription>
                Desglose individual por socio titular con porcentaje de participación y comprobante
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground">
              Total Beneficiarios: {dist.detalles.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Código</TableHead>
                  <TableHead>Socio Titular</TableHead>
                  <TableHead className="text-center">N° Acciones</TableHead>
                  <TableHead className="text-center">% Participación</TableHead>
                  <TableHead className="text-right">Dividendo a Cobrar</TableHead>
                  <TableHead className="text-center">Estado de Pago</TableHead>
                  <TableHead className="text-right">Comprobante de Caja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dist.detalles.map((d) => {
                  const pagado = !!d.operacionId || dist.estado === "PAGADA";
                  return (
                    <TableRow key={d.socioId}>
                      <TableCell className="font-semibold text-primary">
                        #{d.socioCodigo}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{d.socioNombreCompleto}</div>
                        <div className="text-xs text-muted-foreground">{d.socioDocumento}</div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {d.acciones} acciones
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{d.porcentajeParticipacion}%</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        S/. {Number(d.monto).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        {pagado ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                            Liquidado
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {d.operacionId ? (
                          <span className="text-primary font-medium">Op #{d.operacionId.substring(0, 8)}...</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Resumen Total */}
        <div className="p-4 bg-muted/20 border-t flex flex-wrap items-center justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Total Acciones Emitidas: </span>
            <span className="font-bold">{dist.totalAcciones}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Dividendo Promedio por Socio: </span>
            <span className="font-bold">
              S/. {(Number(dist.utilidadTotal) / (dist.detalles.length || 1)).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Liquidado: </span>
            <span className="font-bold text-emerald-600">
              S/. {sumaRepartida.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* Modal: Pagar en Caja */}
      <Dialog open={modalPagar} onOpenChange={setModalPagar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-600" />
              Liquidar y Pagar en Caja Ejercicio {dist.ejercicio}
            </DialogTitle>
            <DialogDescription>
              Se generará una transacción de egreso contable en el libro de caja para cada uno de los {dist.detalles.length} socios bajo el concepto de Utilidad Distribuida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/40 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto Total a Desembolsar:</span>
                <span className="font-bold text-emerald-600">
                  S/. {Number(dist.utilidadTotal).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Socios a Liquidar:</span>
                <span>{dist.detalles.length} pagos</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodoPagoModal">Periodo Contable de Imputación *</Label>
              <Select value={pagoPeriodoId} onValueChange={setPagoPeriodoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione periodo abierto..." />
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
              <Label htmlFor="fechaPagoModal">Fecha del Pago</Label>
              <Input
                id="fechaPagoModal"
                type="date"
                value={pagoFecha}
                onChange={(e) => setPagoFecha(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalPagar(false)}
              disabled={procesando}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmarPago}
              disabled={procesando}
            >
              {procesando ? "Generando Egresos de Caja..." : "Confirmar y Liquidar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
