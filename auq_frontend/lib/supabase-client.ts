import { createClient } from "@supabase/supabase-js"
import type {
  City,
  District,
  Neighborhood,
  IndicatorDefinition,
  FeatureDefinition,
  PointFeature,
  Indicator,
  GeoJSONResponse,
  GeoJSONFeature,
} from "./api-types"
import { getFeatureTypeName } from "./feature-styles"

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === "true" || true // Default to true for development

// Create a singleton Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance && SUPABASE_URL && SUPABASE_KEY) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY)
    console.log("Supabase client initialized")
  }
  return supabaseInstance
})()

// Cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>()

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000

// Helper function to get cached data
function getCachedData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const cachedItem = apiCache.get(key)
  const now = Date.now()

  if (cachedItem && now - cachedItem.timestamp < CACHE_TTL) {
    console.log(`[Cache Hit] ${key}`)
    return Promise.resolve(cachedItem.data)
  }

  console.log(`[Cache Miss] ${key}`)
  return fetchFn().then(data => {
    apiCache.set(key, { data, timestamp: now })
    return data
  })
}

// Helper function to set cached data
function setCachedData<T>(key: string, data: T): void {
  apiCache.set(key, { data, timestamp: Date.now() })
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  console.log('[clearCache] Clearing all cache')
  apiCache.clear()
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(key: string): void {
  console.log(`[clearCacheEntry] Clearing cache for key: ${key}`)
  apiCache.delete(key)
}

/**
 * Get all cities
 */
export async function getCities(): Promise<City[]> {
  console.log('[getCities] Function called')
  if (!USE_SUPABASE || !supabase) {
    throw new Error("Supabase client not available or disabled")
  }

  return getCachedData('cities', async () => {
    console.log('[getCities] Fetching from Supabase')
    const { data, error } = await supabase.from("cities").select("*").order("id")
    if (error) throw new Error(error.message)
    // Ensure data is typed as City[]
    return (data ?? []).map((city: any) => ({
      id: city.id,
      name: city.name,
      country: city.country,
      created_at: city.created_at
      // ...add other fields as needed
    }))
  })
}

/**
 * Get district polygons as GeoJSON for a city
 */
export async function getDistrictPolygons(cityId: number): Promise<GeoJSONResponse> {
  if (!USE_SUPABASE || !supabase) {
    throw new Error("Supabase client not available or disabled")
  }

  return getCachedData(`district_polygons_${cityId}`, async () => {
    const { data, error } = await supabase.from("district_polygons_view").select("*").eq("city_id", cityId)

    if (error) {
      throw new Error(`Error fetching district polygons: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error(`No district polygons found for city ${cityId}`)
    }

    // Transform to GeoJSON
    const features: GeoJSONFeature[] = data.map((district: any, index: number) => ({
      type: "Feature",
      properties: {
        id: Number(district.id),
        name: String(district.name),
        district_code: district.district_code,
        city_id: Number(district.city_id),
        level: "district",
        index,
      },
      geometry: district.geometry,
    }))

    return {
      type: "FeatureCollection",
      features,
      properties: {},
    } as GeoJSONResponse
  })
}

/**
 * Get neighborhood polygons as GeoJSON for a city
 */
export async function getNeighbourhoodPolygons(cityId: number): Promise<GeoJSONResponse> {
  if (!USE_SUPABASE || !supabase) {
    throw new Error("Supabase client not available or disabled")
  }

  return getCachedData(`neighborhood_polygons_${cityId}`, async () => {
    const { data, error } = await supabase.from("neighborhood_polygons_view").select("*").eq("city_id", cityId)

    if (error) {
      throw new Error(`Error fetching neighborhood polygons: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error(`No neighborhood polygons found for city ${cityId}`)
    }

    // Transform to GeoJSON
    const features: GeoJSONFeature[] = data.map((neighborhood: any, index: number) => ({
      type: "Feature",
      properties: {
        id: Number(neighborhood.id),
        name: String(neighborhood.name),
        neighbourhood_code: neighborhood.neighbourhood_code,
        district_id: Number(neighborhood.district_id),
        city_id: Number(neighborhood.city_id),
        level: "neighborhood",
        index,
      },
      geometry: neighborhood.geometry,
    }))

    return {
      type: "FeatureCollection",
      features,
      properties: {},
    } as GeoJSONResponse
  })
}

export const getNeighborhoodPolygons = getNeighbourhoodPolygons

/**
 * Get geographical units for a city at a specific level
 */
export async function getGeographicalUnits(cityId: number, level: string): Promise<any[]> {
  if (!USE_SUPABASE || !supabase) {
    throw new Error("Supabase client not available or disabled")
  }

  const geoLevelId = level === "district" ? 2 : level === "neighborhood" ? 3 : null

  if (geoLevelId === null) {
    throw new Error(`Invalid geographical level: ${level}`)
  }

  return getCachedData(`geo_units_${cityId}_${level}`, async () => {
    const { data, error } = await supabase
      .from("geographical_unit_view")
      .select("*")
      .eq("city_id", cityId)
      .eq("geo_level_id", geoLevelId)

    if (error) {
      throw new Error(`Error fetching geographical units: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error(`No geographical units found for city ${cityId} at level ${level}`)
    }

    return data
  })
}

// Track in-flight requests to prevent duplicates
const inFlightRequests = new Map<string, Promise<any>>()

/**
 * Get districts for a city
 */
export async function getDistricts(cityId: number): Promise<District[]> {
  console.log(`[getDistricts] Function called for city ${cityId}`)
  if (!USE_SUPABASE || !supabase) {
    throw new Error("Supabase client not available or disabled")
  }

  const cacheKey = `districts_${cityId}`
  
  // Check if there's already an in-flight request for this city
  const inFlightRequest = inFlightRequests.get(cacheKey)
  if (inFlightRequest) {
    console.log(`[getDistricts] Using in-flight request for city ${cityId}`)
    return inFlightRequest
  }

  return getCachedData(cacheKey, async () => {
    console.log(`[getDistricts] Fetching from Supabase for city ${cityId}`)
    
    // Create a new request promise
    const requestPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from("districts")
          .select("*")
          .eq("city_id", cityId)
          .order("id")

        if (error) throw error
        return (data ?? []).map((district: any) => ({
          id: Number(district.id),
          name: String(district.name),
          districtId: district.districtId ?? district.district_id,
          cityId: district.cityId ?? district.city_id,
          population: district.population ?? 0,
          avgIncome: district.avgIncome ?? district.avg_income ?? 0,
          surface: district.surface ?? 0,
          disposableIncome: district.disposable_income ?? 0,
        })) as District[]
      } finally {
        // Clean up the in-flight request
        inFlightRequests.delete(cacheKey)
      }
    })()

    // Store the request promise
    inFlightRequests.set(cacheKey, requestPromise)

    return requestPromise
  })
}

/**
 * Get neighborhoods for a district
 */
export async function getNeighborhoods(districtId: number): Promise<Neighborhood[]> {
  console.log(`[getNeighborhoods] Function called for district ${districtId}`)
  if (!USE_SUPABASE || !supabase) {
    throw new Error("Supabase client not available or disabled")
  }

  return getCachedData(`neighborhoods_${districtId}`, async () => {
    console.log(`[getNeighborhoods] Fetching from Supabase for district ${districtId}`)
    const { data, error } = await supabase.from("neighbourhoods").select("*").eq("district_id", districtId).order("id")
    if (error) throw new Error(error.message)
    return (data ?? []).map((neighborhood: any) => ({
      id: Number(neighborhood.id),
      name: String(neighborhood.name),
      district_id: neighborhood.district_id,
      districtId: neighborhood.districtId ?? neighborhood.district_id,
      cityId: neighborhood.cityId ?? neighborhood.city_id,
      population: neighborhood.population ?? 0,
      avgIncome: neighborhood.avgIncome ?? neighborhood.avg_income ?? 0,
      surface: neighborhood.surface ?? 0,
      disposableIncome: neighborhood.disposable_income ?? 0,
    })) as Neighborhood[]
  })
}

/**
 * Get feature definitions
 */
export async function getFeatureDefinitions(): Promise<FeatureDefinition[]> {
  if (!USE_SUPABASE || !supabase) {
    throw new Error("Supabase client not available or disabled")
  }

  return getCachedData("feature_definitions", async () => {
    const { data, error } = await supabase.from("feature_definitions").select("*").order("id")

    if (error) {
      throw new Error(`Error fetching feature definitions: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error("No feature definitions found")
    }

    return (data ?? []).map((def: any) => ({
      id: Number(def.id),
      name: String(def.name),
      description: def.description ?? "",
      category: def.category ?? "",
      icon: def.icon ?? "",
    })) as FeatureDefinition[]
  })
}

/**
 * Get point features for a city
 */
export async function getCityPointFeatures(cityId: number): Promise<PointFeature[]> {
  console.log(`[getCityPointFeatures] Function called for city ${cityId}`)
  if (!USE_SUPABASE || !supabase) {
    console.log('[getCityPointFeatures] Supabase not available or disabled')
    throw new Error("Supabase client not available or disabled")
  }

  const cacheKey = `point_features_${cityId}`
  
  // Check if there's already an in-flight request
  const inFlightRequest = inFlightRequests.get(cacheKey)
  if (inFlightRequest) {
    console.log('[getCityPointFeatures] Using in-flight request')
    return inFlightRequest
  }

  return getCachedData(cacheKey, async () => {
    console.log(`[getCityPointFeatures] Fetching from Supabase for city ${cityId}`)
    
    // Create a new request promise
    const requestPromise = (async () => {
      try {
        // First get the feature definitions
        const featureDefinitions = await getFeatureDefinitions()
        console.log(`[getCityPointFeatures] Found ${featureDefinitions?.length || 0} feature definitions`)

        // Now get the point features
        console.log(`[getCityPointFeatures] Fetching point features for city ${cityId}`)
        const { data, error } = await supabase
          .from("point_features")
          .select("*")
          .eq("city_id", cityId)
          .order("id")

        if (error) {
          console.error(`[getCityPointFeatures] Error fetching point features: ${error.message}`)
          throw error
        }

        console.log(`[getCityPointFeatures] Found ${data?.length || 0} point features`)

        // Map the features and add the type
        const mappedFeatures = (data ?? []).map((feature: any) => ({
            ...feature,
          featureType: getFeatureTypeName(featureDefinitions, feature.feature_definition_id) ?? "",
          geoId: Number(feature.geo_id),
          city_id: Number(feature.city_id),
          }))
        .filter((feature: any) => feature && feature.featureType !== undefined)
        return mappedFeatures
      } finally {
        // Clean up the in-flight request
        inFlightRequests.delete(cacheKey)
      }
    })()

    // Store the request promise
    inFlightRequests.set(cacheKey, requestPromise)

    return requestPromise
  })
}

/**
 * Get indicator definitions
 */
export async function getIndicatorDefinitions(): Promise<IndicatorDefinition[]> {
  console.log('[getIndicatorDefinitions] Function called')
  if (!USE_SUPABASE || !supabase) {
    console.log('[getIndicatorDefinitions] Supabase not available or disabled')
    throw new Error("Supabase client not available or disabled")
  }

  const cacheKey = 'indicator_definitions'
  
  // Check if there's already an in-flight request
  const inFlightRequest = inFlightRequests.get(cacheKey)
  if (inFlightRequest) {
    console.log('[getIndicatorDefinitions] Using in-flight request')
    return inFlightRequest
  }

  return getCachedData(cacheKey, async () => {
    console.log('[getIndicatorDefinitions] Fetching from Supabase')
    
    // Create a new request promise
    const requestPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from("indicator_definitions")
          .select("*")
          .order("id")

        if (error) {
          console.error(`[getIndicatorDefinitions] Error fetching definitions: ${error.message}`)
          throw error
        }

        console.log(`[getIndicatorDefinitions] Found ${data?.length || 0} definitions`)
        return (data ?? []).map((def: any) => ({
          id: Number(def.id),
          name: String(def.name),
          description: def.description ?? "",
          category: def.category ?? "",
          unit: def.unit ?? "",
        })) as IndicatorDefinition[]
      } finally {
        // Clean up the in-flight request
        inFlightRequests.delete(cacheKey)
      }
    })()

    // Store the request promise
    inFlightRequests.set(cacheKey, requestPromise)

    return requestPromise
  })
}

