"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useMapContext } from "@/contexts/map-context"
import { Loader2 } from "lucide-react"
import { getCityPointFeatures, getFeatureDefinitions } from "@/lib/api-service"
import dynamic from "next/dynamic"
import { MapTypeSelector } from "@/components/map-type-selector"
import type { PointFeature, FeatureDefinition } from "@/lib/api-types"
import { DataDisclaimer } from "./data-disclaimer"
import { getFeatureTypeName } from "@/lib/feature-styles"

// Create a client-side only component for the map
const MapWithNoSSR = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Loading map...</span>
    </div>
  ),
})

// Debug flag to control verbose logging
const DEBUG_MODE = false

// Add this function after the existing imports
function debugMadridPoints(points: PointFeature[], visibleTypes: Record<string, boolean>) {
  if (!DEBUG_MODE) return;

  // console.group("🔍 Madrid Points Debug")
  // console.log(`Total Madrid points: ${points.length}`)
  // console.groupEnd()
}

export default function MapComponent() {
  const {
    selectedCity,
    selectedGranularity,
    currentGeoJSON,
    visiblePointTypes,
    isLoadingGeoJSON,
    hasSelectedGranularity,
    mapType,
    setPointFeatures,
    pointFeatures,
  } = useMapContext()

  const mapContainerRef = useRef(null)
  const [isLoadingPoints, setIsLoadingPoints] = useState(false)
  const [isPointsVisible, setIsPointsVisible] = useState(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [featureDefinitions, setFeatureDefinitions] = useState<FeatureDefinition[]>([])

  // Load feature definitions
  useEffect(() => {
    async function loadFeatureDefinitions() {
      try {
        const defs = await getFeatureDefinitions()
        setFeatureDefinitions(defs)
      } catch (error) {
        console.error("[MapComponent] Error loading feature definitions:", error)
      }
    }
    loadFeatureDefinitions()
  }, [])

  // Effect to load point features in the background
  useEffect(() => {
    if (!selectedCity) return

    // Hide points while loading
    setIsPointsVisible(false)

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }

    const loadPointFeatures = async () => {
      setIsLoadingPoints(true)
      try {
        const features = await getCityPointFeatures(selectedCity.id)
        // Map the features to include the feature type name
        const mappedFeatures = features.map(feature => ({
          ...feature,
          featureType: getFeatureTypeName(featureDefinitions, feature.feature_definition_id)
        }))
        setPointFeatures(mappedFeatures)
        // Keep points hidden by default - they will be shown only when toggled
        setIsLoadingPoints(false)
      } catch (error) {
        console.error("Error loading point features:", error)
        setIsLoadingPoints(false)
      }
    }

    // Start loading after a small delay to prioritize map rendering
    loadingTimeoutRef.current = setTimeout(loadPointFeatures, 100)

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [selectedCity, setPointFeatures, featureDefinitions])

  // Filter point features based on visible types and visibility state
  const filteredPointFeatures = useMemo(() => {
    if (!pointFeatures || pointFeatures.length === 0) {
      return []
    }

    return pointFeatures.filter((feature) => {
      const featureType = feature.featureType
      if (!featureType || typeof featureType !== 'string') {
        return false
      }

      // Only show points that are explicitly enabled
      return (visiblePointTypes as Record<string, boolean>)[featureType] === true
    })
  }, [pointFeatures, visiblePointTypes])

  // Debug Madrid points if selected
  if (selectedCity?.id === 2 && DEBUG_MODE) {
    debugMadridPoints(pointFeatures, visiblePointTypes)
  }

  return (
    <div className="h-full w-full relative" ref={mapContainerRef}>
      <MapWithNoSSR
        selectedCity={selectedCity}
        selectedGranularity={selectedGranularity}
        currentGeoJSON={currentGeoJSON}
        pointFeatures={filteredPointFeatures}
        hasSelectedGranularity={hasSelectedGranularity}
        mapType={mapType}
        visiblePointTypes={visiblePointTypes}
      />

      {/* Map Type Selector */}
      <MapTypeSelector />

      {/* Loading indicator */}
      {(isLoadingGeoJSON || isLoadingPoints) && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-80 p-4 rounded-lg shadow-lg z-[1000] flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading data...</span>
        </div>
      )}

      {/* Message to select city */}
      {!selectedCity && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card/80 text-card-foreground border border-border p-4 rounded-xl shadow-lg z-[900] text-center max-w-md backdrop-blur-md">
          <img src="/mascot-blue.svg" alt="Queryous Mascot" className="w-16 h-16 mx-auto mb-2 bg-primary p-1 rounded-full" />
          <h3 className="text-lg font-bold mb-2 text-primary">Welcome to Are-u-Queryous?</h3>
          <p className="text-base text-muted-foreground my-4 border-b border-gray-200 pb-4">
            <b>Select a city from the top menu</b> to start exploring geospatial data.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            <span className="block">
              <a href="/info" className="text-primary underline hover:text-primary/80">Check our info page</a> to learn how everything works!
            </span>
            <br />
            Want a more personalized experience?{' '}
            <span className="block">
              <a href="/signup" className="text-primary underline hover:text-primary/80">Sign up</a> or <a href="/signin" className="text-primary underline hover:text-primary/80">sign in</a> to unlock all features!
            </span>
          </p>
          <DataDisclaimer />
        </div>
      )}

      {/* Message to select level after city is selected */}
      {selectedCity && !currentGeoJSON && !hasSelectedGranularity && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card/80 text-card-foreground border border-border p-6 rounded-xl shadow-lg z-[900] text-center max-w-md backdrop-blur-md">
          <h3 className="text-lg font-bold mb-2 text-primary">Great! You've selected {selectedCity.name}</h3>
          <p className="text-base text-muted-foreground mb-4">
            Now select the level of detail you want to see using the "Level" selector in the top menu.
          </p>
          <p className="text-sm text-muted-foreground">
            You can switch between Districts and Neighborhoods at any time.
          </p>
        </div>
      )}
    </div>
  )
}
