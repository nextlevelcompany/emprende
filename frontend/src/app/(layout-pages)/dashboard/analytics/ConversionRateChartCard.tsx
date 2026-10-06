"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, XAxis, ResponsiveContainer } from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"

const chartConfig = {
  desktop: {
    label: "Conversion Rate",
    color: "var(--chart-1)",
  }
} satisfies ChartConfig

const chartData = [
  { month: "Jan", value: 2.4 },
  { month: "Feb", value: 2.8 },
  { month: "Mar", value: 2.6 },
  { month: "Apr", value: 3.1 },
  { month: "May", value: 2.9 },
  { month: "Jun", value: 3.4 },
]

export default function ConversionRateChartCard() {
  return (
    <Card className="h-full overflow-hidden transition hover:shadow-md">
      <CardHeader>
        <div>
          <CardDescription className="text-md">
            Conversion Rate
          </CardDescription>
          <CardTitle className="text-2xl font-semibold">
            3.4%
          </CardTitle>
        </div>

        <div className="flex items-center gap-2 text-sm font-medium text-green-600">
          <p className="text-xs text-muted-foreground">
            vs last month
          </p>

          <Badge className="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-0 gap-1 rounded-full">
            <TrendingUp className="h-4 w-4" />
            +0.6%
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="mt-0 h-30 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
            >
              <XAxis hide dataKey="month" />

              <Area
                dataKey="value"
                type="monotone"
                stroke="var(--chart-4)"
                fill="var(--chart-4)"
                fillOpacity={0.08}
                strokeWidth={2.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}