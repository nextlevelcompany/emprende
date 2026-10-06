"use client";

import * as React from "react";
import Link from "next/link";
import {
  PieChart,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Coins,
  DollarSign,
  Send,
  RefreshCw,
  Calculator,
  ShieldCheck,
  FileText,
  Users,
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

interface ResumenEjercicio {
  ejercicio: number;
  totalIngresos: number;
  totalEgresos: number;
  utilidadNetaCaja: number;
  totalSociosActivos: number;
  totalAccionesEstimadas: number;
  valorAccionNominal: number;
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

export default function UtilidadesPage() {
  const [distribuciones, setDistribuciones] = React.useState<Distribucion[]>([]);
  const [resumen, setResumen] = React.useState<ResumenEjercicio | null>(null);
  const [socios, setSocios] = React.useState<SocioSimple[]>([]);
  const [periodos, setPeriodos] = React.useState<PeriodoSimple[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modales
  const [modalNuevo, setModalNuevo] = React.useState(false);
  const [modalPagar, setModalPagar] = React.useState<Distribucion | null>(null);
  const [modalAprobar, setModalAprobar] = React.useState<Distribucion | null>(null);

  // Formulario Nueva Distribución
  const [formEjercicio, setFormEjercicio] = React.useState("2024");
  const [formFechaCorte, setFormFechaCorte] = React.useState("2024-12-31");
  const [formUtilidad, setFormUtilidad] = React.useState("6156.73");
  const [accionesPorSocio, setAccionesPorSocio] = React.useState<Record<string, number>>({});
  const [simulacion, setSimulacion] = React.useState<Distribucion | null>(null);
  const [simulando, setSimulando] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);

  // Formulario Pago
  const [pagoPeriodoId, setPagoPeriodoId] = React.useState("");
  const [pagoFecha, setPagoFecha] = React.useState(new Date().toISOString().split("T")[0]);
  const [pagando, setPagando] = React.useState(false);

  const cargarDatos = React.useCallback(async () => {
    setLoading(true);
    try {
      const [resDist, resResumen, resSocios, resPeriodos] = await Promise.all([
        fetch("/api/utilidades"),
        fetch("/api/utilidades/resumen/2024"),
        fetch("/api/socios/activos"),
        fetch("/api/periodos"),
      ]);

      if (resDist.ok) {
        setDistribuciones(await resDist.json());
      }
      if (resResumen.ok) {
        setResumen(await resResumen.json());
      }
      if (resSocios.ok) {
        const sList: SocioSimple[] = await resSocios.json();
        setSocios(sList);

        // Inicializar acciones (ej. 10 acciones por defecto a S/. 30 = S/. 300)
        const initAcc: Record<string, number> = {};
        sList.forEach((s) => {
          initAcc[s.id] = 10;
        });
        setAccionesPorSocio(initAcc);
      }
      if (resPeriodos.ok) {
        const pers = await resPeriodos.json();
        setPeriodos(pers || []);
        const abierto = (pers || []).find((p: PeriodoSimple) => p.estado === "ABIERTO");
        if (abierto) {
          setPagoPeriodoId(abierto.id);
        }
      }
    } catch {
      toast.error("Error al cargar datos de utilidades");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleSimular = async () => {
    const u = parseFloat(formUtilidad);
    if (isNaN(u) || u <= 0) {
      toast.error("Ingrese una utilidad total válida mayor a 0");
      return;
    }

    const sociosManuales = Object.entries(accionesPorSocio).map(([socioId, acciones]) => ({
      socioId,
      acciones: Number(acciones) || 0,
    }));

    setSimulando(true);
    try {
      const res = await fetch("/api/utilidades/simular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ejercicio: parseInt(formEjercicio),
          fechaCorte: formFechaCorte,
          utilidadTotal: u,
          sociosManuales,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al simular distribución");
      }

      const data = await res.json();
      setSimulacion(data);
      toast.success("Simulación de reparto calculada exitosamente");
    } catch (e: any) {
      toast.error(e.message || "Error al simular");
    } finally {
      setSimulando(false);
    }
  };

  const handleGuardarBorrador = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = parseFloat(formUtilidad);
    if (isNaN(u) || u <= 0) {
      toast.error("Ingrese una utilidad total válida");
      return;
    }

    const sociosPayload = Object.entries(accionesPorSocio).map(([socioId, acciones]) => ({
      socioId,
      acciones: Number(acciones) || 0,
    }));

    setGuardando(true);
    try {
      const res = await fetch("/api/utilidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ejercicio: parseInt(formEjercicio),
          fechaCorte: formFechaCorte,
          utilidadTotal: u,
          socios: sociosPayload,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo guardar la distribución");
      }

      toast.success("Borrador de distribución guardado correctamente");
      setModalNuevo(false);
      setSimulacion(null);
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message || "Error al guardar distribución");
    } finally {
      setGuardando(false);
    }
  };

  const handleConfirmarAprobacion = async () => {
    if (!modalAprobar) return;
    try {
      const res = await fetch(`/api/utilidades/${modalAprobar.id}/aprobar`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al aprobar distribución");
      }
      toast.success(`Distribución del ejercicio ${modalAprobar.ejercicio} aprobada`);
      setModalAprobar(null);
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleConfirmarPago = async () => {
    if (!modalPagar || !pagoPeriodoId) {
      toast.error("Seleccione el periodo contable activo");
      return;
    }

    setPagando(true);
    try {
      const res = await fetch(`/api/utilidades/${modalPagar.id}/pagar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodoId: pagoPeriodoId,
          fechaPago: pagoFecha,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al procesar el pago de utilidades");
      }

      toast.success(`Utilidades del ejercicio ${modalPagar.ejercicio} pagadas. Se generaron los egresos contables.`);
      setModalPagar(null);
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPagando(false);
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

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Distribución Anual de Utilidades y Dividendos
          </h1>
          <p className="text-sm text-muted-foreground">
            Reparto proporcional por acciones patrimoniales con cuadratura exacta al centavo.
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
            Nueva Distribución
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas de Ejercicio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilidad Ejercicio 2024</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              S/. {(resumen?.utilidadNetaCaja ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ingresos: S/. {(resumen?.totalIngresos ?? 0).toFixed(2)} | Egresos: S/. {(resumen?.totalEgresos ?? 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Socios Activos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resumen?.totalSociosActivos ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Padrón con derecho a dividendos anuales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Nominal Acción</CardTitle>
            <Coins className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/. 30.00
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Definido en el estatuto comunal de Chambala
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ejercicios Registrados</CardTitle>
            <PieChart className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {distribuciones.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {distribuciones.filter((d) => d.estado === "PAGADA").length} liquidado(s) formalmente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Oficial de Distribuciones */}
      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Historial de Distribuciones de Utilidad</CardTitle>
              <CardDescription>
                Acuerdos anuales de asamblea, cómputo de dividendos y registros de liquidación en caja
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground">
              Total: {distribuciones.length} ejercicio(s)
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Ejercicio</TableHead>
                  <TableHead>Fecha Corte</TableHead>
                  <TableHead className="text-right">Utilidad Aprobada</TableHead>
                  <TableHead className="text-center">Total Acciones</TableHead>
                  <TableHead className="text-right">Dividendo / Acción</TableHead>
                  <TableHead className="text-center">Beneficiarios</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando distribuciones de utilidad...
                    </TableCell>
                  </TableRow>
                ) : distribuciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay distribuciones registradas aún. Haga clic en &quot;Nueva Distribución&quot; para crear el ejercicio 2024.
                    </TableCell>
                  </TableRow>
                ) : (
                  distribuciones.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-bold text-primary">
                        {d.ejercicio}
                      </TableCell>
                      <TableCell>{d.fechaCorte}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        S/. {Number(d.utilidadTotal).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {d.totalAcciones} acciones
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        S/. {Number(d.valorPorAccion).toFixed(6)}
                      </TableCell>
                      <TableCell className="text-center">
                        {d.detalles?.length || 0} socios
                      </TableCell>
                      <TableCell className="text-center">
                        {getBadgeEstado(d.estado)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {d.estado === "BORRADOR" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs text-blue-600 hover:text-blue-700"
                              onClick={() => setModalAprobar(d)}
                            >
                              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                              Aprobar
                            </Button>
                          )}
                          {d.estado === "APROBADA" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => setModalPagar(d)}
                            >
                              <Send className="h-3.5 w-3.5 mr-1" />
                              Pagar en Caja
                            </Button>
                          )}
                          <Link href={`/admin/utilidades/${d.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs">
                              <FileText className="h-3.5 w-3.5 mr-1" />
                              Detalle
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

      {/* Modal: Nueva Distribución y Asignación de Acciones */}
      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Nueva Distribución Anual de Utilidades
            </DialogTitle>
            <DialogDescription>
              Configure el ejercicio anual, la utilidad neta a repartir y las acciones de cada socio.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardarBorrador} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ejercicio">Ejercicio Contable *</Label>
                <Select value={formEjercicio} onValueChange={setFormEjercicio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Año..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaCorte">Fecha de Corte *</Label>
                <Input
                  id="fechaCorte"
                  type="date"
                  value={formFechaCorte}
                  onChange={(e) => setFormFechaCorte(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="utilidadTotal">Utilidad Total a Repartir (S/.) *</Label>
                <Input
                  id="utilidadTotal"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formUtilidad}
                  onChange={(e) => setFormUtilidad(e.target.value)}
                  placeholder="Ej: 6156.73"
                  required
                />
              </div>
            </div>

            {/* Padrón de Socios y Acciones */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Padrón de Acciones por Socio ({socios.length} socios activos)</Label>
                <span className="text-xs text-muted-foreground">
                  Total Acciones: {Object.values(accionesPorSocio).reduce((a, b) => a + (Number(b) || 0), 0)}
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Código</TableHead>
                      <TableHead>Nombre del Socio</TableHead>
                      <TableHead className="w-40 text-right">N° de Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {socios.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">#{s.codigo}</TableCell>
                        <TableCell>{s.nombreCompleto}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            className="h-8 w-28 ml-auto text-right font-medium"
                            value={accionesPorSocio[s.id] ?? 0}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setAccionesPorSocio((prev) => ({ ...prev, [s.id]: val }));
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                {simulando ? "Calculando..." : "Simular / Calcular Reparto"}
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
                  {guardando ? "Guardando..." : "Guardar Borrador Oficial"}
                </Button>
              </div>
            </div>
          </form>

          {/* Tabla de Simulación de Reparto en Vivo */}
          {simulacion && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="flex flex-wrap items-center justify-between bg-muted/40 p-3 rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground">Utilidad Total: </span>
                  <span className="font-bold text-emerald-600">S/. {Number(simulacion.utilidadTotal).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Acciones: </span>
                  <span className="font-semibold">{simulacion.totalAcciones}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Dividendo / Acción: </span>
                  <span className="font-mono font-bold text-primary">S/. {Number(simulacion.valorPorAccion).toFixed(6)}</span>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Código</TableHead>
                      <TableHead>Socio</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                      <TableHead className="text-center">% Participación</TableHead>
                      <TableHead className="text-right">Dividendo a Percibir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {simulacion.detalles.map((d) => (
                      <TableRow key={d.socioId}>
                        <TableCell className="font-medium">#{d.socioCodigo}</TableCell>
                        <TableCell>{d.socioNombreCompleto}</TableCell>
                        <TableCell className="text-center font-semibold">{d.acciones}</TableCell>
                        <TableCell className="text-center">{d.porcentajeParticipacion}%</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          S/. {Number(d.monto).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Aprobar Distribución */}
      <Dialog open={!!modalAprobar} onOpenChange={() => setModalAprobar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar Distribución del Ejercicio {modalAprobar?.ejercicio}</DialogTitle>
            <DialogDescription>
              ¿Confirma que la asamblea comunal ha ratificado este padrón y los montos de utilidad para el ejercicio {modalAprobar?.ejercicio}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Utilidad Total:</span>
              <span className="font-bold text-emerald-600">S/. {modalAprobar?.utilidadTotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Total Acciones:</span>
              <span>{modalAprobar?.totalAcciones} acciones</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Dividendo por Acción:</span>
              <span className="font-mono">S/. {modalAprobar ? Number(modalAprobar.valorPorAccion).toFixed(6) : 0}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAprobar(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarAprobacion}>
              Aprobar Oficialmente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Pagar en Caja */}
      <Dialog open={!!modalPagar} onOpenChange={() => setModalPagar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-600" />
              Liquidación y Pago de Utilidades {modalPagar?.ejercicio}
            </DialogTitle>
            <DialogDescription>
              Esta acción generará automáticamente las transacciones individuales de EGRESO en el Libro de Caja del periodo seleccionado bajo el concepto de Utilidad Distribuida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/40 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ejercicio:</span>
                <span className="font-bold">{modalPagar?.ejercicio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto Total a Desembolsar:</span>
                <span className="font-bold text-emerald-600">
                  S/. {modalPagar?.utilidadTotal?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Socios a Liquidar:</span>
                <span>{modalPagar?.detalles?.length || 0} transferencias/pagos</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodoPago">Periodo Contable de Imputación *</Label>
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
              <Label htmlFor="fechaPago">Fecha del Pago</Label>
              <Input
                id="fechaPago"
                type="date"
                value={pagoFecha}
                onChange={(e) => setPagoFecha(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalPagar(null)}
              disabled={pagando}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmarPago}
              disabled={pagando}
            >
              {pagando ? "Procesando Egresos de Caja..." : "Confirmar y Liquidar en Caja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
