"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Download,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  Landmark,
  History,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const sections = [
  { id: "resumen", title: "Resumen", icon: LayoutDashboard },
  { id: "perfil", title: "Mis datos", icon: UserRound },
  { id: "certificados", title: "Certificados de acciones", icon: BadgeCheck },
  { id: "prestamos", title: "Mis préstamos", icon: HandCoins },
  { id: "movimientos", title: "Movimientos y utilidades", icon: History },
  { id: "descargas", title: "Descargar información", icon: Download },
];

function SocioSidebar({
  activeSection,
  onLogout,
  loggingOut,
}: {
  activeSection: string;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="z-50 shadow-lg">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border/40 px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="p-2">
              <a href="#resumen" aria-label="Ir al resumen">
                <div className="mx-auto flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <Landmark className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight">Emprende Chambala</span>
                  <span className="truncate text-[11px] font-medium text-muted-foreground">Portal del socio</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Mi espacio
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1 px-3 py-2">
            {sections.map(({ id, title, icon: Icon }) => (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  asChild
                  isActive={activeSection === id}
                  tooltip={title}
                  className="h-10 px-3 text-[13px] font-medium tracking-tight"
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  <a href={`#${id}`}>
                    <Icon className="size-5 shrink-0" />
                    <span>{title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/40 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              disabled={loggingOut}
              tooltip="Cerrar sesión"
              className="h-10 px-3 text-[13px] font-medium text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-5 shrink-0" />
              <span>{loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function SocioHeader({ onLogout }: { onLogout: () => void }) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="size-10 rounded-full"
        aria-label="Abrir o cerrar menú"
      >
        <Menu className="size-5" />
      </Button>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">Mi cuenta</p>
        <p className="hidden text-xs text-muted-foreground sm:block">Información personal y financiera</p>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="size-10 rounded-full md:hidden" onClick={onLogout} aria-label="Cerrar sesión">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}

export default function SocioLayoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(true);
  const [activeSection, setActiveSection] = React.useState("resumen");
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = React.useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }, [loggingOut, router]);

  React.useEffect(() => {
    let sectionObserver: IntersectionObserver | undefined;
    const observeSections = () => {
      const targets = sections
        .map(({ id }) => document.getElementById(id))
        .filter((target): target is HTMLElement => target !== null);
      if (!targets.length || sectionObserver) return;

      sectionObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible) setActiveSection(visible.target.id);
        },
        { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.15, 0.4] }
      );
      targets.forEach((target) => sectionObserver?.observe(target));
    };

    observeSections();
    // The dashboard renders its sections after the authenticated data loads.
    const mutationObserver = new MutationObserver(observeSections);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    return () => {
      mutationObserver.disconnect();
      sectionObserver?.disconnect();
    };
  }, []);

  React.useEffect(() => {
    const syncWidth = () => setOpen(window.innerWidth >= 1024);
    syncWidth();
    window.addEventListener("resize", syncWidth);
    return () => window.removeEventListener("resize", syncWidth);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <SocioSidebar activeSection={activeSection} onLogout={handleLogout} loggingOut={loggingOut} />
        <SidebarInset className="min-w-0 max-w-full bg-muted">
          <SocioHeader onLogout={handleLogout} />
          <div className={cn("min-w-0 flex-1 p-4 md:p-6")}>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
