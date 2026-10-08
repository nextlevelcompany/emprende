"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  Search,
  LayoutDashboard,
  Users,
  CalendarDays,
  HandCoins,
  Coins,
  FileSpreadsheet,
  ShieldCheck,
  ChevronRight,
} from "lucide-react"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  return (
    <>
      {/* Mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full h-10 w-10 flex xl:hidden"
        onClick={() => setOpen(true)}
      >
        <Search className="size-5" />
      </Button>

      {/* Desktop */}
      <Button
        variant="ghost"
        className="hidden xl:flex items-center w-[240px] rounded-full gap-2 h-9 px-4 justify-between"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-2">
          <Search className="size-4" />
          <span className="text-xs text-muted-foreground">Buscar módulos...</span>
        </div>

        <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
          <span>⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <VisuallyHidden>
          <DialogTitle>Búsqueda Global Caja Comunal</DialogTitle>
        </VisuallyHidden>

        {/* Input */}
        <div className="px-3">
          <CommandInput
            placeholder="Buscar por módulo, socios, reportes, créditos..."
            className="h-11 text-sm"
          />
        </div>

        <CommandList className="max-h-[400px] overflow-y-auto px-2 py-3">
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            No se encontraron resultados.
          </CommandEmpty>

          <CommandGroup
            heading="Módulos de la Caja Comunal"
            className="px-2 text-xs font-semibold text-muted-foreground"
          >
            <CommandItem
              onSelect={() => handleSelect("/dashboard/analytics")}
              className="flex items-center gap-2 px-2 py-2 h-9 rounded-md cursor-pointer"
            >
              <LayoutDashboard className="size-4 text-muted-foreground" />
              <span>Panel Principal (Dashboard)</span>
              <ChevronRight className="ml-auto size-3 opacity-40" />
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/socios")}
              className="flex items-center gap-2 px-2 py-2 h-9 rounded-md cursor-pointer"
            >
              <Users className="size-4 text-muted-foreground" />
              <span>Padrón de Socios</span>
              <ChevronRight className="ml-auto size-3 opacity-40" />
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/periodos")}
              className="flex items-center gap-2 px-2 py-2 h-9 rounded-md cursor-pointer"
            >
              <CalendarDays className="size-4 text-muted-foreground" />
              <span>Periodos Contables y Asambleas</span>
              <ChevronRight className="ml-auto size-3 opacity-40" />
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/prestamos")}
              className="flex items-center gap-2 px-2 py-2 h-9 rounded-md cursor-pointer"
            >
              <HandCoins className="size-4 text-muted-foreground" />
              <span>Préstamos y Créditos</span>
              <ChevronRight className="ml-auto size-3 opacity-40" />
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/utilidades")}
              className="flex items-center gap-2 px-2 py-2 h-9 rounded-md cursor-pointer"
            >
              <Coins className="size-4 text-muted-foreground" />
              <span>Distribución de Utilidades</span>
              <ChevronRight className="ml-auto size-3 opacity-40" />
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/reportes")}
              className="flex items-center gap-2 px-2 py-2 h-9 rounded-md cursor-pointer"
            >
              <FileSpreadsheet className="size-4 text-muted-foreground" />
              <span>Reportes Oficiales (Libro de Caja y Estados de Cuenta)</span>
              <ChevronRight className="ml-auto size-3 opacity-40" />
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/auditoria")}
              className="flex items-center gap-2 px-2 py-2 h-9 rounded-md cursor-pointer"
            >
              <ShieldCheck className="size-4 text-muted-foreground" />
              <span>Pista de Auditoría</span>
              <ChevronRight className="ml-auto size-3 opacity-40" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}