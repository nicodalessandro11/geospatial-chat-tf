/**
 * Base URL for API calls
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

/**
 * Fetch data from the API
 * @param endpoint - The API endpoint to fetch from (without the base URL)
 * @param options - Optional fetch options
 * @returns The JSON response from the API
 */
export async function fetchAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const startTime = Date.now()

  try {
    // Ensure endpoint starts with a slash
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

    // Make the actual API call
    const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    })

    // Check if the response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(
        `API error: ${response.status} ${response.statusText}${errorData ? ` - ${JSON.stringify(errorData)}` : ""}`,
      )
    }

    // Parse and return the JSON response
    const data = await response.json()

    if (process.env.NODE_ENV === "development") {
      console.log(`API call to ${endpoint} completed in ${Date.now() - startTime}ms`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`Error fetching from ${endpoint}:`, error)
    }
    throw error
  }
}

/**
 * Helper function to build API endpoints with query parameters
 * @param base - The base endpoint
 * @param params - The query parameters as an object
 * @returns The complete endpoint with query parameters
 */
export function buildEndpoint(base: string, params: Record<string, any>): string {
  const queryParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&")

  return queryParams ? `${base}?${queryParams}` : base
}

/**
 * Post data to the API
 * @param endpoint - The API endpoint to post to
 * @param data - The data to post
 * @returns The JSON response from the API
 */
export async function postAPI(endpoint: string, data: any): Promise<any> {
  return fetchAPI(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Put data to the API
 * @param endpoint - The API endpoint to put to
 * @param data - The data to put
 * @returns The JSON response from the API
 */
export async function putAPI(endpoint: string, data: any): Promise<any> {
  return fetchAPI(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Delete data from the API
 * @param endpoint - The API endpoint to delete from
 * @returns The JSON response from the API
 */
export async function deleteAPI(endpoint: string): Promise<any> {
  return fetchAPI(endpoint, {
    method: "DELETE",
  })
}
