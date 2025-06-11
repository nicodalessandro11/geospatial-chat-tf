"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useMapContext } from "@/contexts/map-context"
import { Activity, ChartColumnBig, Loader2 } from "lucide-react"
import { getDistricts, getCityIndicators, getIndicatorDefinitions, getGeoJSON, getIndicatorTimeSeries } from "@/lib/api-service"
import type { IndicatorDefinition, Area } from "@/lib/api-types"
import { VisualizeChart } from "@/components/visualize-chart"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts"
import { DataDisclaimer } from "@/components/data-disclaimer"

export function VisualizeView() {
  const { selectedCity, selectedGranularity, availableIndicators, currentGeoJSON } = useMapContext()
  const [selectedIndicator, setSelectedIndicator] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [areas, setAreas] = useState<Area[]>([])
  const [indicatorValues, setIndicatorValues] = useState<Record<number, number>>({})
  const [topN, setTopN] = useState(5)
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [timeSeries, setTimeSeries] = useState<{ year: number, value: number }[]>([])
  const [isLoadingTimeSeries, setIsLoadingTimeSeries] = useState(false)
  const isLoadingRef = useRef(false)

  // Update areas from context's currentGeoJSON
  useEffect(() => {
    if (currentGeoJSON?.features) {
      const formattedAreas: Area[] = currentGeoJSON.features.map((feature: any) => ({
        id: feature.properties.id,
        name: feature.properties.name,
        cityId: feature.properties.city_id,
        city_id: feature.properties.city_id,
        district_id: feature.properties.district_id,
        population: feature.properties.population || 0,
        avgIncome: feature.properties.avg_income || 0,
        surface: feature.properties.surface || 0,
        disposableIncome: feature.properties.disposable_income || 0,
      }))
      setAreas(formattedAreas)
    } else {
      setAreas([])
    }
  }, [currentGeoJSON])

  // Load indicator values when selection changes
  useEffect(() => {
    async function loadValues() {
      if (!selectedCity || !selectedGranularity || !selectedIndicator) return
      setIsLoading(true)
      try {
        const indicatorDef = availableIndicators.find(def => def.name === selectedIndicator)
        if (!indicatorDef) return
        // Fetch values for this indicator and all areas
        const indicators = await getCityIndicators(selectedCity.id, selectedGranularity.level)
        const values: Record<number, number> = {}
        indicators.forEach(ind => {
          if (ind.indicator_def_id === indicatorDef.id) {
            values[ind.geo_id] = ind.value
          }
        })
        setIndicatorValues(values)
      } catch (error) {
        console.error("Error loading indicator values:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadValues()
  }, [selectedCity, selectedGranularity, selectedIndicator, availableIndicators])

  // Load time series when area and indicator are selected
  useEffect(() => {
    async function fetchTimeSeries() {
      if (!selectedCity || !selectedGranularity || !selectedIndicator || !selectedAreaId) return
      const indicatorDef = availableIndicators.find(def => def.name === selectedIndicator)
      if (!indicatorDef) return
      setIsLoadingTimeSeries(true)
      try {
        const data = await getIndicatorTimeSeries(selectedAreaId, indicatorDef.id, selectedGranularity.level, selectedCity.id)
        setTimeSeries((data || []).map((d: any) => ({
          year: Number(d.year),
          value: Number(d.value)
        })))
      } catch (e) {
        console.error('Error fetching time series:', e)
        setTimeSeries([])
      } finally {
        setIsLoadingTimeSeries(false)
      }
    }
    fetchTimeSeries()
  }, [selectedAreaId, selectedIndicator, selectedGranularity, selectedCity, availableIndicators])

  const topOptions = [3, 5, 10, 15, 20].filter(n => n <= areas.length)
  const indicatorDef = availableIndicators.find(def => def.name === selectedIndicator)
  const areaOptions = areas.map(area => ({ value: area.id, label: area.name }))
  const selectedArea = areas.find(a => a.id === selectedAreaId)

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-8">
      {/* Main Title and Subtitle */}
      <div className="mb-2">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-primary mb-1">
          <ChartColumnBig className="w-6 h-6" />
          Visualize City Indicators
        </h1>

        <p className="text-base text-muted-foreground max-w-8xl">
          Explore and compare city indicators by selecting an indicator, viewing its description, analyzing its evolution over time for a specific area, and discovering the top areas for each metric.
        </p>
      </div>

      {/* Indicator Selection + Description in the same card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-row md:justify-between md:items-end md:items-end gap-4 mb-2">
            <h2 className="text-xl font-bold text-primary mb-2">Step 1: Select an indicator to visualize...</h2>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
                  <SelectTrigger className="modern-input border-primary text-black dark:text-white focus:ring-primary focus:border-primary h-10 text-sm">
                    <SelectValue placeholder="Select option..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIndicators.map((indicator) => (
                      <SelectItem key={indicator.id} value={indicator.name}>
                        {indicator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {selectedIndicator && (
            <div className="mt-4 pt-4 pb-4 p-4 text-muted-foreground">
              <p className="text-sm mb-2">
                <Label className="text-sm font-bold text-black">Description: </Label>{indicatorDef?.description || `No description available for this indicator.`}
              </p>
              <p className="text-sm">
                <Label className="text-sm font-bold text-black">Unit of Measurement: </Label>{indicatorDef?.unit || `No unit of measurement available for this indicator.`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Area Selection & Time Series Section */}
      {selectedIndicator && (
        <Card>
          <CardContent className="p-6 space-y-10">
            <div className="flex flex-row md:justify-between md:items-end md:items-end gap-4 mb-2">
              <h2 className="text-xl font-bold text-primary mb-2"><u>Viz Option 1:</u> View Indicator Evolution Over Time [for a specific {selectedGranularity?.level === "district" ? "district" : "neighborhood"}]</h2>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <Select
                    value={selectedAreaId?.toString() || ""}
                    onValueChange={v => setSelectedAreaId(Number(v))}
                    disabled={areas.length === 0 || !selectedGranularity}
                  >
                    <SelectTrigger className="modern-input border-primary text-black dark:text-white focus:ring-primary focus:border-primary h-10 text-sm">
                      <SelectValue placeholder="Select area..." />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.length === 0 || !selectedGranularity ? (
                        <SelectItem disabled value="select">Select option...</SelectItem>
                      ) : (
                        areaOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="border border-gray-200 rounded-md p-2">
              {selectedArea ? (
                <div className="mt-4">
                  {isLoadingTimeSeries ? (
                    <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : timeSeries.length === 0 ? (
                    <div className="text-muted-foreground text-sm">No data available for this area and indicator.</div>
                  ) : (
                    <div style={{ padding: '40px 32px 8px 32px' }}>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart
                          data={timeSeries}
                          margin={{ left: 0, right: 0, top: 40, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="year"
                            tick={{ fontSize: 14, fontWeight: 'bold' }}
                            interval={0}
                            padding={{ left: 20, right: 20 }}
                          />
                          <YAxis hide={true} />
                          <Tooltip
                            formatter={(value: number) => [value.toFixed(1), '']}
                            labelFormatter={label => `Year: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={{ r: 7, stroke: '#2563eb', strokeWidth: 2, fill: '#fff' }}
                          >
                            <LabelList
                              dataKey="value"
                              position="top"
                              offset={22}
                              fontSize={12}
                              formatter={(value: number) => value.toFixed(1)}
                            />
                          </Line>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8 text-base">Select an area to visualize...</div>
              )}
            </div>

          </CardContent>
        </Card>
      )}

      {/* Top N Chart Section */}
      {selectedIndicator && indicatorDef && (
        <Card>
          <CardContent className="p-6 space-y-8">
            <div className="flex flex-row md:justify-between md:items-end md:items-end gap-4 mb-2">
              <h2 className="text-xl font-bold text-primary mb-2"><u>Viz Option 2:</u> Explore Top areas for the selected indicator [across all {selectedGranularity?.level === "district" ? "districts" : "neighborhoods"}]</h2>
              <div className="w-32">
                <Select
                  value={topN.toString()}
                  onValueChange={v => setTopN(Number(v))}
                  disabled={areas.length === 0 || !selectedGranularity}
                >
                  <SelectTrigger className="modern-input border-primary text-black dark:text-white focus:ring-primary focus:border-primary h-10 text-sm">
                    <SelectValue placeholder="Top N" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.length === 0 || !selectedGranularity ? (
                      <SelectItem disabled value="select">Select option...</SelectItem>
                    ) : (
                      topOptions.map(n => (
                        <SelectItem key={n} value={n.toString()}>Top {n}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-8 p-2">
              {areas.length === 0 || !selectedGranularity ? (
                <div className="text-muted-foreground text-center py-8 text-base">Select an area to visualize...</div>
              ) : (
                <VisualizeChart
                  areas={areas}
                  indicator={indicatorDef}
                  indicatorValues={indicatorValues}
                  topN={topN}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loader or empty state if no indicator selected */}
      {
        isLoading && !selectedIndicator && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )
      }
      {
        !selectedIndicator && !isLoading && (
          <Card>
            <CardContent className="h-[200px] flex items-center justify-center">
              <p className="text-muted-foreground">Please select an indicator to visualize.</p>
            </CardContent>
          </Card>
        )
      }
      <DataDisclaimer />
    </div >
  )
}