"use client"

import { useEffect, useState } from "react"

import { Menu } from "@boxicons/react"

import { AppSidebar } from "@/components/app-sidebar"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { AppLauncherDropdown } from "@/components/appLauncher-dropdown"
import { LanguageDropdown } from "@/components/language-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"
import { GlobalSearch } from "@/components/global-search"
import { UserDropdown } from "@/components/UserDropdown"
import { CartDropdown } from "@/components/CartDropdown"

import Footer from "@/components/layout/Footer"

import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

function LayoutContent({
  children,
  scrolled,
}: {
  children: React.ReactNode
  scrolled: boolean
}) {
  const { toggleSidebar } = useSidebar()

  return (
    <SidebarInset>
      <header
        className={cn(
          "sticky top-0 z-40 flex h-16 w-full shrink-0 items-center gap-2 border-b px-6 shadow-sm transition-all duration-200",
          scrolled
            ? "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md"
            : "bg-background"
        )}
      >
        {/* Left */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-10 w-10 rounded-full hover:bg-muted/60 transition-colors"
          >
            <Menu className="size-6 block shrink-0" />
          </Button>

          <GlobalSearch />
        </div>

        {/* Right */}
        <div className="ml-auto flex items-center gap-1">
          <LanguageDropdown />
          <ThemeToggle />
          <AppLauncherDropdown />
          <NotificationDropdown />
          <CartDropdown />
          <UserDropdown />
        </div>
      </header>

      <div className="flex flex-1 flex-col p-6 bg-muted">
        {children}
      </div>

      <Footer />
    </SidebarInset>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [scrolled, setScrolled] = useState(false)

  // Sidebar states
  const [open, setOpen] = useState(true)
  const [hovered, setHovered] = useState(false)

  const isExpanded = open || hovered

  // Header scroll effect
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", onScroll)

    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth >= 1024)
    }

    handleResize()

    window.addEventListener("resize", handleResize)

    return () =>
      window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <SidebarProvider
      open={isExpanded}
      onOpenChange={setOpen}
    >
      <AppSidebar onHoverChange={setHovered} />

      <LayoutContent scrolled={scrolled}>
        {children}
      </LayoutContent>
    </SidebarProvider>
  )
}