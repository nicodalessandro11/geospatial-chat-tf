"use client"
import { useEffect, useState } from "react"
import { MapProvider } from "@/contexts/map-context"
import { Header } from "@/components/header"
import { CitySelector } from "@/components/city-selector"
import { CompareView } from "@/components/compare-view"
import { DataDisclaimer } from "@/components/data-disclaimer"
// import { useSearchParams } from "next/navigation"
export const dynamic = 'force-dynamic'


export default function ComparePage() {
  const [enabled, setEnabled] = useState(true)
  // const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const features = JSON.parse(localStorage.getItem("enabledFeatures") || "{}")
      setEnabled(features.compare !== false)
    }
  }, [])

  // Removed: useEffect that redirects to home if city or level is missing

  if (!enabled) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-red-500 text-lg">
          This feature is currently disabled by the administrator.
        </div>
      </div>
    )
  }

  return (
    <MapProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex items-center px-4 py-2 bg-primary/5 border-b">
          <CitySelector />
        </div>
        <main className="flex-1">
          <CompareView />
        </main>
        <DataDisclaimer />
      </div>
    </MapProvider>
  )
}