/**
 * Get city indicators at a specific level
 */
export async function getCityIndicators(cityId: number, level: string, year?: number): Promise<Indicator[]> {
  console.log(`[getCityIndicators] Function called for city ${cityId}, level ${level}, year ${year || 'latest'}`)
  if (!USE_SUPABASE || !supabase) {
    throw new Error("Supabase client not available or disabled")
  }

  const geoLevelId = level === "district" ? 2 : level === "neighborhood" || level === "neighbourhood" ? 3 : level === "city" ? 1 : null
  if (geoLevelId === null) {
    throw new Error(`Invalid geographical level: ${level}`)
  }

  // Get disabled indicators from localStorage
  const disabledIndicators = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('disabledIndicators') || '[]') 
    : []

  return getCachedData(`indicators_${cityId}_${level}_${year || "latest"}`, async () => {
    console.log(`[getCityIndicators] Fetching from Supabase for city ${cityId}, level ${level}`)
    try {
      // First get the indicator definitions to map names to IDs
      const { data: indicatorDefs, error: defError } = await supabase
        .from("indicator_definitions")
        .select("id, name")
        .in("name", disabledIndicators)

      if (defError) {
        throw new Error(`Error fetching indicator definitions: ${defError.message}`)
      }

      const disabledIds = indicatorDefs?.map(def => def.id) || []

      let query = supabase
        .from("current_indicators_view")
        .select("*")
        .eq("city_id", cityId)
        .eq("geo_level_id", geoLevelId)

      // If there are disabled indicators, filter them out by their IDs
      if (disabledIds.length > 0) {
        query = query.not('indicator_def_id', 'in', `(${disabledIds.join(',')})`)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Error fetching indicators: ${error.message}`)
      }

      if (!data || data.length === 0) {
        return []
      }

      return (data ?? []).map((item: any) => ({
        id: Number(item.id) || 0,
        indicator_def_id: Number(item.indicator_def_id),
        geo_level_id: Number(item.geo_level_id),
        geo_id: Number(item.geo_id),
        year: Number(item.year),
        value: Number(item.value),
        created_at: typeof item.created_at === 'string' ? item.created_at : undefined,
        indicator_name: typeof item.indicator_name === 'string' ? item.indicator_name : '',
        unit: typeof item.unit === 'string' ? item.unit : '',
        category: typeof item.category === 'string' ? item.category : ''
      })) as Indicator[]
    } catch (error) {
      throw error
    }
  })
}

/**
 * Check if PostGIS is available
 */
export async function checkPostGISAvailability(): Promise<boolean> {
  if (!USE_SUPABASE || !supabase) {
    return false
  }

  try {
    const { data, error } = await supabase.rpc("postgis_version")
    return !error && !!data
  } catch (error) {
    return false
  }
}

/**
 * Get geographical levels
 */
export async function getGeographicalLevels(): Promise<any[]> {
  if (!USE_SUPABASE || !supabase) {
    throw new Error("Supabase client not available or disabled")
  }

  return getCachedData("geographical_levels", async () => {
    const { data, error } = await supabase.from("geographical_levels").select("*").order("id")

    if (error) {
      throw new Error(`Error fetching geographical levels: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error("No geographical levels found")
    }

    // Transform to expected format
    return (data ?? []).map((level: any) => ({
      id: Number(level.id),
      name: String(level.name),
      level: typeof level.name === 'string' ? level.name.toLowerCase() : '',
    }))
  })
}

