"use client";
import { getErrorMessage } from "@/lib/error-message";

import * as React from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  HandCoins,
  History,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatFecha, formatSoles } from "@/lib/utils";
import { enriquecerSocioConDatosPersonales } from "@/lib/socios-datos-personales";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { descargarDocumentoPrestamoPDF } from "@/lib/prestamo-documento-pdf";
import {
  descargarCertificadoPDF,
  descargarCertificadosSocioPDF,
  type CertificadoAccionPDFData,
  type DirectivaCargoPDFData,
  type EmpresaPDFData,
} from "@/lib/certificados-pdf";

type Certificado = {
  id: string;
  numeroCertificado: number;
  socioId: string;
  socioCodigo?: number;
  serieInicio: number;
  serieFin: number;
  cantidad: number;
  valorNominal: number;
  totalMonto: number;
  fechaEmision: string;
  estado: string;
  tipoOrigen?: string;
  observaciones?: string | null;
};

type Cuota = {
  nroCuota: number;
  fechaVencimiento?: string;
  cuotaProgramada?: number;
  capitalProgramado?: number;
  interesProgramado?: number;
  totalPendiente?: number;
  saldoCapital?: number;
  capitalPagado?: number;
  interesPagado?: number;
  moraPagada?: number;
  estado?: string;
  fechaPago?: string;
};

type Prestamo = {
  id: string;
  numero?: number;
  numeroPrestamo?: number;
  montoPrincipal?: number;
  montoAprobado?: number;
  saldoCapital?: number;
  saldoPendiente?: number;
  tasaMensual?: number;
  nroCuotas?: number;
  cuotasTotal?: number;
  cuotasPagadas?: number;
  cuotasVencidas?: number;
  interesPagado?: number;
  fechaDesembolso?: string;
  fechaPrimeraCuota?: string;
  estado: string;
  proposito?: string;
  metodoAmortizacion?: string;
  cronograma?: Cuota[];
};

type Socio = {
  id: string;
  codigo: number;
  tipo?: string;
  nombreCompleto: string;
  nombres?: string;
  apellidos?: string;
  documentoTipo?: string;
  documentoNumero?: string;
  documentoEnmascarado?: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  fechaIngreso?: string;
  fechaRetiro?: string | null;
  estado: string;
  notas?: string | null;
};

type EstadoCuenta = {
  socio?: Record<string, unknown>;
  resumenFinanciero?: Record<string, number | null>;
  prestamos?: Record<string, unknown>[];
  utilidades?: UtilidadCuenta[];
  movimientos?: MovimientoCuenta[];
};

type UtilidadCuenta = { ejercicio: number | string; acciones: number | string; monto: number | string; fechaPago?: string | null; modalidad?: string | null };
type MovimientoCuenta = { nroRecibo?: string | number; fecha?: string | null; concepto?: string | null; tipo?: string | null; monto: number | string };

type ContextoCertificado = {
  directiva: DirectivaCargoPDFData[];
  empresa: EmpresaPDFData | null;
};

const cardClass = "rounded-2xl border border-border/70 bg-card p-5 shadow-sm";
const money = (value?: number | string | null) => formatSoles(Number(value || 0));
const normalizeLoanText = (value?: string | null) =>
  (value || "")
    .replace(/cr\?{1,2}dito/gi, (word) => `${word[0] === "C" ? "C" : "c"}rédito`)
    .replace(/pr\?{1,2}stamo/gi, (word) => `${word[0] === "P" ? "P" : "p"}réstamo`)
    .replace(/inter\?{1,2}s/gi, (word) => `${word[0] === "I" ? "I" : "i"}nterés`)
    .replace(/n\?{1,2}mero/gi, (word) => `${word[0] === "N" ? "N" : "n"}úmero`);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rowsFromResponse<T extends object = Record<string, unknown>>(data: unknown): T[] {
  if (Array.isArray(data)) return data.filter(isRecord) as unknown as T[];
  if (isRecord(data) && Array.isArray(data.content)) return data.content.filter(isRecord) as unknown as T[];
  return [];
}

