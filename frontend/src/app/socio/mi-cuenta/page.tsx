"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Coins,
  Calendar,
  LogOut,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  FileText,
  TrendingUp,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatFecha, formatSoles } from "@/lib/utils";
import { enriquecerSocioConDatosPersonales } from "@/lib/socios-datos-personales";

interface SocioPortalData {
  id: string;
  codigo: number;
  tipo: string;
  nombreCompleto: string;
  nombres?: string;
  apellidos?: string;
  documentoTipo?: string;
  documentoNumero?: string;
  numeroDocumento?: string;
  documentoEnmascarado?: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  fechaIngreso?: string;
  estado: string;
  notas?: string | null;
  // acciones
  accionesCantidad?: number;
  accionesValorNominal?: number;
  accionesTotalInvertido?: number;
  // préstamos
  prestamos?: PrestamoResumen[];
}

interface PrestamoResumen {
  id: string;
  numeroPrestamo?: number;
  montoAprobado: number;
  saldoPendiente?: number;
  cuotasMonto?: number;
  estado: string;
  fechaDesembolso?: string;
  cuotasTotal?: number;
  cuotasPagadas?: number;
}

export default function SocioMiCuentaPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [socio, setSocio] = React.useState<SocioPortalData | null>(null);
  const [acciones, setAcciones] = React.useState<any[]>([]);
  const [prestamos, setPrestamos] = React.useState<PrestamoResumen[]>([]);
  const [cerrando, setCerrando] = React.useState(false);

  const cargarDatos = React.useCallback(async () => {
    try {
      setLoading(true);

      // 1. Obtener perfil del usuario autenticado
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const me = await meRes.json();

      // El backend devuelve el socioId o id del socio vinculado
      const socioId = me.socioId || me.id;
      if (!socioId) {
        toast.error("No se encontró el perfil de socio vinculado a este usuario");
        return;
      }

      // 2. Obtener datos del socio
      const socioRes = await fetch(`/api/socios/${socioId}`, { cache: "no-store" });
      if (!socioRes.ok) {
        toast.error("Error al cargar tus datos de socio");
        return;
      }
      const socioData = await socioRes.json();
      const enriched = enriquecerSocioConDatosPersonales(socioData);
      setSocio(enriched as SocioPortalData);

      // 3. Obtener acciones del socio
      try {
        const accionesRes = await fetch(`/api/acciones/socios?socioId=${socioId}`, {
          cache: "no-store",
        });
        if (accionesRes.ok) {
          const accionesData = await accionesRes.json();
          const lista = Array.isArray(accionesData) ? accionesData : accionesData.content || [];
          setAcciones(lista);
        }
      } catch {
        // acciones opcionales
      }

      // 4. Obtener préstamos del socio
      try {
        const prestamosRes = await fetch(`/api/prestamos?socioId=${socioId}`, {
          cache: "no-store",
        });
        if (prestamosRes.ok) {
          const prestamosData = await prestamosRes.json();
          const lista = Array.isArray(prestamosData)
            ? prestamosData
            : prestamosData.content || [];
          setPrestamos(lista);
        }
      } catch {
        // préstamos opcionales
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cargar el portal");
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleLogout = async () => {
    try {
      setCerrando(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  // Totales de acciones
  const totalAcciones = acciones.reduce((s, a) => s + (a.cantidad || 0), 0);
  const totalInvertido = acciones.reduce(
    (s, a) => s + (a.totalMonto || a.cantidad * a.valorNominal || 0),
    0
  );

  // Préstamos activos
  const prestamosActivos = prestamos.filter(
    (p) => p.estado === "VIGENTE" || p.estado === "DESEMBOLSADO"
  );
  const totalDeuda = prestamosActivos.reduce(
    (s, p) => s + (p.saldoPendiente || p.montoAprobado || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
          <p className="text-sm text-slate-500">Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  if (!socio) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
          <h2 className="text-lg font-semibold">No se pudo cargar tu perfil</h2>
          <p className="text-sm text-slate-500">
            Tu sesión puede haber expirado. Por favor vuelve a ingresar.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  const dni =
    socio.documentoNumero ||
    socio.numeroDocumento ||
    socio.documentoEnmascarado ||
    "—";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Caja Emprende Chambala
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Portal del Socio</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={cerrando}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Saludo */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Hola, {socio.nombres?.split(" ")[0] || socio.nombreCompleto.split(" ").pop() || "Socio"} 👋
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Socio #{String(socio.codigo).padStart(3, "0")} &bull;{" "}
              <span
                className={cn(
                  "font-medium",
                  socio.estado === "ACTIVO"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {socio.estado}
              </span>
            </p>
          </div>
          <button
            onClick={cargarDatos}
            disabled={loading}
            title="Actualizar"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase font-semibold text-slate-400 tracking-wide">
                Mis Acciones
              </p>
              <Coins className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalAcciones}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalInvertido > 0 ? `${formatSoles(totalInvertido)} invertido` : "Sin acciones"}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase font-semibold text-slate-400 tracking-wide">
                Préstamos Activos
              </p>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {prestamosActivos.length}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalDeuda > 0 ? `${formatSoles(totalDeuda)} pendiente` : "Sin deuda activa"}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase font-semibold text-slate-400 tracking-wide">
                Miembro desde
              </p>
              <Calendar className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {socio.fechaIngreso ? formatFecha(socio.fechaIngreso) : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Fecha de ingreso</p>
          </div>
        </div>

        {/* Datos Personales */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Datos Personales</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p className="text-[11px] uppercase text-slate-400 font-medium">Nombre Completo</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {socio.nombreCompleto}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase text-slate-400 font-medium">
                {socio.documentoTipo || "DNI"}
              </p>
              <p className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {dni}
              </p>
            </div>

            {socio.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] uppercase text-slate-400 font-medium">Teléfono</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{socio.telefono}</p>
                </div>
              </div>
            )}

            {socio.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] uppercase text-slate-400 font-medium">Correo</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 break-all">{socio.email}</p>
                </div>
              </div>
            )}

            {socio.direccion && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] uppercase text-slate-400 font-medium">Dirección</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{socio.direccion}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mis Acciones */}
        {acciones.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Mis Certificados de Acciones</h3>
            </div>
            <div className="space-y-2">
              {acciones.map((a, i) => (
                <div
                  key={a.id || i}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Certificado N° {String(a.numeroCertificado || i + 1).padStart(3, "0")}
                    </p>
                    <p className="text-xs text-slate-400">
                      Series {a.serieInicio}–{a.serieFin} &bull;{" "}
                      {formatFecha(a.fechaEmision)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {a.cantidad} acciones
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatSoles(a.totalMonto || a.cantidad * a.valorNominal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between text-sm">
              <span className="text-slate-500">Total acciones</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {totalAcciones} acciones &bull; {formatSoles(totalInvertido)}
              </span>
            </div>
          </div>
        )}

        {/* Mis Préstamos */}
        {prestamos.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Mis Préstamos</h3>
            </div>
            <div className="space-y-2">
              {prestamos.map((p, i) => {
                const esActivo = p.estado === "VIGENTE" || p.estado === "DESEMBOLSADO";
                return (
                  <div
                    key={p.id || i}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border",
                      esActivo
                        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Préstamo #{p.numeroPrestamo || i + 1}
                          </p>
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                              esActivo
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                            )}
                          >
                            {p.estado}
                          </span>
                        </div>
                        {p.fechaDesembolso && (
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Desembolso: {formatFecha(p.fechaDesembolso)}
                          </p>
                        )}
                        {p.cuotasTotal && p.cuotasPagadas !== undefined && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Cuotas: {p.cuotasPagadas}/{p.cuotasTotal} pagadas
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatSoles(p.montoAprobado)}
                        </p>
                        {p.saldoPendiente !== undefined && esActivo && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Pendiente: {formatSoles(p.saldoPendiente)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mensaje si no hay acciones ni préstamos */}
        {acciones.length === 0 && prestamos.length === 0 && !loading && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <Coins className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-500">No hay movimientos registrados aún</p>
            <p className="text-xs text-slate-400 mt-1">
              Tus acciones y préstamos aparecerán aquí cuando estén registrados.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-xs text-slate-400">
            Caja Comunal Emprende Chambala &bull; Portal Seguro de Socios
          </p>
        </div>
      </main>
    </div>
  );
}
