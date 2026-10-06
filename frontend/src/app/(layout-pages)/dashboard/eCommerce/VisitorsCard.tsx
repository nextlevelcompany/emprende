"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Area, AreaChart, XAxis } from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

import { Group } from "@boxicons/react"

const chartData = [
  { month: "January", visitors: 420 },
  { month: "February", visitors: 510 },
  { month: "March", visitors: 680 },
  { month: "April", visitors: 590 },
  { month: "May", visitors: 740 },
  { month: "June", visitors: 620 },
  { month: "July", visitors: 890 },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
} satisfies ChartConfig

export default function VisitorsCard() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="mb-3 flex items-center">
          <div>
            <p className="text-md text-muted-foreground">Total Visitors</p>
            <h2 className="text-3xl font-semibold">18,432</h2>
          </div>
          <div className="ml-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-500/20">
            <Group className="size-6.5 text-rose-600 dark:text-rose-400" />
          </div>
        </div>

        <p className="text-sm flex gap-2 mb-4">
          <span className="text-green-600 font-semibold">+9.6%</span>
          from last month
        </p>

        <ChartContainer config={chartConfig} className="h-14 w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#ec003f" // orange
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="#ff2056" // orange
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>

            <XAxis hide dataKey="month" />

            <Area
              type="monotone"
              dataKey="visitors"
              stroke="#ff2056"
              fill="url(#fillVisitors)"
              strokeWidth={2}
              fillOpacity={0.1}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
