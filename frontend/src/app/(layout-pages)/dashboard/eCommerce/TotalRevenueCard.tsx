import { Card, CardContent } from "@/components/ui/card"

import {
  Area,
  AreaChart,
  XAxis,
} from "recharts"

import { WalletNote } from "@boxicons/react"

import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", revenue: 420 },
  { month: "February", revenue: 560 },
  { month: "March", revenue: 780 },
  { month: "April", revenue: 610 },
  { month: "May", revenue: 540 },
  { month: "June", revenue: 390 },
  { month: "July", revenue: 480 },
]

const chartConfig = {
  revenue: {
    label: "Revenue",
  },
} satisfies ChartConfig

export default function TotalRevenueCard() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="mb-3 flex items-center">
          <div>
            <p className="text-md text-muted-foreground">
              Total Revenue
            </p>

            <h2 className="text-3xl font-semibold">
              $92,460
            </h2>
          </div>

          <div className="ml-auto flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-500/20">
            <WalletNote className="size-6 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <p className="flex gap-2 text-sm mb-4">
          <span className="font-semibold text-red-600">
            -18.2%
          </span>

          from last month
        </p>

        <ChartContainer
          config={chartConfig}
          className="h-14 w-full"
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 5,
              right: 0,
              left: 0,
              bottom: 0,
            }}
          >
            <XAxis
              hide
              dataKey="month"
              tickLine={false}
              axisLine={false}
            />

            <defs>
              <linearGradient
                id="revenueGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#98ec2d"
                  stopOpacity={0.8}
                />

                <stop
                  offset="100%"
                  stopColor="#17ad37"
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#17ad37"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              fillOpacity={0.1}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}