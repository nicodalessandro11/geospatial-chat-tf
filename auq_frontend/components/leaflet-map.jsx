"use client"

import { useEffect, useRef, useState } from "react"
import { useMapContext } from "@/contexts/map-context"
import { mapTypes } from "@/components/map-type-selector"
import { useTheme } from "next-themes"
import { useRouter, useSearchParams } from "next/navigation"
import { getIconUrlForFeatureType, markerShadowUrl } from "@/lib/feature-styles"

// Helper to assign a color to each feature type by order of appearance
const featureTypeColorMap = {}
let colorIndex = 0
const getColorForFeatureType = (featureType) => {
  if (!featureTypeColorMap[featureType]) {
    featureTypeColorMap[featureType] = colorPalette[colorIndex % colorPalette.length]
    colorIndex++
  }
  return featureTypeColorMap[featureType]
}

// This component will only be loaded on the client side
export default function LeafletMap({
  selectedCity,
  selectedGranularity,
  currentGeoJSON,
  pointFeatures, // This is already filtered by map-component.tsx
  hasSelectedGranularity,
  mapType,
  visiblePointTypes,
}) {
  const mapRef = useRef(null)
  const geoJsonLayerRef = useRef(null)
  const markersLayerRef = useRef(null)
  const tileLayerRef = useRef(null)
  const clusterGroupRef = useRef(null)
  const { setMapInitialized, loadGeoJSON, setSelectedArea, filters, dynamicFilters, setMapType, selectedArea, availableIndicators, currentIndicators } = useMapContext()
  const mapInstanceRef = useRef(null)
  const [selectedAreaState, setSelectedAreaState] = useState(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [currentMapType, setCurrentMapType] = useState(mapType)
  const [renderedMarkers, setRenderedMarkers] = useState({})
  const [isClusterReady, setIsClusterReady] = useState(false)
  const markersRef = useRef([])
  const { theme } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  // Track if the last click was on a polygon
  const lastPolygonClickRef = useRef(false)

  // Debug: log context state on every render
  // console.log('[LeafletMap] Render:', {
  //   selectedCity,
  //   selectedGranularity,
  //   selectedArea,
  //   currentGeoJSON
  // });

  // Function to generate a color from a simple palette based on the index
  const getColorFromPalette = (index, total) => {
    const colors = ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3"]
    return colors[index % colors.length]
  }

  // Helper function to get marker style
  const getMarkerStyle = (featureType) => {
    return {
      iconUrl: getIconUrlForFeatureType(featureType),
      shadowUrl: markerShadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }
  }

  // Initialize the map
  useEffect(() => {
    // Add Leaflet CSS
    const linkElement = document.createElement("link")
    linkElement.rel = "stylesheet"
    linkElement.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(linkElement)

    // Add MarkerCluster CSS
    const clusterLinkElement = document.createElement("link")
    clusterLinkElement.rel = "stylesheet"
    clusterLinkElement.href = "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css"
    document.head.appendChild(clusterLinkElement)

    // Load Leaflet from CDN
    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    script.crossOrigin = ""
    script.onload = () => {
      // Load MarkerCluster after Leaflet
      const clusterScript = document.createElement("script")
      clusterScript.src = "https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"
      clusterScript.onload = () => {
        if (!mapRef.current || mapInstanceRef.current) return

        const L = window.L
        if (!L) {
          // console.error("Leaflet not loaded")
          return
        }

        // Create map instance
        const map = L.map(mapRef.current, {
          center: [40, -4], // Initial view of Spain
          zoom: 5,
          zoomControl: false,
        })

        // Get the initial map type configuration
        const initialMapType = mapTypes[mapType] || mapTypes.osm

        // Add tile layer
        tileLayerRef.current = L.tileLayer(initialMapType.url, {
          attribution: initialMapType.attribution,
          maxZoom: 19,
        }).addTo(map)

        // Add zoom control
        L.control.zoom({ position: "bottomright" }).addTo(map)

        // Create layers for GeoJSON and markers
        geoJsonLayerRef.current = L.layerGroup().addTo(map)
        markersLayerRef.current = L.layerGroup().addTo(map)

        // Create marker cluster group
        if (L.MarkerClusterGroup) {
          clusterGroupRef.current = L.markerClusterGroup({
            maxClusterRadius: 80,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            disableClusteringAtZoom: 15,
            chunkedLoading: true,
            chunkInterval: 200,
            chunkDelay: 50,
          }).addTo(map)
          setIsClusterReady(true)
        } else {
          clusterGroupRef.current = null
          setIsClusterReady(false)
          // console.warn("MarkerClusterGroup is not available yet.")
        }

        // Store map instance
        mapInstanceRef.current = map

        // Mark map as ready
        setIsMapReady(true)

        // Notify that map is initialized
        setMapInitialized(true)

        // Deselect area when clicking on map background
        map.on('click', function (e) {
          if (lastPolygonClickRef.current) {
            lastPolygonClickRef.current = false
            return
          }
          setSelectedArea(null)
        })

        // Handle resize events
        const handleResize = () => {
          if (map) {
            map.invalidateSize()
          }
        }

        window.addEventListener("resize", handleResize)

        return () => {
          window.removeEventListener("resize", handleResize)
          if (map) {
            // Remove all layers before destroying the map
            if (geoJsonLayerRef.current) {
              map.removeLayer(geoJsonLayerRef.current)
              geoJsonLayerRef.current = null
            }
            if (markersLayerRef.current) {
              map.removeLayer(markersLayerRef.current)
              markersLayerRef.current = null
            }
            if (clusterGroupRef.current) {
              map.removeLayer(clusterGroupRef.current)
              clusterGroupRef.current = null
            }
            if (tileLayerRef.current) {
              map.removeLayer(tileLayerRef.current)
              tileLayerRef.current = null
            }
            map.remove()
            mapInstanceRef.current = null
            setIsMapReady(false)
            setIsClusterReady(false)
          }
        }
      }
      document.head.appendChild(clusterScript)
    }
    document.head.appendChild(script)

    return () => {
      if (linkElement.parentNode) {
        document.head.removeChild(linkElement)
      }
      if (clusterLinkElement.parentNode) {
        document.head.removeChild(clusterLinkElement)
      }
      if (script.parentNode) {
        document.head.removeChild(script)
      }
    }
  }, [setMapInitialized, mapType, setSelectedArea])

  // Update map when city or granularity changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !isMapReady) return

    // Track the previous city ID to detect city changes
    const prevCityId = map.prevCityId
    let resetTimeout = null

    if (selectedCity) {
      // Only set the view when the city changes
      if (!prevCityId || prevCityId !== selectedCity.id) {
        setDefaultCityView(map, selectedCity)
        map.prevCityId = selectedCity.id
      }
    } else {
      // Debounce resetting to default view
      resetTimeout = setTimeout(() => {
        if (!selectedCity) {
          map.setView([40, -4], 5)
          map.prevCityId = null
        }
      }, 120)
    }
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout)
    }
  }, [selectedCity, selectedGranularity, isMapReady])

  // Helper function to set default city view
  const setDefaultCityView = (map, selectedCity) => {
    if (!map || !selectedCity) return

    try {
      if (selectedCity.id === 1) {
        // Barcelona
        map.setView([41.3851, 2.1734], 12)
      } else if (selectedCity.id === 2) {
        // Madrid
        map.setView([40.4168, -3.7038], 11)
      } else {
        // Default view of Spain
        map.setView([40, -4], 5)
      }
    } catch (error) {
      // console.error(`Error setting default view for city ${selectedCity.name}:`, error)
      // Fallback to a safe default
      try {
        map.setView([40, -4], 5)
      } catch (fallbackError) {
        // console.error("Error setting fallback view:", fallbackError)
      }
    }
  }

  // Update the tile layer when map type changes
  useEffect(() => {
    // Only update if the map type has actually changed
    if (mapType === currentMapType) return

    setCurrentMapType(mapType)

    const map = mapInstanceRef.current
    if (!map || !isMapReady) return

    const L = window.L
    if (!L) return

    try {
      // Get the selected map type configuration
      const selectedMapType = mapTypes[mapType] || mapTypes.osm

      // Remove the current tile layer if it exists
      if (tileLayerRef.current) {
        try {
          map.removeLayer(tileLayerRef.current)
        } catch (error) {
          // console.warn("Error removing tile layer:", error)
        }
      }

      // Add the new tile layer
      tileLayerRef.current = L.tileLayer(selectedMapType.url, {
        attribution: selectedMapType.attribution,
        maxZoom: 19,
      }).addTo(map)

      // Ensure the tile layer is at the bottom
      if (tileLayerRef.current) {
        tileLayerRef.current.bringToBack()
      }
    } catch (error) {
      // console.error("Error updating map type:", error)
      // Fallback to OSM if there's an error
      try {
        tileLayerRef.current = L.tileLayer(mapTypes.osm.url, {
          attribution: mapTypes.osm.attribution,
          maxZoom: 19,
        }).addTo(map)
      } catch (fallbackError) {
        // console.error("Error applying fallback map type:", fallbackError)
      }
    }
  }, [mapType, isMapReady, currentMapType])

  // Update GeoJSON layer when data changes
  useEffect(() => {
    const map = mapInstanceRef.current
    const geoJsonLayer = geoJsonLayerRef.current
    const L = window.L

    if (!map || !geoJsonLayer || !isMapReady || !L) {
      return
    }

    // Only update the layer if there is valid GeoJSON data
    if (!currentGeoJSON || !currentGeoJSON.features || currentGeoJSON.features.length === 0) {
      // Do NOT clear the previous polygons if no new data is ready
      return
    }

    // Clear previous GeoJSON safely
    try {
      if (geoJsonLayer) {
        // Remove the entire layer group and create a new one
        map.removeLayer(geoJsonLayer)
        geoJsonLayerRef.current = L.layerGroup().addTo(map)
      }
    } catch (error) {
      try {
        geoJsonLayerRef.current = L.layerGroup().addTo(map)
      } catch (fallbackError) { }
    }

    // Log para depuración: inspecciona el primer feature y su geometry
    const firstFeature = currentGeoJSON.features[0]
    // console.log('[LeafletMap] First feature:', firstFeature)
    if (firstFeature && firstFeature.geometry) {
      // console.log('[LeafletMap] First feature geometry:', firstFeature.geometry)
    } else {
      // console.warn('[LeafletMap] First feature has NO geometry!')
    }

    // console.log('[LeafletMap] Rendering GeoJSON with features:', currentGeoJSON.features.length)

    // === FILTRADO DE FEATURES SEGÚN LOS SLIDERS DINÁMICOS ===
    // console.log('[LeafletMap] dynamicFilters:', dynamicFilters)
    // console.log('[LeafletMap] Features before filtering:', currentGeoJSON.features.length)

    const filteredFeatures = currentGeoJSON.features.filter((feature) => {
      if (!feature.properties || typeof feature.properties.id === 'undefined') return false;
      const areaId = feature.properties.id
      // Para cada filtro dinámico, busca el valor del indicador en la lista de indicadores
      for (const filter of dynamicFilters) {
        const indicator = currentIndicators.find(ind => ind.geo_id === areaId && ind.indicator_def_id.toString() === filter.key)
        if (!indicator) continue // Si no hay valor, no filtrar
        const value = indicator.value
        if (typeof value !== 'number') continue // Si no es número, no filtrar
        if (value < filter.value[0] || value > filter.value[1]) return false
      }
      return true
    })
    // console.log('[LeafletMap] Features after filtering:', filteredFeatures.length)

    // Style function for GeoJSON
    const getAreaStyle = (feature) => {
      const isSelected = selectedAreaState?.id === feature.properties.id

      // Get property values, handling both Supabase and API formats
      const population = feature.properties.population || 0
      const avgIncome = feature.properties.avg_income || feature.properties.avgIncome || 0

      if (isSelected) {
        return {
          fillColor: "#3b82f6", // Primary blue
          weight: 2,
          opacity: 1,
          color: "#1d4ed8",
          fillOpacity: 0.7,
        }
      } else {
        // Use the color palette function to get a unique color
        const color = getColorFromPalette(
          feature.properties.index || 0,
          currentGeoJSON.features ? currentGeoJSON.features.length : 0,
        )
        return {
          fillColor: color,
          weight: 1,
          opacity: 1,
          color: "#60a5fa",
          fillOpacity: 0.6,
        }
      }
    }

    try {
      // Validate GeoJSON data before rendering
      const validFeatures = filteredFeatures.filter((feature) => {
        // Check if feature has valid geometry
        if (!feature.geometry || !feature.geometry.coordinates) {
          return false
        }

        // Check if coordinates are valid (not empty, not NaN)
        const coords = feature.geometry.coordinates
        if (!coords.length) {
          return false
        }

        // For polygons, check the first ring
        if (feature.geometry.type === "Polygon") {
          const ring = coords[0]
          if (!ring || !ring.length) {
            return false
          }

          // Check if coordinates contain valid numbers
          const hasInvalidCoords = ring.some(
            (point) =>
              point.length < 2 ||
              typeof point[0] !== "number" ||
              typeof point[1] !== "number" ||
              isNaN(point[0]) ||
              isNaN(point[1]),
          )

          if (hasInvalidCoords) {
            return false
          }
        }

        return true
      })

      if (validFeatures.length === 0) {
        return
      }

      // Create a valid GeoJSON object with only valid features
      const validGeoJSON = {
        type: "FeatureCollection",
        features: validFeatures,
      }

      // Add GeoJSON to map
      const geoJson = L.geoJSON(validGeoJSON, {
        style: getAreaStyle,
        onEachFeature: (feature, layer) => {
          // Only bind tooltip if we have valid properties
          if (feature.properties && feature.properties.name) {
            layer.bindTooltip(feature.properties.name, {
              permanent: false,
              sticky: false,
              interactive: false,
              className: 'area-tooltip' // Add a custom class for styling
            });
          }

          layer.on({
            click: (e) => {
              // Prevent event propagation to underlying layers
              e.originalEvent.stopPropagation();
              e.originalEvent.preventDefault();

              lastPolygonClickRef.current = true
              const areaId = feature.properties.id
              const areaName = feature.properties.name
              const area = {
                id: areaId,
                name: areaName,
                cityId: feature.properties.city_id || selectedCity?.id || 0,
                population: feature.properties.population || 0,
                avgIncome: feature.properties.avg_income || feature.properties.avgIncome || 0,
                surface: feature.properties.surface || 0,
                disposableIncome: feature.properties.disposable_income || feature.properties.disposableIncome || 0,
                ...(selectedGranularity?.level === "neighborhood" && {
                  districtId: feature.properties.district_id || feature.properties.districtId || 0,
                }),
              }
              setSelectedAreaState(area)
              setSelectedArea(area)
            },
            mouseover: (e) => {
              // Prevent event propagation on hover
              e.originalEvent.stopPropagation();
              e.originalEvent.preventDefault();

              // Only show tooltip if we have valid properties
              if (feature.properties && feature.properties.name) {
                layer.openTooltip();
              }
            },
            mouseout: (e) => {
              // Prevent event propagation on hover out
              e.originalEvent.stopPropagation();
              e.originalEvent.preventDefault();

              // Only close tooltip if we have valid properties
              if (feature.properties && feature.properties.name) {
                layer.closeTooltip();
              }
            }
          })
        },
      })

      // Only add to layer if it was created successfully
      if (geoJson) {
        geoJson.addTo(geoJsonLayerRef.current)
      }
    } catch (geoJsonError) {
      // console.error("Error rendering GeoJSON:", geoJsonError)
      setDefaultCityView(map, selectedCity)
    }
  }, [currentGeoJSON, dynamicFilters, selectedCity, selectedGranularity, setSelectedArea, selectedAreaState, isMapReady])

  // Update markers when point features change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !pointFeatures || pointFeatures.length === 0) {
      return
    }

    // Clear previous markers
    if (markersRef.current) {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
    }

    // Process markers in chunks for better performance
    const chunkSize = 100
    const chunks = []
    for (let i = 0; i < pointFeatures.length; i += chunkSize) {
      chunks.push(pointFeatures.slice(i, i + chunkSize))
    }

    let totalMarkers = 0
    let invalidMarkers = 0

    chunks.forEach((chunk, chunkIndex) => {
      setTimeout(() => {
        chunk.forEach((feature) => {
          try {
            const lat = Number.parseFloat(feature.latitude)
            const lng = Number.parseFloat(feature.longitude)
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
              invalidMarkers++
              return
            }

            const featureTypeName = (feature.featureType || "Point of Interest")
              .replace(/_/g, " ")
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")

            const iconUrl = getIconUrlForFeatureType(feature.featureType)
            const marker = L.marker([lat, lng], {
              icon: L.icon({
                iconUrl,
                shadowUrl: markerShadowUrl,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              }),
              // Ensure markers are always on top
              zIndexOffset: 1000
            })

            // Add popup with feature information
            let propertiesHtml = ''
            if (feature.properties && typeof feature.properties === 'object') {
              const capitalize = (str) =>
                str
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase());

              const entries = Object.entries(feature.properties)
                .filter(([k, v]) =>
                  v !== null &&
                  v !== undefined &&
                  (typeof v !== 'string' || v.trim() !== '') &&
                  k !== 'id' &&
                  k !== 'name'
                )
                .map(([k, v]) => {
                  let value = v;
                  if (k === 'description' && typeof v === 'string' && v.length > 180) {
                    value = v.slice(0, 180) + '...';
                  }
                  return `<li><span class=\"font-semibold text-foreground\">${capitalize(k)}:</span> <span class=\"text-muted-foreground\">${value}</span></li>`;
                });
              if (entries.length > 0) {
                propertiesHtml = `<ul class="space-y-1">${entries.join('')}</ul>`
              }
            }
            const popupContent = `
              <div class="marker-tooltip bg-card text-card-foreground border border-border shadow-lg rounded-xl p-4 max-w-xs min-w-[160px] space-y-2">
                <h3 class="text-base font-bold text-primary mb-1">${feature.name}</h3>
                ${propertiesHtml}
              </div>
            `
            marker.bindPopup(popupContent, {
              autoPan: true,
              closeButton: true,
              className: 'custom-popup',
              closeOnClick: false // Prevent popup from closing when clicking the marker
            })

            // Add event handlers to prevent event propagation
            marker.on({
              click: (e) => {
                e.originalEvent.stopPropagation();
                e.originalEvent.preventDefault();
              },
              mouseover: (e) => {
                e.originalEvent.stopPropagation();
                e.originalEvent.preventDefault();
              },
              mouseout: (e) => {
                e.originalEvent.stopPropagation();
                e.originalEvent.preventDefault();
              }
            });

            marker.addTo(map)
            markersRef.current.push(marker)
            totalMarkers++
          } catch (error) {
            invalidMarkers++
          }
        })
      }, chunkIndex * 100)
    })

    return () => {
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.remove())
        markersRef.current = []
      }
    }
  }, [pointFeatures])

  // Nuevo efecto para cambiar el tile layer según el theme
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady || !theme) return;
    const L = window.L;
    if (!L) return;

    // Usa los mismos mapTypes que el selector
    const selectedMapType = theme === "dark" ? mapTypes.dark : mapTypes.grayscale;

    // Elimina el tile layer anterior si existe
    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
      } catch (error) {
        // console.warn("Error removing tile layer on theme change:", error);
      }
    }

    // Añade el nuevo tile layer
    tileLayerRef.current = L.tileLayer(selectedMapType.url, {
      attribution: selectedMapType.attribution,
      maxZoom: 19,
    }).addTo(map);

    // Asegura que el tile layer está en el fondo
    if (tileLayerRef.current) {
      tileLayerRef.current.bringToBack();
    }
  }, [theme, isMapReady]);

  // Ensure area selection is re-applied when map/data becomes ready
  useEffect(() => {
    // console.log('[LeafletMap] Area highlight effect:', { selectedArea, isMapReady, currentGeoJSON });
    if (selectedArea && isMapReady && currentGeoJSON && geoJsonLayerRef.current) {
      // console.log('[LeafletMap] Applying selectedArea highlight:', selectedArea);
      setSelectedAreaState(selectedArea);
    }
  }, [isMapReady, currentGeoJSON, geoJsonLayerRef, selectedArea]);

  return <div ref={mapRef} className="h-full w-full" />
}
