"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMapContext } from "@/contexts/map-context"
import { getCities } from "@/lib/api-service"
import type { City } from "@/lib/api-types"
import { useAuth } from "@/contexts/auth-context"
import { analyticsLogger } from "@/lib/analytics/logger"
import { STORAGE_KEYS } from "@/lib/constants"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Building, Layers } from "lucide-react"

// Custom hook for city data management
function useCityData() {
  const [cities, setCities] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadCities() {
      if (!mounted) return

      setIsLoading(true)
      setError(null)
      try {
        const citiesData = await getCities()
        if (mounted) {
          setCities(citiesData)
        }
      } catch (error) {
        if (mounted) {
          const errorMessage = "Failed to load cities. Please try again later."
          setError(errorMessage)
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadCities()
    return () => {
      mounted = false
    }
  }, [toast])

  return { cities, isLoading, error }
}

// Custom hook for city selection
function useCitySelection() {
  const { selectedCity, switchCity, switchGranularity } = useMapContext()
  const { user } = useAuth()
  const { toast } = useToast()
  const analyticsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const storageTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleCityChange = useCallback((city: City) => {
    // Use requestAnimationFrame for UI updates
    requestAnimationFrame(() => {
      switchCity(city)
    })

    // Debounce storage updates
    if (storageTimeoutRef.current) {
      clearTimeout(storageTimeoutRef.current)
    }
    storageTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEYS.SELECTED_CITY, JSON.stringify(city))
      } catch (error) {
        console.error('Failed to save city to localStorage:', error)
      }
    }, 0)

    // Debounce analytics logging
    if (analyticsTimeoutRef.current) {
      clearTimeout(analyticsTimeoutRef.current)
    }
    analyticsTimeoutRef.current = setTimeout(async () => {
      try {
        if (user) {
          await analyticsLogger.logEvent({
            user_id: user.id,
            event_type: 'map.view',
            event_details: {
              city: city.name,
              city_id: city.id
            }
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to log city selection. Please try again.",
          variant: "destructive",
        })
      }
    }, 100)
  }, [user, switchCity, toast])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (analyticsTimeoutRef.current) {
        clearTimeout(analyticsTimeoutRef.current)
      }
      if (storageTimeoutRef.current) {
        clearTimeout(storageTimeoutRef.current)
      }
    }
  }, [])

  return { selectedCity, handleCityChange }
}

export function CitySelector() {
  const { cities, isLoading, error } = useCityData()
  const { selectedCity, handleCityChange } = useCitySelection()
  const { selectedGranularity, switchGranularity } = useMapContext()
  const router = useRouter()

  // Granularity levels
  const granularityLevels = [
    { id: 2, name: "Districts", level: "district" },
    { id: 3, name: "Neighborhoods", level: "neighborhood" },
  ]

  // Handle granularity change
  const handleGranularityChange = (levelObj: { id: number; name: string; level: string }) => {
    const granularity = {
      id: levelObj.id,
      name: levelObj.name,
      level: levelObj.level
    }
    switchGranularity(granularity)
    console.log('[CitySelector] handleGranularityChange:', { levelObj, url: window.location.href })
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="font-medium flex items-center gap-2"
            disabled={isLoading || !!error}
          >
            <Building className="h-4 w-4 mr-1" />
            {isLoading ? "Loading cities..." :
              error ? "Error loading cities" :
                selectedCity ? selectedCity.name : "Select City"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[180px]">
          {cities.length > 0 ? (
            cities.map((city) => (
              <DropdownMenuItem
                key={city.id}
                onClick={() => handleCityChange(city)}
                className={selectedCity?.id === city.id ? "bg-primary/10 text-primary" : ""}
              >
                {city.name}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>
              {error ? "Error loading cities" : "No cities available"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="font-medium flex items-center gap-2"
            disabled={!selectedCity}
          >
            <Layers className="h-4 w-4 mr-1" />
            {selectedGranularity ? selectedGranularity.name : "Select Level"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[180px]">
          {granularityLevels.map((level) => (
            <DropdownMenuItem
              key={level.id}
              onClick={() => handleGranularityChange(level)}
              className={selectedGranularity?.level === level.level ? "bg-primary/10 text-primary" : ""}
            >
              {level.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
