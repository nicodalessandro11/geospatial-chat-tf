"use client"

import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/contexts/auth-context"
import { MapProvider } from "@/contexts/map-context"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <AuthProvider>
                <MapProvider>
                    {children}
                </MapProvider>
            </AuthProvider>
        </ThemeProvider>
    )
} 