// Cache for indicator values
const indicatorCache = new Map<string, { data: number; timestamp: number }>()

/**
 * Get indicator value for a specific area and indicator
 */
export async function getIndicatorValue(areaId: number, indicatorId: number, level: string): Promise<number | null> {
  const cacheKey = `indicator_${areaId}_${indicatorId}_${level}`
  const cachedItem = indicatorCache.get(cacheKey)
  const now = Date.now()

  // Return cached data if it exists and is not expired
  if (cachedItem && now - cachedItem.timestamp < CACHE_TTL) {
    return cachedItem.data
  }

  if (!supabase) {
    // console.error("Supabase client not available")
    return null
  }

  try {
    // Convert level to geo_level_id
    const geoLevelId = level === "district" ? 2 : level === "neighborhood" || level === "neighbourhood" ? 3 : level === "city" ? 1 : null

    if (geoLevelId === null) {
      throw new Error(`Invalid geographical level: ${level}`)
    }

    // Get indicator value from the view, using the appropriate geo_level_id
    const { data, error } = await supabase
      .from("current_indicators_view")
      .select("value, year")
      .eq("indicator_def_id", indicatorId)
      .eq("geo_level_id", geoLevelId)
      .eq("geo_id", areaId)
      .order("year", { ascending: false })
      .limit(1)

    if (error) {
      // console.error(`Error fetching indicator value: ${error.message}`)
      return null
    }

    if (!data || data.length === 0) {
      return null // Return null without logging error for missing indicators
    }

    // Get the first (and should be only) result
    const value = Number(data[0].value)

    // Cache the result
    indicatorCache.set(cacheKey, { data: value, timestamp: now })
    return value
  } catch (error) {
    // console.error(`Error getting indicator value: ${error}`)
    return null
  }
}

