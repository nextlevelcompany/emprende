"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Circle, CreditCardIcon, EllipsisVertical, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A multiple bar chart"

const chartData = [
  { month: "January", sales: 420, profit: 240 },
  { month: "February", sales: 680, profit: 390 },
  { month: "March", sales: 520, profit: 310 },
  { month: "April", sales: 760, profit: 480 },
  { month: "May", sales: 610, profit: 350 },
  { month: "June", sales: 830, profit: 520 },
  { month: "July", sales: 720, profit: 430 },
  { month: "August", sales: 940, profit: 610 },
]

const chartConfig = {
  sales: {
    label: "Sales",
    color: "var(--chart-1)",
  },
  profit: {
    label: "Profit",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export default function SalesOverviewCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-row items-center justify-between border-0 mb-6">
                <div>
                    <CardTitle className="text-lg mb-0">Sales Overview</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                        Business performance in last 8 months
                    </CardDescription>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full [&_svg]:size-5">
                            <EllipsisVertical />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <UserIcon />
                            View detailed report
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <CreditCardIcon />
                            Download report
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <SettingsIcon />
                            Export as CSV / PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <LogOutIcon />
                            Refresh data
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-6">

          {/* Total Sales */}
          <div>
            <p className="text-sm text-muted-foreground">
              Total Sales
            </p>

            <h2 className="text-xl font-semibold mt-2">
              $128K
            </h2>

            <p className="mt-2 text-sm font-medium text-green-500">
              ▲ 18.4% growth this month
            </p>
          </div>

          {/* Net Profit */}
          <div>
            <p className="text-sm text-muted-foreground">
              Net Profit
            </p>

            <h2 className="text-xl font-semibold mt-2">
              $48.2K
            </h2>

            <p className="mt-2 text-sm font-medium text-green-500">
              ▲ 9.7% from previous month
            </p>
          </div>

          {/* Conversion Rate */}
          <div>
            <p className="text-sm text-muted-foreground">
              Conversion Rate
            </p>

            <h2 className="text-xl font-semibold mt-2">
              6.8%
            </h2>

            <p className="mt-2 text-sm font-medium text-red-500">
              ▼ 1.2% lower than last month
            </p>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="max-h-[270px] w-full mt-6">
          <BarChart accessibilityLayer data={chartData} 
           barSize={18}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
            <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
          </BarChart>
        </ChartContainer>

        <div className="flex items-center justify-center gap-6 mt-3">

          {/* Sales */}
          <div className="flex items-center gap-2">
            <Circle className="size-3 fill-blue-300 text-blue-300" />

            <span className="text-sm font-medium">
              Sales
            </span>
          </div>

          {/* Profit */}
          <div className="flex items-center gap-2">
            <Circle className="size-3 fill-blue-500 text-blue-500" />

            <span className="text-sm font-medium">
              Profit
            </span>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
