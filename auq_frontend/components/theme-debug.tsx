"use client"

import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ThemeDebug() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Theme Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium">Current Theme:</div>
          <div>{theme}</div>

          <div className="font-medium">Resolved Theme:</div>
          <div>{resolvedTheme}</div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={() => setTheme("light")} className="px-3 py-1 bg-blue-500 text-white rounded">
            Set Light
          </button>
          <button onClick={() => setTheme("dark")} className="px-3 py-1 bg-gray-800 text-white rounded">
            Set Dark
          </button>
          <button onClick={() => setTheme("system")} className="px-3 py-1 bg-gray-500 text-white rounded">
            Set System
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
