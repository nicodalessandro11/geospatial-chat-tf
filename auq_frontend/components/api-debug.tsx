"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { X, AlertCircle, Check } from "lucide-react"

// Create a global array to store API call logs
declare global {
  interface Window {
    apiLogs: Array<{
      timestamp: Date
      endpoint: string
      success: boolean
      duration: number
    }>
  }
}

// Initialize the global array if it doesn't exist
if (typeof window !== "undefined") {
  window.apiLogs = window.apiLogs || []
}

// Function to add a log entry
export function logApiCall(endpoint: string, success: boolean, duration: number) {
  if (typeof window !== "undefined") {
    window.apiLogs.push({
      timestamp: new Date(),
      endpoint,
      success,
      duration,
    })
  }
}

export function ApiDebug() {
  const [logs, setLogs] = useState<
    Array<{
      timestamp: Date
      endpoint: string
      success: boolean
      duration: number
    }>
  >([])
  const [visible, setVisible] = useState(false)

  // Update logs from global array
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== "undefined") {
        setLogs([...window.apiLogs])
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Clear logs
  const clearLogs = () => {
    if (typeof window !== "undefined") {
      window.apiLogs = []
      setLogs([])
    }
  }

  if (!visible) {
    return (
      <Button
        className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground"
        onClick={() => setVisible(true)}
      >
        API Debug
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-96 shadow-lg">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-primary" />
          Mock API Calls
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearLogs}>
            Clear
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setVisible(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No API calls logged yet</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div key={index} className="text-xs border rounded-md p-2">
                  <div className="flex justify-between items-center mb-1">
                    <Badge variant={log.success ? "default" : "destructive"} className="text-xs">
                      {log.success ? <Check className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                      {log.success ? "Success" : "Error"}
                    </Badge>
                    <span className="text-muted-foreground">{log.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <div className="font-mono break-all">{log.endpoint}</div>
                  <div className="text-muted-foreground mt-1">Duration: {log.duration}ms</div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
