"use client";
import { getErrorMessage } from "@/lib/error-message";

import * as React from "react";
import {
  ShieldAlert,
  RefreshCw,
  FileCode,
  Activity,
  Layers,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuditEntry {
  id: number;
  occurredAt: string;
  cajaId: string;
  actorUserId: string | null;
  actorRole: string | null;
  accion: string;
  entidad: string | null;
  entidadId: string | null;
  antes: string | null;
  despues: string | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
}

export default function AuditoriaPage() {
  const [logs, setLogs] = React.useState<AuditEntry[]>([]);
  const [totalElements, setTotalElements] = React.useState<number>(0);
  const [totalPages, setTotalPages] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Filtros
  const [accionesDisponibles, setAccionesDisponibles] = React.useState<string[]>([]);
  const [entidadesDisponibles, setEntidadesDisponibles] = React.useState<string[]>([]);
  const [accionFiltro, setAccionFiltro] = React.useState<string>("TODAS");
  const [entidadFiltro, setEntidadFiltro] = React.useState<string>("TODAS");

  // Detalle Modal
  const [selectedEntry, setSelectedEntry] = React.useState<AuditEntry | null>(null);
  const [detailOpen, setDetailOpen] = React.useState<boolean>(false);

  // Cargar filtros disponibles
  const loadFiltros = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auditoria/filtros");
      if (res.ok) {
        const data = await res.json();
        setAccionesDisponibles(data.acciones || []);
        setEntidadesDisponibles(data.entidades || []);
      }
    } catch (e) {
      console.error("Error al cargar filtros de auditoría", e);
    }
  }, []);

  // Cargar lista de logs
  const loadLogs = React.useCallback(
    async (page: number = 0) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("size", "25");
        if (accionFiltro !== "TODAS") params.set("accion", accionFiltro);
        if (entidadFiltro !== "TODAS") params.set("entidad", entidadFiltro);

        const res = await fetch(`/api/auditoria?${params.toString()}`);
        if (!res.ok) {
          throw new Error("No se pudo obtener la pista de auditoría");
        }
        const data = await res.json();
        setLogs(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 0);
        setCurrentPage(page);
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Error al cargar registros"));
      } finally {
        setIsLoading(false);
      }
    },
    [accionFiltro, entidadFiltro]
  );

  React.useEffect(() => {
    loadFiltros();
  }, [loadFiltros]);

  React.useEffect(() => {
    loadLogs(0);
  }, [loadLogs]);

  const handleOpenDetail = (entry: AuditEntry) => {
    setSelectedEntry(entry);
    setDetailOpen(true);
  };

  const formatFecha = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const formatJson = (val: string | null) => {
    if (!val) return null;
    try {
      return JSON.stringify(JSON.parse(val), null, 2);
    } catch {
      return val;
    }
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "DIRECTIVO":
        return "default";
      case "SOCIO":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getAccionBadgeClass = (accion: string) => {
    if (accion.includes("DELETE") || accion.includes("ANULAD") || accion.includes("FAIL")) {
      return "border-destructive text-destructive bg-destructive/10";
    }
    if (accion.includes("CREATE") || accion.includes("PAGAD") || accion.includes("SUCCESS")) {
      return "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20";
    }
    return "border-primary text-primary bg-primary/10";
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Pista de Auditoría</h1>
            <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-600 bg-emerald-50">
              Inmutable (Solo Inserción)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Registro cronológico protegido de todas las operaciones, accesos y modificaciones en la Caja Comunal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadLogs(currentPage)}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI de Auditoría */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Total de Eventos Registrados</CardDescription>
            <CardTitle className="text-2xl font-bold">{totalElements.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Protección de disparador inmutable activa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Tipos de Acciones Auditadas</CardDescription>
            <CardTitle className="text-2xl font-bold">{accionesDisponibles.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-primary" />
              Logins, operaciones, desembolsos y pagos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Entidades Supervisadas</CardDescription>
            <CardTitle className="text-2xl font-bold">{entidadesDisponibles.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Caja, Periodos, Préstamos, Utilidades, Socios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Filtrar por Acción</label>
              <Select
                value={accionFiltro}
                onValueChange={(val) => {
                  setAccionFiltro(val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas las acciones</SelectItem>
                  {accionesDisponibles.map((acc) => (
                    <SelectItem key={acc} value={acc}>
                      {acc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Filtrar por Entidad</label>
              <Select
                value={entidadFiltro}
                onValueChange={(val) => {
                  setEntidadFiltro(val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas las entidades</SelectItem>
                  {entidadesDisponibles.map((ent) => (
                    <SelectItem key={ent} value={ent}>
                      {ent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2 pt-5">
              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => {
                  setAccionFiltro("TODAS");
                  setEntidadFiltro("TODAS");
                }}
              >
                Restablecer Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Auditoría */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Eventos Auditados</span>
            <span className="text-xs font-normal text-muted-foreground">
              Página {currentPage + 1} de {Math.max(1, totalPages)}
            </span>
          </CardTitle>
          <CardDescription>
            Cada registro incluye actor, rol, timestamp de servidor, IP y estado antes/después.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[170px]">Fecha / Hora</TableHead>
                  <TableHead className="w-[100px]">Rol</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead className="w-[140px]">IP</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Cargando pista de auditoría...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron eventos con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                        {formatFecha(log.occurredAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(log.actorRole)} className="text-[10px]">
                          {log.actorRole || "SISTEMA"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                            getAccionBadgeClass(log.accion)
                          )}
                        >
                          {log.accion}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium text-foreground">{log.entidad || "-"}</span>
                        {log.entidadId && (
                          <span className="block text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                            {log.entidadId}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.ip || "127.0.0.1"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleOpenDetail(log)}
                        >
                          <FileCode className="h-3.5 w-3.5" />
                          Inspeccionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-muted-foreground">
                Mostrando {logs.length} de {totalElements} registros
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadLogs(currentPage - 1)}
                  disabled={currentPage === 0 || isLoading}
                >
                  Anterior
                </Button>
                <span className="text-xs font-medium">
                  {currentPage + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadLogs(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1 || isLoading}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Inspección de Evento */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <span>Inspección de Registro #{selectedEntry?.id}</span>
            </DialogTitle>
            <DialogDescription>
              Trazabilidad técnica inmutable del evento registrado.
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4 pt-2 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground block">Fecha / Hora:</span>
                  <span className="font-mono font-medium">{formatFecha(selectedEntry.occurredAt)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Acción:</span>
                  <span className="font-semibold text-primary">{selectedEntry.accion}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Rol del Actor:</span>
                  <Badge variant={getRoleBadgeVariant(selectedEntry.actorRole)} className="mt-0.5">
                    {selectedEntry.actorRole || "SISTEMA"}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block">ID del Actor:</span>
                  <span className="font-mono">{selectedEntry.actorUserId || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Entidad / ID:</span>
                  <span className="font-medium">{selectedEntry.entidad || "N/A"}</span>
                  {selectedEntry.entidadId && (
                    <span className="block font-mono text-[11px] text-muted-foreground truncate">
                      {selectedEntry.entidadId}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block">IP / Dispositivo:</span>
                  <span className="font-mono">{selectedEntry.ip || "127.0.0.1"}</span>
                </div>
              </div>

              {selectedEntry.userAgent && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">User Agent</label>
                  <p className="text-xs bg-muted/50 p-2 rounded font-mono break-all">{selectedEntry.userAgent}</p>
                </div>
              )}

              {selectedEntry.antes && (
                <div>
                  <label className="text-xs font-semibold text-amber-600 block mb-1">Estado Anterior (JSON)</label>
                  <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto max-h-48 border border-border">
                    {formatJson(selectedEntry.antes)}
                  </pre>
                </div>
              )}

              {selectedEntry.despues && (
                <div>
                  <label className="text-xs font-semibold text-emerald-600 block mb-1">Estado Posterior (JSON)</label>
                  <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto max-h-48 border border-border">
                    {formatJson(selectedEntry.despues)}
                  </pre>
                </div>
              )}

              {!selectedEntry.antes && !selectedEntry.despues && (
                <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded">
                  No se registraron cambios estructurales de campos para este evento.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
