"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Database, AlertCircle, CheckCircle2 } from "lucide-react"
import { supabase, checkPostGISAvailability } from "@/lib/supabase-client"

export function ConnectionStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [message, setMessage] = useState<string>("Checking connection...")
  const [hasPostGIS, setHasPostGIS] = useState<boolean>(false)

  useEffect(() => {
    async function checkConnection() {
      try {
        if (!supabase) {
          setStatus("error")
          setMessage("Supabase client not initialized")
          return
        }

        // Try a simple query to check if the connection works
        const { data, error } = await supabase.from("cities").select("count").limit(1)

        if (error) {
          console.error("Supabase connection error:", error)
          setStatus("error")
          setMessage(`Connection error: ${error.message}`)
          return
        }

        // Check if PostGIS is available
        const postgisAvailable = await checkPostGISAvailability()
        setHasPostGIS(postgisAvailable)

        setStatus("connected")
        setMessage(`Connected ${postgisAvailable ? "(PostGIS available)" : "(PostGIS not available)"}`)
      } catch (error) {
        console.error("Error checking connection:", error)
        setStatus("error")
        setMessage("Connection check failed")
      }
    }

    checkConnection()
  }, [])

  return (
    <div className="flex items-center gap-2">
      <Badge variant={status === "connected" ? "default" : "destructive"} className="px-2 py-1 flex items-center gap-1">
        {status === "checking" && <Database className="h-3 w-3 animate-pulse" />}
        {status === "connected" && <CheckCircle2 className="h-3 w-3" />}
        {status === "error" && <AlertCircle className="h-3 w-3" />}
        <span className="text-xs">{message}</span>
      </Badge>
    </div>
  )
}
