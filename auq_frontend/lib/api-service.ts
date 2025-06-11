import { fetchAPI, buildEndpoint } from "./api-utils"
import type {
  City,
  GranularityLevel,
  District,
  Neighborhood,
  IndicatorDefinition,
  Indicator,
  FeatureDefinition,
  PointFeature,
  GeoJSONResponse,
} from "./api-types"

// Import Supabase functions
import {
  getCities as getSupabaseCities,
  getDistricts as getSupabaseDistricts,
  getNeighborhoods as getSupabaseNeighborhoods,
  getDistrictPolygons,
  getNeighborhoodPolygons,
  getCityPointFeatures as getSupabaseCityPointFeatures,
  getFeatureDefinitions as getSupabaseFeatureDefinitions,
  getIndicatorDefinitions as getSupabaseIndicatorDefinitions,
  getCityIndicators as getSupabaseCityIndicators,
  getGeographicalLevels as getSupabaseGeographicalLevels,
  getGeographicalUnits as getSupabaseGeographicalUnits,
  getEnrichedGeoJSON,
  insertUserEvent as supabaseInsertUserEvent,
  getUserEvents as supabaseGetUserEvents,
  getUserConfig as supabaseGetUserConfig,
  upsertUserConfig as supabaseUpsertUserConfig,
  getProfile as supabaseGetProfile,
  upsertProfile as supabaseUpsertProfile,
} from "./supabase-client"
import { supabase } from "./supabase-client"

// Flag to determine whether to use Supabase or API
// Default to true for development, but respect the environment variable if set
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE !== "false"

// Cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>()

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000

// Cache for GeoJSON data
const geoJSONCache = new Map<string, { data: GeoJSONResponse; timestamp: number }>()

/**
 * Get data from cache or fetch it
 */
async function getCachedData<T>(cacheKey: string, fetchFn: () => Promise<T>, ttl: number = CACHE_TTL): Promise<T> {
  const cachedItem = apiCache.get(cacheKey)
  const now = Date.now()

  // Return cached data if it exists and is not expired
  if (cachedItem && now - cachedItem.timestamp < ttl) {
    // console.log(`Using cached API data for ${cacheKey}`)
    return cachedItem.data as T
  }

  // Fetch fresh data
  const data = await fetchFn()

  // Cache the result
  apiCache.set(cacheKey, { data, timestamp: now })

  return data
}

/**
 * Get all cities
 */
export async function getCities(): Promise<City[]> {
  return getCachedData("cities", async () => {
    if (USE_SUPABASE) {
      return await getSupabaseCities()
    } else {
      return await fetchAPI("/api/cities")
    }
  })
}

/**
 * Get all geographical levels
 */
export async function getGeographicalLevels(): Promise<GranularityLevel[]> {
  return getCachedData("geographical_levels", async () => {
    if (USE_SUPABASE) {
      return await getSupabaseGeographicalLevels()
    } else {
      return await fetchAPI("/api/geographical-levels")
    }
  })
}

/**
 * Get districts for a city
 */
export async function getDistricts(cityId: number): Promise<District[]> {
  return getCachedData(`districts_${cityId}`, async () => {
    if (USE_SUPABASE) {
      return await getSupabaseDistricts(cityId)
    } else {
      return await fetchAPI(`/api/cities/${cityId}/districts`)
    }
  })
}

/**
 * Get neighborhoods for a district
 */
export async function getNeighborhoods(districtId: number): Promise<Neighborhood[]> {
  return getCachedData(`neighborhoods_${districtId}`, async () => {
    if (USE_SUPABASE) {
      return await getSupabaseNeighborhoods(districtId)
    } else {
      return await fetchAPI(`/api/districts/${districtId}/neighborhoods`)
    }
  })
}

/**
 * Get geographical units for a city at a specific level
 */
export async function getGeographicalUnits(cityId: number, level: string): Promise<any[]> {
  return getCachedData(`geo_units_${cityId}_${level}`, async () => {
    if (USE_SUPABASE) {
      return await getSupabaseGeographicalUnits(cityId, level)
    } else {
      return await fetchAPI(`/api/cities/${cityId}/geo-units?level=${level}`)
    }
  })
}

/**
 * Get GeoJSON data for a city at a specific level
 */
export async function getGeoJSON(cityId: number, level: string): Promise<GeoJSONResponse> {
  const cacheKey = `geojson_${cityId}_${level}`
  
  // Check cache first
  const cached = geoJSONCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  // If not in cache or expired, fetch from Supabase
  const data = await getEnrichedGeoJSON(cityId, level)
  
  // Update cache
  geoJSONCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  })

  return data
}

/**
 * Get feature definitions
 */
export async function getFeatureDefinitions(): Promise<FeatureDefinition[]> {
  return getCachedData("feature_definitions", async () => {
    if (USE_SUPABASE) {
      return await getSupabaseFeatureDefinitions()
    } else {
      return await fetchAPI("/api/feature-definitions")
    }
  })
}

/**
 * Get indicator definitions
 */
export async function getIndicatorDefinitions(): Promise<IndicatorDefinition[]> {
  return getCachedData("indicator_definitions", async () => {
    if (USE_SUPABASE) {
      return await getSupabaseIndicatorDefinitions()
    } else {
      return await fetchAPI("/api/indicator-definitions")
    }
  })
}

/**
 * Get point features for a city
 */
export async function getCityPointFeatures(cityId: number): Promise<PointFeature[]> {
  return getCachedData(`point_features_${cityId}`, async () => {
    if (USE_SUPABASE) {
      return await getSupabaseCityPointFeatures(cityId)
    } else {
      return await fetchAPI(`/api/cities/${cityId}/point-features`)
    }
  })
}

