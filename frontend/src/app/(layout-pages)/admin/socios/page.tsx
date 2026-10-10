"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Key,
  UserX,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Edit,
  UserCheck,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatFecha } from "@/lib/utils";

import { ModalEditarDatosPersonales } from "@/components/socios/modal-editar-datos-personales";
import { extraerObservaciones } from "@/lib/socios-datos-personales";
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

interface Socio {
  id: string;
  codigo: number;
  tipo: "SOCIO" | "EXTERNO";
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  documentoTipo: string;
  documentoEnmascarado: string;
  documentoNumero?: string | null;
  numeroDocumento?: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  fechaIngreso: string;
  fechaRetiro: string | null;
  estado: "ACTIVO" | "INACTIVO" | "RETIRADO";
  notas: string | null;
  tieneAccesoWeb: boolean;
  usuarioStatus: string;
}

export default function SociosPage() {
  const [socios, setSocios] = React.useState<Socio[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [estadoFiltro, setEstadoFiltro] = React.useState<string>("TODOS");
  const [tipoFiltro, setTipoFiltro] = React.useState<string>("TODOS");

  // Modales
  const [modalCrear, setModalCrear] = React.useState(false);
  const [modalBaja, setModalBaja] = React.useState<Socio | null>(null);
  const [modalAcceso, setModalAcceso] = React.useState<Socio | null>(null);
  const [modalEditar, setModalEditar] = React.useState<Socio | null>(null);

  // Form states
  const [formCrear, setFormCrear] = React.useState({
    tipo: "SOCIO",
    nombres: "",
    apellidos: "",
    documentoTipo: "DNI",
    numeroDocumento: "",
    telefono: "",
    email: "",
    direccion: "",
    fechaIngreso: new Date().toISOString().split("T")[0],
    notas: "",
  });

  const [formBaja, setFormBaja] = React.useState({
    fechaRetiro: new Date().toISOString().split("T")[0],
    motivo: "",
  });

  const [formAcceso, setFormAcceso] = React.useState({
    email: "",
    passwordTemporal: "",
  });

  const [guardando, setGuardando] = React.useState(false);

  const cargarSocios = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/socios?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error al obtener lista de socios");
      const data = await res.json();
      const lista = Array.isArray(data) ? data : data.content || [];
      setSocios(lista);
    } catch (err: any) {
      toast.error(err.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarSocios();
  }, [cargarSocios]);

  // Filtrado reactivo en cliente
  const sociosFiltrados = React.useMemo(() => {
    return socios.filter((s) => {
      const coincideBusqueda =
        search === "" ||
        s.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
        s.codigo.toString().includes(search) ||
        (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
        (s.telefono && s.telefono.includes(search));

      const coincideEstado = estadoFiltro === "TODOS" || s.estado === estadoFiltro;
      const coincideTipo = tipoFiltro === "TODOS" || s.tipo === tipoFiltro;

      return coincideBusqueda && coincideEstado && coincideTipo;
    });
  }, [socios, search, estadoFiltro, tipoFiltro]);

  // Métricas
  const totalActivos = socios.filter((s) => s.estado === "ACTIVO").length;
  const totalInactivos = socios.filter((s) => s.estado === "INACTIVO").length;
  const totalRetirados = socios.filter((s) => s.estado === "RETIRADO").length;

  // Handlers
  const handleCrearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCrear.nombres || !formCrear.apellidos || !formCrear.numeroDocumento) {
      toast.error("Complete los campos obligatorios: Nombres, Apellidos y DNI");
      return;
    }
    try {
      setGuardando(true);
      const res = await fetch("/api/socios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formCrear),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || "Error al registrar socio");
      toast.success(`Socio ${data.nombreCompleto} registrado con código #${data.codigo}`);
      setModalCrear(false);
      setFormCrear({
        tipo: "SOCIO",
        nombres: "",
        apellidos: "",
        documentoTipo: "DNI",
        numeroDocumento: "",
        telefono: "",
        email: "",
        direccion: "",
        fechaIngreso: new Date().toISOString().split("T")[0],
        notas: "",
      });
      cargarSocios();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleBajaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalBaja) return;
    if (!formBaja.motivo.trim()) {
      toast.error("Debe especificar el motivo de retiro");
      return;
    }
    try {
      setGuardando(true);
      const res = await fetch(`/api/socios/${modalBaja.id}/baja`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formBaja),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || "Error al dar de baja");
      toast.success(`Socio ${modalBaja.nombreCompleto} retirado del padrón`);
      setModalBaja(null);
      setFormBaja({ fechaRetiro: new Date().toISOString().split("T")[0], motivo: "" });
      cargarSocios();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleAccesoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAcceso) return;
    if (!formAcceso.email.trim()) {
      toast.error("Debe ingresar un correo electrónico");
      return;
    }
    try {
      setGuardando(true);
      const res = await fetch(`/api/socios/${modalAcceso.id}/acceso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formAcceso),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || "Error al habilitar acceso");
      toast.success(`Acceso web habilitado exitosamente para ${modalAcceso.nombreCompleto}`);
      setModalAcceso(null);
      cargarSocios();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Padrón Oficial de Socios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Caja Comunal "Emprende Chambala" &bull; Cifrado AES-256-GCM y control de acceso web
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => cargarSocios()}
            disabled={loading}
            title="Actualizar listado"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button onClick={() => setModalCrear(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo Socio
          </Button>
        </div>
      </div>

      {/* KPI Cards de la plantilla */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs uppercase font-medium text-muted-foreground">Total Registrados</p>
              <h3 className="text-2xl font-bold mt-1">{socios.length}</h3>
              <p className="text-xs text-muted-foreground mt-1">Socios y externos</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs uppercase font-medium text-muted-foreground">Socios Activos</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{totalActivos}</h3>
              <p className="text-xs text-muted-foreground mt-1">Con derecho a voto y aporte</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs uppercase font-medium text-muted-foreground">Inactivos</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{totalInactivos}</h3>
              <p className="text-xs text-muted-foreground mt-1">En pausa temporal</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs uppercase font-medium text-muted-foreground">Retirados</p>
              <h3 className="text-2xl font-bold mt-1 text-destructive">{totalRetirados}</h3>
              <p className="text-xs text-muted-foreground mt-1">Baja lógica inmutable</p>
            </div>
            <div className="rounded-xl bg-destructive/10 p-3 text-destructive">
              <UserX className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla con Card de la plantilla */}
      <Card className="w-full min-w-0 max-w-full overflow-hidden shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b p-4 sm:p-6 gap-3">
          <div>
            <CardTitle className="text-lg">Socios de la Caja</CardTitle>
            <CardDescription>
              Directorio oficial de asociados y participantes de la asamblea
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los Estados</SelectItem>
                <SelectItem value="ACTIVO">Activos</SelectItem>
                <SelectItem value="INACTIVO">Inactivos</SelectItem>
                <SelectItem value="RETIRADO">Retirados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los Tipos</SelectItem>
                <SelectItem value="SOCIO">Socios</SelectItem>
                <SelectItem value="EXTERNO">Externos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto w-full">
          <Table className="w-full min-w-[850px]">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-14 text-center">Cód</TableHead>
                <TableHead className="min-w-[170px] max-w-[220px]">Socio / Integrante</TableHead>
                <TableHead className="w-16 text-center">Tipo</TableHead>
                <TableHead className="whitespace-nowrap">Documento</TableHead>
                <TableHead className="whitespace-nowrap">Contacto</TableHead>
                <TableHead className="whitespace-nowrap text-center">Ingreso</TableHead>
                <TableHead className="whitespace-nowrap text-center">Estado</TableHead>
                <TableHead className="whitespace-nowrap text-center">Acceso Web</TableHead>
                <TableHead className="whitespace-nowrap text-right pr-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Cargando padrón de socios...
                  </TableCell>
                </TableRow>
              ) : sociosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No se encontraron socios que coincidan con los criterios de búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                sociosFiltrados.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-center font-semibold py-3">
                      <span className="inline-block bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                        #{String(s.codigo).padStart(3, "0")}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 max-w-[220px]">
                      <div className="font-medium text-foreground leading-snug">{s.nombreCompleto}</div>
                      {s.direccion && <div className="text-[11px] text-muted-foreground truncate">{s.direccion}</div>}
                      {s.notas && (() => {
                        const obs = extraerObservaciones(s.notas);
                        const texto = obs || (s.notas.startsWith("{") ? "" : s.notas);
                        if (!texto) return null;
                        return (
                          <div className={cn(
                            "text-[11px] mt-0.5 line-clamp-2",
                            s.estado === "RETIRADO" ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"
                          )} title={texto}>
                            {texto}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <Badge variant={s.tipo === "SOCIO" ? "default" : "secondary"} className="text-[11px] px-2 py-0">
                        {s.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap py-3">
                      {s.documentoTipo}: {s.documentoNumero || s.numeroDocumento || s.documentoEnmascarado}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground whitespace-nowrap">
                        {s.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" /> {s.telefono}
                          </span>
                        )}
                        {s.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" /> {s.email}
                          </span>
                        )}
                        {!s.telefono && !s.email && <span className="text-muted-foreground/60 text-[11px]">Sin contacto</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap text-center py-3">
                      <div className="inline-flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3 text-muted-foreground" /> {formatFecha(s.fechaIngreso)}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-center py-3">
                      {s.estado === "ACTIVO" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]">
                          Activo
                        </Badge>
                      ) : s.estado === "INACTIVO" ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px]">
                          Inactivo
                        </Badge>
                      ) : (
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <Badge variant="destructive" className="text-[11px]">
                            Retirado
                          </Badge>
                          {s.fechaRetiro && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Baja: {formatFecha(s.fechaRetiro)}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap py-3">
                      {s.tieneAccesoWeb ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <Shield className="h-3.5 w-3.5" /> Habilitado
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setModalAcceso(s);
                            setFormAcceso({
                              email: s.email || "",
                              passwordTemporal: `Socio${s.codigo}#Chambala2026`,
                            });
                          }}
                          className="h-7 text-xs text-primary gap-1 px-2"
                        >
                          <Key className="h-3 w-3" /> Activar
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap pr-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/socios/detalle?id=${s.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            title="Ver Detalle y Estado de Cuenta"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setModalEditar(s)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Editar datos personales del socio"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {s.estado !== "RETIRADO" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setModalBaja(s);
                              setFormBaja({
                                fechaRetiro: new Date().toISOString().split("T")[0],
                                motivo: "",
                              });
                            }}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title="Dar de baja"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG: Crear Socio */}
      <Dialog open={modalCrear} onOpenChange={setModalCrear}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Registrar Nuevo Socio
            </DialogTitle>
            <DialogDescription>
              El DNI será cifrado de extremo a extremo con AES-256-GCM y HMAC para confidencialidad bancaria.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrearSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Integrante *</Label>
                <Select
                  value={formCrear.tipo}
                  onValueChange={(val) => setFormCrear({ ...formCrear, tipo: val })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOCIO">Socio Oficial</SelectItem>
                    <SelectItem value="EXTERNO">Cliente Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Documento *</Label>
                <Select
                  value={formCrear.documentoTipo}
                  onValueChange={(val) => setFormCrear({ ...formCrear, documentoTipo: val })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI (8 dígitos)</SelectItem>
                    <SelectItem value="CE">Carné de Extranjería</SelectItem>
                    <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nombres *</Label>
                <Input
                  required
                  value={formCrear.nombres}
                  onChange={(e) => setFormCrear({ ...formCrear, nombres: e.target.value })}
                  placeholder="Ej. Juan Carlos"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Apellidos *</Label>
                <Input
                  required
                  value={formCrear.apellidos}
                  onChange={(e) => setFormCrear({ ...formCrear, apellidos: e.target.value })}
                  placeholder="Ej. Quispe Morales"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Número de Documento *</Label>
                <Input
                  required
                  value={formCrear.numeroDocumento}
                  onChange={(e) => setFormCrear({ ...formCrear, numeroDocumento: e.target.value })}
                  placeholder="8 dígitos"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Fecha de Ingreso *</Label>
                <Input
                  type="date"
                  required
                  value={formCrear.fechaIngreso}
                  onChange={(e) => setFormCrear({ ...formCrear, fechaIngreso: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Teléfono</Label>
                <Input
                  value={formCrear.telefono}
                  onChange={(e) => setFormCrear({ ...formCrear, telefono: e.target.value })}
                  placeholder="Ej. 987654321"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Correo Electrónico</Label>
                <Input
                  type="email"
                  value={formCrear.email}
                  onChange={(e) => setFormCrear({ ...formCrear, email: e.target.value })}
                  placeholder="socio@correo.com"
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Dirección / Residencia</Label>
              <Input
                value={formCrear.direccion}
                onChange={(e) => setFormCrear({ ...formCrear, direccion: e.target.value })}
                placeholder="Calle o Urbanización"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notas u Observaciones</Label>
              <Textarea
                rows={2}
                value={formCrear.notas}
                onChange={(e) => setFormCrear({ ...formCrear, notas: e.target.value })}
                placeholder="Notas internas..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalCrear(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Registrando..." : "Guardar Socio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Dar de Baja */}
      <Dialog open={!!modalBaja} onOpenChange={(open) => !open && setModalBaja(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <UserX className="h-5 w-5" />
              Retirar Socio del Padrón
            </DialogTitle>
            <DialogDescription>
              Esta acción marcará al socio como <strong>RETIRADO</strong> y revocará su acceso web. Las operaciones históricas se conservan inmutables en el libro contable.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBajaSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha de Retiro *</Label>
              <Input
                type="date"
                required
                value={formBaja.fechaRetiro}
                onChange={(e) => setFormBaja({ ...formBaja, fechaRetiro: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Motivo de Retiro (Justificación) *</Label>
              <Textarea
                rows={3}
                required
                value={formBaja.motivo}
                onChange={(e) => setFormBaja({ ...formBaja, motivo: e.target.value })}
                placeholder="Ej. Renuncia voluntaria expresada en asamblea comunal..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalBaja(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={guardando}>
                {guardando ? "Procesando..." : "Confirmar Baja"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Habilitar Acceso Web */}
      <Dialog open={!!modalAcceso} onOpenChange={(open) => !open && setModalAcceso(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Habilitar Acceso al Portal
            </DialogTitle>
            <DialogDescription>
              Crea una cuenta de usuario con rol <strong>SOCIO</strong> para que pueda revisar sus estados de cuenta y aportes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAccesoSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Correo Electrónico de Acceso *</Label>
              <Input
                type="email"
                required
                value={formAcceso.email}
                onChange={(e) => setFormAcceso({ ...formAcceso, email: e.target.value })}
                placeholder="socio@correo.com"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Contraseña Temporal Sugerida *</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  required
                  value={formAcceso.passwordTemporal}
                  onChange={(e) => setFormAcceso({ ...formAcceso, passwordTemporal: e.target.value })}
                  className="font-mono h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(formAcceso.passwordTemporal);
                    toast.success("Contraseña copiada al portapapeles");
                  }}
                  title="Copiar contraseña"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                El socio deberá cambiar obligatoriamente su contraseña en su primer inicio de sesión.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalAcceso(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Activando..." : "Habilitar Cuenta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Editar Datos Personales del Socio */}
      <ModalEditarDatosPersonales
        open={!!modalEditar}
        onOpenChange={(open) => !open && setModalEditar(null)}
        socio={modalEditar}
        onSuccess={cargarSocios}
      />
    </div>
  );
}
