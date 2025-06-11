"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { X, Bug, Trash2, RefreshCw } from "lucide-react"
import { useMapContext } from "@/contexts/map-context"
import { clearCache as clearSupabaseCache } from "@/lib/supabase-client"
import { clearApiCache } from "@/lib/api-service"

// Declare DEBUG_MODE on window
declare global {
  interface Window {
    DEBUG_MODE: boolean;
  }
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    triggerRefresh,
    selectedCity,
    visiblePointTypes
  } = useMapContext()

  const handleClearCache = async () => {
    try {
      // Clear all caches
      clearSupabaseCache()
      clearApiCache()
      triggerRefresh()
    } catch (error) {
      console.error("Error clearing cache:", error)
    }
  }

  const handleRefresh = () => {
    triggerRefresh()
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50"
        onClick={() => setIsOpen(true)}
      >
        <Bug className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 w-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Debug Panel</h3>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="debug-mode">Debug Mode</Label>
          <Switch
            id="debug-mode"
            checked={window.DEBUG_MODE || false}
            onCheckedChange={(checked) => {
              window.DEBUG_MODE = checked
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-points">Show Points</Label>
          <Switch
            id="show-points"
            checked={Object.values(visiblePointTypes).some(v => v)}
            onCheckedChange={(checked) => {
              // Toggle all point types
              Object.keys(visiblePointTypes).forEach(key => {
                visiblePointTypes[key] = checked
              })
              triggerRefresh()
            }}
          />
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleClearCache}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Caches
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Current City: {selectedCity?.name || "None"}</p>
          <p>Point Types: {Object.keys(visiblePointTypes).length}</p>
        </div>
      </div>
    </div>
  )
}
