# *Are-u-Queryous?* - Supabase Integration Architecture

## Overview

This document explains the Supabase integration in the Are-u-Queryous? application, detailing the singleton client pattern, API service layer, and data flow architecture.

## Singleton Client Pattern

### Implementation

The Supabase client is implemented as a singleton to ensure:

- Single instance across the application
- Consistent connection management
- Efficient resource usage

```typescript
// Singleton implementation
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance && SUPABASE_URL && SUPABASE_KEY) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY)
    console.log("Supabase client initialized")
  }
  return supabaseInstance
})()
```

### Configuration

- Environment variables control the client:
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public API key
  - `NEXT_PUBLIC_USE_SUPABASE`: Feature flag (defaults to true)

## Caching System

### Cache Implementation

The application implements a sophisticated caching system:

```typescript
const apiCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
```

### Cache Features

1. **Time-based Invalidation**
   - Cache entries expire after 5 minutes
   - Automatic refresh on expiration

2. **Cache Management**
   - `clearCache()`: Clears all cached data
   - `clearCacheEntry(key)`: Removes specific cache entries
   - `getCachedData()`: Retrieves or fetches fresh data
   - `setCachedData()`: Stores new data in cache

3. **Request Deduplication**
   - Tracks in-flight requests
   - Prevents duplicate API calls
   - Improves performance and reduces server load

## API Service Layer

### Core Endpoints

1. **Geographical Data**

   ```typescript
   getCities(): Promise<City[]>
   getDistricts(cityId: number): Promise<District[]>
   getNeighborhoods(districtId: number): Promise<Neighborhood[]>
   getGeographicalUnits(cityId: number, level: string): Promise<any[]>
   ```

2. **Spatial Data**

   ```typescript
   getDistrictPolygons(cityId: number): Promise<GeoJSONResponse>
   getNeighbourhoodPolygons(cityId: number): Promise<GeoJSONResponse>
   getEnrichedGeoJSON(cityId: number, level: string): Promise<GeoJSONResponse>
   ```

3. **Indicators and Features**

   ```typescript
   getIndicatorDefinitions(): Promise<IndicatorDefinition[]>
   getFeatureDefinitions(): Promise<FeatureDefinition[]>
   getCityIndicators(cityId: number, level: string, year?: number): Promise<Indicator[]>
   getCityPointFeatures(cityId: number): Promise<PointFeature[]>
   ```

4. **User Management**

   ```typescript
   getUserProfile(user_id: string): Promise<{ display_name?: string; is_admin?: boolean } | null>
   upsertProfile(profile: { user_id: string; is_admin?: boolean; display_name?: string }): Promise<void>
   getUserConfig(user_id: string): Promise<any | null>
   upsertUserConfig(config: { user_id: string; custom_features?: any; custom_indicators?: any; other_prefs?: any }): Promise<void>
   ```

### Data Flow

1. **Request Flow**

   ```
   Client Request → Cache Check → Supabase Query → Cache Update → Response
   ```

2. **Error Handling**
   - Comprehensive error checking
   - Type-safe responses
   - Detailed error messages
   - Fallback mechanisms

3. **Type Safety**
   - TypeScript interfaces for all responses
   - Runtime type checking
   - Consistent data structures

## Database Views and Tables

### Main Views

1. `district_polygons_view`
   - Contains district geometries
   - Includes city relationships
   - Optimized for spatial queries

2. `neighborhood_polygons_view`
   - Contains neighborhood geometries
   - Links to districts and cities
   - Spatial data optimization

3. `geographical_unit_view`
   - Unified view of all geographical units
   - Supports different granularity levels
   - Includes metadata and relationships

### Key Tables

1. `cities`
   - Basic city information
   - Country relationships
   - Creation timestamps

2. `districts`
   - District information
   - City relationships
   - Administrative codes

3. `neighborhoods`
   - Neighborhood details
   - District relationships
   - Local identifiers

## Performance Optimizations

1. **Caching Strategy**
   - In-memory caching
   - Time-based invalidation
   - Request deduplication

2. **Query Optimization**
   - Efficient spatial queries
   - Indexed lookups
   - Optimized joins

3. **Data Loading**
   - Lazy loading
   - Progressive enhancement
   - Background updates

## Security Considerations

1. **Authentication**
   - JWT-based authentication
   - Role-based access control
   - Secure session management

2. **Data Protection**
   - Environment variable protection
   - API key security
   - Request validation

3. **Error Handling**
   - Secure error messages
   - Rate limiting
   - Request validation

## Best Practices

1. **Code Organization**
   - Modular structure
   - Clear separation of concerns
   - Consistent naming conventions

2. **Error Handling**
   - Comprehensive error checking
   - Detailed error messages
   - Fallback mechanisms

3. **Type Safety**
   - TypeScript interfaces
   - Runtime type checking
   - Consistent data structures

## Future Improvements

1. **Potential Enhancements**
   - Real-time subscriptions
   - Advanced caching strategies
   - Query optimization

2. **Scalability Considerations**
   - Connection pooling
   - Load balancing
   - Performance monitoring

3. **Maintenance**
   - Regular updates
   - Performance monitoring
   - Security audits


## License & Ownership

This **Supabase Integration Document** was designed and documented by Nico Dalessandro  
for the UOC Final Degree Project (TFG) — "Are-u-Queryous?"
