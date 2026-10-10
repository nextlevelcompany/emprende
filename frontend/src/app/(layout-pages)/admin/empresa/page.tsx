"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Users,
  Award,
  Phone,
  Mail,
  MapPin,
  Globe,
  Shield,
  Edit,
  Plus,
  Trash2,
  Upload,
  Download,
  Eye,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  FileCheck,
  Clock,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Landmark,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatFecha, formatSoles } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Interfaces
interface EmpresaData {
  id: string;
  nombre: string;
  nombreComercial: string;
  ruc: string;
  logo: string;
  fechaFundacion: string;
  fechaEmisionAcciones?: string;
  descripcion: string;
  objetoSocial: string;
  mision: string;
  vision: string;
  direccion: string;
  distrito: string;
  provincia: string;
  departamento: string;
  pais: string;
  telefono: string;
  email: string;
  sitioWeb: string;
  moneda: string;
  diaReunion: number;
  valorAccion: number;
  representanteLegal: string;
  cargoRepresentante: string;
  tipoDocumentoRepresentante: string;
  numeroDocumentoRepresentante: string;
  partidaRegistral?: string;
  updatedAt?: string;
}

interface ActaReunion {
  id: string;
  numeroActa: string;
  tipo: "ORDINARIA" | "EXTRAORDINARIA" | "DIRECTIVA" | "MENSUAL";
  tipoTitulo: string;
  fecha: string;
  hora: string;
  lugar: string;
  presidente: string;
  secretario: string;
  asistentes: number;
  quorumPorcentaje: number;
  agenda: string[];
  acuerdos: string[];
  resumen: string;
  archivoNombre?: string;
  archivoTipo?: string;
  archivoTamano?: number;
  archivoData?: string;
  fechaRegistro: string;
}

interface AccionistaHistorico {
  id: string;
  codigo: number;
  nombreCompleto: string;
  documentoNumero: string;
  fechaIngreso: string;
  accionesFundacion: number;
  capitalInicial: number;
  rolFundacion: string;
  estado: "ACTIVO" | "RETIRADO";
  observaciones?: string;
}

