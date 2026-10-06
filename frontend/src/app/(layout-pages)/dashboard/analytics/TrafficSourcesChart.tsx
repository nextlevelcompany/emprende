"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const chartData = [
  {
    source: "Organic Search",
    value: 62.7,
    fill: "var(--chart-1)",
  },
  {
    source: "Direct",
    value: 42.6,
    fill: "var(--chart-2)",
  },
  {
    source: "Referral",
    value: 28.2,
    fill: "var(--chart-3)",
  },
  {
    source: "Others",
    value: 18.6,
    fill: "var(--chart-4)",
  },
  {
    source: "Social",
    value: 10.3,
    fill: "var(--chart-5)",
  },
]

export default function TrafficSourcesChart() {
  return (
    <Card>
      
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl font-medium mb-0">
          Traffic Sources Status
        </CardTitle>
        <CardDescription className="text-base text-sm text-muted-foreground">
          January, 2025
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="h-[340px] w-full">
          
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 10,
                left: 10,
                bottom: 0,
              }}
              barCategoryGap={40}
            >
              
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="source"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tick={{
                  fontSize: 12,
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                domain={[0, 80]}
                tick={{
                  fontSize: 14,
                }}
                label={{
                  value: "Total percent market share",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    textAnchor: "middle",
                    fontSize: 14,
                  },
                }}
              />

              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                barSize={40}
              >
                
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: number) => `${value}%`}
                  className="fill-foreground text-sm font-semibold"
                />

                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                  />
                ))}
              </Bar>

            </BarChart>
          </ResponsiveContainer>

        </div>
      </CardContent>
    </Card>
  )
}