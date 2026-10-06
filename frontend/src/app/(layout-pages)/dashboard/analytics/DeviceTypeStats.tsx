"use client"

import * as React from "react"
import { OctagonX, ShieldHalf, TrendingUp, CircleCheckBig, Smartphone, Tablet, Monitor, TrendingDown } from "lucide-react"
import { Label, Pie, PieChart, Cell } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    type ChartConfig,
} from "@/components/ui/chart"

export const description = "A donut chart with text"

const chartData = [
    { device: "Desktop", visitors: 485, fill: "var(--chart-1)" },
    { device: "Mobile", visitors: 375, fill: "var(--chart-2)" },
    { device: "Tablet", visitors: 210, fill: "var(--chart-3)" },
    { device: "Smart TV", visitors: 95, fill: "var(--chart-4)" },
    { device: "Other", visitors: 60, fill: "var(--chart-5)" },
]
const gradientMap: Record<string, [string, string]> = {
    chrome: ["#ee0979", "#ff6a00"],
    safari: ["#00c6fb", "#005bea"],
    firefox: ["#17ad37", "#98ec2d"],
    edge: ["#7928ca", "#ff0080"],
    other: ["#f7971e", "#ffd200"],
}

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null

    return (
        <div className="rounded-lg border bg-background p-2 shadow-md">
            {payload.map((entry: any, index: number) => {
                const color = entry.payload.fill

                return (
                    <div key={index} className="flex items-center gap-2 text-sm">

                        {/* ✅ Correct gradient */}
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                                background: entry.payload.fill
                            }}
                        />

                        <span className="text-muted-foreground">
                            {entry.name}
                        </span>

                        <span className="font-medium ml-auto">
                            {entry.value}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

const chartConfig = {
    visitors: {
        label: "Visitors",
    },
    Desktop: {
        label: "Desktop",
    },
    Mobile: {
        label: "Mobile",
    },
    Tablet: {
        label: "Tablet",
    },
    "Smart TV": {
        label: "Smart TV",
    },
    Other: {
        label: "Other",
    },
} satisfies ChartConfig


export default function DeviceTypeStats() {
    const totalVisitors = React.useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.visitors, 0)
    }, [])

    return (
        <Card className="h-auto w-full">
            <CardHeader className="items-center pb-0">
                <CardTitle className="text-lg mb-0">Device Type Audience</CardTitle>
                <CardDescription>January - June 2025</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square h-80 w-full"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<CustomTooltip />}
                        />
                        {/* ✅ Define gradients */}
                        <defs>
                            <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#ee0979" />
                                <stop offset="100%" stopColor="#ff6a00" />
                            </linearGradient>

                            <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#00c6fb" />
                                <stop offset="100%" stopColor="#005bea" />
                            </linearGradient>

                            <linearGradient id="grad3" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#17ad37" />
                                <stop offset="100%" stopColor="#98ec2d" />
                            </linearGradient>

                            <linearGradient id="grad4" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#7928ca" />
                                <stop offset="100%" stopColor="#ff0080" />
                            </linearGradient>

                            <linearGradient id="grad5" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#f7971e" />
                                <stop offset="100%" stopColor="#ffd200" />
                            </linearGradient>
                        </defs>
                        <Pie
                            data={chartData}
                            dataKey="visitors"
                            nameKey="device"
                            innerRadius={80}
                            outerRadius={115}
                            stroke="hsl(var(--background))"
                            strokeWidth={2}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.fill}
                                    className="outline-none"
                                />
                            ))}

                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {totalVisitors.toLocaleString()}
                                                </tspan>

                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy ?? 0) + 24}
                                                    className="fill-muted-foreground text-sm"
                                                >
                                                    Total Visitors
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>

                {/* Device Stats */}
                <div className="space-y-5">

                    {/* Desktop */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                                <Monitor className="h-5 w-5" />
                            </div>

                            <div>
                                <p className="text-sm font-medium">Desktop Visitors</p>
                                <p className="text-xs text-muted-foreground">
                                    Primary traffic source
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-emerald-600">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm font-semibold">+12.8%</span>
                        </div>
                    </div>

                    {/* Mobile */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                <Smartphone className="h-5 w-5" />
                            </div>

                            <div>
                                <p className="text-sm font-medium">Mobile Visitors</p>
                                <p className="text-xs text-muted-foreground">
                                    Highest engagement rate
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-emerald-600">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm font-semibold">+8.4%</span>
                        </div>
                    </div>

                    {/* Tablet */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                                <Tablet className="h-5 w-5" />
                            </div>

                            <div>
                                <p className="text-sm font-medium">Tablet Visitors</p>
                                <p className="text-xs text-muted-foreground">
                                    Moderate traffic growth
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-red-500">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-sm font-semibold">-2.1%</span>
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
