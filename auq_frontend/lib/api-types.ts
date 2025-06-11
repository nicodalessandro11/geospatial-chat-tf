// Types for API responses based on the database schema

export interface City {
  id: number
  name: string
  country?: string
  created_at?: string
}

export interface GranularityLevel {
  id: number
  name: string
  level: string
}

export interface District extends City {
  id: number
  name: string
  district_code?: number
  population?: number
  avg_income?: number
  surface?: number
  disposable_income?: number
  created_at?: string
  districtId: number
}

export interface Neighborhood extends City {
  id: number
  name: string
  neighbourhood_code?: number
  district_id: number
  population?: number
  avg_income?: number
  surface?: number
  disposable_income?: number
  created_at?: string
  districtId: number
}

export interface IndicatorDefinition {
  id: number
  name: string
  unit?: string
  description?: string
  category?: string
  created_at?: string
  year?: number
}

export interface Indicator {
  id: number
  indicator_def_id: number
  geo_level_id: number
  geo_id: number
  year: number
  value: number
  created_at?: string
  indicator_name: string
}

export interface FeatureDefinition {
  id: number
  name: string
  description?: string
  created_at?: string
}

export interface PointFeature {
  id: number
  feature_definition_id: number
  name: string
  latitude: number
  longitude: number
  geo_level_id: number
  geo_id: number
  city_id?: number
  properties?: Record<string, any>
  created_at?: string
  // For client-side use
  featureType?: string
  geoId?: number
  cityId: number
}

export interface GeoJSONFeature {
  type: "Feature"
  properties: {
    id: number
    name: string
    [key: string]: any
  }
  geometry: {
    type: string
    coordinates: any[]
  }
}

export interface GeoJSONResponse {
  type: string
  features: any[]
  properties: Record<string, any>
}

export interface ComparisonResponse {
  area1: {
    id: number
    name: string
    indicators: Array<{
      id: number
      name: string
      value: number
      unit: string
    }>
  } | null
  area2: {
    id: number
    name: string
    indicators: Array<{
      id: number
      name: string
      value: number
      unit: string
    }>
  } | null
}

export interface FilterResponse {
  type: string
  features: any[]
}

export interface Area {
  id: number
  name: string
  cityId: number
  population: number
  avgIncome: number
  surface: number
  disposableIncome: number
  districtId?: number
}

export interface DynamicFilter {
  key: string
  name: string
  unit?: string
  min: number
  max: number
  value: [number, number]
}
