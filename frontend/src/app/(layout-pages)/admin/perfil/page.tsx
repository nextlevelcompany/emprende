"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, BadgeCheck, Building2, CheckCircle2, Fingerprint, KeyRound, Loader2, LockKeyhole, Mail, ShieldCheck, UserRound, Bell, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdminProfile = {
  id: string;
  cajaId?: string | null;
  email: string;
  role: string;
  status: string;
  socioId?: string | null;
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  displayName?: string | null;
  phone?: string | null;
  locale?: string;
  notificationsEnabled?: boolean;
  passwordChangedAt?: string | null;
  createdAt?: string | null;
  lastLoginAt?: string | null;
  pendingEmail?: string | null;
};

type MfaSetup = { secret: string; otpAuthUri: string };
const inputClass = "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring";

export default function AdminProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<AdminProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [displayName, setDisplayName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [locale, setLocale] = React.useState("es-PE");
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [profilePassword, setProfilePassword] = React.useState("");
  const [emailPassword, setEmailPassword] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [emailMfaCode, setEmailMfaCode] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordMfaCode, setPasswordMfaCode] = React.useState("");
  const [mfaSetup, setMfaSetup] = React.useState<MfaSetup | null>(null);
  const [mfaCode, setMfaCode] = React.useState("");
  const [mfaSetupPassword, setMfaSetupPassword] = React.useState("");
  const [disableMfaPassword, setDisableMfaPassword] = React.useState("");
  const [disableMfaCode, setDisableMfaCode] = React.useState("");
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);

  const readProfile = React.useCallback(async () => {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "No se pudieron cargar los datos de la sesión.");
    if (data.role !== "ADMIN") throw new Error("Esta página está disponible solo para administración.");
    setProfile(data as AdminProfile);
    setDisplayName(data.displayName || "");
    setPhone(data.phone || "");
    setLocale(data.locale || "es-PE");
    setNotificationsEnabled(data.notificationsEnabled !== false);
    return data as AdminProfile;
  }, []);

  React.useEffect(() => {
    let active = true;
    readProfile()
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "No se pudo cargar el perfil."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [readProfile]);

  const sendRequest = async (url: string, body: Record<string, unknown>) => {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || data.title || "No se pudo completar la operación.");
    return data;
  };

  const showError = (cause: unknown) => setFeedback({ type: "error", text: cause instanceof Error ? cause.message : "No se pudo completar la operación." });

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setFeedback(null);
    try {
      await sendRequest("/api/auth/admin/profile", { currentPassword: profilePassword, displayName, phone, locale, notificationsEnabled });
      setProfilePassword(""); await readProfile(); setFeedback({ type: "success", text: "Tus datos y preferencias se actualizaron." });
    } catch (cause) { showError(cause); } finally { setBusy(false); }
  };

  const requestEmailChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setFeedback(null);
    try {
      await sendRequest("/api/auth/admin/email-change", { currentPassword: emailPassword, newEmail, mfaCode: emailMfaCode || undefined });
      setEmailPassword(""); setEmailMfaCode(""); await readProfile();
      setFeedback({ type: "success", text: `Enviamos un enlace de verificación a ${newEmail}. El correo actual seguirá activo hasta que confirmes el enlace.` });
    } catch (cause) { showError(cause); } finally { setBusy(false); }
  };

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setFeedback(null);
    try {
      if (newPassword !== confirmPassword) throw new Error("La confirmación no coincide con la nueva contraseña.");
      await sendRequest("/api/auth/change-password", { currentPassword: currentPassword || undefined, newPassword, mfaCode: passwordMfaCode || undefined });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordMfaCode(""); await readProfile();
      setFeedback({ type: "success", text: "Contraseña cambiada. Las demás sesiones fueron cerradas." });
    } catch (cause) { showError(cause); } finally { setBusy(false); }
  };

  const startMfaSetup = async () => {
    setBusy(true); setFeedback(null);
    try { setMfaSetup(await sendRequest("/api/auth/mfa/setup", { currentPassword: mfaSetupPassword })); }
    catch (cause) { showError(cause); } finally { setBusy(false); }
  };

  const confirmMfaSetup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!mfaSetup) return; setBusy(true); setFeedback(null);
    try {
      const result = await sendRequest("/api/auth/mfa/confirm", { secret: mfaSetup.secret, code: mfaCode, currentPassword: mfaSetupPassword });
      setRecoveryCodes(result.recoveryCodes || []); setMfaSetup(null); setMfaCode(""); setMfaSetupPassword(""); await readProfile();
      setFeedback({ type: "success", text: "MFA quedó activado. Guarda los códigos de recuperación; solo se muestran ahora." });
    } catch (cause) { showError(cause); } finally { setBusy(false); }
  };

  const disableMfa = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setFeedback(null);
    try {
      await sendRequest("/api/auth/mfa/disable", { currentPassword: disableMfaPassword, code: disableMfaCode });
      router.push("/admin/login?motivo=mfa-desactivado");
    } catch (cause) { showError(cause); setBusy(false); }
  };

  return (
    <div className="w-full space-y-4 pb-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Volver"><ArrowLeft className="size-4" /></Button>
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Cuenta y seguridad</p><h1 className="mt-0.5 text-xl font-bold tracking-tight md:text-2xl">Datos del administrador</h1><p className="mt-0.5 text-xs text-muted-foreground">Información de la cuenta administrativa con la que ingresaste.</p></div>
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="flex min-h-72 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />Cargando datos de la sesión…</CardContent></Card>
      ) : error ? (
        <Card><CardContent className="flex min-h-72 flex-col items-center justify-center text-center"><span className="mb-4 rounded-full bg-destructive/10 p-3"><AlertCircle className="size-7 text-destructive" /></span><p className="max-w-lg text-sm text-muted-foreground">{error}</p><Button variant="outline" className="mt-5" onClick={() => router.push("/admin/login")}>Ir al acceso administrativo</Button></CardContent></Card>
      ) : profile ? (
        <>
          <Card className="overflow-hidden border-primary/15">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3 md:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><UserRound className="size-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold tracking-tight">{profile.displayName || "Cuenta administrativa"}</h2><StatusPill active={profile.status === "ACTIVE" || profile.status === "ACTIVO"} label={profile.status} /></div>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <div className="rounded-lg border bg-background/80 px-3 py-2 sm:min-w-36"><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Tipo de cuenta</p><p className="mt-0.5 flex items-center gap-2 text-xs font-semibold"><ShieldCheck className="size-3.5 text-primary" />{profile.role === "ADMIN" ? "Administrador" : profile.role}</p></div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="h-full">
              <CardHeader className="border-b px-4 py-3"><CardTitle className="flex items-center gap-2 text-sm"><UserRound className="size-4 text-primary" />Información de la cuenta</CardTitle><CardDescription className="text-xs">Datos básicos y estado de tu acceso.</CardDescription></CardHeader>
              <CardContent className="grid gap-2 p-3 md:grid-cols-2">
                <ProfileField icon={<Mail />} label="Correo electrónico" value={profile.email} />
                <ProfileField icon={<UserRound />} label="Nombre visible" value={profile.displayName || "No configurado"} />
                <ProfileField icon={<Smartphone />} label="Teléfono" value={profile.phone || "No configurado"} />
                <ProfileField icon={<ShieldCheck />} label="Rol asignado" value={profile.role === "ADMIN" ? "Administrador" : profile.role} />
                <ProfileField icon={<BadgeCheck />} label="Estado de la cuenta" value={profile.status} />
                <ProfileField label="Idioma" value={profile.locale || "es-PE"} />
                <ProfileField icon={<Bell />} label="Notificaciones" value={profile.notificationsEnabled ? "Activadas" : "Desactivadas"} />
                {profile.cajaId && <ProfileField icon={<Building2 />} label="Caja asociada" value={profile.cajaId} />}
                {profile.socioId && <ProfileField icon={<UserRound />} label="Socio vinculado" value={profile.socioId} />}
                <ProfileField icon={<Fingerprint />} label="Identificador de cuenta" value={profile.id} />
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="border-b px-4 py-3"><CardTitle className="flex items-center gap-2 text-sm"><LockKeyhole className="size-4 text-primary" />Seguridad de la cuenta</CardTitle><CardDescription className="text-xs">Configuración que la sesión informa actualmente.</CardDescription></CardHeader>
              <CardContent className="space-y-2 p-3">
                <SecurityRow icon={<KeyRound />} title="Verificación en dos pasos" detail={profile.mfaEnabled ? "La autenticación multifactor está activa." : "La autenticación multifactor no está activa."} enabled={profile.mfaEnabled} />
                <SecurityRow icon={<LockKeyhole />} title="Cambio de contraseña" detail={profile.mustChangePassword ? "El sistema requiere actualizar la contraseña." : "No hay un cambio obligatorio pendiente."} enabled={!profile.mustChangePassword} />
                <ProfileField label="Último cambio de contraseña" value={profile.passwordChangedAt ? new Date(profile.passwordChangedAt).toLocaleString("es-PE") : "—"} />
                <ProfileField label="Último acceso registrado" value={profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString("es-PE") : "Sin registro"} />
                <ProfileField label="Cuenta creada" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("es-PE") : "—"} />
                <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-[11px] leading-4 text-muted-foreground">Esta página solo muestra datos de sesión y referencias internas. Nunca muestra contraseñas, tokens de acceso ni secretos de autenticación.</div>
              </CardContent>
            </Card>
          </div>

          {feedback && <div role="status" aria-live="polite" className={`rounded-xl border p-4 text-sm ${feedback.type === "success" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>{feedback.text}</div>}

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader className="border-b px-4 py-3"><CardTitle className="flex items-center gap-2 text-sm"><UserRound className="size-4 text-primary" />Datos visibles y preferencias</CardTitle><CardDescription className="text-xs">Nombre, teléfono y preferencias de esta cuenta.</CardDescription></CardHeader>
              <CardContent className="p-4">
                <form onSubmit={saveProfile} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Nombre visible"><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} placeholder="Nombre para mostrar" className={inputClass} /></Field>
                    <Field label="Teléfono de contacto"><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder="+51 999 999 999" className={inputClass} /></Field>
                    <Field label="Idioma"><select value={locale} onChange={(e) => setLocale(e.target.value)} className={inputClass}><option value="es-PE">Español (Perú)</option><option value="en-US">English (United States)</option></select></Field>
                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-3"><span><span className="block text-sm font-medium">Notificaciones</span><span className="text-xs text-muted-foreground">Preferencia de esta cuenta</span></span><input type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} className="size-4 accent-primary" /></label>
                  </div>
                  <Field label="Confirma con tu contraseña actual"><input type="password" autoComplete="current-password" required value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} className={inputClass} /></Field>
                  <Button type="submit" disabled={busy}>{busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Guardar datos y preferencias</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b px-4 py-3"><CardTitle className="flex items-center gap-2 text-sm"><Mail className="size-4 text-primary" />Correo de acceso</CardTitle><CardDescription className="text-xs">Se aplica después de verificar el correo nuevo.</CardDescription></CardHeader>
              <CardContent className="space-y-3 p-4">
                <div className="rounded-lg bg-muted/40 p-3 text-sm"><span className="text-muted-foreground">Actual:</span> <span className="font-semibold">{profile.email}</span>{profile.pendingEmail && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Verificación pendiente para {profile.pendingEmail}.</p>}</div>
                <form onSubmit={requestEmailChange} className="space-y-3">
                  <Field label="Correo nuevo"><input type="email" autoComplete="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nombre@dominio.com" className={inputClass} /></Field>
                  <Field label="Contraseña actual"><input type="password" autoComplete="current-password" required value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} className={inputClass} /></Field>
                  {profile.mfaEnabled && <Field label="Código de autenticación"><input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={emailMfaCode} onChange={(e) => setEmailMfaCode(e.target.value)} placeholder="6 dígitos" className={inputClass} /></Field>}
                  <p className="text-xs leading-5 text-muted-foreground">La solicitud requiere contraseña actual{profile.mfaEnabled ? " y MFA" : ""}. Al confirmar, se cerrarán las sesiones abiertas y se notificará a tu correo anterior.</p>
                  <Button type="submit" variant="outline" disabled={busy}>{busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Enviar verificación</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b px-4 py-3"><CardTitle className="flex items-center gap-2 text-sm"><LockKeyhole className="size-4 text-primary" />Cambiar contraseña</CardTitle><CardDescription className="text-xs">Requiere contraseña actual y MFA si está activado.</CardDescription></CardHeader>
              <CardContent className="p-4">
                <form onSubmit={changePassword} className="space-y-3">
                  {!profile.mustChangePassword && <Field label="Contraseña actual"><input type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} /></Field>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nueva contraseña"><input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} /></Field>
                    <Field label="Confirmar contraseña"><input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} /></Field>
                  </div>
                  {profile.mfaEnabled && <Field label="Código de autenticación"><input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={passwordMfaCode} onChange={(e) => setPasswordMfaCode(e.target.value)} placeholder="6 dígitos" className={inputClass} /></Field>}
                  <p className="text-xs text-muted-foreground">Mínimo 12 caracteres; no puede ser igual a la contraseña anterior ni contener el usuario del correo.</p>
                  <Button type="submit" disabled={busy}>{busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Actualizar contraseña</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b px-4 py-3"><CardTitle className="flex items-center gap-2 text-sm"><Smartphone className="size-4 text-primary" />Verificación en dos pasos</CardTitle><CardDescription className="text-xs">Autenticador y códigos de recuperación.</CardDescription></CardHeader>
              <CardContent className="space-y-3 p-4">
                {!profile.mfaEnabled && !mfaSetup && <><p className="text-sm text-muted-foreground">Al activarla, se exigirá un código temporal al iniciar sesión y confirmar operaciones sensibles.</p><Field label="Confirma con tu contraseña actual"><input type="password" autoComplete="current-password" required value={mfaSetupPassword} onChange={(e) => setMfaSetupPassword(e.target.value)} className={inputClass} /></Field><Button type="button" variant="outline" onClick={() => void startMfaSetup()} disabled={busy || !mfaSetupPassword}>{busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Configurar MFA</Button></>}
                {!profile.mfaEnabled && mfaSetup && <form onSubmit={confirmMfaSetup} className="space-y-4">
                  <div className="rounded-xl border bg-muted/30 p-4"><p className="text-sm font-semibold">1. Agrega la cuenta a tu autenticador</p><p className="mt-1 text-xs text-muted-foreground">Escanea el URI o ingresa esta clave en una aplicación compatible con TOTP.</p><code className="mt-3 block break-all rounded-lg bg-background p-3 text-sm font-bold tracking-wider">{mfaSetup.secret}</code><details className="mt-3"><summary className="cursor-pointer text-xs font-medium text-primary">Mostrar URI de configuración</summary><code className="mt-2 block break-all text-[10px] text-muted-foreground">{mfaSetup.otpAuthUri}</code></details></div>
                  <Field label="2. Ingresa el código de 6 dígitos para confirmar"><input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} className={inputClass} /></Field>
                  <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}>Confirmar y activar</Button><Button type="button" variant="ghost" onClick={() => { setMfaSetup(null); setMfaCode(""); setMfaSetupPassword(""); }}>Cancelar</Button></div>
                </form>}
                {profile.mfaEnabled && <form onSubmit={disableMfa} className="space-y-4">
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">MFA está activa en esta cuenta.</div>
                  <Field label="Contraseña actual"><input type="password" autoComplete="current-password" required value={disableMfaPassword} onChange={(e) => setDisableMfaPassword(e.target.value)} className={inputClass} /></Field>
                  <Field label="Código actual del autenticador"><input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={disableMfaCode} onChange={(e) => setDisableMfaCode(e.target.value)} className={inputClass} /></Field>
                  <Button type="submit" variant="destructive" disabled={busy}>{busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Desactivar MFA y cerrar sesiones</Button>
                </form>}
                {recoveryCodes.length > 0 && <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Códigos de recuperación · guardar ahora</p><p className="mt-1 text-xs text-muted-foreground">Cada código se usa una sola vez. No volverán a mostrarse.</p><div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">{recoveryCodes.map((code) => <code key={code} className="rounded border bg-background p-2 text-center">{code}</code>)}</div><Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setRecoveryCodes([])}>Ya los guardé</Button></div>}
              </CardContent>
            </Card>
          </div>
          <p className="text-xs text-muted-foreground">Los cambios de perfil se registran en auditoría. El nombre visible, teléfono e idioma no alteran permisos, roles ni datos de socios.</p>
        </>
      ) : null}
    </div>
  );
}

function ProfileField({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-card p-2.5 transition-colors hover:bg-muted/20">
    {icon && <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&>svg]:size-3.5">{icon}</span>}
    <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-0.5 break-all text-xs font-semibold leading-4">{value || "—"}</p></div>
  </div>;
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${active ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
    <span className={`size-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-amber-500"}`} />{label}
  </span>;
}

function SecurityRow({ icon, title, detail, enabled }: { icon: React.ReactNode; title: string; detail: string; enabled: boolean }) {
  return <div className="flex items-start gap-2 rounded-lg border p-2.5">
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&>svg]:size-3.5">{icon}</span>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold">{title}</p><span className={`inline-flex items-center gap-1 text-[9px] font-semibold ${enabled ? "text-emerald-600" : "text-amber-600"}`}>{enabled ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}{enabled ? "Correcto" : "Revisar"}</span></div><p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{detail}</p></div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-[11px] font-medium text-muted-foreground">{label}</span>{children}</label>;
}
