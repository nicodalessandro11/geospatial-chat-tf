"use client"
import { useEffect, useState } from "react"
import { MapProvider } from "@/contexts/map-context"
import { Header } from "@/components/header"
import { CitySelector } from "@/components/city-selector"
import { VisualizeView } from "@/components/visualize-view"
export const dynamic = 'force-dynamic'

export default function VisualizePage() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const features = JSON.parse(localStorage.getItem("enabledFeatures") || "{}")
      setEnabled(features.visualize !== false)
    }
  }, [])

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
          <VisualizeView />
        </main>
      </div>
    </MapProvider>
  )
}
