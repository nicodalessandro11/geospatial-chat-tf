"use client"

import { createContext, useContext, useState, useCallback, useRef, type ReactNode, useEffect, type Dispatch, type SetStateAction, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { analyticsLogger } from "@/lib/analytics/logger"
import { URL_PARAMS, STORAGE_KEYS } from "@/lib/constants"

// Import API service functions
import { getDistricts, getGeoJSON, getGeographicalLevels, getCityPointFeatures, getIndicatorDefinitions, getCityIndicators, getDistrictPolygons, getNeighborhoodPolygons } from "@/lib/api-service"

// Import types
import type { City, District, Neighborhood, PointFeature, Area, DynamicFilter, GeoJSONResponse, IndicatorDefinition } from "@/lib/api-types"

// Update GranularityLevel type to match what we're using
type GranularityLevel = {
  level: string
  name: string
}

// Type for filters
type Filters = {
  populationMin: number
  populationMax: number
  incomeMin: number
  incomeMax: number
  surfaceMin: number
  surfaceMax: number
  disposableIncomeMin: number
  disposableIncomeMax: number
}

// Type for filter ranges
type FilterRanges = {
  population: { min: number; max: number }
  income: { min: number; max: number }
  surface: { min: number; max: number }
  disposableIncome: { min: number; max: number }
}

// Map type (for tile layer)
type MapType = "osm" | "satellite" | "grayscale" | "terrain" | "dark" | "watercolor"

interface MapContextType {
  selectedCity: City | null
  setSelectedCity: (city: City | null) => void
  selectedArea: Area | null
  setSelectedArea: (area: Area | null) => void
  selectedGranularity: GranularityLevel | null
  setSelectedGranularity: (granularity: GranularityLevel | null) => void
  currentGeoJSON: GeoJSONResponse | null
  setCurrentGeoJSON: (geoJSON: GeoJSONResponse | null) => void
  visiblePointTypes: Record<string, boolean>
  setVisiblePointTypes: (types: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void
  dynamicPointTypes: string[]
  setDynamicPointTypes: (types: string[]) => void
  dynamicFilters: DynamicFilter[]
  setDynamicFilters: (filters: DynamicFilter[]) => void
  isLoadingGeoJSON: boolean
  setIsLoadingGeoJSON: (loading: boolean) => void
  hasSelectedGranularity: boolean
  mapType: MapType
  setMapType: (type: MapType) => void
  pointFeatures: PointFeature[]
  setPointFeatures: (features: PointFeature[]) => void
  resetFilters: () => void
  triggerRefresh: () => void
  mapInitialized: boolean
  setMapInitialized: (initialized: boolean) => void
  comparisonArea: Area | null
  setComparisonArea: (area: Area | null) => void
  availableAreas: Area[]
  setAvailableAreas: (areas: Area[]) => void
  loadGeoJSON: (cityId: number, granularityLevel: string) => Promise<void>
  availableIndicators: IndicatorDefinition[]
  setAvailableIndicators: (indicators: IndicatorDefinition[]) => void
  currentIndicators: any[]
  availableIndicatorDefinitions: IndicatorDefinition[]
  availableIndicatorValues: any[]
  setForceRefresh: (updater: (prev: number) => number) => void
  switchCity: (city: City | null) => Promise<void>
  switchGranularity: (granularity: GranularityLevel | null) => Promise<void>
}

const MapContext = createContext<MapContextType | undefined>(undefined)

// Utilidad para calcular el rango min/max de un campo numérico en un array de objetos
function calculateRange(arr: any[], key: string): { min: number; max: number } {
  const values = arr.map(item => item[key]).filter((v: any) => typeof v === 'number' && !isNaN(v))
  if (values.length === 0) return { min: 0, max: 0 }
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  }
}

// Utilidad para convertir a snake_case consistente
function toSnakeCase(str: string): string {
  return str
    .normalize('NFD').replace(/[0-\u036f]/g, '') // quita tildes
    .replace(/[^\w\s]/gi, '') // quita caracteres especiales
    .replace(/\s+/g, '_') // espacios a guion bajo
    .toLowerCase()
}

export function MapProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCity, setSelectedCityState] = useState<City | null>(null)
  const [selectedArea, setSelectedAreaState] = useState<Area | null>(null)
  const [selectedGranularity, setSelectedGranularityState] = useState<GranularityLevel | null>(null)
  const [comparisonArea, setComparisonArea] = useState<Area | null>(null)
  const [availableAreas, setAvailableAreas] = useState<Area[]>([])
  const [availableIndicators, setAvailableIndicators] = useState<IndicatorDefinition[]>([])
  const [currentIndicators, setCurrentIndicators] = useState<any[]>([])
  const [availableIndicatorDefinitions, setAvailableIndicatorDefinitions] = useState<IndicatorDefinition[]>([])
  const [availableIndicatorValues, setAvailableIndicatorValues] = useState<any[]>([])

  // Default filters
  const defaultFilters: Filters = {
    populationMin: 0,
    populationMax: 300000,
    incomeMin: 0,
    incomeMax: 60000,
    surfaceMin: 0,
    surfaceMax: 20,
    disposableIncomeMin: 0,
    disposableIncomeMax: 30000,
  }

  const [filters, _setFilters] = useState<Filters>(defaultFilters)
  const [filterRanges, setFilterRanges] = useState<FilterRanges>({
    population: { min: 0, max: 300000 },
    income: { min: 0, max: 60000 },
    surface: { min: 0, max: 20 },
    disposableIncome: { min: 0, max: 30000 },
  })
  const [visiblePointTypes, setVisiblePointTypesState] = useState<Record<string, boolean>>({})
  const [hasSelectedGranularity, _setHasSelectedGranularity] = useState<boolean>(false)
  const [mapType, setMapTypeState] = useState<MapType>("grayscale")
  const [currentGeoJSON, setCurrentGeoJSONState] = useState<GeoJSONResponse | null>(null)
  const [isLoadingGeoJSON, setIsLoadingGeoJSONState] = useState<boolean>(false)
  const [mapInitialized, setMapInitialized] = useState<boolean>(false)
  const [forceRefresh, setForceRefresh] = useState<number>(0)
  const [dynamicFilters, setDynamicFiltersState] = useState<DynamicFilter[]>([])
  const [dynamicPointTypes, setDynamicPointTypesState] = useState<string[]>([])
  const [pointFeatures, setPointFeaturesState] = useState<PointFeature[]>([])
  const [pointFeaturesCache, setPointFeaturesCache] = useState<Record<number, GeoJSONResponse>>({})

  // Reference to track the last load request
  const lastLoadRequestRef = useRef<string>("")
  const prevCityIdRef = useRef<number | null>(null)
  const prevGranularityLevelRef = useRef<string | null>(null)
  const filterRangesLoadedRef = useRef<boolean>(false)

  // Ref para evitar bucles de carga
  const lastLoadKeyRef = useRef<string>("")

  // Trigger map refresh - moved to the top
  const triggerRefresh = useCallback(() => {
    // Force a re-render of the map
    setCurrentGeoJSONState(prev => prev ? { ...prev } : null)
  }, [])

  // Initialize city from URL or localStorage
  useEffect(() => {
    if (!searchParams) return;

    const cityId = searchParams.get(URL_PARAMS.CITY);
    if (cityId) {
      // Only set the city if it's different from the current one
      if (!selectedCity || selectedCity.id.toString() !== cityId) {
        const savedCity = localStorage.getItem(STORAGE_KEYS.SELECTED_CITY);
        if (savedCity) {
          try {
            const parsedCity = JSON.parse(savedCity);
            if (parsedCity.id.toString() === cityId) {
              setSelectedCityState(parsedCity);
            }
          } catch (error) {
            console.error("Error parsing saved city:", error);
          }
        }
      }
    }
  }, [searchParams, selectedCity]);

  // Load available point types when city changes
  useEffect(() => {
    async function loadAvailablePointTypes() {
      if (!selectedCity) {
        setDynamicPointTypesState([])
        setVisiblePointTypesState({})
        return
      }

      try {
        // console.log(`[MapContext] Loading point features for city ${selectedCity.id}`)
        const features = await getCityPointFeatures(selectedCity.id)
        // console.log(`[MapContext] Loaded ${features.length} point features`)

        // Get unique feature types
        const uniqueTypes = Array.from(
          new Set(
            features
              .map(f => f.featureType)
              .filter((type): type is string => type !== undefined)
          )
        )
        // console.log(`[MapContext] Found ${uniqueTypes.length} unique feature types:`, uniqueTypes)

        // Try to load saved visibility state from localStorage
        const savedVisibility = localStorage.getItem(`visiblePointTypes_${selectedCity.id}`)
        let initialVisibility: Record<string, boolean>

        if (savedVisibility) {
          try {
            initialVisibility = JSON.parse(savedVisibility)
            // Ensure all current types are in the saved state
            uniqueTypes.forEach(type => {
              if (!(type in initialVisibility)) {
                initialVisibility[type] = false
              }
            })
            // Remove any types that no longer exist
            Object.keys(initialVisibility).forEach(type => {
              if (!uniqueTypes.includes(type)) {
                delete initialVisibility[type]
              }
            })
          } catch (error) {
            console.error("[MapContext] Error parsing saved visibility state:", error)
            initialVisibility = uniqueTypes.reduce<Record<string, boolean>>((acc, type) => {
              acc[type] = false
              return acc
            }, {})
          }
        } else {
          // Initialize all types as hidden if no saved state exists
          initialVisibility = uniqueTypes.reduce<Record<string, boolean>>((acc, type) => {
            acc[type] = false
            return acc
          }, {})
        }

        // console.log("[MapContext] Initial visibility state:", initialVisibility)

        setDynamicPointTypesState(uniqueTypes)
        setVisiblePointTypesState(initialVisibility)
      } catch (error) {
        console.error("[MapContext] Error loading point types:", error)
        setDynamicPointTypesState([])
        setVisiblePointTypesState({})
      }
    }

    loadAvailablePointTypes()
  }, [selectedCity])

  // Add effect to restore visibility state when navigating to root
  useEffect(() => {
    if (selectedCity) {
      const savedVisibility = localStorage.getItem(`visiblePointTypes_${selectedCity.id}`)
      if (savedVisibility) {
        try {
          const parsedVisibility = JSON.parse(savedVisibility)
          setVisiblePointTypesState(parsedVisibility)
        } catch (error) {
          console.error("[MapContext] Error restoring visibility state:", error)
        }
      }
    }
  }, [selectedCity])

  // Update the loadAvailableAreas function to use direct Supabase data
  const loadAvailableAreas = useCallback(async (cityId: number, granularityLevel: string) => {
    if (!cityId || !granularityLevel) return

    // Only load areas if we have a selected area or if we're changing granularity
    if (!selectedArea && !prevGranularityLevelRef.current) return

    try {
      let areas: any[] = []

      if (granularityLevel === "district") {
        const districtsData = await getDistricts(cityId)
        areas = districtsData
      } else if (granularityLevel === "neighborhood" || granularityLevel === "neighbourhood") {
        try {
          const geoJsonData = await getGeoJSON(cityId, "neighborhood")
          if (geoJsonData && geoJsonData.features) {
            areas = geoJsonData.features.map((feature: any) => {
              const properties = feature.properties || {}
              return {
                id: properties.id,
                name: properties.name,
                districtId: properties.district_id,
                cityId: properties.city_id,
                district_id: properties.district_id,
                city_id: properties.city_id,
                population: properties.population || 0,
                avgIncome: properties.avg_income || 0,
                surface: properties.surface || 0,
                disposableIncome: properties.disposable_income || 0,
              }
            }).filter(area => area.id && area.name)
          }
        } catch (error) {
          throw error
        }
      }

      setAvailableAreas(areas)
    } catch (error) {
      setAvailableAreas([])
    }
  }, [selectedArea])

  // Function to load GeoJSON data with caching
  const loadGeoJSON = useCallback(
    async (cityId: number, granularityLevel: string) => {
      if (!cityId || !granularityLevel) {
        return
      }

      const cacheKey = `${cityId}_${granularityLevel}`

      // If we're already loading this exact data, don't start another load
      if (lastLoadRequestRef.current === cacheKey && isLoadingGeoJSON) {
        return
      }

      // Save this request as the last one
      lastLoadRequestRef.current = cacheKey

      // Loading guard: prevent overlapping loads
      if (isLoadingGeoJSON) {
        return
      }

      setIsLoadingGeoJSONState(true)

      try {
        console.log('[MapContext] Loading GeoJSON for:', { cityId, granularityLevel })

        // 1. Load polygons with geometry
        let geojson
        if (granularityLevel === "district") {
          geojson = await getDistrictPolygons(cityId)
        } else if (granularityLevel === "neighborhood" || granularityLevel === "neighbourhood") {
          geojson = await getNeighborhoodPolygons(cityId)
        } else {
          throw new Error("Invalid granularity level")
        }

        // 2. Only update the GeoJSON if valid and has features
        if (geojson && geojson.features && geojson.features.length > 0) {
          setCurrentGeoJSONState(geojson)
          console.log('[MapContext] GeoJSON loaded:', {
            features: geojson.features?.length,
            firstFeature: geojson.features?.[0]
          })

          // 3. Extract and set available areas
          const areas = geojson.features.map((feature: any) => {
            const properties = feature.properties || {}
            return {
              id: properties.id,
              name: properties.name,
              districtId: properties.district_id,
              cityId: properties.city_id,
              district_id: properties.district_id,
              city_id: properties.city_id,
              population: properties.population || 0,
              avgIncome: properties.avg_income || 0,
              surface: properties.surface || 0,
              disposableIncome: properties.disposable_income || 0,
            }
          }).filter(area => area.id && area.name)

          console.log('[MapContext] Setting available areas:', { count: areas.length })
          setAvailableAreas(areas)
        } else {
          // If no features, do not clear the old polygons, just show an error
          console.error('[MapContext] No valid GeoJSON features loaded for city', cityId, 'level', granularityLevel)
        }

        setIsLoadingGeoJSONState(false)
        setForceRefresh((prev) => prev + 1)
      } catch (error) {
        console.error('[MapContext] Error loading GeoJSON:', error)
        setIsLoadingGeoJSONState(false)
        // Do NOT clear the old polygons here
        // setAvailableAreas([])
      }
    },
    [isLoadingGeoJSON, setForceRefresh],
  )

  // Cargar y cachear los indicadores y definiciones al cambiar ciudad o granularidad
  useEffect(() => {
    async function loadIndicatorsAndDefs() {
      if (!selectedCity || !selectedGranularity) {
        setAvailableIndicatorDefinitions([]);
        setAvailableIndicatorValues([]);
        setDynamicFiltersState([]);
        setCurrentIndicators([]);
        return;
      }
      try {
        const [definitions, indicators] = await Promise.all([
          getIndicatorDefinitions(),
          getCityIndicators(selectedCity.id, selectedGranularity.level)
        ]);
        setAvailableIndicatorDefinitions(definitions);
        setAvailableIndicatorValues(indicators);
        setAvailableIndicators(definitions);
        setCurrentIndicators(indicators);
        // Generar filtros dinámicos usando el rango real de la base de datos
        const dynamicFilters = definitions.map(def => {
          // Buscar todos los valores de este indicador para las áreas
          const values = indicators.filter(ind => ind.indicator_def_id === def.id).map(ind => ind.value)
          if (!values.length) return null
          const min = Math.min(...values)
          const max = Math.max(...values)
          return {
            key: def.id.toString(),
            name: def.name,
            unit: def.unit || '',
            min,
            max,
            value: [min, max] as [number, number] // SIEMPRE el rango completo
          }
        }).filter(Boolean)
        setDynamicFiltersState(dynamicFilters as DynamicFilter[])
      } catch (error) {
        setAvailableIndicatorDefinitions([]);
        setAvailableIndicatorValues([]);
        setAvailableIndicators([]);
        setDynamicFiltersState([]);
        setCurrentIndicators([]);
      }
    }
    loadIndicatorsAndDefs()
  }, [selectedCity, selectedGranularity])

  // Function to load filter ranges based on available data
  const loadFilterRanges = useCallback(async (cityId: number, granularityLevel: string) => {
    if (!cityId || !granularityLevel) return

    // Only load filter ranges if we have a selected area or if we're changing granularity
    if (!selectedArea && !prevGranularityLevelRef.current) return

    try {
      let areas: any[] = []

      if (granularityLevel === "district") {
        const districtsData = await getDistricts(cityId)
        areas = districtsData
      } else if (granularityLevel === "neighbourhood" || granularityLevel === "neighborhood") {
        try {
          const geoJsonData = await getGeoJSON(cityId, "neighborhood")
          if (geoJsonData && geoJsonData.features) {
            areas = geoJsonData.features.map((feature: any) => ({
              population: feature.properties.population,
              avg_income: feature.properties.avg_income,
              surface: feature.properties.surface,
              disposable_income: feature.properties.disposable_income,
            }))
          }
        } catch (error) {
          throw error
        }
      }

      // Calculate filter ranges from areas data
      const ranges = {
        population: calculateRange(areas, "population"),
        income: calculateRange(areas, "avg_income"),
        surface: calculateRange(areas, "surface"),
        disposableIncome: calculateRange(areas, "disposable_income"),
      }

      setFilterRanges(ranges)
      filterRangesLoadedRef.current = true
    } catch (error) {
      setFilterRanges({
        population: { min: 0, max: 0 },
        income: { min: 0, max: 0 },
        surface: { min: 0, max: 0 },
        disposableIncome: { min: 0, max: 0 },
      })
      filterRangesLoadedRef.current = false
    }
  }, [selectedArea])

  // Reset filters to their full range
  const resetFilters = useCallback(() => {
    if (!filterRanges) return;

    // Reset classic filters
    const newFilters = {
      populationMin: filterRanges.population.min,
      populationMax: filterRanges.population.max,
      incomeMin: filterRanges.income.min,
      incomeMax: filterRanges.income.max,
      surfaceMin: filterRanges.surface.min,
      surfaceMax: filterRanges.surface.max,
      disposableIncomeMin: filterRanges.disposableIncome.min,
      disposableIncomeMax: filterRanges.disposableIncome.max,
    };
    _setFilters(newFilters);

    // Reset dynamic filters (sliders)
    setDynamicFiltersState((prev) =>
      prev.map((f) => ({
        ...f,
        value: [f.min, f.max],
      }))
    );

    setForceRefresh((prev) => prev + 1);
  }, [filterRanges, _setFilters]);

  // Atomic city switch: loads new GeoJSON, then updates selectedCity and currentGeoJSON together
  const switchCity = useCallback(async (city: City | null) => {
    if (!city || (selectedCity?.id === city.id)) return;

    // Log city selection
    if (user && city) {
      analyticsLogger.logEvent({
        user_id: user.id,
        event_type: 'map.view',
        event_details: {
          city: city.name,
          city_id: city.id
        }
      });
    }

    // Update the URL using router
    const params = new URLSearchParams(window.location.search);
    if (city?.id) {
      params.set("city", city.id.toString());
    } else {
      params.delete("city");
    }
    router.replace(`?${params.toString()}`, { scroll: false });

    // Load new GeoJSON before updating city
    let geojson = null;
    let areas: Area[] = [];
    if (selectedGranularity) {
      try {
        if (selectedGranularity.level === "district") {
          geojson = await getDistrictPolygons(city.id)
        } else if (selectedGranularity.level === "neighborhood" || selectedGranularity.level === "neighbourhood") {
          geojson = await getNeighborhoodPolygons(city.id)
        }
        if (geojson && geojson.features && geojson.features.length > 0) {
          areas = geojson.features.map((feature: any) => {
            const properties = feature.properties || {}
            return {
              id: properties.id,
              name: properties.name,
              districtId: properties.district_id,
              cityId: properties.city_id,
              district_id: properties.district_id,
              city_id: properties.city_id,
              population: properties.population || 0,
              avgIncome: properties.avg_income || 0,
              surface: properties.surface || 0,
              disposableIncome: properties.disposable_income || 0,
            }
          }).filter(area => area.id && area.name)
        }
      } catch (error) {
        console.error('[MapContext] Error loading GeoJSON for switchCity:', error)
      }
    }

    // Now update all state atomically
    setSelectedCityState(city);
    if (geojson && geojson.features && geojson.features.length > 0) {
      setCurrentGeoJSONState(geojson);
      setAvailableAreas(areas);
    }
    setSelectedAreaState(null);
    setComparisonArea(null);
    setDynamicFiltersState([]);
    _setFilters(defaultFilters);
    triggerRefresh();
  }, [selectedCity, selectedGranularity, user, router, triggerRefresh]);

  // Atomic granularity switch: loads new GeoJSON, then updates granularity and areas together
  const switchGranularity = useCallback(async (granularity: GranularityLevel | null) => {
    if (!granularity || !selectedCity || (selectedGranularity?.level === granularity.level)) return;

    setIsLoadingGeoJSONState(true);

    try {
      // Load new GeoJSON before updating any state
      let geojson = null;
      let areas: Area[] = [];

      if (granularity.level === "district") {
        geojson = await getDistrictPolygons(selectedCity.id)
      } else if (granularity.level === "neighborhood" || granularity.level === "neighbourhood") {
        geojson = await getNeighborhoodPolygons(selectedCity.id)
      }

      if (geojson && geojson.features && geojson.features.length > 0) {
        areas = geojson.features.map((feature: any) => {
          const properties = feature.properties || {}
          return {
            id: properties.id,
            name: properties.name,
            districtId: properties.district_id,
            cityId: properties.city_id,
            district_id: properties.district_id,
            city_id: properties.city_id,
            population: properties.population || 0,
            avgIncome: properties.avg_income || 0,
            surface: properties.surface || 0,
            disposableIncome: properties.disposable_income || 0,
          }
        }).filter(area => area.id && area.name)
      }

      // Update URL first
      const params = new URLSearchParams(window.location.search);
      params.set("level", granularity.level);
      router.replace(`?${params.toString()}`, { scroll: false });

      // Now update all state atomically
      setSelectedGranularityState(granularity);
      _setHasSelectedGranularity(true);
      if (geojson && geojson.features && geojson.features.length > 0) {
        setCurrentGeoJSONState(geojson);
        setAvailableAreas(areas);
      }
      setSelectedAreaState(null);
      setComparisonArea(null);
      setDynamicFiltersState([]);
      _setFilters(defaultFilters);
      triggerRefresh();
    } catch (error) {
      console.error('[MapContext] Error loading GeoJSON for switchGranularity:', error)
    } finally {
      setIsLoadingGeoJSONState(false);
    }
  }, [selectedCity, selectedGranularity, router, triggerRefresh]);

  // Custom setter for selectedCity that also updates the global variable
  const setSelectedCity = useCallback((city: City | null) => {
    // Prevent unnecessary updates
    if (selectedCity?.id === city?.id) {
      return;
    }

    // Log city selection
    if (user && city) {
      analyticsLogger.logEvent({
        user_id: user.id,
        event_type: 'map.view',
        event_details: {
          city: city.name,
          city_id: city.id
        }
      });
    }

    // Update the URL using router
    const params = new URLSearchParams(window.location.search);
    if (city?.id) {
      params.set("city", city.id.toString());
    } else {
      params.delete("city");
    }
    // Use replace instead of push to prevent adding to history
    router.replace(`?${params.toString()}`, { scroll: false });

    // Clear only the necessary state
    setAvailableAreas([]);
    setSelectedAreaState(null);
    setDynamicFiltersState([]);
    _setFilters(defaultFilters);

    // Update the city state
    setSelectedCityState(city);

    // Force a refresh to ensure all components update
    triggerRefresh();

    // If we have a city and granularity, load the data immediately
    if (city && selectedGranularity) {
      Promise.all([
        loadGeoJSON(city.id, selectedGranularity.level),
        loadAvailableAreas(city.id, selectedGranularity.level),
        loadFilterRanges(city.id, selectedGranularity.level)
      ]).catch(error => {
        console.error("Error loading data for new city:", error);
      });
    }
  }, [selectedCity, selectedGranularity, loadGeoJSON, loadAvailableAreas, loadFilterRanges, triggerRefresh, user, router]);

  // Custom setter for selectedGranularity
  const setSelectedGranularity = useCallback(
    (granularity: GranularityLevel | null) => {
      console.log('[MapContext] setSelectedGranularity called with:', granularity);
      setSelectedGranularityState(granularity);
    },
    []
  )

  // Custom setter for selectedArea
  const setSelectedArea = useCallback((area: Area | null) => {
    console.log('[MapContext] setSelectedArea called with:', area);
    setSelectedAreaState(area);
  }, [])

  // Custom setter for visiblePointTypes
  const setVisiblePointTypes = useCallback(
    (typesOrUpdater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
      setVisiblePointTypesState(prev => {
        const types = typeof typesOrUpdater === 'function' ? typesOrUpdater(prev) : typesOrUpdater
        // Save to localStorage when the state changes
        if (selectedCity) {
          localStorage.setItem(`visiblePointTypes_${selectedCity.id}`, JSON.stringify(types))
        }
        return types
      })
    },
    [selectedCity],
  )

  // Custom setter for mapType
  const setMapType = useCallback(
    (type: MapType) => {
      if (type !== mapType) {
        setMapTypeState(type)
        // Force a refresh after changing the map type
        setTimeout(() => {
          triggerRefresh()
        }, 0)
      }
    },
    [mapType, triggerRefresh],
  )

  // Debounced loader for GeoJSON and available areas
  useEffect(() => {
    if (!selectedCity || !selectedGranularity) return;
    const loadKey = `${selectedCity.id}_${selectedGranularity.level}`;
    if (lastLoadKeyRef.current === loadKey) return; // Already loaded

    // Debounce: batch rapid changes
    const timeout = setTimeout(() => {
      if (lastLoadKeyRef.current === loadKey) return;
      lastLoadKeyRef.current = loadKey;
      loadGeoJSON(selectedCity.id, selectedGranularity.level);
      loadAvailableAreas(selectedCity.id, selectedGranularity.level);
      loadFilterRanges(selectedCity.id, selectedGranularity.level);
    }, 50); // 50ms debounce

    return () => clearTimeout(timeout);
  }, [selectedCity, selectedGranularity]);

  // Actualizar dynamicPointTypes cuando cambian los pointFeatures
  useEffect(() => {
    if (!pointFeatures || pointFeatures.length === 0) {
      setDynamicPointTypesState([])
      return
    }
    const types = Array.from(new Set(pointFeatures.map(f => f.featureType).filter(Boolean))) as string[]
    setDynamicPointTypesState(types)
  }, [pointFeatures])

  // Ensure hasSelectedGranularity always reflects selectedGranularity
  useEffect(() => {
    _setHasSelectedGranularity(!!selectedGranularity)
  }, [selectedGranularity])

  // Load available indicators when city changes (not granularity)
  useEffect(() => {
    async function loadIndicators() {
      if (!selectedCity) {
        setAvailableIndicators([])
        return
      }
      try {
        const [definitions, indicators] = await Promise.all([
          getIndicatorDefinitions(),
          getCityIndicators(selectedCity.id, "city") // or use a default level if needed
        ])
        const filtered = definitions.filter(def =>
          indicators.some(ind => ind.indicator_def_id === def.id)
        )
        setAvailableIndicators(filtered)
      } catch (error) {
        setAvailableIndicators([])
      }
    }
    loadIndicators()
  }, [selectedCity])

  // Sync selectedGranularity with the ?level= param in the URL on mount/navigation
  useEffect(() => {
    if (!searchParams) return;
    const levelParam = searchParams.get("level");
    if (levelParam && (!selectedGranularity || selectedGranularity.level !== levelParam)) {
      // Only update if not already set
      const granularityLevels = [
        { id: 2, name: "Districts", level: "district" },
        { id: 3, name: "Neighborhoods", level: "neighborhood" },
      ];
      const found = granularityLevels.find(g => g.level === levelParam);
      if (found) {
        setSelectedGranularityState(found);
        _setHasSelectedGranularity(true);
      }
    }
  }, [searchParams, selectedGranularity]);

  // Always reset selectedArea when city changes (in all views)
  useEffect(() => {
    setSelectedAreaState(null);
  }, [selectedCity]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    selectedCity,
    setSelectedCity,
    switchCity,
    selectedArea,
    setSelectedArea,
    selectedGranularity,
    setSelectedGranularity,
    switchGranularity,
    currentGeoJSON,
    setCurrentGeoJSON: setCurrentGeoJSONState,
    visiblePointTypes,
    setVisiblePointTypes,
    dynamicPointTypes,
    setDynamicPointTypes: setDynamicPointTypesState,
    dynamicFilters,
    setDynamicFilters: setDynamicFiltersState,
    isLoadingGeoJSON,
    setIsLoadingGeoJSON: setIsLoadingGeoJSONState,
    hasSelectedGranularity,
    mapType,
    setMapType,
    pointFeatures,
    setPointFeatures: setPointFeaturesState,
    resetFilters,
    triggerRefresh,
    mapInitialized,
    setMapInitialized,
    comparisonArea,
    setComparisonArea,
    availableAreas,
    setAvailableAreas,
    loadGeoJSON,
    availableIndicators,
    setAvailableIndicators,
    currentIndicators,
    availableIndicatorDefinitions,
    availableIndicatorValues,
    setForceRefresh,
  }), [
    selectedCity,
    setSelectedCity,
    switchCity,
    selectedArea,
    setSelectedArea,
    selectedGranularity,
    setSelectedGranularity,
    switchGranularity,
    currentGeoJSON,
    visiblePointTypes,
    dynamicPointTypes,
    dynamicFilters,
    isLoadingGeoJSON,
    hasSelectedGranularity,
    mapType,
    pointFeatures,
    mapInitialized,
    comparisonArea,
    availableAreas,
    availableIndicators,
    currentIndicators,
    availableIndicatorDefinitions,
    availableIndicatorValues,
    setForceRefresh,
  ])

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}

export function useMapContext() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error("useMapContext must be used within a MapProvider")
  }
  return context
}
