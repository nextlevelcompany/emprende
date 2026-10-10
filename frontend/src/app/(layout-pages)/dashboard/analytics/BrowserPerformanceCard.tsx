"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"

import {
  EllipsisVertical,
  LogOutIcon,
  SettingsIcon,
  CreditCardIcon,
  UserIcon,
  Chrome,
  Globe,
  Compass,
  Monitor,
  Shield,
  Zap,
  Apple
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

/* ---------------------------------- */
/* Data */
/* ---------------------------------- */

const browsers = [
  {
    name: "Google Chrome",
    users: "58.4% Users",
    status: "Fast",
    growth: "+12.5%",
  },
  {
    name: "Safari",
    users: "21.8% Users",
    status: "Stable",
    growth: "+8.2%",
  },
  {
    name: "Mozilla Firefox",
    users: "9.6% Users",
    status: "Average",
    growth: "-2.4%",
  },
  {
    name: "Microsoft Edge",
    users: "6.2% Users",
    status: "Growing",
    growth: "+5.1%",
  },
  {
    name: "Opera Browser",
    users: "2.8% Users",
    status: "Low",
    growth: "-1.2%",
  },
  {
    name: "Brave Browser",
    users: "1.6% Users",
    status: "Trending",
    growth: "+6.8%",
  },
  {
    name: "Other",
    users: "1.4% Users",
    status: "Low",
    growth: "-0.8%",
  }
]

/* ---------------------------------- */
/* Status Styles */
/* ---------------------------------- */

const STATUS_STYLES: Record<string, string> = {
  Fast:
    "bg-green-100 text-green-700 border border-green-200 dark:border-green-500/20 dark:text-green-400",

  Stable:
    "bg-blue-100 text-blue-700 border border-blue-200 dark:border-blue-500/20 dark:text-blue-400",

  Average:
    "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:border-yellow-500/20 dark:text-yellow-400",

  Growing:
    "bg-purple-100 text-purple-700 border border-purple-200 dark:border-purple-500/20 dark:text-purple-400",

  Low:
    "bg-red-100 text-red-700 border border-red-200 dark:border-red-500/20 dark:text-red-400",

  Trending:
    "bg-cyan-100 text-cyan-700 border border-cyan-200 dark:border-cyan-500/20 dark:text-cyan-400",
}

/* ---------------------------------- */
/* Icon Mapping */
/* ---------------------------------- */

const ICON_MAP: Record<string, LucideIcon> = {
  "Google Chrome": Chrome,
  Safari: Compass,
  "Mozilla Firefox": Globe,
  "Microsoft Edge": Monitor,
  "Opera Browser": Shield,
  "Brave Browser": Zap,
  Other: Apple,
}

/* ---------------------------------- */
/* Color Classes */
/* ---------------------------------- */

const COLOR_CLASSES = [
  "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  "bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400",
  "bg-pink-100 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400",
]

const getColorByIndex = (index: number) =>
  COLOR_CLASSES[index % COLOR_CLASSES.length]

/* ---------------------------------- */
/* Component */
/* ---------------------------------- */

export default function BrowserPerformanceCard() {
  return (
    <Card className="h-auto w-full">
      
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <div>
          <CardTitle className="text-lg font-medium">
            Browser Performance
          </CardTitle>

          <CardDescription>
            Traffic analytics by browser
          </CardDescription>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full [&_svg]:size-5"
            >
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              View detailed report
            </DropdownMenuItem>

            <DropdownMenuItem>
              <CreditCardIcon className="mr-2 h-4 w-4" />
              Download report
            </DropdownMenuItem>

            <DropdownMenuItem>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Export as CSV / PDF
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Refresh data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {/* Content */}
      <CardContent className="px-3 mt-3">
        {browsers.map((item, index) => {
          const Icon = ICON_MAP[item.name] || Globe

          return (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-muted/50"
            >
              
              {/* Left */}
              <div className="flex items-center gap-3">
                
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    getColorByIndex(index)
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div>
                  <p className="text-sm font-medium leading-none">
                    {item.name}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.users}
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-3">
                
                <Badge
                  className={cn(
                    "pointer-events-none rounded-full px-3 text-xs font-medium shadow-none hover:shadow-none dark:bg-transparent",
                    STATUS_STYLES[item.status]
                  )}
                >
                  {item.status}
                </Badge>

                <span
                  className={cn(
                    "min-w-[52px] text-right text-sm font-semibold",
                    item.growth.startsWith("-")
                      ? "text-red-500"
                      : "text-green-600"
                  )}
                >
                  {item.growth}
                </span>

              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