/**
 * Clear indicator cache
 */
export function clearIndicatorCache(): void {
  indicatorCache.clear()
}

/**
 * Get enriched GeoJSON data for a city at a specific level
 */
export async function getEnrichedGeoJSON(cityId: number, level: string): Promise<GeoJSONResponse> {
  console.log(`[getEnrichedGeoJSON] Function called for city ${cityId}, level ${level}`)
  if (!USE_SUPABASE || !supabase) {
    throw new Error("Supabase client not available or disabled")
  }

  const cacheKey = `enriched_geojson_${cityId}_${level}`
  
  // Check if there's already an in-flight request for this city and level
  const inFlightRequest = inFlightRequests.get(cacheKey)
  if (inFlightRequest) {
    console.log(`[getEnrichedGeoJSON] Using in-flight request for city ${cityId}, level ${level}`)
    return inFlightRequest
  }

  return getCachedData(cacheKey, async () => {
    console.log(`[getEnrichedGeoJSON] Fetching from Supabase for city ${cityId}, level ${level}`)
    
    // Create a new request promise
    const requestPromise = (async () => {
      try {
        let query = supabase
          .from(level === "district" ? "districts" : "neighbourhoods")
          .select("*")
          .eq("city_id", cityId)
          .order("id")

        const { data, error } = await query
        console.log(`[getEnrichedGeoJSON] Supabase response for city ${cityId}, level ${level}:`, { data, error })
        
        if (error) throw error

        if (!data || data.length === 0) {
          console.log(`[getEnrichedGeoJSON] No data found for city ${cityId}, level ${level}`)
          return {
            type: "FeatureCollection",
            features: [],
            properties: {}
          }
        }

        // Transform the data into GeoJSON format
        const features = data.map((item: any, index: number) => ({
          type: "Feature",
          properties: {
            id: item.id,
            name: item.name,
            ...(level === "district" 
              ? { district_code: item.district_code }
              : { neighbourhood_code: item.neighbourhood_code, district_id: item.district_id }
            ),
            city_id: item.city_id,
            level,
            index
          },
          geometry: item.geometry
        }))

        const result = {
          type: "FeatureCollection",
          features,
          properties: {}
        }
        
        console.log(`[getEnrichedGeoJSON] Transformed data for city ${cityId}, level ${level}:`, result)
        return result
      } finally {
        // Clean up the in-flight request
        inFlightRequests.delete(cacheKey)
      }
    })()

    // Store the request promise
    inFlightRequests.set(cacheKey, requestPromise)

    return requestPromise
  })
}

