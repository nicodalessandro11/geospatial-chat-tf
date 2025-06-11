"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { useMapContext } from "@/contexts/map-context"
import { FilterPanel } from "@/components/filter-panel"
import { DistrictInfo } from "@/components/district-info"
import { PointFeaturesToggle } from "@/components/point-features-toggle"
import { ChatSidebar } from "@/components/chat-sidebar"
import { Filter, Info, MapPin, ChevronLeft, ChevronRight, Bot } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { TABS, TabType, isValidTab } from "@/lib/constants"

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <p>Loading map...</p>
    </div>
  ),
})

const STORAGE_KEY = 'activeTab'

export function MapView() {
  const { selectedCity, selectedArea, setVisiblePointTypes, visiblePointTypes, triggerRefresh, selectedGranularity, availableAreas, setSelectedArea, resetFilters } =
    useMapContext()

  // Initialize with default tab
  const [activeTab, setActiveTab] = useState<TabType>(TABS.POINTS)
  const [isClient, setIsClient] = useState(false)

  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true)
  const mapContainerRef = useRef(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const prevCityIdRef = useRef<number | null>(null)

  // Handle responsive sidebar
  const [isMobile, setIsMobile] = useState(false)

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true)
    const savedTab = localStorage.getItem(STORAGE_KEY)
    if (savedTab && isValidTab(savedTab)) {
      setActiveTab(savedTab)
    }
  }, [])

  // Initialize tab from URL or set default
  useEffect(() => {
    if (!searchParams || !isClient) return;

    const tabParam = searchParams.get("tab")
    if (tabParam && isValidTab(tabParam)) {
      setActiveTab(tabParam)
      localStorage.setItem(STORAGE_KEY, tabParam)
    } else if (pathname === "/") {
      // Use the persisted tab from localStorage
      const savedTab = localStorage.getItem(STORAGE_KEY)
      if (savedTab && isValidTab(savedTab)) {
        setActiveTab(savedTab)
        const params = new URLSearchParams(window.location.search)
        params.set("tab", savedTab)
        router.push(`?${params.toString()}`, { scroll: false })
      }
    }
  }, [searchParams, pathname, router, isClient])

  // Handle tab changes
  const handleTabChange = useCallback((newTab: TabType) => {
    if (newTab === activeTab) return;

    setActiveTab(newTab)
    if (isClient) {
      localStorage.setItem(STORAGE_KEY, newTab)
    }

    const params = new URLSearchParams(window.location.search)
    params.set("tab", newTab)
    router.push(`?${params.toString()}`, { scroll: false })
  }, [activeTab, router, isClient])

  // Memoize the setVisiblePointTypes handler to prevent unnecessary re-renders
  const handleVisiblePointTypesChange = useCallback(
    (types: Record<string, boolean>) => {
      // Only update if the values actually changed
      const hasChanged = Object.keys(types).some((key) => types[key] !== visiblePointTypes[key])
      if (hasChanged) {
        setVisiblePointTypes(types)
      }
    },
    [setVisiblePointTypes, visiblePointTypes],
  )

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkIfMobile()

    // Add event listener
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Force map to update when sidebar state changes
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
      triggerRefresh() // Force the map to refresh
    }, 300)
    return () => clearTimeout(timer)
  }, [rightSidebarCollapsed, triggerRefresh])

  // Toggle right sidebar
  const toggleRightSidebar = () => {
    setRightSidebarCollapsed(!rightSidebarCollapsed)
    // Force a refresh after sidebar state changes
    setTimeout(() => {
      triggerRefresh()
    }, 300)
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex w-full" ref={mapContainerRef}>
      {/* Left Sidebar - fixed width */}
      <div className="h-full w-[350px] flex-shrink-0 bg-background border-r">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold tracking-tight">{selectedCity ? selectedCity.name : "Select city"}</h2>
            <p className="text-sm text-muted-foreground mt-1">Walk the city through data</p>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="p-4">
              <div className="modern-tabs flex mb-6">
                <button
                  className={`flex-1 modern-tab ${activeTab === TABS.POINTS ? "modern-tab-active" : "modern-tab-inactive"}`}
                  onClick={() => handleTabChange(TABS.POINTS)}
                >
                  <MapPin className="h-4 w-4 mr-2 inline-block" />
                  Points
                </button>
                <button
                  className={`flex-1 modern-tab ${activeTab === TABS.FILTERS ? "modern-tab-active" : "modern-tab-inactive"}`}
                  onClick={() => handleTabChange(TABS.FILTERS)}
                >
                  <Filter className="h-4 w-4 mr-2 inline-block" />
                  Filters
                </button>
                <button
                  className={`flex-1 modern-tab ${activeTab === TABS.INFO ? "modern-tab-active" : "modern-tab-inactive"}`}
                  onClick={() => handleTabChange(TABS.INFO)}
                >
                  <Info className="h-4 w-4 mr-2 inline-block" />
                  Info
                </button>
              </div>

              {activeTab === TABS.POINTS && (
                <div>
                  <h3 className="section-title flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Points of Interest
                  </h3>
                  <p className="caption mb-4">Customize what is displayed on the map</p>
                  <PointFeaturesToggle />
                </div>
              )}

              {activeTab === TABS.FILTERS && (
                <div>
                  <h3 className="section-title flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter Areas
                  </h3>
                  <p className="caption mb-4">
                    Adjust filters to explore data from {selectedCity?.name || "the selected city"}
                  </p>
                  <FilterPanel />
                </div>
              )}

              {activeTab === TABS.INFO && (
                <div>
                  {selectedArea && (typeof selectedArea.id !== 'undefined') && (typeof (selectedArea as any)['cityId'] !== 'undefined' || typeof (selectedArea as any)['city_id'] !== 'undefined') ? (
                    <DistrictInfo area={{
                      id: selectedArea.id,
                      name: selectedArea.name,
                      cityId: ((selectedArea as any)['cityId'] ?? (selectedArea as any)['city_id']),
                      population: (selectedArea as any)['population'] ?? 0,
                      avgIncome: (selectedArea as any)['avgIncome'] ?? (selectedArea as any)['avg_income'] ?? 0,
                      districtId: (selectedArea as any)['districtId'] ?? (selectedArea as any)['district_id']
                    }} />
                  ) : (
                    <div className="text-center py-8 flex flex-col items-center gap-4">
                      <div className="bg-muted rounded-full p-4">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">Select an area on the map to view details</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 h-full relative">
        <MapComponent />
      </div>

      {/* Right Sidebar container - fixed width when visible, 0 when collapsed */}
      <div
        className="h-full transition-all duration-300 flex-shrink-0"
        style={{
          width: rightSidebarCollapsed ? 0 : "350px",
          overflow: "hidden",
        }}
      >
        {/* Right Sidebar content */}
        <div className="h-full w-[350px]">
          <ChatSidebar />
        </div>
      </div>

      {/* Right Sidebar toggle button */}
      <button
        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-[1000] bg-primary hover:bg-blue-600 text-white rounded-l-lg p-3 shadow-lg border-2 border-white"
        onClick={toggleRightSidebar}
        style={{ right: rightSidebarCollapsed ? "0" : "350px" }}
      >
        {rightSidebarCollapsed ? <Bot className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
      </button>
    </div>
  )
}
