"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/**
 * Component that manages URL parameter cleanup across the application.
 * Specifically handles the 'tab' parameter, ensuring it only exists on the root route.
 */
export function URLParamCleanup() {
    const pathname = usePathname() || "/"
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (!searchParams) return;

        const shouldCleanupTab = pathname !== "/" && searchParams.has("tab")
        if (!shouldCleanupTab) return;

        // Create new URL parameters without the tab parameter
        const newParams = new URLSearchParams()
        searchParams.forEach((value, key) => {
            if (key !== "tab") {
                newParams.set(key, value)
            }
        })

        // Construct the new URL
        const hasParams = newParams.toString().length > 0
        const newUrl = hasParams ? `?${newParams.toString()}` : pathname

        // Update the URL without adding to browser history
        router.push(newUrl, { scroll: false })
    }, [pathname, searchParams, router])

    return null
} 