export async function fetchIndicators(cityId: number, level: string): Promise<Indicator[]> {
  if (!USE_SUPABASE || !supabase) throw new Error("Supabase client not available or disabled");

  // Convert level to geo_level_id
  const geoLevelId = level === "district" ? 2 : level === "neighborhood" || level === "neighbourhood" ? 3 : level === "city" ? 1 : null;
  if (geoLevelId === null) throw new Error(`Invalid geographical level: ${level}`);

  const { data, error } = await supabase
    .from("current_indicators_view")
    .select("*")
    .eq("city_id", cityId)
    .eq("geo_level_id", geoLevelId);

  if (error) throw error;

  return (data ?? []).map((item: any) => ({
    id: Number(item.id) || 0,
    indicator_def_id: Number(item.indicator_def_id),
    geo_level_id: Number(item.geo_level_id),
    geo_id: Number(item.geo_id),
    year: Number(item.year),
    value: Number(item.value),
    created_at: typeof item.created_at === 'string' ? item.created_at : undefined,
    indicator_name: typeof item.indicator_name === 'string' ? item.indicator_name : '',
    unit: typeof item.unit === 'string' ? item.unit : '',
    category: typeof item.category === 'string' ? item.category : ''
  })) as Indicator[];
}

/**
 * Insert a user event (for analytics)
 */
