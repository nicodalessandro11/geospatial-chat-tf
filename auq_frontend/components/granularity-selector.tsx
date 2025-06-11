"use client"

import { useEffect, useState, useRef } from "react"
import { useMapContext } from "@/contexts/map-context"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Layers } from "lucide-react"
import { useRouter } from "next/navigation"

// Define the GranularityLevel type
type GranularityLevel = {
  id: number
  name: string
  level: string
}

export function GranularitySelector() {
  const {
    selectedCity,
    hasSelectedGranularity,
    loadGeoJSON,
    triggerRefresh,
    selectedGranularity,
    setSelectedArea,
    setSelectedGranularity,
  } = useMapContext()

  const [granularityLevels] = useState<GranularityLevel[]>([
    { id: 2, name: "Districts", level: "district" },
    { id: 3, name: "Neighborhoods", level: "neighborhood" },
  ])
  const router = useRouter()

  const hasGranularity = !!selectedGranularity;

  const handleGranularityChange = (value: string) => {
    if (!value || !selectedCity) return;

    // 1. Clear area from state only
    setSelectedArea(null);

    // 2. Set new granularity in state
    const newGranularity = granularityLevels.find(g => g.level === value) || null;
    setSelectedGranularity(newGranularity);

    // 3. Set new granularity in URL (in the same step)
    const params = new URLSearchParams(window.location.search);
    params.set("level", value);
    router.replace(`?${params.toString()}`);

    // 4. Log for debugging
    console.log('[GranularitySelector] handleGranularityChange:', {
      value,
      newGranularity,
      selectedCity,
      url: window.location.href
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-2 text-sm font-medium ${!selectedCity
          ? "text-muted-foreground"
          : !hasGranularity
            ? "text-primary animate-pulse"
            : ""
          }`}
      >
        <Layers className={`h-4 w-4 ${!hasGranularity && selectedCity ? "animate-bounce" : ""}`} />
        <span>Level:</span>
      </div>
      <ToggleGroup
        type="single"
        value={selectedGranularity?.level || ""}
        onValueChange={handleGranularityChange}
        disabled={!selectedCity}
        className={selectedCity && !hasGranularity ? "ring-2 ring-primary ring-offset-2" : ""}
      >
        {granularityLevels.map((granularity) => (
          <ToggleGroupItem
            key={granularity.id}
            value={granularity.level}
            aria-label={granularity.name}
            className="text-xs px-3"
            disabled={!selectedCity}
          >
            {granularity.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