export default function SocioMiCuentaPage() {
  const [loading, setLoading] = React.useState(true);
  const [socio, setSocio] = React.useState<Socio | null>(null);
  const [certificados, setCertificados] = React.useState<Certificado[]>([]);
  const [prestamos, setPrestamos] = React.useState<Prestamo[]>([]);
  const [estadoCuenta, setEstadoCuenta] = React.useState<EstadoCuenta | null>(null);
  const [contextoCertificado, setContextoCertificado] = React.useState<ContextoCertificado | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [prestamoBusqueda, setPrestamoBusqueda] = React.useState("");
  const [prestamoEstadoFiltro, setPrestamoEstadoFiltro] = React.useState("TODOS");

  const cargarDatos = React.useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      if (!meRes.ok) {
        window.location.assign("/login");
        return;
      }

      // All personal endpoints derive the member id from the authenticated session.
      const profileRes = await fetch("/api/socios/me", { cache: "no-store" });
      if (!profileRes.ok) {
        const body = await profileRes.json().catch(() => ({}));
        throw new Error(body.detail || "No se pudo cargar tu información personal.");
      }
      const profile = enriquecerSocioConDatosPersonales(await profileRes.json()) as Socio;
      setSocio(profile);

      const [certRes, loanRes, accountRes, certificateContextRes, directivaRes] = await Promise.all([
        fetch("/api/acciones/certificados", { cache: "no-store" }),
        fetch("/api/prestamos?size=100", { cache: "no-store" }),
        fetch("/api/reportes/mi-cuenta", { cache: "no-store" }),
        fetch("/api/socios/me/certificado-contexto", { cache: "no-store" }),
        fetch("/api/directiva?soloActivos=true", { cache: "no-store" }),
      ]);

      let certificadoContexto: ContextoCertificado | null = null;
      if (certificateContextRes.ok) {
        certificadoContexto = await certificateContextRes.json().catch(() => null);
      }
      if (!certificadoContexto) {
        const directiva = directivaRes.ok
          ? rowsFromResponse<DirectivaCargoPDFData>(await directivaRes.json().catch(() => []))
          : [];
        // Fallback compatible con el formato principal si el backend aún no publica el endpoint nuevo.
        certificadoContexto = { directiva, empresa: null };
      }
      setContextoCertificado(certificadoContexto);

      if (certRes.ok) {
        const certData = await certRes.json();
        setCertificados(rowsFromResponse<Certificado>(certData));
      } else {
        setCertificados([]);
        toast.error("No se pudieron cargar tus certificados de acciones.");
      }

      if (loanRes.ok) {
        const loanData = await loanRes.json();
        const loanRows = rowsFromResponse(loanData) as Prestamo[];
        const loansWithSchedule = await Promise.all(
          loanRows.map(async (loan) => {
            try {
              const detailRes = await fetch(`/api/prestamos/${encodeURIComponent(loan.id)}`, {
                cache: "no-store",
              });
              if (!detailRes.ok) return loan;
              const detail = await detailRes.json();
              const header = detail.prestamo || detail;
              return {
                ...loan,
                ...header,
                numeroPrestamo: header.numero,
                montoAprobado: header.montoPrincipal,
                saldoPendiente: header.saldoCapital,
                cuotasTotal: header.nroCuotas,
                cronograma: Array.isArray(detail.cronograma) ? detail.cronograma : [],
              } as Prestamo;
            } catch {
              return loan;
            }
          })
        );
        setPrestamos(loansWithSchedule);
      } else {
        setPrestamos([]);
        toast.error("No se pudieron cargar tus préstamos.");
      }

      if (accountRes.ok) {
        setEstadoCuenta(await accountRes.json());
      } else {
        setEstadoCuenta(null);
        toast.error("Tu perfil cargó, pero el estado de cuenta aún no está disponible.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? getErrorMessage(error, "Ocurrió un error") : "No se pudo cargar tu cuenta.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const certificadosVigentes = certificados.filter((cert) => cert.estado === "ACTIVO");
  const accionesVigentes = certificadosVigentes.reduce((sum, cert) => sum + Number(cert.cantidad || 0), 0);
  const capitalAcciones = certificadosVigentes.reduce((sum, cert) => sum + Number(cert.totalMonto || 0), 0);
  const prestamosVigentes = prestamos.filter((loan) => ["VIGENTE", "DESEMBOLSADO"].includes(loan.estado));
  const saldoPrestamos = prestamosVigentes.reduce(
    (sum, loan) => sum + Number(loan.saldoPendiente ?? loan.saldoCapital ?? 0),
    0
  );
  const prestamosFiltrados = prestamos.filter((loan) => {
    const termino = prestamoBusqueda.trim().toLowerCase();
    const coincideBusqueda = !termino || [
      loan.numeroPrestamo || loan.numero,
      normalizeLoanText(loan.proposito),
      loan.estado,
    ].some((value) => String(value ?? "").toLowerCase().includes(termino));
    return coincideBusqueda && (prestamoEstadoFiltro === "TODOS" || loan.estado === prestamoEstadoFiltro);
  });
  const capitalTotalPrestamos = prestamos.reduce((total, loan) => total + Number(loan.montoPrincipal ?? loan.montoAprobado ?? 0), 0);
  const interesesPagadosPrestamos = prestamos.reduce((total, loan) => total + Number(loan.interesPagado || 0), 0);
  const cuotasVencidasPrestamos = prestamos.reduce((total, loan) => total + Number(loan.cuotasVencidas || 0), 0);
  const progresoPrestamos = prestamos.map((loan) => {
    const capital = Number(loan.montoPrincipal ?? loan.montoAprobado ?? 0);
    const saldo = Math.max(0, Number(loan.saldoCapital ?? loan.saldoPendiente ?? capital));
    return {
      prestamo: `Préstamo ${loan.numeroPrestamo || loan.numero || ""}`,
      capitalPagado: Math.max(0, capital - saldo),
      saldoPendiente: saldo,
    };
  }).filter((loan) => loan.capitalPagado + loan.saldoPendiente > 0);
  const composicionCertificados = certificadosVigentes
    .map((cert) => ({ nombre: `Cert. ${cert.numeroCertificado}`, valor: Number(cert.totalMonto || 0) }))
    .filter((cert) => cert.valor > 0)
    .sort((a, b) => b.valor - a.valor);
  const certificadosGrafico = composicionCertificados.length > 6
    ? [...composicionCertificados.slice(0, 5), {
      nombre: "Otros certificados",
      valor: composicionCertificados.slice(5).reduce((total, cert) => total + cert.valor, 0),
    }]
    : composicionCertificados;
  const chartColors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

  const descargarCertificadosPdf = (items = certificados) => {
    if (!socio || items.length === 0) return;
    setExporting(true);
    try {
      // La carga del tablero ya prepara el contexto; los respaldos del generador
      // oficial permiten descargar aun si la ruta institucional no responde.
      const pdfContext = contextoCertificado || { directiva: [], empresa: null };
      const certificadosOficiales: CertificadoAccionPDFData[] = items.map((cert) => ({
        id: cert.id,
        numeroCertificado: cert.numeroCertificado,
        socioId: socio.id,
        socioCodigo: socio.codigo,
        socioNombre: socio.nombreCompleto,
        socioDocumentoTipo: socio.documentoTipo || "DNI",
        socioDocumentoNumero: socio.documentoNumero || socio.documentoEnmascarado || null,
        serieInicio: cert.serieInicio,
        serieFin: cert.serieFin,
        cantidad: cert.cantidad,
        valorNominal: cert.valorNominal,
        totalMonto: cert.totalMonto,
        fechaEmision: cert.fechaEmision,
        estado: cert.estado,
        tipoOrigen: cert.tipoOrigen,
      }));
      if (certificadosOficiales.length === 1) {
        descargarCertificadoPDF(
          certificadosOficiales[0],
          pdfContext.directiva,
          pdfContext.empresa
        );
      } else {
        descargarCertificadosSocioPDF(
          socio.nombreCompleto,
          certificadosOficiales,
          pdfContext.directiva,
          pdfContext.empresa
        );
      }
      toast.success(items.length === 1 ? "Certificado oficial descargado." : "Certificados oficiales descargados.");
    } catch {
      toast.error("No se pudo generar el certificado oficial en PDF.");
    } finally {
      setExporting(false);
    }
  };

  const descargarCronogramaPdf = async (loan: Prestamo) => {
    if (!socio) return;
    try {
      const detailRes = await fetch(`/api/prestamos/${encodeURIComponent(loan.id)}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!detailRes.ok) throw new Error("No se pudo obtener el cronograma actual del préstamo.");
      const detail = await detailRes.json();
      const latest = detail.prestamo || detail;
      const currentSchedule = Array.isArray(detail.cronograma) ? detail.cronograma : loan.cronograma || [];
      const currentLoan = { ...loan, ...latest, cronograma: currentSchedule };
      if (!currentSchedule?.length) throw new Error("Este préstamo no tiene un cronograma disponible.");

      const prestamoPDF = {
        prestamo: {
          id: currentLoan.id,
          numero: Number(currentLoan.numero ?? currentLoan.numeroPrestamo ?? loan.numero ?? loan.numeroPrestamo ?? 0),
          socioId: socio.id,
          socioCodigo: socio.codigo,
          socioNombreCompleto: socio.nombreCompleto,
          socioDocumento: socio.documentoNumero || socio.documentoEnmascarado || "",
          montoPrincipal: Number(currentLoan.montoPrincipal ?? currentLoan.montoAprobado ?? 0),
          tasaMensual: Number(currentLoan.tasaMensual || 0),
          nroCuotas: Number(currentLoan.nroCuotas ?? currentLoan.cuotasTotal ?? currentSchedule.length),
          metodoAmortizacion: currentLoan.metodoAmortizacion || "CUOTA_FIJA",
          fechaDesembolso: currentLoan.fechaDesembolso || "",
          fechaPrimeraCuota: currentLoan.fechaPrimeraCuota || "",
          estado: currentLoan.estado,
          proposito: normalizeLoanText(currentLoan.proposito) || null,
          capitalPagado: Number(currentLoan.capitalPagado || 0),
          saldoCapital: Number(currentLoan.saldoCapital ?? currentLoan.saldoPendiente ?? 0),
          interesPagado: Number(currentLoan.interesPagado || 0),
          cuotasPagadas: Number(currentLoan.cuotasPagadas || 0),
          cuotasVencidas: Number(currentLoan.cuotasVencidas || 0),
          createdAt: currentLoan.createdAt,
        },
        socio: {
          id: socio.id,
          codigo: socio.codigo,
          nombres: socio.nombres,
          apellidos: socio.apellidos,
          nombreCompleto: socio.nombreCompleto,
          documentoNumero: socio.documentoNumero || socio.documentoEnmascarado || null,
          documentoEnmascarado: socio.documentoEnmascarado || null,
          documentoTipo: socio.documentoTipo || null,
          telefono: socio.telefono || null,
          email: socio.email || null,
          direccion: socio.direccion || null,
          notas: socio.notas || null,
        },
        cronograma: currentSchedule.map((cuota: Cuota) => ({
          nroCuota: Number(cuota.nroCuota),
          fechaVencimiento: cuota.fechaVencimiento || "",
          capitalProgramado: Number(cuota.capitalProgramado || 0),
          interesProgramado: Number(cuota.interesProgramado || 0),
          cuotaProgramada: Number(cuota.cuotaProgramada || 0),
          capitalPagado: Number(cuota.capitalPagado || 0),
          interesPagado: Number(cuota.interesPagado || 0),
          moraPagada: Number(cuota.moraPagada || 0),
          saldoCapital: Number(cuota.saldoCapital || 0),
          estado: cuota.estado || "PENDIENTE",
          fechaPago: cuota.fechaPago || null,
        })),
        directiva: contextoCertificado?.directiva || [],
        empresa: contextoCertificado?.empresa,
      };
      descargarDocumentoPrestamoPDF(prestamoPDF);
      toast.success("Documento de crédito, pagaré y cronograma descargado.");
    } catch (error) {
      toast.error(error instanceof Error ? getErrorMessage(error, "Ocurrió un error") : "No se pudo descargar el cronograma actual.");
    }
  };

  if (loading && !socio) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" /> Cargando tu información…
        </div>
      </div>
    );
  }

  if (!socio) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center p-4">
        <div className={`${cardClass} max-w-md text-center`}>
          <AlertCircle className="mx-auto mb-3 size-10 text-destructive" />
          <h1 className="text-lg font-semibold">No se pudo cargar tu cuenta</h1>
          <p className="mt-2 text-sm text-muted-foreground">Actualiza la página o vuelve a ingresar para consultar tu información.</p>
          <button onClick={() => void cargarDatos()} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Intentar de nuevo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <section id="resumen" className="scroll-mt-24 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="size-3.5" /> Portal privado del socio
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Hola, {socio.nombres?.split(" ")[0] || socio.nombreCompleto.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Aquí tienes tus datos, certificados, préstamos e historial.</p>
          </div>
          <Button variant="outline" onClick={() => void cargarDatos()} disabled={loading} className="gap-2 self-start sm:self-auto">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} /> Actualizar
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<BadgeCheck className="size-5" />} label="Acciones vigentes" value={String(accionesVigentes)} detail={`${certificadosVigentes.length} certificados activos`} tone="amber" />
          <MetricCard icon={<CircleDollarSign className="size-5" />} label="Capital en acciones" value={money(capitalAcciones)} detail="Según certificados activos" tone="emerald" />
          <MetricCard icon={<HandCoins className="size-5" />} label="Préstamos activos" value={String(prestamosVigentes.length)} detail={`${prestamos.length} préstamos registrados`} tone="blue" />
          <MetricCard icon={<Clock3 className="size-5" />} label="Saldo por pagar" value={money(saldoPrestamos)} detail="Capital pendiente de préstamos activos" tone="violet" />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <article className={cardClass}>
            <h2 className="text-sm font-semibold">Progreso de mis préstamos</h2>
            <p className="mt-1 text-xs text-muted-foreground">Capital pagado y saldo pendiente por préstamo.</p>
            {progresoPrestamos.length === 0 ? <EmptyState compact text="No hay préstamos con montos para graficar." /> : (
              <div className="mt-4 h-64 w-full" role="img" aria-label="Gráfico de capital pagado y saldo pendiente por préstamo">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progresoPrestamos} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="prestamo" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(value) => `S/ ${Number(value).toLocaleString("es-PE")}`} tickLine={false} axisLine={false} width={78} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => money(Number(value || 0))} />
                    <Bar dataKey="capitalPagado" name="Capital pagado" stackId="capital" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="saldoPendiente" name="Saldo pendiente" stackId="capital" fill="#6366f1" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>

          <article className={cardClass}>
            <h2 className="text-sm font-semibold">Capital en certificados activos</h2>
            <p className="mt-1 text-xs text-muted-foreground">Distribución del monto de tus certificados vigentes.</p>
            {certificadosGrafico.length === 0 ? <EmptyState compact text="No hay certificados activos con montos para graficar." /> : (
              <div className="mt-4 flex h-64 w-full items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={certificadosGrafico} dataKey="valor" nameKey="nombre" innerRadius={58} outerRadius={92} paddingAngle={3}>
                      {certificadosGrafico.map((entry, index) => <Cell key={entry.nombre} fill={chartColors[index % chartColors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => money(Number(value || 0))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>
        </div>
      </section>

      <section id="perfil" className={`${cardClass} scroll-mt-24`}>
        <SectionHeading icon={<UserRound className="size-5" />} title="Mis datos personales" description="Información asociada a tu cuenta de socio." />
        <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
          <InfoField label="Nombre completo" value={socio.nombreCompleto} />
          <InfoField label={socio.documentoTipo || "Documento"} value={socio.documentoNumero || socio.documentoEnmascarado || "No registrado"} />
          <InfoField label="Código de socio" value={`SOCIO-${String(socio.codigo).padStart(3, "0")}`} />
          <InfoField icon={<Phone className="size-4" />} label="Teléfono" value={socio.telefono || "No registrado"} />
          <InfoField icon={<Mail className="size-4" />} label="Correo" value={socio.email || "No registrado"} />
          <InfoField icon={<MapPin className="size-4" />} label="Dirección" value={socio.direccion || "No registrada"} />
          <InfoField icon={<CalendarDays className="size-4" />} label="Fecha de ingreso" value={socio.fechaIngreso ? formatFecha(socio.fechaIngreso) : "—"} />
          <InfoField label="Estado" value={socio.estado} />
        </div>
      </section>

      <section id="certificados" className={`${cardClass} scroll-mt-24`}>
        <SectionHeading
          icon={<BadgeCheck className="size-5 text-amber-600" />}
          title="Mis certificados de acciones"
          description="Mismo formato y diseño oficial del registro principal de acciones."
          action={certificados.length > 0 ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => void descargarCertificadosPdf()} disabled={exporting}>
              <Download className="size-4" /> Descargar todos
            </Button>
          ) : undefined}
        />
        {certificados.length === 0 ? (
          <EmptyState icon={<BadgeCheck className="size-8" />} text="Aún no tienes certificados registrados." />
        ) : (
          <div className="mt-5 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[1000px] text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-semibold">N.º Certificado</th>
                  <th className="px-3 py-3 font-semibold">Series</th>
                  <th className="px-3 py-3 text-right font-semibold">Acciones</th>
                  <th className="px-3 py-3 text-right font-semibold">Capital</th>
                  <th className="px-3 py-3 text-center font-semibold">Fecha</th>
                  <th className="px-3 py-3 font-semibold">Origen</th>
                  <th className="px-3 py-3 text-center font-semibold">Estado</th>
                  <th className="px-3 py-3 text-center font-semibold">Documento</th>
                </tr>
              </thead>
              <tbody>
                {certificados.map((cert) => (
                  <tr key={cert.id} className="border-t transition-colors hover:bg-muted/30">
                    <td className="px-3 py-3 font-mono text-xs font-bold">CERT-{String(cert.numeroCertificado).padStart(6, "0")}</td>
                    <td className="px-3 py-3 font-mono text-xs"><span className="rounded border bg-muted px-2 py-1">#{cert.serieInicio} al #{cert.serieFin}</span></td>
                    <td className="px-3 py-3 text-right font-bold">{cert.cantidad}</td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{money(cert.totalMonto)}</td>
                    <td className="px-3 py-3 text-center font-mono text-muted-foreground">
                      {contextoCertificado?.empresa?.fechaFundacion
                        ? formatFecha(contextoCertificado.empresa.fechaFundacion)
                          : cert.fechaEmision ? formatFecha(cert.fechaEmision) : "—"}
                    </td>
                    <td className="px-3 py-3"><span className="rounded border px-2 py-1 text-[10px] uppercase">{(cert.tipoOrigen || "—").replace(/_/g, " ")}</span></td>
                    <td className="px-3 py-3 text-center">
                      <StatusBadge value={cert.estado === "DEVUELTO_RETIRO" ? "CANCELADO / DEVUELTO" : cert.estado} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 border-primary/30 px-2.5 text-xs font-medium text-primary shadow-sm hover:bg-primary/10" onClick={() => void descargarCertificadosPdf([cert])} disabled={exporting}>
                        <ArrowDownToLine className="size-3.5" /> Descargar PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="prestamos" className={`${cardClass} scroll-mt-24`}>
        <SectionHeading icon={<HandCoins className="size-5 text-blue-600" />} title="Mis préstamos" description="Vista de créditos y cronogramas con el mismo formato de listado que administración, limitada a tus propios préstamos." />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<CircleDollarSign className="size-5" />} label="Capital otorgado" value={money(capitalTotalPrestamos)} detail={`${prestamos.length} préstamos registrados`} tone="emerald" />
          <MetricCard icon={<CheckCircle2 className="size-5" />} label="Capital recuperado" value={money(Math.max(0, capitalTotalPrestamos - prestamos.reduce((total, loan) => total + Number(loan.saldoCapital ?? loan.saldoPendiente ?? 0), 0)))} detail={`${prestamos.filter((loan) => loan.estado === "CANCELADO").length} préstamos cancelados`} tone="blue" />
          <MetricCard icon={<CircleDollarSign className="size-5" />} label="Intereses pagados" value={money(interesesPagadosPrestamos)} detail="Intereses abonados en tus préstamos" tone="violet" />
          <MetricCard icon={<Clock3 className="size-5" />} label="Cuotas vencidas" value={String(cuotasVencidasPrestamos)} detail="Cuotas vencidas registradas a tu nombre" tone="amber" />
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Buscar préstamo</span>
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input value={prestamoBusqueda} onChange={(event) => setPrestamoBusqueda(event.target.value)} placeholder="Buscar por número, propósito o estado…" className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select value={prestamoEstadoFiltro} onChange={(event) => setPrestamoEstadoFiltro(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm md:w-56">
              <option value="TODOS">Todos los estados</option>
              {[...new Set(prestamos.map((loan) => loan.estado))].sort().map((estado) => <option key={estado} value={estado}>{estado.replace(/_/g, " ")}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border">
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
            <div><h3 className="text-sm font-semibold">Listado de mis créditos</h3><p className="text-xs text-muted-foreground">Cronogramas, pagos y descargas de tus préstamos.</p></div>
            <span className="text-xs text-muted-foreground">Total: {prestamosFiltrados.length}</span>
          </div>
          <div>
            <table className="w-full table-fixed text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground"><tr>
                <th className="w-12 px-2 py-3 font-semibold">N.º</th><th className="hidden px-3 py-3 font-semibold md:table-cell">Propósito</th><th className="hidden px-3 py-3 text-center font-semibold xl:table-cell">F. desembolso</th><th className="px-2 py-3 text-right font-semibold sm:px-3">Monto</th><th className="hidden px-3 py-3 text-center font-semibold lg:table-cell">Tasa mes</th><th className="hidden px-3 py-3 text-center font-semibold lg:table-cell">Plazo</th><th className="px-2 py-3 text-right font-semibold sm:px-3">Saldo</th><th className="hidden px-3 py-3 text-right font-semibold xl:table-cell">Interés pagado</th><th className="px-2 py-3 text-center font-semibold">Estado</th><th className="w-16 px-2 py-3 text-center font-semibold">PDF</th>
              </tr></thead>
              {loading ? <tbody><tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground"><RefreshCw className="mx-auto mb-2 size-5 animate-spin" />Cargando préstamos…</td></tr></tbody>
                : prestamosFiltrados.length === 0 ? <tbody><tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">{prestamos.length ? "No hay préstamos que coincidan con el filtro." : "No tienes préstamos registrados."}</td></tr></tbody>
                  : prestamosFiltrados.map((loan, index) => <tbody key={loan.id} className="divide-y">
                    <tr className="hover:bg-muted/20">
                      <td className="px-2 py-3 font-semibold text-primary">#{loan.numeroPrestamo || loan.numero || index + 1}</td>
                      <td className="hidden px-3 py-3 md:table-cell"><span className="block truncate font-medium" title={normalizeLoanText(loan.proposito)}>{normalizeLoanText(loan.proposito) || "Préstamo personal"}</span></td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-center font-mono text-muted-foreground xl:table-cell">{loan.fechaDesembolso ? formatFecha(loan.fechaDesembolso) : "—"}</td>
                      <td className="px-2 py-3 text-right font-medium sm:px-3">{money(loan.montoPrincipal ?? loan.montoAprobado)}</td>
                      <td className="hidden px-3 py-3 text-center lg:table-cell"><span className="rounded-full border px-2 py-1">{(Number(loan.tasaMensual || 0) * 100).toFixed(1)}%</span></td>
                      <td className="hidden px-3 py-3 text-center lg:table-cell">{loan.nroCuotas || loan.cuotasTotal || 0}</td>
                      <td className="px-2 py-3 text-right font-semibold text-rose-600 sm:px-3">{money(loan.saldoCapital ?? loan.saldoPendiente)}</td>
                      <td className="hidden px-3 py-3 text-right font-medium text-emerald-600 xl:table-cell">{money(loan.interesPagado)}</td>
                      <td className="px-2 py-3 text-center"><StatusBadge value={loan.estado} /></td>
                      <td className="px-2 py-3 text-center"><Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => void descargarCronogramaPdf(loan)} disabled={exporting} title="Descargar expediente, pagaré y cronograma"><ArrowDownToLine className="size-3.5" /><span className="sr-only">Descargar pagaré y cronograma</span></Button></td>
                    </tr>
                    <tr className="bg-muted/10"><td colSpan={10} className="p-0">
                      <details className="group">
                        <summary className="cursor-pointer list-none border-y px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5">Ver cronograma completo · {loan.cronograma?.length || 0} cuotas <span className="float-right text-muted-foreground group-open:hidden">Mostrar</span><span className="float-right hidden text-muted-foreground group-open:inline">Ocultar</span></summary>
                        <div className="border-b p-3 sm:p-4">
                          {(loan.cronograma?.length || 0) === 0 ? <p className="py-5 text-center text-sm text-muted-foreground">No hay cronograma disponible.</p> : <>
                            <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-medium">
                              <CuotaLegend color="emerald" label="Pagada" /><CuotaLegend color="blue" label="Parcial" /><CuotaLegend color="rose" label="Vencida" /><CuotaLegend color="amber" label="Pendiente" />
                            </div>
                            <div className="hidden md:block">
                              <table className="w-full table-fixed text-[10px] lg:text-xs">
                                <thead className="bg-muted/70 text-muted-foreground"><tr><th className="w-[6%] p-2 text-center">Cuota</th><th className="w-[11%] p-2 text-left">Vencimiento</th><th className="w-[10%] p-2 text-right">Capital prog.</th><th className="w-[10%] p-2 text-right">Interés prog.</th><th className="w-[10%] p-2 text-right">Total cuota</th><th className="w-[10%] p-2 text-right">Capital pagado</th><th className="w-[10%] p-2 text-right">Interés pagado</th><th className="w-[10%] p-2 text-right">Saldo deuda</th><th className="w-[10%] p-2 text-center">Estado</th><th className="w-[11%] p-2 text-center">Fecha pago</th></tr></thead>
                                <tbody>{loan.cronograma!.map((cuota) => <tr key={cuota.nroCuota} className={cn("border-b last:border-0", cuota.estado === "PAGADA" && "bg-emerald-500/5", cuota.estado === "VENCIDA" && "bg-rose-500/5", cuota.estado === "PARCIAL" && "bg-blue-500/5", (!cuota.estado || cuota.estado === "PENDIENTE") && "bg-amber-500/5")}>
                                  <td className="p-2 text-center font-bold">#{cuota.nroCuota}</td><td className="p-2">{cuota.fechaVencimiento ? formatFecha(cuota.fechaVencimiento) : "—"}</td><td className="p-2 text-right">{money(cuota.capitalProgramado)}</td><td className="p-2 text-right text-emerald-600">{money(cuota.interesProgramado)}</td><td className="p-2 text-right font-semibold">{money(cuota.cuotaProgramada)}</td><td className="p-2 text-right font-medium text-blue-600">{money(cuota.capitalPagado)}</td><td className="p-2 text-right font-medium text-emerald-600">{money(cuota.interesPagado)}</td><td className="p-2 text-right font-semibold text-rose-600">{money(cuota.totalPendiente ?? cuota.saldoCapital)}</td><td className="p-2 text-center"><CuotaStatusBadge value={cuota.estado || "PENDIENTE"} /></td><td className="p-2 text-center">{cuota.fechaPago ? formatFecha(cuota.fechaPago) : "—"}</td>
                                </tr>)}</tbody>
                              </table>
                            </div>
                            <div className="space-y-2 md:hidden">
                              {loan.cronograma!.map((cuota) => <article key={cuota.nroCuota} className={cn("rounded-lg border p-3", cuota.estado === "PAGADA" && "border-emerald-500/30 bg-emerald-500/5", cuota.estado === "VENCIDA" && "border-rose-500/30 bg-rose-500/5", cuota.estado === "PARCIAL" && "border-blue-500/30 bg-blue-500/5", (!cuota.estado || cuota.estado === "PENDIENTE") && "border-amber-500/30 bg-amber-500/5")}>
                                <div className="flex items-center justify-between"><span className="font-semibold">Cuota #{cuota.nroCuota} · {cuota.fechaVencimiento ? formatFecha(cuota.fechaVencimiento) : "—"}</span><CuotaStatusBadge value={cuota.estado || "PENDIENTE"} /></div>
                                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]"><QuotaAmount label="Capital programado" value={money(cuota.capitalProgramado)} /><QuotaAmount label="Interés programado" value={money(cuota.interesProgramado)} /><QuotaAmount label="Total cuota" value={money(cuota.cuotaProgramada)} /><QuotaAmount label="Capital pagado" value={money(cuota.capitalPagado)} /><QuotaAmount label="Interés pagado" value={money(cuota.interesPagado)} /><QuotaAmount label="Saldo deuda" value={money(cuota.totalPendiente ?? cuota.saldoCapital)} /><QuotaAmount label="Fecha de pago" value={cuota.fechaPago ? formatFecha(cuota.fechaPago) : "—"} /></div>
                              </article>)}
                            </div>
                          </>}
                        </div>
                      </details>
                    </td></tr>
                  </tbody>)}
            </table>
          </div>
        </div>
      </section>

      <section id="movimientos" className={`${cardClass} scroll-mt-24`}>
        <SectionHeading icon={<History className="size-5 text-primary" />} title="Movimientos y utilidades" description="Operaciones y utilidades que el estado de cuenta reporta para tu socio." />
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Utilidades recibidas</h3>
            {(estadoCuenta?.utilidades?.length || 0) === 0 ? <EmptyState compact text="No hay utilidades registradas." /> : (
              <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[520px] text-left text-xs">
                <thead className="bg-muted text-muted-foreground"><tr><th className="px-3 py-2">Ejercicio</th><th className="px-3 py-2">Acciones</th><th className="px-3 py-2">Monto</th><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Modalidad</th></tr></thead>
                <tbody>{estadoCuenta!.utilidades!.map((item, index) => <tr key={`${item.ejercicio}-${index}`} className="border-t"><td className="px-3 py-2">{item.ejercicio}</td><td className="px-3 py-2">{item.acciones}</td><td className="px-3 py-2">{money(item.monto)}</td><td className="px-3 py-2">{item.fechaPago ? formatFecha(item.fechaPago) : "—"}</td><td className="px-3 py-2">{item.modalidad || "—"}</td></tr>)}</tbody>
              </table></div>
            )}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Movimientos de caja</h3>
            {(estadoCuenta?.movimientos?.length || 0) === 0 ? <EmptyState compact text="No hay movimientos registrados." /> : (
              <div className="max-h-[360px] overflow-auto rounded-xl border"><table className="w-full min-w-[560px] text-left text-xs">
                <thead className="sticky top-0 bg-muted text-muted-foreground"><tr><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Concepto</th><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Monto</th></tr></thead>
                <tbody>{estadoCuenta!.movimientos!.map((item, index) => <tr key={`${item.nroRecibo}-${index}`} className="border-t"><td className="px-3 py-2">{item.fecha ? formatFecha(item.fecha) : "—"}</td><td className="px-3 py-2">{item.concepto || "—"}</td><td className="px-3 py-2">{item.tipo || "—"}</td><td className="px-3 py-2">{money(item.monto)}</td></tr>)}</tbody>
              </table></div>
            )}
          </div>
        </div>
      </section>

      <footer className="pb-2 text-center text-xs text-muted-foreground">Caja Emprende Chambala · Portal privado del socio</footer>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) {
  const tones: Record<string, string> = {
    amber: "bg-amber-500/10 text-amber-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    blue: "bg-blue-500/10 text-blue-600",
    violet: "bg-violet-500/10 text-violet-600",
  };
  return <article className={cardClass}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight">{value}</p></div><div className={cn("rounded-xl p-2.5", tones[tone])}>{icon}</div></div><p className="mt-3 text-xs text-muted-foreground">{detail}</p></article>;
}

function SectionHeading({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="mt-0.5 text-primary">{icon}</div><div><h2 className="font-semibold tracking-tight">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{description}</p></div></div>{action}</div>;
}

function InfoField({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return <div className="min-w-0"><p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{icon}{label}</p><p className="mt-1 break-words text-sm font-medium">{value}</p></div>;
}


function StatusBadge({ value }: { value: string }) {
  const active = ["ACTIVO", "VIGENTE", "DESEMBOLSADO", "PAGADA", "PAGADO"].includes(value);
  return <span className={cn("inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold", active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>
    {active && <CheckCircle2 className="size-3" />}{value}
  </span>;
}

function CuotaStatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    PAGADA: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    PARCIAL: "border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300",
    VENCIDA: "border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-300",
    PENDIENTE: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  };
  const label = value === "PAGADA" ? "Pagada" : value === "PARCIAL" ? "Parcial" : value === "VENCIDA" ? "Vencida" : "Pendiente";
  return <span className={cn("inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold", styles[value] || styles.PENDIENTE)}>{label}</span>;
}

function CuotaLegend({ color, label }: { color: "emerald" | "blue" | "rose" | "amber"; label: string }) {
  const styles = {
    emerald: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    blue: "border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300",
    rose: "border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-300",
    amber: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  };
  return <span className={cn("rounded-full border px-2 py-1", styles[color])}>{label}</span>;
}

function QuotaAmount({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="truncate text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-0.5 font-semibold tabular-nums">{value}</p></div>;
}

function EmptyState({ icon, text, compact = false }: { icon?: React.ReactNode; text: string; compact?: boolean }) {
  return <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 text-center text-muted-foreground", compact ? "min-h-24 p-4" : "mt-5 min-h-36 p-6")}>
    {icon && <div className="mb-2 opacity-40">{icon}</div>}<p className="text-sm">{text}</p>
  </div>;
}
