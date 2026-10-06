"use client"

import { TrendingUp } from "lucide-react"

import {
  Pie,
  PieChart,
  Cell,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description =
  "Sessions by device chart"

const chartData = [
  {
    device: "Desktop",
    sessions: 56,
    fill: "var(--chart-3)",
  },
  {
    device: "Mobile",
    sessions: 30,
    fill: "var(--chart-2)",
  },
  {
    device: "Tablet",
    sessions: 14,
    fill: "var(--chart-4)",
  },
  {
    device: "Smart TV",
    sessions: 5,
    fill: "var(--chart-1)",
  },
  {
    device: "Others",
    sessions: 5,
    fill: "var(--chart-5)",
  }
]

const chartConfig = {
  sessions: {
    label: "Sessions",
  },

  desktop: {
    label: "Desktop",
    color: "var(--chart-3)",
  },

  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },

  tablet: {
    label: "Tablet",
    color: "var(--chart-4)",
  },

  smarttv: {
    label: "Smart TV",
    color: "var(--chart-1)",
  },

  others: {
    label: "Others",
    color: "var(--chart-5)",
  }
} satisfies ChartConfig

export default function SessionsDeviceChart() {
  return (
    <Card className="flex flex-col">
      
      {/* Header */}
      <CardHeader className="items-center pb-0 text-center">
        <CardTitle className="mb-0 text-xl font-medium">
          Sessions by Device
        </CardTitle>

        <CardDescription className="text-sm font-medium">
          Device usage statistics
        </CardDescription>
      </CardHeader>

      {/* Chart */}
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[320px] pb-0"
        >
          <PieChart>
            
            <ChartTooltip
              content={
                <ChartTooltipContent hideLabel />
              }
            />

            <Pie
                data={chartData}
                dataKey="sessions"
                nameKey="device"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                strokeWidth={3}
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                />
              ))}
            </Pie>

          </PieChart>
        </ChartContainer>
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex-col gap-2 text-sm">
        
        <div className="flex items-center gap-2 leading-none font-medium">
          Desktop traffic increased by 12.5%
          
          <TrendingUp className="h-4 w-4" />
        </div>

        <div className="leading-none text-muted-foreground">
          Showing total sessions across all devices
        </div>

      </CardFooter>
    </Card>
  )
}