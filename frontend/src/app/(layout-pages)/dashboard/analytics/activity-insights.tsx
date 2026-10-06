"use client"
import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"

import { Calendar } from "@/components/ui/calendar"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "An area chart with gradient fill"

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 173, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
  { month: "July", desktop: 278, mobile: 180 },
  { month: "August", desktop: 320, mobile: 240 },
  { month: "September", desktop: 289, mobile: 210 },
  { month: "October", desktop: 356, mobile: 260 },
  { month: "November", desktop: 398, mobile: 310 },
  { month: "December", desktop: 420, mobile: 340 },
]

const chartConfig = {
  desktop: {
    label: "Views",
  },
  mobile: {
    label: "Clicks",
  },
} satisfies ChartConfig

export default function ActivityInsights() {

  const [fromDate, setFromDate] = React.useState<Date>()
  const [toDate, setToDate] = React.useState<Date>()

  return (
    <Card className="w-full border-0 shadow-none bg-transparent">
      <CardHeader className="flex flex-col gap-4 border-b p-0 lg:flex-row lg:items-center lg:justify-between">

        {/* Left Content */}
        <div>
          <CardTitle className="text-xl font-medium">
            Audience Overview
          </CardTitle>

          <CardDescription className="text-sm text-muted-foreground">
            Overview of users and activities
          </CardDescription>
        </div>

        {/* Right Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

          {/* From Date */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium whitespace-nowrap">
              From Date
            </label>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[220px] justify-between rounded-lg h-9 font-normal"
                  )}
                >
                  {fromDate ? (
                    format(fromDate, "PPP")
                  ) : (
                    <span>Select date</span>
                  )}

                  <CalendarIcon className="h-4 w-4 opacity-60" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                className="w-auto p-0"
                align="end"
              >
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium whitespace-nowrap">
              To Date
            </label>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[220px] justify-between rounded-lg h-9 font-normal"
                  )}
                >
                  {toDate ? (
                    format(toDate, "PPP")
                  ) : (
                    <span>Select date</span>
                  )}

                  <CalendarIcon className="h-4 w-4 opacity-60" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                className="w-auto p-0"
                align="end"
              >
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

        </div>
      </CardHeader>
      <CardContent className="px-0">
        <ChartContainer config={chartConfig} className="h-88 w-full mt-6">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 10,
              right: 10,
            }}
          >
          <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              {/* 🔵 Desktop Gradient */}
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f7971e" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#ffd200" stopOpacity={0.1} />
              </linearGradient>

              {/* 🟢 Mobile Gradient */}
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00c6fb" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#005bea" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              dataKey="mobile"
              type="monotone"
              fill="url(#fillMobile)"
              stroke="#005bea"   // ✅ match gradient start
              fillOpacity={0.4}
              stackId="a"
              strokeWidth={2}
            />

            <Area
              dataKey="desktop"
              type="monotone"
              fill="url(#fillDesktop)"
              stroke="#f7971e"   // ✅ match gradient start
              fillOpacity={0.3}
              stackId="a"
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
