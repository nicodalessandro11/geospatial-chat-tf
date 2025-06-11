"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from "recharts"
import type { Area, IndicatorDefinition } from "@/lib/api-types"
import { useEffect, useState } from "react"

interface VisualizeChartProps {
    areas: Area[]
    indicator: IndicatorDefinition
    indicatorValues: Record<number, number> // areaId -> value
    topN: number
}

const truncateName = (name: string, maxLength: number = 15) => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        const area = payload[0].payload
        return (
            <div className="bg-white p-3 border rounded-lg shadow-lg">
                <p className="font-bold">{area.name}</p>
                <p className="text-sm text-muted-foreground">
                    {payload[0].value?.toLocaleString()} {payload[0].unit || ''}
                </p>
            </div>
        )
    }
    return null
}

export function VisualizeChart({ areas, indicator, indicatorValues, topN }: VisualizeChartProps) {
    // Detect dark mode
    const [isDark, setIsDark] = useState(false)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsDark(document.documentElement.classList.contains('dark'))
            const observer = new MutationObserver(() => {
                setIsDark(document.documentElement.classList.contains('dark'))
            })
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
            return () => observer.disconnect()
        }
    }, [])
    // Ordenar áreas por valor del indicador y tomar el top N
    const sorted = React.useMemo(() => {
        return areas
            .map(area => ({
                ...area,
                displayName: truncateName(area.name),
                value: indicatorValues[area.id] ?? 0
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, topN)
    }, [areas, indicatorValues, topN])

    const formatValue = (value: number) => {
        if (indicator.unit === "€") return `${value.toLocaleString()} €`
        if (indicator.unit === "%") return `${value.toFixed(1)}%`
        return value.toLocaleString()
    }

    return (
        <Card>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sorted} margin={{ top: 10, right: 20, bottom: 10, left: 20 }} barGap={6} barCategoryGap={20}>
                            <XAxis
                                dataKey="displayName"
                                tick={{ fontSize: 13, fontWeight: 'bold', fill: isDark ? '#fff' : '#222' }}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis hide={true} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="value"
                                fill="#2563eb"
                                radius={[4, 4, 0, 0]}
                                label={{
                                    position: 'top',
                                    formatter: formatValue,
                                    style: { fontSize: '12px', fill: isDark ? '#fff' : '#222', fontWeight: 'bold' }
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
} 