"use client"

import { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useMapContext } from "@/contexts/map-context"
import { Loader2, ChartBarBig } from "lucide-react"
import { DistrictComparisonChart } from "@/components/district-comparison-chart"
import { MultiSelect } from "@/components/ui/multi-select"
import type { IndicatorDefinition, Area } from "@/lib/api-types"

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-6">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    </div>
  )
}

function ComparisonChartWrapper({
  selectedArea,
  comparisonArea,
  selectedGranularity,
  selectedIndicators,
  availableIndicators
}: {
  selectedArea: Area | null
  comparisonArea: Area | null
  selectedGranularity: { level: string } | null
  selectedIndicators: string[]
  availableIndicators: IndicatorDefinition[]
}) {
  if (!selectedArea || !comparisonArea) {
    return <div className="text-center py-12 text-muted-foreground">Please select two areas to compare</div>
  }

  return (
    <div className="space-y-6">
      <DistrictComparisonChart
        district1={selectedArea}
        district2={comparisonArea}
        granularity={selectedGranularity?.level || "district"}
        selectedIndicators={selectedIndicators}
        availableIndicators={availableIndicators}
      />
    </div>
  )
}

export function CompareView() {
  const {
    selectedCity,
    selectedGranularity,
    selectedArea,
    setSelectedArea,
    comparisonArea,
    setComparisonArea,
    availableAreas,
    availableIndicatorDefinitions,
    availableIndicatorValues,
  } = useMapContext()

  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([])
  const [showIndicatorLimit, setShowIndicatorLimit] = useState(false)

  // areaOptions is just a map, keep as is
  const areaOptions = useMemo(() =>
    (availableAreas || []).map(area => ({
      value: area.id.toString(),
      label: area.name
    })), [availableAreas])

  // Pre-index availableIndicatorValues for O(1) lookup
  const indicatorValueMap = useMemo(() => {
    const map = new Map<string, any>()
    for (const val of availableIndicatorValues) {
      map.set(`${val.indicator_def_id}_${val.geo_id}`, val)
    }
    return map
  }, [availableIndicatorValues])

  // Optimize indicatorOptions
  const indicatorOptions = useMemo(() => {
    if (!availableIndicatorDefinitions || !selectedArea) return []
    return availableIndicatorDefinitions
      .map(def => {
        const found = indicatorValueMap.get(`${def.id}_${selectedArea.id}`)
        if (!found) return null // Only show indicators with a value for this area
        const year = found?.year || ''
        const indicatorKey = `${def.name}${year ? ` (${year})` : ''}`
        return {
          label: indicatorKey,
          value: indicatorKey,
          description: def.description || '',
          unit: def.unit || '',
          disabled: selectedIndicators.length >= 2 && !selectedIndicators.includes(indicatorKey),
        }
      })
      .filter((opt): opt is { label: string; value: string; description: string; unit: string; disabled: boolean } => Boolean(opt))
  }, [availableIndicatorDefinitions, selectedArea, selectedIndicators, indicatorValueMap])

  const handleAreaChange = useCallback((value: string, isArea1: boolean) => {
    const area = availableAreas?.find((a) => a.id === Number.parseInt(value))
    if (isArea1) {
      setSelectedArea(area || null)
    } else {
      setComparisonArea(area || null)
    }
  }, [availableAreas, setSelectedArea, setComparisonArea])

  useEffect(() => {
    setSelectedIndicators([])
  }, [selectedCity, selectedGranularity])

  // Restore the chart rendering
  const chartWrapper = useMemo(() => (
    <ComparisonChartWrapper
      selectedArea={selectedArea}
      comparisonArea={comparisonArea}
      selectedGranularity={selectedGranularity}
      selectedIndicators={selectedIndicators}
      availableIndicators={availableIndicatorDefinitions || []}
    />
  ), [selectedArea, comparisonArea, selectedGranularity, selectedIndicators, availableIndicatorDefinitions])

  return (
    <div className="container mx-auto py-4 md:py-6 px-2 space-y-4">
      <div className="flex flex-col md:flex-row gap-6 md:items-stretch h-full">
        <Card className="w-full md:w-1/3 flex flex-col shadow-none md:sticky md:top-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-primary text-xl">
              <ChartBarBig className="h-5 w-5" />
              Compare Areas
            </CardTitle>
            <CardDescription className="text-s">
              Select two {selectedGranularity?.level === "district" ? "districts" : "neighborhoods"} to compare their indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Area 1</Label>
              <Select
                value={selectedArea?.id.toString() || ""}
                onValueChange={(value) => handleAreaChange(value, true)}
                disabled={areaOptions.length === 0}
              >
                <SelectTrigger className="modern-input h-9 text-sm bg-[rgba(37,99,235,0.08)]">
                  <SelectValue placeholder="Select first area" />
                </SelectTrigger>
                <SelectContent>
                  {areaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Area 2</Label>
              <Select
                value={comparisonArea?.id.toString() || ""}
                onValueChange={(value) => handleAreaChange(value, false)}
                disabled={areaOptions.length === 0}
              >
                <SelectTrigger className="modern-input h-9 text-sm bg-[rgba(16,185,129,0.08)]">
                  <SelectValue placeholder="Select second area" />
                </SelectTrigger>
                <SelectContent>
                  {areaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Indicators to compare</Label>
              <MultiSelect
                options={indicatorOptions}
                selected={selectedIndicators}
                onChange={(newSelected) => {
                  if (newSelected.length > 2) {
                    setShowIndicatorLimit(true)
                    setTimeout(() => setShowIndicatorLimit(false), 2000)
                    return
                  }
                  setSelectedIndicators(newSelected)
                }}
                placeholder="Select up to 2 indicators to compare..."
                className="modern-input"
              />
            </div>
            <div
              className={`text-xs text-center mt-4 ${showIndicatorLimit ? "text-red-500" : "text-muted-foreground"}`}
              style={{ minHeight: "1.25em" }}
            >
              {showIndicatorLimit
                ? "You can only compare up to 2 indicators."
                : "Select up to 2 indicators to compare."}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full md:w-2/3 flex flex-col">
          <CardContent className="p-4">
            <Suspense fallback={<LoadingSpinner />}>
              {chartWrapper}
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function toFullArea(area: any): Area {
  return {
    id: area.id ?? 0,
    name: area.name ?? '',
    district_code: area.district_code ?? undefined,
    city_id: area.city_id ?? area.cityId ?? 0,
    population: area.population ?? 0,
    avg_income: area.avg_income ?? 0,
    surface: area.surface ?? 0,
    disposable_income: area.disposable_income ?? 0,
    created_at: area.created_at ?? undefined,
    neighbourhood_code: area.neighbourhood_code ?? undefined,
    district_id: area.district_id ?? undefined,
    cityId: area.cityId ?? area.city_id ?? 0,
    avgIncome: area.avgIncome ?? area.avg_income ?? 0,
    disposableIncome: area.disposableIncome ?? area.disposable_income ?? 0,
    districtId: area.districtId ?? area.district_id ?? undefined,
  } as Area
}

