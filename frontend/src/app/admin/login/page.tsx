"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, KeyRound, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin/socios";

  const [email, setEmail] = useState("admin@cajachambala.pe");
  const [password, setPassword] = useState("Admin12345678#Chambala");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portal: "ADMIN" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.title || "Credenciales no válidas para administrador");
      }

      if (data.mfaRequired) {
        setMfaToken(data.mfaToken);
      } else {
        router.push(from);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaToken) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaToken, code: totpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.title || "Código de verificación incorrecto");
      }

      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al verificar código MFA");
    } finally {
      setLoading(false);
    }
  };

  const prefillAdmin = () => {
    setEmail("admin@cajachambala.pe");
    setPassword("Admin12345678#Chambala");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto inline-flex p-3 rounded-2xl bg-primary/10 text-primary">
            <Shield className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Caja Emprende Chambala
          </CardTitle>
          <CardDescription>
            Portal de Administración y Control Contable
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {!mfaToken ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cajachambala.pe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="w-4 h-4 text-primary" />
                  Contraseña
                </label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>Validando acceso...</span>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={prefillAdmin}
                className="w-full text-xs text-muted-foreground gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Rellenar credenciales de Administrador inicial
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-xs flex items-center gap-2">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Ingresa el código TOTP de 6 dígitos de tu aplicación autenticadora.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Código de Autenticación TOTP
                </label>
                <Input
                  type="text"
                  required
                  autoFocus
                  maxLength={10}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="123456"
                  className="text-center tracking-widest font-mono text-lg"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || totpCode.length < 6}
                className="w-full cursor-pointer"
              >
                {loading ? "Verificando..." : "Verificar y Entrar"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMfaToken(null);
                  setTotpCode("");
                  setError(null);
                }}
                className="w-full text-xs text-muted-foreground cursor-pointer"
              >
                ← Volver a ingresar usuario
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="pt-0 text-center flex justify-center text-xs text-muted-foreground border-t p-4">
          ¿Eres socio comunal?{" "}
          <a href="/login" className="text-primary hover:underline font-medium ml-1">
            Ingresa al Portal de Socios
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando acceso...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
