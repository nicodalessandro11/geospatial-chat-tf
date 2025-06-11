"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useMapContext } from "@/contexts/map-context"
import { getFeatureDefinitions } from "@/lib/api-service"
import type { FeatureDefinition } from "@/lib/api-types"
import { getIconUrlForFeatureType } from "@/lib/feature-styles"

type VisiblePointTypes = Record<string, boolean>

// Helper to map marker icon filename to color
const markerColorMap: Record<string, string> = {
  "marker-icon-blue.png": "#2A81CB",
  "marker-icon-red.png": "#D41159",
  "marker-icon-green.png": "#3CB44B",
  "marker-icon-orange.png": "#FF8800",
  "marker-icon-yellow.png": "#FFD700",
  "marker-icon-violet.png": "#911EB4",
  "marker-icon-grey.png": "#808080",
  "marker-icon-black.png": "#000000",
}

function getColorForFeatureType(featureType: string) {
  const iconUrl = getIconUrlForFeatureType(featureType)
  const filename = iconUrl.split("/").pop() || ""
  return markerColorMap[filename] || "#2A81CB"
}

// Helper to format feature labels
const getFeatureLabel = (type: string) =>
  type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())

export function PointFeaturesToggle() {
  const {
    selectedCity,
    visiblePointTypes,
    setVisiblePointTypes,
    dynamicPointTypes
  } = useMapContext()
  const [localVisibleTypes, setLocalVisibleTypes] = useState<Record<string, boolean>>({})
  const [featureDefinitions, setFeatureDefinitions] = useState<FeatureDefinition[]>([])

  // Load feature definitions
  useEffect(() => {
    async function loadFeatureDefinitions() {
      try {
        const defs = await getFeatureDefinitions()
        setFeatureDefinitions(defs)
      } catch (error) {
        console.error("[PointFeaturesToggle] Error loading feature definitions:", error)
      }
    }
    loadFeatureDefinitions()
  }, [])

  // Initialize local state from context
  useEffect(() => {
    setLocalVisibleTypes(visiblePointTypes)
  }, [visiblePointTypes])

  // Handle toggle changes
  const handleToggleChange = useCallback((type: string, checked: boolean) => {
    const newState = { ...localVisibleTypes, [type]: checked }
    setLocalVisibleTypes(newState)
    setVisiblePointTypes(newState)
  }, [localVisibleTypes, setVisiblePointTypes])

  // Reset visibility only when city actually changes
  useEffect(() => {
    if (selectedCity) {
      // Try to load saved state from localStorage
      const savedVisibility = localStorage.getItem(`visiblePointTypes_${selectedCity.id}`)
      if (savedVisibility) {
        try {
          const parsedVisibility = JSON.parse(savedVisibility)
          setLocalVisibleTypes(parsedVisibility)
          setVisiblePointTypes(parsedVisibility)
        } catch (error) {
          console.error("[PointFeaturesToggle] Error parsing saved visibility state:", error)
          // If there's an error, initialize all to false
          const newState = Object.fromEntries(
            dynamicPointTypes.map(type => [type, false])
          )
          setLocalVisibleTypes(newState)
          setVisiblePointTypes(newState)
        }
      } else {
        // If no saved state, initialize all to false
        const newState = Object.fromEntries(
          dynamicPointTypes.map(type => [type, false])
        )
        setLocalVisibleTypes(newState)
        setVisiblePointTypes(newState)
      }
    }
  }, [selectedCity?.id, dynamicPointTypes, setVisiblePointTypes])

  if (!dynamicPointTypes.length) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No point features available</p>
      </div>
    )
  }

  return (
    <Card className="p-4">
      {dynamicPointTypes.length > 0 ? (
        <>
          <div className="flex flex-col gap-2">
            {dynamicPointTypes.map((type) => {
              const isVisible = localVisibleTypes[type] ?? false // Default to false
              const color = getColorForFeatureType(type)

              return (
                <div key={type} className="flex items-center gap-2">
                  <Switch
                    checked={isVisible}
                    onCheckedChange={(checked) => handleToggleChange(type, checked)}
                    style={{
                      '--switch-checked-bg': color,
                      backgroundColor: isVisible ? color : undefined,
                      borderColor: isVisible ? color : undefined,
                    } as React.CSSProperties}
                  />
                  <span className="capitalize text-xs">{getFeatureLabel(type)}</span>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {selectedCity
            ? "No points available for this city/level"
            : "Select a city to see available points"}
        </div>
      )}
    </Card>
  )
}
