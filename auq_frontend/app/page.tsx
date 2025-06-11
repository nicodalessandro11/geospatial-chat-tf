"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState, Suspense } from "react"
import { Header } from "@/components/header"
import { CitySelector } from "@/components/city-selector"
import { MapView } from "@/components/map-view"
import { DataDisclaimer } from "@/components/data-disclaimer"

function HomeContent() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const features = JSON.parse(localStorage.getItem("enabledFeatures") || "{}")
      setEnabled(features.map !== false)
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex items-center px-4 py-2 bg-primary/5 border-b">
        <CitySelector />
      </div>
      <main className="flex-1">
        <MapView />
      </main>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
