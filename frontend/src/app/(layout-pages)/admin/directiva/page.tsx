"use client";

import * as React from "react";
import Link from "next/link";
import {
  UserCheck,
  Award,
  Users,
  Shield,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Info,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface DirectivaCargo {
  id?: string;
  cargo: string;
  cargoTitulo: string;
  socioId: string | null;
  socioCodigo?: number | null;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  email: string;
  periodoInicio: string | null;
  periodoFin: string | null;
  activo: boolean;
  orden: number;
  observaciones: string;
}

interface SocioBasico {
  id: string;
  codigo: number;
  nombreCompleto: string;
  documentoTipo?: string;
  documentoNumero?: string;
  telefono?: string;
  email?: string;
  estado?: string;
}

export default function JuntaDirectivaPage() {
  const [cargos, setCargos] = React.useState<DirectivaCargo[]>([]);
  const [socios, setSocios] = React.useState<SocioBasico[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [guardando, setGuardando] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  const cargarDatos = React.useCallback(async () => {
    try {
      setCargando(true);
      const [resDirectiva, resSocios] = await Promise.all([
        fetch("/api/directiva"),
        fetch("/api/socios"),
      ]);

      if (resDirectiva.ok) {
        const dataDirectiva = await resDirectiva.json();
        const listaDirectiva = Array.isArray(dataDirectiva)
          ? dataDirectiva
          : Array.isArray(dataDirectiva?.content)
          ? dataDirectiva.content
          : [];

        setCargos(
          listaDirectiva && listaDirectiva.length > 0
            ? listaDirectiva
            : [
                {
                  cargo: "PRESIDENTE",
                  cargoTitulo: "Presidente",
                  socioId: null,
                  nombreCompleto: "PONCE HUILCAYA ADELA",
                  tipoDocumento: "DNI",
                  numeroDocumento: "09812345",
                  telefono: "",
                  email: "",
                  periodoInicio: null,
                  periodoFin: null,
                  activo: true,
                  orden: 1,
                  observaciones: "Representante legal y Presidenta",
                },
                {
                  cargo: "TESORERO",
                  cargoTitulo: "Tesorero(a)",
                  socioId: null,
                  nombreCompleto: "HUAMAN MORAN ALEJANDRA SILVIA",
                  tipoDocumento: "DNI",
                  numeroDocumento: "10876543",
                  telefono: "",
                  email: "",
                  periodoInicio: null,
                  periodoFin: null,
                  activo: true,
                  orden: 2,
                  observaciones: "Custodia de fondos y arqueo",
                },
                {
                  cargo: "SECRETARIO",
                  cargoTitulo: "Secretario(a)",
                  socioId: null,
                  nombreCompleto: "LAIME CCACCRO ANABEL MARIA",
                  tipoDocumento: "DNI",
                  numeroDocumento: "41765432",
                  telefono: "",
                  email: "",
                  periodoInicio: null,
                  periodoFin: null,
                  activo: true,
                  orden: 3,
                  observaciones: "Custodia de libros y actas",
                },
              ]
        );
      }

      if (resSocios.ok) {
        const dataSocios = await resSocios.json();
        const listaSocios = Array.isArray(dataSocios)
          ? dataSocios
          : Array.isArray(dataSocios?.content)
          ? dataSocios.content
          : [];
        setSocios(listaSocios);
      } else {
        setSocios([]);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cargar la junta directiva");
    } finally {
      setCargando(false);
      setIsDirty(false);
    }
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleChangeCargo = (index: number, campo: keyof DirectivaCargo, valor: any) => {
    setCargos((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [campo]: valor };
      return copy;
    });
    setIsDirty(true);
  };

  const handleSeleccionarSocio = (index: number, socioId: string) => {
    if (socioId === "none") {
      setCargos((prev) => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          socioId: null,
          socioCodigo: null,
        };
        return copy;
      });
      setIsDirty(true);
      return;
    }

    const lista = Array.isArray(socios) ? socios : [];
    const socio = lista.find((s) => s.id === socioId);
    if (!socio) return;

    setCargos((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        socioId: socio.id,
        socioCodigo: socio.codigo,
        nombreCompleto: socio.nombreCompleto,
        numeroDocumento: socio.documentoNumero || copy[index].numeroDocumento || "",
        telefono: socio.telefono || copy[index].telefono || "",
        email: socio.email || copy[index].email || "",
      };
      return copy;
    });
    setIsDirty(true);
  };

  const handleAgregarCargo = () => {
    const nuevoOrden = cargos.length + 1;
    setCargos((prev) => [
      ...prev,
      {
        cargo: `VOCAL_${nuevoOrden}`,
        cargoTitulo: `Vocal ${nuevoOrden - 3}`,
        socioId: null,
        nombreCompleto: "",
        tipoDocumento: "DNI",
        numeroDocumento: "",
        telefono: "",
        email: "",
        periodoInicio: null,
        periodoFin: null,
        activo: true,
        orden: nuevoOrden,
        observaciones: "",
      },
    ]);
    setIsDirty(true);
  };

  const handleEliminarCargo = (index: number) => {
    const cargo = cargos[index];
    if (["PRESIDENTE", "TESORERO", "SECRETARIO"].includes(cargo.cargo.toUpperCase())) {
      toast.error("Los 3 cargos principales (Presidente, Tesorero, Secretario) son estatutarios y requeridos para firmas.");
      return;
    }

    setCargos((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);

      // Validar que los cargos principales tengan nombre
      for (const c of cargos) {
        if (!c.nombreCompleto.trim()) {
          toast.error(`El cargo "${c.cargoTitulo}" debe tener un nombre asignado.`);
          setGuardando(false);
          return;
        }
      }

      const payload = {
        cargos: cargos.map((c, i) => ({
          id: c.id,
          cargo: c.cargo,
          cargoTitulo: c.cargoTitulo,
          socioId: c.socioId || null,
          nombreCompleto: c.nombreCompleto.trim(),
          tipoDocumento: c.tipoDocumento || "DNI",
          numeroDocumento: c.numeroDocumento ? c.numeroDocumento.trim() : "",
          telefono: c.telefono ? c.telefono.trim() : "",
          email: c.email ? c.email.trim() : "",
          periodoInicio: c.periodoInicio || null,
          periodoFin: c.periodoFin || null,
          activo: Boolean(c.activo),
          orden: i + 1,
          observaciones: c.observaciones || "",
        })),
      };

      const res = await fetch("/api/directiva", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.detail || resData.message || "Error al guardar directiva");
      }

      setCargos(resData);
      setIsDirty(false);
      toast.success("Junta Directiva guardada y actualizada exitosamente. Los certificados usarán estas firmas.");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar la junta directiva");
    } finally {
      setGuardando(false);
    }
  };

  const presidente = cargos.find((c) => c.cargo.toUpperCase().includes("PRESIDENTE"));
  const tesorero = cargos.find((c) => c.cargo.toUpperCase().includes("TESORERO"));
  const secretario = cargos.find((c) => c.cargo.toUpperCase().includes("SECRETARIO"));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserCheck className="size-6" />
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Junta Directiva y Cargos Oficiales
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Administración de cargos estatutarios (Presidente, Tesorero/a, Secretario/a).
            Esta información se refleja automáticamente en las <strong>firmas oficiales</strong> de los
            Certificados de Compra de Acciones, Actas de Asamblea y documentación oficial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarDatos}
            disabled={cargando || guardando}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-4", cargando && "animate-spin")} />
            Recargar
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleGuardar}
            disabled={cargando || guardando}
            className="gap-2 shadow-sm font-semibold"
          >
            <Save className="size-4" />
            {guardando ? "Guardando..." : "Guardar Directiva"}
          </Button>
        </div>
      </div>

      {isDirty && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <Info className="size-4 shrink-0 text-amber-600" />
            <span>Tiene modificaciones sin guardar en la directiva. Recuerde hacer clic en <strong>"Guardar Directiva"</strong>.</span>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs border-amber-500/50" onClick={handleGuardar}>
            Guardar Ahora
          </Button>
        </div>
      )}

      {/* Previsualización en Vivo de Firmas Oficiales para Certificados */}
      <Card className="border-2 border-primary/20 bg-muted/20 shadow-sm overflow-hidden">
        <CardHeader className="bg-card/50 pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="size-5 text-primary" />
                Previsualización de Firmas Institucionales (Certificados de Acciones)
              </CardTitle>
              <CardDescription className="text-xs">
                Así aparecerán las 3 firmas obligatorias en la impresión formal de los certificados nominativos:
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
              <Link href="/admin/acciones">
                <span>Ver Matrícula de Acciones</span>
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-6">
          <div className="max-w-3xl mx-auto bg-card border-2 border-double border-primary/30 p-6 md:p-8 rounded-lg shadow-inner">
            <div className="text-center mb-6">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground font-semibold">
                — DISPOSICIÓN OFICIAL DE FIRMAS PARA EMISIÓN DE TÍTULOS —
              </span>
            </div>

            {/* Bloque Superior: Presidente y Tesorero(a) */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs md:text-sm pt-4">
              {/* Presidente */}
              <div className="flex flex-col items-center">
                <div className="w-48 sm:w-56 border-b-2 border-foreground/70 pb-1 mb-2 font-mono text-center text-xs text-muted-foreground select-none">
                  ________________________
                </div>
                <div className="font-bold text-foreground tracking-wide uppercase">
                  {presidente?.nombreCompleto || "PRESIDENTE NO ASIGNADO"}
                </div>
                <div className="text-xs font-semibold text-primary mt-0.5">
                  {presidente?.cargoTitulo || "Presidente"}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {presidente?.tipoDocumento || "DNI"}: {presidente?.numeroDocumento || "—"}
                </div>
              </div>

              {/* Tesorero(a) */}
              <div className="flex flex-col items-center">
                <div className="w-48 sm:w-56 border-b-2 border-foreground/70 pb-1 mb-2 font-mono text-center text-xs text-muted-foreground select-none">
                  ________________________
                </div>
                <div className="font-bold text-foreground tracking-wide uppercase">
                  {tesorero?.nombreCompleto || "TESORERO(A) NO ASIGNADO"}
                </div>
                <div className="text-xs font-semibold text-primary mt-0.5">
                  {tesorero?.cargoTitulo || "Tesorero(a)"}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {tesorero?.tipoDocumento || "DNI"}: {tesorero?.numeroDocumento || "—"}
                </div>
              </div>
            </div>

            {/* Bloque Inferior Centrado: Secretario(a) */}
            <div className="mt-8 flex flex-col items-center text-center text-xs md:text-sm">
              <div className="w-48 sm:w-56 border-b-2 border-foreground/70 pb-1 mb-2 font-mono text-center text-xs text-muted-foreground select-none">
                ________________________
              </div>
              <div className="font-bold text-foreground tracking-wide uppercase">
                {secretario?.nombreCompleto || "SECRETARIO(A) NO ASIGNADO"}
              </div>
              <div className="text-xs font-semibold text-primary mt-0.5">
                {secretario?.cargoTitulo || "Secretario(a)"}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                {secretario?.tipoDocumento || "DNI"}: {secretario?.numeroDocumento || "—"}
              </div>
            </div>

            <div className="text-center mt-6 pt-3 border-t border-border/40 text-[11px] font-mono text-muted-foreground">
              NO NEGOCIABLE &bull; UNIÓN DE CRÉDITO Y AHORRO &bull; CAJA COMUNAL EMPRENDE CHAMBALA
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor de Cargos Estatutarios */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Titulares y Asignación de Cargos
          </h2>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAgregarCargo}
            className="gap-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            Agregar Cargo Adicional
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.isArray(cargos) &&
            cargos.map((cargo, idx) => {
            const esPrincipal = ["PRESIDENTE", "TESORERO", "SECRETARIO"].includes(
              cargo.cargo.toUpperCase()
            );

            return (
              <Card
                key={cargo.id || `${cargo.cargo}-${idx}`}
                className={cn(
                  "flex flex-col justify-between transition-shadow hover:shadow-md",
                  esPrincipal && "border-primary/40 bg-card"
                )}
              >
                <CardHeader className="pb-3 border-b border-border/30">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge
                          variant={esPrincipal ? "default" : "secondary"}
                          className="font-mono text-[10px] uppercase tracking-wider"
                        >
                          {cargo.cargo}
                        </Badge>
                        {cargo.activo && (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40">
                            Activo
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base font-bold text-foreground">
                        {cargo.cargoTitulo}
                      </CardTitle>
                    </div>

                    {!esPrincipal && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        onClick={() => handleEliminarCargo(idx)}
                        title="Eliminar cargo"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3.5 pt-4 text-xs">
                  {/* Selector rápido desde el Padrón de Socios */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                      <span>Vincular con Socio del Padrón</span>
                      {cargo.socioCodigo && (
                        <span className="text-primary font-mono text-[10px]">Socio #{cargo.socioCodigo}</span>
                      )}
                    </Label>
                    <Select
                      value={cargo.socioId || "none"}
                      onValueChange={(val) => handleSeleccionarSocio(idx, val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Seleccione del padrón..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        <SelectItem value="none">-- Sin vincular / Externo --</SelectItem>
                        {Array.isArray(socios) &&
                          socios.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              #{s.codigo} - {s.nombreCompleto}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nombre Completo */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Nombre Completo *
                    </Label>
                    <Input
                      value={cargo.nombreCompleto}
                      onChange={(e) => handleChangeCargo(idx, "nombreCompleto", e.target.value)}
                      placeholder="Ej. PONCE HUILCAYA ADELA"
                      className="h-8 text-xs font-medium uppercase"
                    />
                  </div>

                  {/* Documento de Identidad */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-muted-foreground">Tipo</Label>
                      <Input
                        value={cargo.tipoDocumento}
                        onChange={(e) => handleChangeCargo(idx, "tipoDocumento", e.target.value)}
                        placeholder="DNI"
                        className="h-8 text-xs font-mono uppercase"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[11px] font-semibold text-muted-foreground">Número Doc. *</Label>
                      <Input
                        value={cargo.numeroDocumento}
                        onChange={(e) => handleChangeCargo(idx, "numeroDocumento", e.target.value)}
                        placeholder="09812345"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Título formal para la firma */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Título formal para el sello/firma
                    </Label>
                    <Input
                      value={cargo.cargoTitulo}
                      onChange={(e) => handleChangeCargo(idx, "cargoTitulo", e.target.value)}
                      placeholder="Ej. Presidente / Tesorero(a)"
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Teléfono y Correo */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-muted-foreground">Teléfono</Label>
                      <Input
                        value={cargo.telefono || ""}
                        onChange={(e) => handleChangeCargo(idx, "telefono", e.target.value)}
                        placeholder="999888777"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-muted-foreground">Email</Label>
                      <Input
                        value={cargo.email || ""}
                        onChange={(e) => handleChangeCargo(idx, "email", e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Notas / Periodo
                    </Label>
                    <Input
                      value={cargo.observaciones || ""}
                      onChange={(e) => handleChangeCargo(idx, "observaciones", e.target.value)}
                      placeholder="Periodo 2024 - 2026 / Acta Asam. #12"
                      className="h-8 text-xs"
                    />
                  </div>
                </CardContent>

                <CardFooter className="pt-2 pb-3 border-t border-border/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`activo-${idx}`}
                      checked={cargo.activo}
                      onCheckedChange={(val) => handleChangeCargo(idx, "activo", val)}
                    />
                    <Label htmlFor={`activo-${idx}`} className="text-xs cursor-pointer">
                      {cargo.activo ? "Cargo Vigente" : "Inactivo"}
                    </Label>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Orden #{idx + 1}
                  </span>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
