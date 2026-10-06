"use client"

import { GridCirclePlus } from "@boxicons/react"
import {
  FolderKanban,
  FileText, 
  Users,
  MessageCircle,
  ShoppingCart,
  CreditCard,
  Briefcase,
  Inbox,
  File,
  Calendar,
  Cloud,
  Store,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type AppItem = {
  icon: LucideIcon
  label: string
  color: string
}

const appItems: AppItem[] = [
  {
    icon: FolderKanban,
    label: "Projects",
    color: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-white",
  },
  {
    icon: FileText,
    label: "Invoice",
    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
  },
  {
    icon: Users,
    label: "Teams",
    color: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
  },
  {
    icon: MessageCircle,
    label: "Chat",
    color: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  },
  {
    icon: ShoppingCart,
    label: "Billing",
    color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
  },
  {
    icon: CreditCard,
    label: "Payment",
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  {
    icon: Briefcase,
    label: "Management",
    color: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
  },
  {
    icon: Inbox,
    label: "Inbox",
    color: "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
  },
  {
    icon: File,
    label: "Docs",
    color: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
  },
  {
    icon: Calendar,
    label: "Events",
    color: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400",
  },
  {
    icon: Cloud,
    label: "Cloud",
    color: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400",
  },
  {
    icon: Store,
    label: "Store",
    color: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    color: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400",
  },
  {
    icon: Settings,
    label: "Settings",
    color: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  },
]

export function AppLauncherDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-10 h-10"
        >
          <GridCirclePlus className="size-5" />
        </Button>
      </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[calc(100vw-0px)] sm:w-[320px] p-0 rounded-2xl overflow-hidden shadow-xl pop-in"
        >
        <ScrollArea className="h-[420px]">
          <div className="grid grid-cols-3 gap-2 p-3">
            {appItems.map((item, index) => {
              const Icon = item.icon

              return (
                <div
                  key={item.label}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-3 rounded-xl",
                    "hover:bg-muted transition-all duration-200 cursor-pointer",
                    (index + 1) % 2 === 0 && "border-r-0"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full",
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <span className="text-xs font-medium text-center">
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}