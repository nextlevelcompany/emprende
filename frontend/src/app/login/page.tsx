"use client";
import { getErrorMessage } from "@/lib/error-message";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function SocioLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ email, password, portal: "SOCIO" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.title || "Credenciales no válidas para socio");
      }

      router.push("/socio/mi-cuenta");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al iniciar sesión"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Caja Emprende Chambala
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Portal del Socio Comunal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="socio@cajachambala.pe"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-slate-400" />
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? (
              <span>Validando acceso...</span>
            ) : (
              <>
                <span>Ingresar al Portal de Socio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          ¿Eres directivo o administrador?{" "}
          <a href="/admin/login" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
            Ingreso de Administración aquí
          </a>
        </div>
      </div>
    </div>
  );
}
