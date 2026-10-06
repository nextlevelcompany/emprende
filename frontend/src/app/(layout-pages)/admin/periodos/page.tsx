"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  Lock,
  Unlock,
  FileSpreadsheet,
  RotateCcw,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  AlertTriangle,
  Clock,
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

interface Periodo {
  id: string;
  anio: number;
  mes: number;
  fechaReunion: string;
  estado: "ABIERTO" | "CERRADO";
  cerradoAt: string | null;
  cerradoPor: string | null;
  saldoAnterior: number;
  totalIngresos: number;
  totalEgresos: number;
  saldoFinal: number;
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

export default function PeriodosPage() {
  const [periodos, setPeriodos] = React.useState<Periodo[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modales
  const [modalCrear, setModalCrear] = React.useState(false);
  const [modalReabrir, setModalReabrir] = React.useState<Periodo | null>(null);

  // Forms
  const now = new Date();
  const [formCrear, setFormCrear] = React.useState({
    anio: now.getFullYear(),
    mes: now.getMonth() + 1,
    fechaReunion: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-08`,
  });

  const [motivoReapertura, setMotivoReapertura] = React.useState("");
  const [procesando, setProcesando] = React.useState(false);

  const cargarPeriodos = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/periodos");
      if (!res.ok) throw new Error("Error al obtener periodos");
      const data = await res.json();
      setPeriodos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarPeriodos();
  }, [cargarPeriodos]);

  const handleMesChange = (mesStr: string) => {
    const mes = parseInt(mesStr);
    setFormCrear((prev) => ({
      ...prev,
      mes,
      fechaReunion: `${prev.anio}-${String(mes).padStart(2, "0")}-08`,
    }));
  };

  const handleAnioChange = (anioStr: string) => {
    const anio = parseInt(anioStr);
    if (isNaN(anio)) return;
    setFormCrear((prev) => ({
      ...prev,
      anio,
      fechaReunion: `${anio}-${String(prev.mes).padStart(2, "0")}-08`,
    }));
  };

  const handleCrearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProcesando(true);
      const res = await fetch("/api/periodos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formCrear),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || "Error al aperturar periodo");
      toast.success(`Periodo ${MESES[data.mes - 1]} ${data.anio} aperturado con éxito`);
      setModalCrear(false);
      cargarPeriodos();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleReabrirSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalReabrir) return;
    if (!motivoReapertura.trim()) {
      toast.error("Debe ingresar una justificación escrita para la auditoría");
      return;
    }
    try {
      setProcesando(true);
      const res = await fetch(`/api/periodos/${modalReabrir.id}/reabrir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: motivoReapertura }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || "Error al reabrir periodo");
      toast.success(`Periodo ${MESES[modalReabrir.mes - 1]} ${modalReabrir.anio} reabierto.`);
      setModalReabrir(null);
      setMotivoReapertura("");
      cargarPeriodos();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const periodoAbierto = periodos.find((p) => p.estado === "ABIERTO");

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Periodos Contables Mensuales
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Libro de caja por hojas mensuales &bull; Arqueo físico, inmutabilidad tras cierre y firma SHA-256
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => cargarPeriodos()}
            disabled={loading}
            title="Refrescar"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button onClick={() => setModalCrear(true)} className="gap-2">
            <CalendarPlus className="h-4 w-4" />
            Aperturar Nuevo Mes
          </Button>
        </div>
      </div>

      {/* Tarjeta de Periodo Abierto Actual */}
      {periodoAbierto ? (
        <Card className="border-primary/30 shadow-md overflow-hidden bg-card">
          <CardHeader className="bg-primary/5 border-b pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold text-[11px]">
                    Periodo Activo en Curso
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">
                  {MESES[periodoAbierto.mes - 1]} {periodoAbierto.anio}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Reunión mensual programada: {periodoAbierto.fechaReunion} (Día fijo 8)
                </CardDescription>
              </div>

              <Button asChild size="default" className="gap-2">
                <Link href={`/admin/periodos/${periodoAbierto.id}/planilla`}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Abrir Planilla Excel
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground">Saldo Inicial Mes</p>
                <p className="text-xl font-bold mt-1 text-foreground">
                  S/. {Number(periodoAbierto.saldoAnterior).toFixed(2)}
                </p>
              </div>

              <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Ingresos del Mes
                </p>
                <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  + S/. {Number(periodoAbierto.totalIngresos).toFixed(2)}
                </p>
              </div>

              <div className="p-4 rounded-xl border bg-destructive/5 border-destructive/20">
                <p className="text-xs font-medium text-destructive flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5" /> Egresos del Mes
                </p>
                <p className="text-xl font-bold mt-1 text-destructive">
                  - S/. {Number(periodoAbierto.totalEgresos).toFixed(2)}
                </p>
              </div>

              <div className="p-4 rounded-xl border bg-primary/5 border-primary/20">
                <p className="text-xs font-medium text-primary flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" /> Saldo Proyectado
                </p>
                <p className="text-xl font-bold mt-1 text-primary">
                  S/. {Number(periodoAbierto.saldoFinal).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">No hay periodos abiertos</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Para registrar operaciones mensuales y recibos, aperture un nuevo periodo contable.
                </p>
              </div>
            </div>
            <Button onClick={() => setModalCrear(true)} className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              Aperturar Mes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Historial de Todos los Periodos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b py-4">
          <div>
            <CardTitle className="text-lg">Historial de Meses Contables</CardTitle>
            <CardDescription>
              Registro histórico y estados de cierre mensual
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {periodos.length} periodos registrados
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periodo</TableHead>
                <TableHead>Fecha Reunión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Saldo Inicial</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Egresos</TableHead>
                <TableHead className="text-right">Saldo Final</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Cargando periodos contables...
                  </TableCell>
                </TableRow>
              ) : periodos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No hay ningún periodo registrado en la caja.
                  </TableCell>
                </TableRow>
              ) : (
                periodos.map((p) => {
                  const abierto = p.estado === "ABIERTO";
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {MESES[p.mes - 1]} {p.anio}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.fechaReunion}
                      </TableCell>
                      <TableCell>
                        {abierto ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1">
                            <Unlock className="h-3 w-3" /> Abierto
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="h-3 w-3" /> Cerrado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        S/. {Number(p.saldoAnterior).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                        +S/. {Number(p.totalIngresos).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-destructive">
                        -S/. {Number(p.totalEgresos).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        S/. {Number(p.saldoFinal).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                          >
                            <Link href={`/admin/periodos/${p.id}/planilla`}>
                              <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                              Ver Planilla
                            </Link>
                          </Button>
                          {!abierto && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setModalReabrir(p);
                                setMotivoReapertura("");
                              }}
                              className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                              title="Reabrir periodo con auditoría"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reabrir
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG: Aperturar Nuevo Periodo */}
      <Dialog open={modalCrear} onOpenChange={setModalCrear}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-primary" />
              Aperturar Periodo Contable
            </DialogTitle>
            <DialogDescription>
              Inicia una nueva hoja mensual en el libro contable. El saldo inicial se transferirá automáticamente del cierre anterior.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrearSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Año *</Label>
                <Input
                  type="number"
                  required
                  value={formCrear.anio}
                  onChange={(e) => handleAnioChange(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Mes *</Label>
                <Select
                  value={String(formCrear.mes)}
                  onValueChange={handleMesChange}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m, idx) => (
                      <SelectItem key={idx + 1} value={String(idx + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Fecha de Reunión Asamblea (Día fijo 8) *</Label>
              <Input
                type="date"
                required
                value={formCrear.fechaReunion}
                onChange={(e) => setFormCrear({ ...formCrear, fechaReunion: e.target.value })}
                className="h-9"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalCrear(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={procesando}>
                {procesando ? "Aperturando..." : "Aperturar Periodo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Reabrir Periodo */}
      <Dialog open={!!modalReabrir} onOpenChange={(open) => !open && setModalReabrir(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <RotateCcw className="h-5 w-5" />
              Reabrir Periodo Contable
            </DialogTitle>
            <DialogDescription>
              Esta acción desbloqueará el periodo{" "}
              <strong>
                {modalReabrir ? `${MESES[modalReabrir.mes - 1]} ${modalReabrir.anio}` : ""}
              </strong>
              . Se registrará un evento de auditoría con la justificación ingresada.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReabrirSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Motivo de Reapertura (Justificación obligatoria) *</Label>
              <Textarea
                rows={3}
                required
                value={motivoReapertura}
                onChange={(e) => setMotivoReapertura(e.target.value)}
                placeholder="Ej. Rectificación de recibo #12 solicitado por el tesorero..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalReabrir(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={procesando}>
                {procesando ? "Reabriendo..." : "Confirmar Reapertura"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
