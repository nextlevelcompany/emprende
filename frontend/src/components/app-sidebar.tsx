"use client"

import * as React from "react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NavMain, type NavMainItem } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  HandCoins,
  Coins,
  FileSpreadsheet,
  ShieldCheck,
  Landmark,
  Award,
  UserCheck,
  Building2,
} from "lucide-react"

// Cada punto de la Caja Comunal como elemento independiente en el menú
const navItems: NavMainItem[] = [
  {
    title: "Panel Principal",
    url: "/dashboard/analytics",
    icon: <LayoutDashboard className="size-5 shrink-0" />,
  },
  {
    title: "Datos de la Empresa",
    url: "/admin/empresa",
    icon: <Building2 className="size-5 shrink-0" />,
  },
  {
    title: "Padrón de Socios",
    url: "/admin/socios",
    icon: <Users className="size-5 shrink-0" />,
    items: [
      {
        title: "Directorio General",
        url: "/admin/socios",
      },
      {
        title: "Detalle y Estado de Cuenta",
        url: "/admin/socios/detalle",
      },
    ],
  },
  {
    title: "Junta Directiva",
    url: "/admin/directiva",
    icon: <UserCheck className="size-5 shrink-0" />,
  },
  {
    title: "Matrícula de Acciones",
    url: "/admin/acciones",
    icon: <Award className="size-5 shrink-0" />,
  },
  {
    title: "Periodos Contables",
    url: "/admin/periodos",
    icon: <CalendarDays className="size-5 shrink-0" />,
  },
  {
    title: "Préstamos y Créditos",
    url: "/admin/prestamos",
    icon: <HandCoins className="size-5 shrink-0" />,
  },
  {
    title: "Distribución de Utilidades",
    url: "/admin/utilidades",
    icon: <Coins className="size-5 shrink-0" />,
  },
  {
    title: "Reportes Oficiales",
    url: "/admin/reportes",
    icon: <FileSpreadsheet className="size-5 shrink-0" />,
  },
  {
    title: "Pista de Auditoría",
    url: "/admin/auditoria",
    icon: <ShieldCheck className="size-5 shrink-0" />,
  },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  onHoverChange?: (value: boolean) => void
}

export function AppSidebar({ onHoverChange, ...props }: AppSidebarProps) {
  return (
    <div
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <Sidebar collapsible="icon" {...props} className="shadow-lg z-50 overflow-hidden">
        <SidebarHeader className="h-16 justify-center px-3 border-b border-sidebar-border/40">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="p-2">
                <Link href="/dashboard/analytics">
                  <div className="flex aspect-square size-9 items-center justify-center mx-auto rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <Landmark className="size-5" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold tracking-tight text-foreground">
                      Emprende Chambala
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground font-medium">
                      Caja Comunal
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex min-h-full flex-col py-2">
              <SidebarGroup className="p-0">
                <SidebarGroupLabel className="px-5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80">
                  Operaciones
                </SidebarGroupLabel>
                <NavMain items={navItems} />
              </SidebarGroup>
            </div>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
    </div>
  )
}