/**
 * Get indicators for a city at a specific granularity level
 */
export async function getCityIndicators(cityId: number, level: string, year?: number): Promise<Indicator[]> {
  return getCachedData(`indicators_${cityId}_${level}_${year || "latest"}`, async () => {
    if (USE_SUPABASE) {
      return await getSupabaseCityIndicators(cityId, level, year)
    } else {
      const endpoint = buildEndpoint(`/api/cities/${cityId}/indicators`, {
        level,
        year: year ? year.toString() : undefined,
      })
      return await fetchAPI(endpoint)
    }
  })
}

/**
 * Get all neighborhoods for a city
 */
export async function getNeighborhoodsByCity(cityId: number): Promise<Neighborhood[]> {
  return getCachedData(`neighborhoods_city_${cityId}`, async () => {
    if (USE_SUPABASE) {
      if (!supabase) throw new Error("Supabase client not available")
      // Query the neighborhoods table or view for all neighborhoods in the city
      const { data, error } = await supabase
        .from("neighbourhoods")
        .select("*")
        .eq("city_id", cityId)
        .order("id")
      if (error) throw new Error(error.message)
      return data || []
    } else {
      // REST endpoint for all neighborhoods in a city
      return await fetchAPI(`/api/cities/${cityId}/neighborhoods`)
    }
  })
}

/**
 * Clear all API caches
 */
export function clearApiCache(): void {
  apiCache.clear()
  // console.log("API cache cleared")
}

/**
 * Clear specific API cache entry
 */
export function clearApiCacheEntry(key: string, subKey?: string): void {
  if (subKey) {
    // Clear a specific entry with a subkey (e.g., pointFeatures for a specific city)
    const entries = Array.from(apiCache.entries())
    for (const [cacheKey, value] of entries) {
      if (cacheKey.startsWith(`${key}_${subKey}`)) {
        apiCache.delete(cacheKey)
        // console.log(`API cache cleared for ${cacheKey}`)
      }
    }
  } else {
    // Clear all entries with a specific key prefix
    const entries = Array.from(apiCache.entries())
    for (const [cacheKey, value] of entries) {
      if (cacheKey.startsWith(key)) {
        apiCache.delete(cacheKey)
        // console.log(`API cache cleared for ${cacheKey}`)
      }
    }
  }
}

/**
 * Log a user event (analytics)
 */
export async function logUserEvent(event: { user_id: string; event_type: string; event_details?: any }): Promise<void> {
  if (USE_SUPABASE) {
    return supabaseInsertUserEvent(event)
  } else {
    // Implement API fallback if needed
    throw new Error("API fallback not implemented for logUserEvent")
  }
}

/**
 * Get user events (optionally filter by user_id, event_type, limit)
 */
export async function getUserEvents({ user_id, event_type, limit = 100 }: { user_id?: string; event_type?: string; limit?: number }): Promise<any[]> {
  return getCachedData(`user_events_${user_id || 'all'}_${event_type || 'all'}_${limit}`, async () => {
    if (USE_SUPABASE) {
      return supabaseGetUserEvents({ user_id, event_type, limit })
    } else {
      throw new Error("API fallback not implemented for getUserEvents")
    }
  })
}

/**
 * Get user config by user_id
 */
export async function getUserConfig(user_id: string): Promise<any | null> {
  return getCachedData(`user_config_${user_id}`, async () => {
    if (USE_SUPABASE) {
      return supabaseGetUserConfig(user_id)
    } else {
      throw new Error("API fallback not implemented for getUserConfig")
    }
  })
}

/**
 * Upsert user config (by user_id)
 */
export async function upsertUserConfig(config: { user_id: string; custom_features?: any; custom_indicators?: any; other_prefs?: any }): Promise<void> {
  if (USE_SUPABASE) {
    return supabaseUpsertUserConfig(config)
  } else {
    throw new Error("API fallback not implemented for upsertUserConfig")
  }
}

/**
 * Get profile by user_id
 */
export async function getProfile(user_id: string): Promise<any | null> {
  return getCachedData(`profile_${user_id}`, async () => {
    if (USE_SUPABASE) {
      return supabaseGetProfile(user_id)
    } else {
      throw new Error("API fallback not implemented for getProfile")
    }
  })
}

/**
 * Upsert profile (by user_id)
 */
export async function upsertProfile(profile: { user_id: string; is_admin?: boolean; display_name?: string }): Promise<void> {
  if (USE_SUPABASE) {
    return supabaseUpsertProfile(profile)
  } else {
    throw new Error("API fallback not implemented for upsertProfile")
  }
}

/**
 * Get time series (all years) for an indicator in a specific area and level
 */
export async function getIndicatorTimeSeries(areaId: number, indicatorId: number, level: string, cityId: number) {
  return getCachedData(`time_series_${areaId}_${indicatorId}_${level}_${cityId}`, async () => {
    if (!USE_SUPABASE || !supabase) {
      throw new Error("Supabase client not available or disabled")
    }

    const geoLevelId = level === "district" ? 2 : level === "neighborhood" || level === "neighbourhood" ? 3 : level === "city" ? 1 : null;
    if (geoLevelId === null) throw new Error("Invalid geographical level");

    const { data, error } = await supabase
      .from("time_series_indicators_view")
      .select("year, value")
      .eq("geo_id", areaId)
      .eq("indicator_def_id", indicatorId)
      .eq("geo_level_id", geoLevelId)
      .eq("city_id", cityId)
      .order("year", { ascending: true });

    if (error) throw error;
    return data;
  });
}

export { getDistrictPolygons, getNeighborhoodPolygons }