export default function EmpresaPage() {
  const [empresa, setEmpresa] = React.useState<EmpresaData | null>(null);
  const [actas, setActas] = React.useState<ActaReunion[]>([]);
  const [accionistas, setAccionistas] = React.useState<AccionistaHistorico[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [guardando, setGuardando] = React.useState(false);

  // Modales
  const [modalEditarEmpresa, setModalEditarEmpresa] = React.useState(false);
  const [modalActa, setModalActa] = React.useState<ActaReunion | null>(null);
  const [modalCrearActa, setModalCrearActa] = React.useState(false);
  const [modalAccionista, setModalAccionista] = React.useState<AccionistaHistorico | null>(null);
  const [modalCrearAccionista, setModalCrearAccionista] = React.useState(false);
  const [docParaVer, setDocParaVer] = React.useState<{ nombre: string; tipo: string; data: string } | null>(null);

  // Filtros de Actas
  const [filtroTipoActa, setFiltroTipoActa] = React.useState<string>("TODOS");
  const [busquedaActa, setBusquedaActa] = React.useState<string>("");

  // Form State para Empresa
  const [formEmpresa, setFormEmpresa] = React.useState<Partial<EmpresaData>>({});

  // Form State para Acta
  const [formActa, setFormActa] = React.useState({
    numeroActa: "",
    tipo: "ORDINARIA" as "ORDINARIA" | "EXTRAORDINARIA" | "DIRECTIVA" | "MENSUAL",
    tipoTitulo: "Asamblea General Ordinaria",
    fecha: new Date().toISOString().split("T")[0],
    hora: "14:00",
    lugar: "Local Comunal de Chambala",
    presidente: "",
    secretario: "",
    asistentes: 30,
    quorumPorcentaje: 90,
    agendaTexto: "",
    acuerdosTexto: "",
    resumen: "",
    archivoNombre: "",
    archivoTipo: "",
    archivoTamano: 0,
    archivoData: "",
  });

  // Form State para Accionista
  const [formAccionista, setFormAccionista] = React.useState({
    codigo: 1,
    nombreCompleto: "",
    documentoNumero: "",
    fechaIngreso: "2021-06-08",
    accionesFundacion: 10,
    capitalInicial: 300,
    rolFundacion: "Socio Fundador",
    estado: "ACTIVO" as "ACTIVO" | "RETIRADO",
    observaciones: "",
  });

  const fileLogoRef = React.useRef<HTMLInputElement>(null);
  const fileActaRef = React.useRef<HTMLInputElement>(null);

  // Cargar datos
  const cargarTodo = React.useCallback(async () => {
    try {
      setLoading(true);
      const [resEmpresa, resActas, resAccionistas] = await Promise.all([
        fetch("/api/empresa"),
        fetch("/api/empresa/actas"),
        fetch("/api/empresa/accionistas"),
      ]);

      if (resEmpresa.ok) {
        const dataEmp = await resEmpresa.json();
        setEmpresa(dataEmp);
        setFormEmpresa(dataEmp);
      }
      if (resActas.ok) {
        const dataActas = await resActas.json();
        setActas(Array.isArray(dataActas) ? dataActas : []);
      }
      if (resAccionistas.ok) {
        const dataAcc = await resAccionistas.json();
        setAccionistas(Array.isArray(dataAcc) ? dataAcc : []);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cargar información institucional");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  // Manejar subida de Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen del logo no debe superar los 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormEmpresa((prev) => ({ ...prev, logo: base64 }));
      toast.success("Logo cargado. Recuerde guardar los cambios.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Guardar datos de Empresa
  const handleGuardarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGuardando(true);
      const res = await fetch("/api/empresa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formEmpresa),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al guardar datos");

      setEmpresa(data);
      setModalEditarEmpresa(false);
      toast.success("Datos generales de la empresa actualizados correctamente");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  // Manejar subida de archivo para Acta
  const handleActaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo del acta no debe superar los 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormActa((prev) => ({
        ...prev,
        archivoNombre: file.name,
        archivoTipo: file.type || "application/pdf",
        archivoTamano: file.size,
        archivoData: base64,
      }));
      toast.success(`Archivo "${file.name}" adjuntado al acta`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Guardar Acta (Crear o Editar)
  const handleGuardarActa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGuardando(true);

      const agendaArray = formActa.agendaTexto
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const acuerdosArray = formActa.acuerdosTexto
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const payload = {
        ...formActa,
        agenda: agendaArray,
        acuerdos: acuerdosArray,
      };

      const isEdit = !!modalActa;
      const url = "/api/empresa/actas";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...payload, id: modalActa.id } : payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al procesar acta");

      toast.success(isEdit ? "Acta de reunión actualizada" : "Nueva reunión y acta registrada exitosamente");
      setModalActa(null);
      setModalCrearActa(false);
      cargarTodo();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar acta");
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar Acta
  const handleEliminarActa = async (id: string, numero: string) => {
    if (!confirm(`¿Está seguro de eliminar el registro de ${numero}?`)) return;
    try {
      const res = await fetch(`/api/empresa/actas?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar acta");
      toast.success(`${numero} eliminada`);
      cargarTodo();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Guardar Accionista Histórico
  const handleGuardarAccionista = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGuardando(true);
      const isEdit = !!modalAccionista;
      const url = "/api/empresa/accionistas";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...formAccionista, id: modalAccionista.id } : formAccionista),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al guardar accionista");

      toast.success(isEdit ? "Accionista histórico actualizado" : "Accionista histórico registrado");
      setModalAccionista(null);
      setModalCrearAccionista(false);
      cargarTodo();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar Accionista Histórico
  const handleEliminarAccionista = async (id: string, nombre: string) => {
    if (!confirm(`¿Está seguro de eliminar a ${nombre} del padrón histórico?`)) return;
    try {
      const res = await fetch(`/api/empresa/accionistas?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar accionista");
      toast.success(`Accionista ${nombre} eliminado`);
      cargarTodo();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Filtrado de Actas
  const actasFiltradas = React.useMemo(() => {
    return actas.filter((a) => {
      const matchTipo = filtroTipoActa === "TODOS" || a.tipo === filtroTipoActa;
      const term = busquedaActa.toLowerCase();
      const matchBusqueda =
        !term ||
        a.numeroActa.toLowerCase().includes(term) ||
        a.tipoTitulo.toLowerCase().includes(term) ||
        a.resumen.toLowerCase().includes(term) ||
        a.fecha.includes(term) ||
        a.presidente.toLowerCase().includes(term);
      return matchTipo && matchBusqueda;
    });
  }, [actas, filtroTipoActa, busquedaActa]);

  // Cálculos
  const aniosTrayectoria = React.useMemo(() => {
    if (!empresa?.fechaFundacion) return 0;
    const anioFund = new Date(empresa.fechaFundacion).getFullYear();
    const anioActual = new Date().getFullYear();
    return anioActual - anioFund;
  }, [empresa]);

  const totalCapitalFundacion = React.useMemo(() => {
    return accionistas.reduce((sum, a) => sum + Number(a.capitalInicial || 0), 0);
  }, [accionistas]);

  const totalAccionesFundacion = React.useMemo(() => {
    return accionistas.reduce((sum, a) => sum + Number(a.accionesFundacion || 0), 0);
  }, [accionistas]);

  const descargarArchivo = (nombre: string, data: string) => {
    if (!data) {
      toast.info("Este registro no cuenta con archivo digital adjunto");
      return;
    }
    const link = document.createElement("a");
    link.href = data;
    link.download = nombre || "acta_reunion.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Datos de la Empresa y Registro Institucional
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Caja Comunal "Emprende Chambala" &bull; Perfil oficial, historial de fundación y libro de actas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarTodo}
            disabled={loading}
            className="gap-1.5"
            title="Refrescar datos"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setFormEmpresa(empresa || {});
              setModalEditarEmpresa(true);
            }}
            className="gap-1.5 shadow-sm"
          >
            <Edit className="h-4 w-4" />
            Editar Datos Generales
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI de Resumen Institucional */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs uppercase font-medium text-muted-foreground">Fundación Oficial</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">
                {empresa?.fechaFundacion ? formatFecha(empresa.fechaFundacion) : "08/06/2021"}
              </h3>
              <p className="text-xs text-primary font-medium mt-0.5">
                {aniosTrayectoria} años de trayectoria comunal
              </p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs uppercase font-medium text-muted-foreground">RUC Institucional</p>
              <h3 className="text-xl font-bold mt-1 font-mono text-foreground">
                {empresa?.ruc || "20608945123"}
              </h3>
              <Badge variant="outline" className="text-[10px] mt-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Activo &bull; Habido
              </Badge>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs uppercase font-medium text-muted-foreground">Accionistas Fundadores</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">
                {accionistas.length} socios
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Capital inicial: {formatSoles(totalCapitalFundacion)}
              </p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs uppercase font-medium text-muted-foreground">Libro de Actas</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">
                {actas.length} reuniones
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Asambleas y sesiones registradas
              </p>
            </div>
            <div className="rounded-xl bg-purple-500/10 p-3 text-purple-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas Principales */}
      <Tabs defaultValue="generales" className="w-full space-y-4">
        <TabsList className="grid grid-cols-3 max-w-lg h-10">
          <TabsTrigger value="generales" className="text-xs sm:text-sm gap-1.5">
            <Building2 className="h-4 w-4" />
            Datos Generales
          </TabsTrigger>
          <TabsTrigger value="historicos" className="text-xs sm:text-sm gap-1.5">
            <Users className="h-4 w-4" />
            Accionistas Históricos
          </TabsTrigger>
          <TabsTrigger value="actas" className="text-xs sm:text-sm gap-1.5">
            <BookOpen className="h-4 w-4" />
            Libro de Actas ({actas.length})
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: DATOS GENERALES DE LA EMPRESA */}
        {/* ========================================================================= */}
        <TabsContent value="generales" className="space-y-4">
          <Card className="shadow-sm border-t-4 border-t-primary">
            <CardHeader className="bg-muted/20 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Logo de la empresa */}
                  <div className="relative group">
                    <div className="h-20 w-20 rounded-2xl border-2 border-primary/20 bg-background flex items-center justify-center overflow-hidden shadow-sm">
                      {empresa?.logo ? (
                        <img
                          src={empresa.logo}
                          alt="Logo de la Empresa"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-primary">
                          <Landmark className="h-9 w-9" />
                          <span className="text-[10px] font-bold mt-0.5">UNICA</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        {empresa?.nombre || "Caja Comunal Emprende Chambala"}
                      </h2>
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {empresa?.nombreComercial || "UNICA Chambala"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                      <span>RUC: <strong className="font-mono text-foreground">{empresa?.ruc}</strong></span>
                      &bull;
                      <span>Fundación: <strong>{empresa?.fechaFundacion ? formatFecha(empresa.fechaFundacion) : "08/06/2021"}</strong></span>
                      &bull;
                      <span>Moneda: <strong>{empresa?.moneda} (Soles)</strong></span>
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setFormEmpresa(empresa || {});
                    setModalEditarEmpresa(true);
                  }}
                  className="gap-1.5 shadow-sm self-start md:self-center"
                >
                  <Edit className="h-4 w-4" />
                  Editar Información
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Reseña y Objeto Social */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Descripción Institucional
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {empresa?.descripcion}
                  </p>
                </div>

                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    Objeto Social de la Organización
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {empresa?.objetoSocial}
                  </p>
                </div>
              </div>

              {/* Misión y Visión */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Misión Comunal
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {empresa?.mision}
                  </p>
                </div>

                <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-blue-600" />
                    Visión de Futuro
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {empresa?.vision}
                  </p>
                </div>
              </div>

              {/* Datos de Domicilio, Contacto y Parámetros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-2 border-t">
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Domicilio Legal
                  </span>
                  <p className="font-medium text-foreground">{empresa?.direccion}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {empresa?.distrito}, {empresa?.provincia}, {empresa?.departamento}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> Teléfono Oficial
                  </span>
                  <p className="font-medium text-foreground font-mono">{empresa?.telefono}</p>
                  <p className="text-[11px] text-muted-foreground">Atención a socios en asambleas</p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> Correo Institucional
                  </span>
                  <p className="font-medium text-foreground truncate">{empresa?.email}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{empresa?.sitioWeb}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Día de Reunión Mensual
                  </span>
                  <p className="font-medium text-foreground">
                    Día <strong>{empresa?.diaReunion}</strong> de cada mes
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Valor de Acción: <strong>S/. {empresa?.valorAccion}.00</strong>
                  </p>
                </div>
              </div>

              {/* Representante Legal y Personería Jurídica */}
              <div className="p-4 rounded-xl border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Representante Legal / Presidente en Ejercicio
                  </span>
                  <p className="text-base font-bold text-foreground">
                    {empresa?.representanteLegal}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {empresa?.cargoRepresentante} &bull; {empresa?.tipoDocumentoRepresentante}: {empresa?.numeroDocumentoRepresentante}
                  </p>
                </div>

                {empresa?.partidaRegistral && (
                  <div className="sm:text-right space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Registro y Personería Jurídica
                    </span>
                    <p className="text-xs font-mono font-medium text-foreground">
                      {empresa?.partidaRegistral}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* PESTAÑA 2: ACCIONISTAS HISTÓRICOS Y FUNDADORES */}
        {/* ========================================================================= */}
        <TabsContent value="historicos" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    Padrón Histórico de Accionistas Fundadores
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comuneros y socios participantes del acto de constitución de la Caja Comunal (08 de junio de 2021)
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setFormAccionista({
                      codigo: accionistas.length + 1,
                      nombreCompleto: "",
                      documentoNumero: "",
                      fechaIngreso: empresa?.fechaFundacion || "2021-06-08",
                      accionesFundacion: 10,
                      capitalInicial: 300,
                      rolFundacion: "Socio Fundador",
                      estado: "ACTIVO",
                      observaciones: "",
                    });
                    setModalAccionista(null);
                    setModalCrearAccionista(true);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Accionista Fundador
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 text-xs">
                      <TableHead className="w-16">N°</TableHead>
                      <TableHead>Nombre del Accionista</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Fecha Ingreso</TableHead>
                      <TableHead className="text-right">Acciones Iniciales</TableHead>
                      <TableHead className="text-right">Capital Fundacional</TableHead>
                      <TableHead>Rol / Cargo en Fundación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-24 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accionistas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">
                          No se han registrado accionistas históricos.
                        </TableCell>
                      </TableRow>
                    ) : (
                      accionistas.map((acc) => (
                        <TableRow key={acc.id} className="text-xs hover:bg-muted/30">
                          <TableCell className="font-mono font-bold text-primary">
                            #{String(acc.codigo).padStart(3, "0")}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {acc.nombreCompleto}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {acc.documentoNumero}
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatFecha(acc.fechaIngreso)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {acc.accionesFundacion} acc.
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatSoles(acc.capitalInicial)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-medium">
                              {acc.rolFundacion}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {acc.estado === "ACTIVO" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                Activo
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[10px]">
                                Retirado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setModalAccionista(acc);
                                  setFormAccionista({
                                    codigo: acc.codigo,
                                    nombreCompleto: acc.nombreCompleto,
                                    documentoNumero: acc.documentoNumero,
                                    fechaIngreso: acc.fechaIngreso,
                                    accionesFundacion: acc.accionesFundacion,
                                    capitalInicial: acc.capitalInicial,
                                    rolFundacion: acc.rolFundacion,
                                    estado: acc.estado,
                                    observaciones: acc.observaciones || "",
                                  });
                                  setModalCrearAccionista(true);
                                }}
                                title="Editar datos"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => handleEliminarAccionista(acc.id, acc.nombreCompleto)}
                                title="Eliminar registro"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Totalizador */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 p-3 bg-muted/30 rounded-lg mt-3 text-xs">
                <span className="font-medium text-muted-foreground">
                  Total de Accionistas Fundadores: <strong>{accionistas.length} comuneros</strong>
                </span>
                <span className="font-mono text-muted-foreground">
                  Acciones Emitidas en Fundación: <strong>{totalAccionesFundacion} acc.</strong> &bull; Total Capital Social Inicial:{" "}
                  <strong className="text-emerald-600 font-bold">{formatSoles(totalCapitalFundacion)}</strong>
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* PESTAÑA 3: LIBRO DE ACTAS Y REUNIONES */}
        {/* ========================================================================= */}
        <TabsContent value="actas" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Libro Oficial de Actas de Asambleas y Reuniones
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Registro cronológico de acuerdos, orden del día, actas firmadas y quórum de socios
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setModalActa(null);
                    setFormActa({
                      numeroActa: `Acta N° ${String(actas.length + 1).padStart(2, "0")}-${new Date().getFullYear()}`,
                      tipo: "ORDINARIA",
                      tipoTitulo: "Asamblea General Ordinaria",
                      fecha: new Date().toISOString().split("T")[0],
                      hora: "14:00",
                      lugar: "Local Comunal de Chambala",
                      presidente: empresa?.representanteLegal || "PONCE HUILCAYA ADELA",
                      secretario: "MORAN LAIME CIRILO",
                      asistentes: 32,
                      quorumPorcentaje: 92,
                      agendaTexto: "Presentación y aprobación de balance\nDistribución de utilidades\nNuevos créditos",
                      acuerdosTexto: "Se aprueba por unanimidad el balance financiero.\nSe autoriza el pago de dividendos a socios.",
                      resumen: "",
                      archivoNombre: "",
                      archivoTipo: "",
                      archivoTamano: 0,
                      archivoData: "",
                    });
                    setModalCrearActa(true);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Registrar Nueva Reunión / Acta
                </Button>
              </div>

              {/* Filtros de Búsqueda de Actas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t mt-3">
                <div className="sm:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por N° de acta, tema, acuerdos o directivo..."
                    value={busquedaActa}
                    onChange={(e) => setBusquedaActa(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <div>
                  <Select value={filtroTipoActa} onValueChange={setFiltroTipoActa}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Tipo de Reunión" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todas las reuniones</SelectItem>
                      <SelectItem value="ORDINARIA">Asamblea Ordinaria</SelectItem>
                      <SelectItem value="EXTRAORDINARIA">Asamblea Extraordinaria</SelectItem>
                      <SelectItem value="MENSUAL">Reunión Mensual de Caja</SelectItem>
                      <SelectItem value="DIRECTIVA">Sesión de Directiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {actasFiltradas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                  <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-medium">No se encontraron actas con los criterios seleccionados</p>
                  <p className="text-xs mt-1">Haga clic en "Registrar Nueva Reunión" para agregar un acta.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {actasFiltradas.map((acta) => (
                    <div
                      key={acta.id}
                      className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm space-y-4 hover:border-primary/40 transition-colors"
                    >
                      {/* Cabecera del Acta */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-bold text-sm sm:text-base text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                            {acta.numeroActa}
                          </span>
                          <h3 className="font-bold text-base text-foreground">
                            {acta.tipoTitulo}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {acta.tipo}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/40 px-2.5 py-1 rounded-md">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            <span>{formatFecha(acta.fecha)} ({acta.hora})</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setModalActa(acta);
                              setFormActa({
                                numeroActa: acta.numeroActa,
                                tipo: acta.tipo,
                                tipoTitulo: acta.tipoTitulo,
                                fecha: acta.fecha,
                                hora: acta.hora,
                                lugar: acta.lugar,
                                presidente: acta.presidente,
                                secretario: acta.secretario,
                                asistentes: acta.asistentes,
                                quorumPorcentaje: acta.quorumPorcentaje,
                                agendaTexto: acta.agenda?.join("\n") || "",
                                acuerdosTexto: acta.acuerdos?.join("\n") || "",
                                resumen: acta.resumen || "",
                                archivoNombre: acta.archivoNombre || "",
                                archivoTipo: acta.archivoTipo || "",
                                archivoTamano: acta.archivoTamano || 0,
                                archivoData: acta.archivoData || "",
                              });
                              setModalCrearActa(true);
                            }}
                            title="Editar acta"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleEliminarActa(acta.id, acta.numeroActa)}
                            title="Eliminar acta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Metadatos de la sesión */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/20 p-3 rounded-lg">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Lugar / Sede</span>
                          <p className="font-medium text-foreground truncate">{acta.lugar}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Preside la Sesión</span>
                          <p className="font-medium text-foreground truncate">{acta.presidente}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Secretaría de Actas</span>
                          <p className="font-medium text-foreground truncate">{acta.secretario}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Asistencia y Quórum</span>
                          <p className="font-medium text-foreground">
                            {acta.asistentes} socios ({acta.quorumPorcentaje}% quórum)
                          </p>
                        </div>
                      </div>

                      {/* Resumen */}
                      {acta.resumen && (
                        <p className="text-xs text-muted-foreground italic">
                          "{acta.resumen}"
                        </p>
                      )}

                      {/* Agenda y Acuerdos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                        {/* Agenda */}
                        <div className="space-y-1.5 p-3 rounded-lg border bg-background">
                          <h4 className="font-semibold text-primary uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            Agenda / Puntos Tratados
                          </h4>
                          <ul className="space-y-1 pl-4 list-disc text-foreground/90">
                            {acta.agenda && acta.agenda.length > 0 ? (
                              acta.agenda.map((punto, idx) => <li key={idx}>{punto}</li>)
                            ) : (
                              <li className="text-muted-foreground">Puntos regulares de asamblea</li>
                            )}
                          </ul>
                        </div>

                        {/* Acuerdos */}
                        <div className="space-y-1.5 p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20">
                          <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Acuerdos Adoptados y Resoluciones
                          </h4>
                          <ul className="space-y-1 pl-4 list-disc text-foreground/90">
                            {acta.acuerdos && acta.acuerdos.length > 0 ? (
                              acta.acuerdos.map((acuerdo, idx) => <li key={idx}>{acuerdo}</li>)
                            ) : (
                              <li className="text-muted-foreground">Acuerdos conforme al estatuto</li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Adjunto del Acta Digitalizada */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t">
                        <div className="flex items-center gap-2 text-xs">
                          <FileCheck className="h-4 w-4 text-primary shrink-0" />
                          {acta.archivoNombre ? (
                            <span className="font-medium text-foreground">
                              Documento digitalizado: <strong>{acta.archivoNombre}</strong>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Sin archivo digital adjunto (puede digitalizarlo en "Editar")
                            </span>
                          )}
                        </div>

                        {acta.archivoNombre && (
                          <div className="flex items-center gap-2">
                            {acta.archivoData && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() =>
                                  setDocParaVer({
                                    nombre: acta.archivoNombre || "Acta",
                                    tipo: acta.archivoTipo || "application/pdf",
                                    data: acta.archivoData || "",
                                  })
                                }
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Ver Acta Digital
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => descargarArchivo(acta.archivoNombre || "", acta.archivoData || "")}
                            >
                              <Download className="h-3.5 w-3.5" />
                              Descargar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* DIALOG: EDITAR DATOS GENERALES DE LA EMPRESA */}
      {/* ========================================================================= */}
      <Dialog open={modalEditarEmpresa} onOpenChange={setModalEditarEmpresa}>
        <DialogContent className="w-full sm:max-w-4xl md:max-w-5xl lg:max-w-5xl max-h-[92vh] overflow-y-auto p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Building2 className="h-5 w-5 text-primary" />
              Editar Datos Generales de la Empresa
            </DialogTitle>
            <DialogDescription className="text-sm">
              Actualice los datos institucionales, logotipo, objeto social, personería y canales de contacto.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardarEmpresa} className="space-y-6 pt-2">
            {/* Logo y Razón Social */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Identidad Corporativa
              </h3>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Logo Uploader */}
                <div className="space-y-2 shrink-0">
                  <Label className="text-sm font-semibold">Logotipo Institucional</Label>
                  <div className="h-28 w-28 rounded-2xl border-2 border-dashed border-primary/30 bg-muted/20 flex flex-col items-center justify-center relative overflow-hidden group">
                    {formEmpresa.logo ? (
                      <img src={formEmpresa.logo} alt="Logo" className="h-full w-full object-contain p-2" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground p-2 text-center">
                        <ImageIcon className="h-8 w-8 mb-1" />
                        <span className="text-[10px]">Sin logo</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileLogoRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1"
                      onClick={() => fileLogoRef.current?.click()}
                    >
                      <Upload className="h-3 w-3" />
                      Cargar Logo
                    </Button>
                    {formEmpresa.logo && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => setFormEmpresa({ ...formEmpresa, logo: "" })}
                      >
                        Quitar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Nombres y RUC */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="text-sm font-semibold">Nombre de la Empresa / Razón Social *</Label>
                    <Input
                      required
                      value={formEmpresa.nombre || ""}
                      onChange={(e) => setFormEmpresa({ ...formEmpresa, nombre: e.target.value })}
                      className="h-10 text-sm font-medium"
                      placeholder="Caja Comunal Emprende Chambala"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Nombre Comercial / Siglas</Label>
                    <Input
                      value={formEmpresa.nombreComercial || ""}
                      onChange={(e) => setFormEmpresa({ ...formEmpresa, nombreComercial: e.target.value })}
                      className="h-10 text-sm"
                      placeholder="UNICA Emprende Chambala"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Número de RUC *</Label>
                    <Input
                      required
                      value={formEmpresa.ruc || ""}
                      onChange={(e) => setFormEmpresa({ ...formEmpresa, ruc: e.target.value })}
                      className="h-10 text-sm font-mono"
                      maxLength={11}
                      placeholder="20608945123"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Fecha de Fundación Oficial *</Label>
                    <Input
                      type="date"
                      required
                      value={formEmpresa.fechaFundacion || ""}
                      onChange={(e) => setFormEmpresa({ ...formEmpresa, fechaFundacion: e.target.value })}
                      className="h-10 text-sm font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Fecha canónica institucional. Se jala automáticamente a la emisión formal de Certificados de Acciones.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Fecha de Emisión de Acciones (Opcional)</Label>
                    <Input
                      type="date"
                      value={formEmpresa.fechaEmisionAcciones || ""}
                      onChange={(e) => setFormEmpresa({ ...formEmpresa, fechaEmisionAcciones: e.target.value })}
                      className="h-10 text-sm font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Si se define, los certificados usarán esta fecha en lugar de la fecha de fundación.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Partida Registral SUNARP</Label>
                    <Input
                      value={formEmpresa.partidaRegistral || ""}
                      onChange={(e) => setFormEmpresa({ ...formEmpresa, partidaRegistral: e.target.value })}
                      className="h-10 text-sm"
                      placeholder="Partida N° 11048291"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Objeto Social y Reseña */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reseña, Misión y Objeto Social
              </h3>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Descripción General de la Organización</Label>
                <Textarea
                  rows={2}
                  value={formEmpresa.descripcion || ""}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, descripcion: e.target.value })}
                  className="text-sm"
                  placeholder="Organización comunal de crédito y ahorro..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Objeto Social Principal</Label>
                <Textarea
                  rows={2}
                  value={formEmpresa.objetoSocial || ""}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, objetoSocial: e.target.value })}
                  className="text-sm"
                  placeholder="Intermediación financiera comunal, custodia del ahorro..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Misión</Label>
                  <Textarea
                    rows={2}
                    value={formEmpresa.mision || ""}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, mision: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Visión</Label>
                  <Textarea
                    rows={2}
                    value={formEmpresa.vision || ""}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, vision: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Domicilio y Contacto */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación y Canales de Contacto
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label className="text-sm font-semibold">Dirección Legal / Sede</Label>
                  <Input
                    value={formEmpresa.direccion || ""}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, direccion: e.target.value })}
                    className="h-10 text-sm"
                    placeholder="Av. Principal S/N, Local Comunal de Chambala"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Distrito</Label>
                  <Input
                    value={formEmpresa.distrito || ""}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, distrito: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Provincia</Label>
                  <Input
                    value={formEmpresa.provincia || ""}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, provincia: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Departamento</Label>
                  <Input
                    value={formEmpresa.departamento || ""}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, departamento: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Teléfono</Label>
                  <Input
                    value={formEmpresa.telefono || ""}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, telefono: e.target.value })}
                    className="h-10 text-sm font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Correo Electrónico</Label>
                  <Input
                    type="email"
                    value={formEmpresa.email || ""}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, email: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Sitio Web</Label>
                  <Input
                    value={formEmpresa.sitioWeb || ""}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, sitioWeb: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Día de Reunión Mensual (Asamblea)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formEmpresa.diaReunion || 8}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, diaReunion: Number(e.target.value) })}
                    className="h-10 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Representación Legal */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Representación Legal
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label className="text-sm font-semibold">Nombres del Representante Legal</Label>
                  <Input
                    value={formEmpresa.representanteLegal || ""}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, representanteLegal: e.target.value })}
                    className="h-10 text-sm"
                    placeholder="PONCE HUILCAYA ADELA"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Cargo Institucional</Label>
                  <Input
                    value={formEmpresa.cargoRepresentante || ""}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, cargoRepresentante: e.target.value })}
                    className="h-10 text-sm"
                    placeholder="Presidenta de Junta Directiva"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">DNI del Representante</Label>
                  <Input
                    value={formEmpresa.numeroDocumentoRepresentante || ""}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, numeroDocumentoRepresentante: e.target.value })}
                    className="h-10 text-sm font-mono"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalEditarEmpresa(false)}
                disabled={guardando}
                className="h-10 px-5 text-sm"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando} className="h-10 px-5 text-sm font-semibold">
                {guardando ? "Guardando..." : "Guardar Datos de la Empresa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: REGISTRAR / EDITAR REUNIÓN Y ACTA */}
      {/* ========================================================================= */}
      <Dialog open={modalCrearActa} onOpenChange={setModalCrearActa}>
        <DialogContent className="w-full sm:max-w-4xl md:max-w-5xl lg:max-w-5xl max-h-[92vh] overflow-y-auto p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <BookOpen className="h-5 w-5 text-primary" />
              {modalActa ? "Editar Acta de Reunión" : "Registrar Nueva Reunión y Acta"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Registre los detalles de la asamblea, acuerdos adoptados y adjunte el acta digitalizada en PDF o imagen.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardarActa} className="space-y-6 pt-2">
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Datos de la Sesión / Reunión
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">N° de Acta *</Label>
                  <Input
                    required
                    value={formActa.numeroActa}
                    onChange={(e) => setFormActa({ ...formActa, numeroActa: e.target.value })}
                    placeholder="Acta N° 05-2024"
                    className="h-10 text-sm font-mono font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Tipo de Reunión *</Label>
                  <Select
                    value={formActa.tipo}
                    onValueChange={(val: any) => {
                      let titulo = "Asamblea General Ordinaria";
                      if (val === "EXTRAORDINARIA") titulo = "Asamblea General Extraordinaria";
                      if (val === "MENSUAL") titulo = "Reunión Mensual de Caja Comunal";
                      if (val === "DIRECTIVA") titulo = "Sesión de Junta Directiva";
                      setFormActa({ ...formActa, tipo: val, tipoTitulo: titulo });
                    }}
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORDINARIA">Asamblea General Ordinaria</SelectItem>
                      <SelectItem value="EXTRAORDINARIA">Asamblea General Extraordinaria</SelectItem>
                      <SelectItem value="MENSUAL">Reunión Mensual de Caja</SelectItem>
                      <SelectItem value="DIRECTIVA">Sesión de Junta Directiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Título de la Sesión *</Label>
                  <Input
                    required
                    value={formActa.tipoTitulo}
                    onChange={(e) => setFormActa({ ...formActa, tipoTitulo: e.target.value })}
                    placeholder="Asamblea General Anual..."
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Fecha de la Reunión *</Label>
                  <Input
                    type="date"
                    required
                    value={formActa.fecha}
                    onChange={(e) => setFormActa({ ...formActa, fecha: e.target.value })}
                    className="h-10 text-sm font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Hora de Inicio</Label>
                  <Input
                    type="time"
                    value={formActa.hora}
                    onChange={(e) => setFormActa({ ...formActa, hora: e.target.value })}
                    className="h-10 text-sm font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Lugar de la Sesión</Label>
                  <Input
                    value={formActa.lugar}
                    onChange={(e) => setFormActa({ ...formActa, lugar: e.target.value })}
                    placeholder="Local Comunal de Chambala"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Presidente que Dirige</Label>
                  <Input
                    value={formActa.presidente}
                    onChange={(e) => setFormActa({ ...formActa, presidente: e.target.value })}
                    placeholder="PONCE HUILCAYA ADELA"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Secretario de Actas</Label>
                  <Input
                    value={formActa.secretario}
                    onChange={(e) => setFormActa({ ...formActa, secretario: e.target.value })}
                    placeholder="MORAN LAIME CIRILO"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">N° Asistentes</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formActa.asistentes}
                      onChange={(e) => setFormActa({ ...formActa, asistentes: Number(e.target.value) })}
                      className="h-10 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">% Quórum</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formActa.quorumPorcentaje}
                      onChange={(e) => setFormActa({ ...formActa, quorumPorcentaje: Number(e.target.value) })}
                      className="h-10 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Agenda y Acuerdos */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2 flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Desarrollo de la Asamblea y Acuerdos
              </h3>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Agenda / Puntos Tratados (Un punto por línea)
                </Label>
                <Textarea
                  rows={3}
                  value={formActa.agendaTexto}
                  onChange={(e) => setFormActa({ ...formActa, agendaTexto: e.target.value })}
                  placeholder="1. Aprobación de balance anual&#10;2. Distribución de utilidades&#10;3. Solicitudes de crédito"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Acuerdos Adoptados y Resoluciones (Un acuerdo por línea)
                </Label>
                <Textarea
                  rows={4}
                  value={formActa.acuerdosTexto}
                  onChange={(e) => setFormActa({ ...formActa, acuerdosTexto: e.target.value })}
                  placeholder="Se aprueba por unanimidad el balance financiero...&#10;Se fija la fecha de pago de dividendos..."
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Resumen / Observaciones Adicionales</Label>
                <Input
                  value={formActa.resumen}
                  onChange={(e) => setFormActa({ ...formActa, resumen: e.target.value })}
                  placeholder="Breve reseña de la sesión..."
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Adjuntar Documento del Acta */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Acta Digitalizada (PDF o Imagen de Libro de Actas)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adjunte el archivo escaneado con las firmas de los comuneros (hasta 10MB)
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileActaRef}
                    onChange={handleActaFileUpload}
                    accept="application/pdf,image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 text-xs font-semibold"
                    onClick={() => fileActaRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 text-primary" />
                    {formActa.archivoNombre ? "Reemplazar Archivo" : "Subir Acta Digital"}
                  </Button>
                </div>
              </div>

              {formActa.archivoNombre ? (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-sm">
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-foreground">{formActa.archivoNombre}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {(formActa.archivoTamano / 1024).toFixed(1)} KB &bull; Adjunto listo para guardar
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      setFormActa({
                        ...formActa,
                        archivoNombre: "",
                        archivoTipo: "",
                        archivoTamano: 0,
                        archivoData: "",
                      })
                    }
                  >
                    Quitar
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileActaRef.current?.click()}
                  className="p-6 rounded-lg border-2 border-dashed text-center cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-medium">Haga clic para subir el acta escaneada (PDF o JPG/PNG)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permite tener el respaldo digital del libro comunal disponible para auditorías
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalCrearActa(false)}
                disabled={guardando}
                className="h-10 px-5 text-sm"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando} className="h-10 px-5 text-sm font-semibold">
                {guardando ? "Guardando..." : modalActa ? "Actualizar Acta" : "Guardar Acta de Reunión"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: CREAR / EDITAR ACCIONISTA HISTÓRICO */}
      {/* ========================================================================= */}
      <Dialog open={modalCrearAccionista} onOpenChange={setModalCrearAccionista}>
        <DialogContent className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Award className="h-5 w-5 text-amber-500" />
              {modalAccionista ? "Editar Accionista Fundador" : "Agregar Accionista Fundador"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registro histórico del comunero participante en la fundación de la Caja Comunal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardarAccionista} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">N° de Socio / Código *</Label>
                <Input
                  type="number"
                  required
                  value={formAccionista.codigo}
                  onChange={(e) => setFormAccionista({ ...formAccionista, codigo: Number(e.target.value) })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">DNI *</Label>
                <Input
                  required
                  value={formAccionista.documentoNumero}
                  onChange={(e) => setFormAccionista({ ...formAccionista, documentoNumero: e.target.value })}
                  maxLength={15}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nombres y Apellidos Completos *</Label>
              <Input
                required
                value={formAccionista.nombreCompleto}
                onChange={(e) => setFormAccionista({ ...formAccionista, nombreCompleto: e.target.value })}
                placeholder="Ej. MORAN LAIME CIRILO"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Acciones Fundacionales *</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={formAccionista.accionesFundacion}
                  onChange={(e) => {
                    const acc = Number(e.target.value);
                    setFormAccionista({
                      ...formAccionista,
                      accionesFundacion: acc,
                      capitalInicial: acc * 30,
                    });
                  }}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Capital Inicial (S/.) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formAccionista.capitalInicial}
                  onChange={(e) => setFormAccionista({ ...formAccionista, capitalInicial: Number(e.target.value) })}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Fecha de Ingreso / Fundación *</Label>
                <Input
                  type="date"
                  required
                  value={formAccionista.fechaIngreso}
                  onChange={(e) => setFormAccionista({ ...formAccionista, fechaIngreso: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Estado Actual</Label>
                <Select
                  value={formAccionista.estado}
                  onValueChange={(val: any) => setFormAccionista({ ...formAccionista, estado: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVO">Activo</SelectItem>
                    <SelectItem value="RETIRADO">Retirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Rol o Cargo en la Fundación</Label>
              <Input
                value={formAccionista.rolFundacion}
                onChange={(e) => setFormAccionista({ ...formAccionista, rolFundacion: e.target.value })}
                placeholder="Ej. Socio Fundador / Secretario Inicial"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Observaciones</Label>
              <Input
                value={formAccionista.observaciones}
                onChange={(e) => setFormAccionista({ ...formAccionista, observaciones: e.target.value })}
                placeholder="Notas de aportes o antecedentes..."
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalCrearAccionista(false)}
                disabled={guardando}
                className="h-9 text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando} className="h-9 text-xs font-semibold">
                {guardando ? "Guardando..." : "Guardar Accionista"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: PREVISUALIZAR ACTA DIGITALIZADA */}
      {/* ========================================================================= */}
      <Dialog open={!!docParaVer} onOpenChange={(open) => !open && setDocParaVer(null)}>
        <DialogContent className="w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base pr-6">
              <span className="truncate">{docParaVer?.nombre}</span>
              {docParaVer && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => descargarArchivo(docParaVer.nombre, docParaVer.data)}
                  className="h-7 gap-1 text-xs shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar Acta
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
                <p className="text-sm font-medium">Formato no previsualizable en navegador</p>
                <Button
                  size="sm"
                  onClick={() => docParaVer && descargarArchivo(docParaVer.nombre, docParaVer.data)}
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
