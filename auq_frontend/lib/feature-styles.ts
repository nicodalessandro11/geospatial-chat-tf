import type { FeatureDefinition } from "./api-types"

// Leaflet-color-markers icon URLs
export const markerIconUrls = [
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png',
]

export const markerShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'

// Helper functions
export const getFeatureTypeName = (definitions: FeatureDefinition[], id: number): string => {
  const definition = definitions.find(def => def.id === id)
  return definition ? definition.name.toLowerCase().replace(/\s+/g, '_') : 'unknown'
}

// Helper to assign a marker icon URL to each feature type by order of appearance
const featureTypeIconMap: Record<string, string> = {}
let iconIndex = 0
export const getIconUrlForFeatureType = (featureType: string): string => {
  if (!featureTypeIconMap[featureType]) {
    featureTypeIconMap[featureType] = markerIconUrls[iconIndex % markerIconUrls.length]
    iconIndex++
  }
  return featureTypeIconMap[featureType]
} 