export async function insertUserEvent(event: { user_id: string; event_type: string; event_details?: any }): Promise<void> {
  if (!USE_SUPABASE || !supabase) throw new Error("Supabase client not available or disabled")
  const { error } = await supabase.from("user_events").insert([event])
  if (error) throw new Error(`Error inserting user event: ${error.message}`)
}

/**
 * Get user events (optionally filter by user_id, event_type, limit)
 */
export async function getUserEvents({ user_id, event_type, limit = 100 }: { user_id?: string; event_type?: string; limit?: number }): Promise<any[]> {
  if (!USE_SUPABASE || !supabase) throw new Error("Supabase client not available or disabled")
  let query = supabase.from("user_events").select("*")
  if (user_id) query = query.eq("user_id", user_id)
  if (event_type) query = query.eq("event_type", event_type)
  if (limit) query = query.limit(limit)
  const { data, error } = await query.order("created_at", { ascending: false })
  if (error) throw new Error(`Error fetching user events: ${error.message}`)
  return data || []
}

/**
 * Get user config by user_id
 */
export async function getUserConfig(user_id: string): Promise<any | null> {
  if (!USE_SUPABASE || !supabase) throw new Error("Supabase client not available or disabled")
  const { data, error } = await supabase.from("user_config").select("*").eq("user_id", user_id).single()
  if (error && error.code !== 'PGRST116') throw new Error(`Error fetching user config: ${error.message}`)
  return data || null
}

/**
 * Upsert user config (by user_id)
 */
export async function upsertUserConfig(config: { user_id: string; custom_features?: any; custom_indicators?: any; other_prefs?: any }): Promise<void> {
  if (!USE_SUPABASE || !supabase) throw new Error("Supabase client not available or disabled")
  const { error } = await supabase.from("user_config").upsert([config], { onConflict: "user_id" })
  if (error) throw new Error(`Error upserting user config: ${error.message}`)
}

/**
 * Get profile by user_id
 */
export async function getProfile(user_id: string): Promise<any | null> {
  if (!USE_SUPABASE || !supabase) throw new Error("Supabase client not available or disabled")
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user_id).single()
  if (error && error.code !== 'PGRST116') throw new Error(`Error fetching profile: ${error.message}`)
  return data || null
}

/**
 * Upsert profile (by user_id)
 */
export async function upsertProfile(profile: { user_id: string; is_admin?: boolean; display_name?: string }): Promise<void> {
  if (!USE_SUPABASE || !supabase) throw new Error("Supabase client not available or disabled")
  const { error } = await supabase.from("profiles").upsert([profile], { onConflict: "user_id" })
  if (error) throw new Error(`Error upserting profile: ${error.message}`)
}

/**
 * Get user profile by user_id (from 'profiles' table)
 */
export async function getUserProfile(user_id: string): Promise<{ display_name?: string; is_admin?: boolean } | null> {
  if (!USE_SUPABASE || !supabase) throw new Error("Supabase client not available or disabled")
  console.log("[getUserProfile] CONSULTING profiles with user_id:", user_id)
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, is_admin")
    .eq("user_id", user_id)
    .single()
  console.log("[getUserProfile] RESULT for user_id:", user_id, "data:", data, "error:", error)
  if (error && error.code !== 'PGRST116') throw new Error(`Error fetching user profile: ${error.message}`)
  if (!data) return null
  return {
    display_name: typeof data.display_name === "string" ? data.display_name : undefined,
    is_admin: typeof data.is_admin === "boolean" ? data.is_admin : undefined,
  }
}
