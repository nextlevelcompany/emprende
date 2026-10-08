"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  ShieldCheck,
  LogOut,
} from "lucide-react"

export function UserDropdown() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Ignorar error de red
    }
    router.push("/login")
  }

  return (
    <DropdownMenu>
      {/* Trigger */}
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-3 cursor-pointer px-3 border-r border-l h-16 ml-3 hover:bg-muted/40 transition-colors">
          <Avatar className="h-9 w-9 border border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              AD
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col gap-0.5 text-left">
            <p className="text-xs font-semibold leading-none">Administrador</p>
            <p className="text-[10px] text-muted-foreground leading-none">Emprende Chambala</p>
          </div>
        </div>
      </DropdownMenuTrigger>

      {/* Content */}
      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl">
        {/* Header */}
        <DropdownMenuLabel className="rounded-lg p-2 bg-muted/60 mb-2">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                AD
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-semibold leading-tight">Administración</p>
              <p className="text-[10px] text-muted-foreground">admin@cajachambala.pe</p>
            </div>
          </div>
        </DropdownMenuLabel>

        {/* Items */}
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/analytics")}
          className="gap-2 text-xs h-8 cursor-pointer"
        >
          <LayoutDashboard className="size-4 text-muted-foreground" />
          Panel Principal
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/admin/auditoria")}
          className="gap-2 text-xs h-8 cursor-pointer"
        >
          <ShieldCheck className="size-4 text-muted-foreground" />
          Pista de Auditoría
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1.5" />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="gap-2 text-xs h-8 text-destructive focus:text-destructive cursor-pointer font-medium"
        >
          <LogOut className="size-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}