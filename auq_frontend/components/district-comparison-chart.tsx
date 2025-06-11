"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import type { IndicatorDefinition, Area } from "@/lib/api-types"
import { getIndicatorValue } from "@/lib/supabase-client"

type DistrictComparisonChartProps = {
  district1: Area | null
  district2: Area | null
  granularity: string
  selectedIndicators: string[]
  availableIndicators: IndicatorDefinition[]
}

type YAxisLabelProps = {
  value: string
  angle: number
  position: 'insideLeft' | 'insideRight'
  style: React.CSSProperties
}

export function DistrictComparisonChart({
  district1,
  district2,
  granularity,
  selectedIndicators,
  availableIndicators,
}: DistrictComparisonChartProps) {
  const [chartData, setChartData] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadIndicatorValues() {
      if (!district1 || !district2) return

      setIsLoading(true)
      try {
        // Create data array for the chart
        const data = await Promise.all(selectedIndicators.map(async (indicatorNameWithYear) => {
          // Extract the base name without the year
          const baseName = indicatorNameWithYear.split(' (')[0]
          const indicator = availableIndicators.find(ind => ind.name === baseName)
          if (!indicator) return null

          const value1 = await getIndicatorValue(district1.id, indicator.id, granularity)
          const value2 = await getIndicatorValue(district2.id, indicator.id, granularity)

          return {
            name: indicatorNameWithYear,
            [`${district1.name} - ${indicatorNameWithYear}`]: value1 || 0,
            [`${district2.name} - ${indicatorNameWithYear}`]: value2 || 0,
            unit: indicator.unit
          }
        }))

        setChartData(data.filter(Boolean))
      } catch (error) {
        console.error("Error loading indicator values:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadIndicatorValues()
  }, [district1, district2, granularity, selectedIndicators, availableIndicators])

  if (!district1 || !district2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>District Comparison</CardTitle>
          <CardDescription>Select two districts to compare.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Please select two districts to compare</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Comparison Data</CardTitle>
          <CardDescription>Please wait while we load the indicator values...</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading data...</p>
        </CardContent>
      </Card>
    )
  }

  // Generate colors for the areas
  const areaColors = {
    [district1.name]: "hsl(220, 70%, 50%)",
    [district2.name]: "hsl(150, 70%, 50%)",
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => {
            const indicator = availableIndicators.find(ind => ind.name === entry.name)
            const value = entry.value
            const formattedValue = indicator?.unit === '€'
              ? `${Number(value).toFixed(1).replace(/\.0$/, '')} €`
              : indicator?.unit === '%'
                ? `${Number(value).toFixed(1)}%`
                : Number(value).toFixed(1).replace(/\.0$/, '')
            return (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: {formattedValue}
              </p>
            )
          })}
        </div>
      )
    }
    return null
  }

  const formatYAxisValue = (value: number, unit?: string) => {
    return unit === '€'
      ? `${Number(value).toFixed(1).replace(/\.0$/, '')} €`
      : unit === '%'
        ? `${Number(value).toFixed(1)}%`
        : Number(value).toFixed(1).replace(/\.0$/, '')
  }

  const getUnit = (indicatorName: string) => {
    const indicator = availableIndicators.find(ind => ind.name === indicatorName)
    return indicator?.unit
  }

  const formatValue = (value: number, unit?: string) => {
    if (!unit) return value.toString()
    return unit === '€'
      ? `${Number(value).toFixed(1).replace(/\.0$/, '')} €`
      : unit === '%'
        ? `${Number(value).toFixed(1)}%`
        : Number(value).toFixed(1).replace(/\.0$/, '')
  }

  // Calculate max values for each Y axis for padding
  const maxLeft = chartData.length > 0 ? Math.max(
    ...[`${district1.name} - ${selectedIndicators[0]}`, `${district2.name} - ${selectedIndicators[0]}`].map(key =>
      Math.max(...chartData.map(d => d[key] || 0))
    )
  ) : 0;
  const maxRight = selectedIndicators.length > 1 && chartData.length > 1 ? Math.max(
    ...[`${district1.name} - ${selectedIndicators[1]}`, `${district2.name} - ${selectedIndicators[1]}`].map(key =>
      Math.max(...chartData.map(d => d[key] || 0))
    )
  ) : 0;

  return (
    <Card className="border-0 shadow-none
    ">
      <CardHeader className="pb-2 ">
        <CardTitle className="text-lg text-center mb-6">
          Comparing {district1.name} vs {district2.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 10,
                right: 20,
                bottom: 10,
                left: 20,
              }}
              barGap={6}
              barCategoryGap={20}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 13, fontWeight: 'bold' }}
                interval={0}
                angle={0}
                textAnchor="middle"
                height={40}
              />

              {/* Left Y-axis for first indicator */}
              <YAxis
                yAxisId="left"
                orientation="left"
                tickFormatter={(value) => formatYAxisValue(value, chartData[0]?.unit)}
                width={50}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                domain={[0, maxLeft ? maxLeft * 1.1 : 'auto']}
              />

              {/* Right Y-axis for second indicator */}
              {selectedIndicators.length > 1 && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => formatYAxisValue(value, chartData[1]?.unit)}
                  width={50}
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  domain={[0, maxRight ? maxRight * 1.1 : 'auto']}
                />
              )}

              <Tooltip
                formatter={(value: number, name: string) => {
                  const indicator = name.split(' - ')[1]
                  const dataPoint = chartData.find(d => d.name === indicator)
                  return [formatValue(value, dataPoint?.unit), name]
                }}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />

              {selectedIndicators.map((indicator, index) => (
                <Bar
                  key={`${district1.name}-${indicator}`}
                  dataKey={`${district1.name} - ${indicator}`}
                  fill={areaColors[district1.name]}
                  yAxisId={index === 0 ? "left" : "right"}
                  radius={[4, 4, 0, 0]}
                  label={{
                    position: 'top',
                    formatter: (value: number) => formatValue(value, chartData[index]?.unit),
                    style: { fontSize: '12px', fill: '#666' }
                  }}
                />
              ))}

              {selectedIndicators.map((indicator, index) => (
                <Bar
                  key={`${district2.name}-${indicator}`}
                  dataKey={`${district2.name} - ${indicator}`}
                  fill={areaColors[district2.name]}
                  yAxisId={index === 0 ? "left" : "right"}
                  radius={[4, 4, 0, 0]}
                  label={{
                    position: 'top',
                    formatter: (value: number) => formatValue(value, chartData[index]?.unit),
                    style: { fontSize: '12px', fill: '#666' }
                  }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
