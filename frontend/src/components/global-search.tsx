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
  CommandSeparator,
} from "@/components/ui/command"
import { DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { 
  Search,
  Tachometer,
  ChartLine,
  Group,
  User,
  CreditCardAlt,
  ChevronRight

 } from "@boxicons/react"


export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

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
        <div className="flex items-center gap-2 text-muted-foreground">
          <Search className="size-5" />
          <span className="text-sm">Type to search...</span>
        </div>
      </Button>

      {/* Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <VisuallyHidden>
          <DialogTitle>Global Search</DialogTitle>
        </VisuallyHidden>

        {/* Input */}
        <div className="px-3">
          <CommandInput
            placeholder="Search pages, actions..."
            className="h-11 text-sm"
          />
        </div>

        <CommandList className="max-h-[400px] overflow-y-auto px-2 py-3">
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </CommandEmpty>

          {/* Dashboard */}
          <CommandGroup
            heading="Dashboard"
            className="px-2 text-xs font-semibold text-muted-foreground"
          >
            <CommandItem
              onSelect={() => router.push("/")}
              className="flex items-center gap-2 px-2 py-2 h-9 rounded-md cursor-pointer"
            >
              <Tachometer className="size-4 text-muted-foreground" />
              <span>Dashboard</span>
              <ChevronRight className="ml-auto size-3 opacity-40" />
            </CommandItem>

            <CommandItem
              onSelect={() => router.push("/analytics")}
              className="flex items-center gap-2 px-2 py-2 h-9 rounded-md"
            >
              <ChartLine className="size-4 text-muted-foreground" />
              <span>Analytics</span>
              <ChevronRight className="ml-auto size-3 opacity-40" />
            </CommandItem>

            <CommandItem
              onSelect={() => router.push("/crm")}
              className="flex items-center gap-2 px-2 py-2 h-9 rounded-md"
            >
              <Group className="size-4 text-muted-foreground" />
              <span>CRM</span>
              <ChevronRight className="ml-auto size-3 opacity-40" />
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="my-1"/>

          {/* Settings */}
          <CommandGroup
            heading="Settings"
            className="px-2 text-xs font-semibold text-muted-foreground"
          >
            <CommandItem
              onSelect={() => alert("Profile")}
              className="flex items-center gap-2 px-2 py-2 h-9 rounded-md"
            >
              <User className="size-4 text-muted-foreground" />
              <span>Profile</span>
              <ChevronRight className="ml-auto size-3 opacity-40" />
            </CommandItem>

            <CommandItem
              onSelect={() => alert("Billing")}
              className="flex items-center gap-2 px-2 py-2 h-9 rounded-md"
            >
              <CreditCardAlt className="size-4 text-muted-foreground" />
              <span>Billing</span>
              <ChevronRight className="ml-auto size-3 opacity-40" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}