"use client"

import { useMapContext } from "@/contexts/map-context"
import { useEffect, useState } from "react"

type Area = {
  id: number
  name: string
  cityId: number
  population: number
  avgIncome: number
  districtId?: number
}

type DistrictInfoProps = {
  area: Area
}

export function DistrictInfo({ area }: DistrictInfoProps) {
  const { selectedGranularity, selectedCity, availableIndicatorDefinitions, availableIndicatorValues } = useMapContext();
  const [indicatorValues, setIndicatorValues] = useState<{ [indicatorName: string]: { value: number | null, year: number } }>({})

  useEffect(() => {
    if (!selectedGranularity || !selectedCity || !area) return
    // Use context data instead of fetching
    const values: { [indicatorName: string]: { value: number | null, year: number } } = {}
    availableIndicatorDefinitions.forEach(def => {
      const found = availableIndicatorValues.find(ind => ind.indicator_def_id === def.id && ind.geo_id === area.id)
      values[def.name] = {
        value: found ? found.value : null,
        year: found ? found.year : 0
      }
    })
    setIndicatorValues(values)
  }, [area, selectedGranularity, selectedCity, availableIndicatorDefinitions, availableIndicatorValues])

  if (!selectedGranularity || !area) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-primary/90 dark:bg-primary-900 text-primary-foreground px-5 py-4 flex flex-col gap-1 shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-bold tracking-tight text-primary-foreground">{area.name}</h3>
        </div>
        <p className="text-xs text-primary-foreground/80">
          {selectedGranularity.level === "district" ? "District Profile" : "Neighborhood Profile"}
        </p>
      </div>

      <div className="grid gap-4">
        {availableIndicatorDefinitions.map(def => (
          indicatorValues[def.name]?.value !== null && (
            <div
              className="rounded-xl border border-border bg-background/80 dark:bg-muted/70 shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-all"
              key={def.id}
            >
              <div className="flex items-center gap-3 mb-1">
                <div>
                  <h4 className="text-base font-semibold text-foreground dark:text-white">
                    {def.name} ({indicatorValues[def.name]?.year})
                  </h4>
                  {def.description && (
                    <p className="text-[11px] text-muted-foreground mt-1">{def.description}</p>
                  )}
                </div>
              </div>
              <p className="text-[18px] font-bold text-primary dark:text-primary-400">
                {indicatorValues[def.name]?.value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                {def.unit && !isNaN(Number(indicatorValues[def.name]?.value)) && ` ${def.unit}`}
              </p>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
