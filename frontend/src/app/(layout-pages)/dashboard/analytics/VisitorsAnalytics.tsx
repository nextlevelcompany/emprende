"use client"

import {ArrowUp, ShieldHalf, Leaf, Lightbulb, EllipsisVertical,
        LogOutIcon, SettingsIcon, UserIcon, CreditCardIcon } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export const description = "A bar chart with completion rate"

const chartData = [
  { month: "Jan", newVisitors: 180, oldVisitors: 90 },
  { month: "Feb", newVisitors: 240, oldVisitors: 120 },
  { month: "Mar", newVisitors: 320, oldVisitors: 150 },
  { month: "Apr", newVisitors: 280, oldVisitors: 130 },
  { month: "May", newVisitors: 360, oldVisitors: 170 },
  { month: "Jun", newVisitors: 300, oldVisitors: 160 },
]

const chartConfig = {
  newVisitors: {
    label: "New Visitors",
    color: "#2d7af5",
  },
  oldVisitors: {
    label: "Returning Visitors",
    color: "#7caeff",
  },
} satisfies ChartConfig

export default function VisitorsAnalytics() {
  return (
    <Card className="h-full w-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <p className="text-md font-medium text-muted-foreground">
            Visitors Analytics
          </p>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="text-4xl font-semibold">24.8K</h2>
            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
              <ArrowUp className="h-4 w-4" />
              18.4%
            </span>
          </div>
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

      <CardContent>
        {/* Mini bar chart */}
        <ChartContainer
  config={chartConfig}
  className="h-[240px] w-full"
>
  <BarChart
    accessibilityLayer
    data={chartData}
    barSize={34}
  >
    <CartesianGrid
      vertical={false}
    />

    <XAxis
      dataKey="month"
      tickLine={false}
      tickMargin={10}
      axisLine={false}
    />

    <ChartTooltip
      cursor={false}
      content={<ChartTooltipContent />}
    />

    {/* New Visitors */}
    <Bar
      dataKey="newVisitors"
      stackId="a"
      radius={[0, 0, 8, 8]}
      fill="var(--color-newVisitors)"
    />

    {/* Returning Visitors */}
    <Bar
      dataKey="oldVisitors"
      stackId="a"
      radius={[8, 8, 0, 0]}
      fill="var(--color-oldVisitors)"
    />

  </BarChart>
</ChartContainer>

        {/* Stats */}
        <div className="mt-6 space-y-5">

  {/* New Visitors */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-600 dark:bg-muted-500/20 dark:text-muted-400">
        <ShieldHalf className="h-5 w-5" />
      </div>

      <div>
        <p className="text-sm font-medium">
          New Visitors
        </p>

        <p className="text-xs text-muted-foreground">
          Last 30 days
        </p>
      </div>
    </div>

    <span className="text-sm font-medium text-green-600">
      +18.4%
    </span>
  </div>

  {/* Returning Visitors */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-600 dark:bg-muted-500/20 dark:text-muted-400">
        <Lightbulb className="h-5 w-5" />
      </div>

      <div>
        <p className="text-sm font-medium">
          Returning Visitors
        </p>

        <p className="text-xs text-muted-foreground">
          This month
        </p>
      </div>
    </div>

    <span className="text-sm font-medium text-green-600">
      +9.7%
    </span>
  </div>

  {/* Bounce Rate */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-600 dark:bg-muted-500/20 dark:text-muted-400">
        <Leaf className="h-5 w-5" />
      </div>

      <div>
        <p className="text-sm font-medium">
          Bounce Rate
        </p>

        <p className="text-xs text-muted-foreground">
          Average engagement
        </p>
      </div>
    </div>

    <span className="text-sm font-medium text-red-500">
      -2.8%
    </span>
  </div>

</div>
      </CardContent>
    </Card>
  )
}
