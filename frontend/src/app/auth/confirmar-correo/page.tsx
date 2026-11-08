"use client";
import { getErrorMessage } from "@/lib/error-message";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ConfirmarCorreoContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = React.useState("Confirmando la dirección nueva…");

  React.useEffect(() => {
    let active = true;
    if (!token) {
      setStatus("error");
      setMessage("El enlace está incompleto o ya fue utilizado.");
      return;
    }
    fetch("/api/auth/email-change/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "No se pudo confirmar el cambio de correo.");
      if (active) { setStatus("success"); setMessage("El correo de acceso se actualizó. Inicia sesión nuevamente con la dirección nueva."); }
    }).catch((error) => {
      if (active) { setStatus("error"); setMessage(error instanceof Error ? getErrorMessage(error, "Ocurrió un error") : "No se pudo confirmar el cambio."); }
    });
    return () => { active = false; };
  }, [token]);

  return <main className="flex min-h-[70vh] w-full items-center justify-center p-4">
    <Card className="w-full max-w-xl">
      <CardHeader className="items-center text-center">
        <span className={`mb-2 flex size-14 items-center justify-center rounded-2xl ${status === "success" ? "bg-emerald-500/10 text-emerald-600" : status === "error" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          {status === "loading" ? <Loader2 className="size-7 animate-spin" /> : status === "success" ? <CheckCircle2 className="size-7" /> : <AlertCircle className="size-7" />}
        </span>
        <CardTitle>{status === "loading" ? "Verificando correo" : status === "success" ? "Correo confirmado" : "No se pudo confirmar"}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        {status === "success" ? <Button asChild><Link href="/admin/login"><MailCheck className="mr-2 size-4" />Ir al acceso administrativo</Link></Button> : status === "error" ? <Button asChild variant="outline"><Link href="/admin/login">Volver al acceso</Link></Button> : null}
      </CardContent>
    </Card>
  </main>;
}

export default function ConfirmarCorreoPage() {
  return (
    <React.Suspense fallback={
      <main className="flex min-h-[70vh] w-full items-center justify-center p-4">
        <Loader2 className="size-7 animate-spin text-primary" />
      </main>
    }>
      <ConfirmarCorreoContent />
    </React.Suspense>
  );
}
