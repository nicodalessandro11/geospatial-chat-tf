"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Layers, Map, ImageIcon, Mountain, Moon, Palette } from "lucide-react"
import { useMapContext } from "@/contexts/map-context"

export const mapTypes = {
  osm: {
    name: "Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    icon: <Map className="h-4 w-4" />,
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    icon: <ImageIcon className="h-4 w-4" />,
  },
  grayscale: {
    name: "Grayscale",
    url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>',
    icon: <Layers className="h-4 w-4" />,
  },
  terrain: {
    name: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    icon: <Mountain className="h-4 w-4" />,
  },
  dark: {
    name: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    icon: <Moon className="h-4 w-4" />,
  },
  watercolor: {
    name: "Artistic",
    // Using a different artistic style from CARTO that doesn't require authentication
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    icon: <Palette className="h-4 w-4" />,
  },
}

export function MapTypeSelector() {
  const { mapType, setMapType } = useMapContext()
  const [isOpen, setIsOpen] = useState(false)

  const handleMapTypeChange = (value: "osm" | "satellite" | "grayscale" | "terrain" | "dark" | "watercolor") => {
    console.log("Changing map type to:", value)
    setMapType(value)
    setIsOpen(false)
  }

  return (
    <div className="absolute right-12 top-4 z-[1001]">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-background/90 backdrop-blur-sm shadow-md"
            onClick={() => setIsOpen(true)} // Explicitly set to open on click
          >
            {mapTypes[mapType]?.icon || <Map className="h-4 w-4" />}
            <span className="ml-2">{mapTypes[mapType]?.name || "Standard"} Map</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 z-[1002]" align="end" sideOffset={5}>
          <div className="space-y-2">
            {Object.entries(mapTypes).map(([key, { name, icon }]) => (
              <div
                key={key}
                className={`flex items-center space-x-2 rounded-md p-2 hover:bg-muted cursor-pointer ${mapType === key ? "bg-primary/10" : ""
                  }`}
                onClick={() => handleMapTypeChange(key as "osm" | "satellite" | "grayscale" | "terrain" | "dark" | "watercolor")}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className={`p-1.5 rounded-md ${mapType === key ? "bg-primary/20" : "bg-muted"}`}>{icon}</span>
                  <span className="font-medium">{name}</span>
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
