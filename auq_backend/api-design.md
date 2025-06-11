# *Are-u-Queryous?* - API Design Specification

## Overview

This document outlines the complete API design for the "Are U Query-ous" geospatial data visualization platform. The API is designed to seamlessly integrate with the existing frontend application, providing all necessary data endpoints for the map visualization, comparison, and analysis features.

## Integration with Existing Codebase

The API design is specifically tailored to work with the existing frontend implementation, which currently uses direct Supabase connections. The API will:

1. Match the exact data structures expected by the frontend
2. Support all existing functionality
3. Maintain the same field names and response formats
4. Enable seamless switching between direct Supabase and API modes

## API Base URL

```bash
https://api.areuqueryous.com/v1s
```

## Authentication

All API requests require authentication using a JWT token in the Authorization header:

```bash
Authorization: Bearer <JWT_TOKEN>
```

For public endpoints, an API key can be used instead:

```bash
X-API-Key: <API_KEY>
```

## Response Format

All API responses follow a consistent format:

```json
{
  "data": <response_data>,
  "error": null,
  "status": 200
}
```

For errors:

```json
{
  "data": null,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  },
  "status": 400
}
```

## Core Endpoints

### Cities

#### Get All Cities

Retrieves all available cities.

- **URL**: `/api/cities`
- **Method**: `GET`
- **Response Format**:

```json
[
  {
    "id": 1,
    "name": "Barcelona",
    "country": "Spain",
    "created_at": "2023-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Madrid",
    "country": "Spain",
    "created_at": "2023-01-01T00:00:00Z"
  }
]
```

- **Integration Notes**:
  - This endpoint is called by `getCities()` in `api-service.ts`
  - The response format exactly matches the `City` type in `api-types.ts`

### Geographical Levels

#### Get All Geographical Levels

Retrieves all available geographical levels.

- **URL**: `/api/geographical-levels`
- **Method**: `GET`
- **Response Format**:

```json
[
  {
    "id": 1,
    "name": "City",
    "level": "city"
  },
  {
    "id": 2,
    "name": "Districts",
    "level": "district"
  },
  {
    "id": 3,
    "name": "Neighborhoods",
    "level": "neighbourhood"
  }
]
```

- **Integration Notes**:
  - This endpoint is called by `getGeographicalLevels()` in `api-service.ts`
  - The response format exactly matches the `GranularityLevel` type in `api-types.ts`
  - Note that "neighbourhood" uses British spelling to match existing code

### Districts

#### Get Districts for a City

Retrieves all districts for a specific city.

- **URL**: `/api/cities/{cityId}/districts`
- **Method**: `GET`
- **URL Parameters**:
  - `cityId`: ID of the city
- **Response Format**:

```json
[
  {
    "id": 1,
    "name": "Ciutat Vella",
    "district_code": 1,
    "city_id": 1,
    "population": 100000,
    "avg_income": 30000,
    "surface": 4.5,
    "disposable_income": 22000,
    "created_at": "2023-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Eixample",
    "district_code": 2,
    "city_id": 1,
    "population": 200000,
    "avg_income": 40000,
    "surface": 7.5,
    "disposable_income": 28000,
    "created_at": "2023-01-01T00:00:00Z"
  }
]
```

- **Integration Notes**:
  - This endpoint is called by `getDistricts(cityId)` in `api-service.ts`
  - The response format exactly matches the `District` type in `api-types.ts`
  - Used in both the map view and comparison views

### Neighborhoods

#### Get Neighborhoods for a District

Retrieves all neighborhoods for a specific district.

- **URL**: `/api/districts/{districtId}/neighborhoods`
- **Method**: `GET`
- **URL Parameters**:
  - `districtId`: ID of the district
- **Response Format**:

```json
[
  {
    "id": 101,
    "name": "El Raval",
    "neighbourhood_code": 1,
    "district_id": 1,
    "city_id": 1,
    "population": 50000,
    "avg_income": 25000,
    "surface": 1.1,
    "disposable_income": 18000,
    "created_at": "2023-01-01T00:00:00Z"
  },
  {
    "id": 102,
    "name": "Gothic Quarter",
    "neighbourhood_code": 2,
    "district_id": 1,
    "city_id": 1,
    "population": 50000,
    "avg_income": 35000,
    "surface": 0.8,
    "disposable_income": 24000,
    "created_at": "2023-01-01T00:00:00Z"
  }
]
```

- **Integration Notes**:
  - This endpoint is called by `getNeighborhoods(districtId)` in `api-service.ts`
  - The response format exactly matches the `Neighborhood` type in `api-types.ts`
  - Note that "neighbourhood_code" uses British spelling to match existing code

### Geographical Units

#### Get Geographical Units for a City

Retrieves all geographical units of a specific level for a city.

- **URL**: `/api/cities/{cityId}/geo-units`
- **Method**: `GET`
- **URL Parameters**:
  - `cityId`: ID of the city
- **Query Parameters**:
  - `level`: Granularity level (`district` or `neighbourhood`)
- **Response Format**:

```json
[
  {
    "id": 1,
    "name": "Ciutat Vella",
    "code": 1,
    "city_id": 1,
    "population": 100000,
    "avg_income": 30000,
    "surface": 4.5,
    "disposable_income": 22000
  },
  {
    "id": 2,
    "name": "Eixample",
    "code": 2,
    "city_id": 1,
    "population": 200000,
    "avg_income": 40000,
    "surface": 7.5,
    "disposable_income": 28000
  }
]
```

- **Integration Notes**:
  - This endpoint is called by `getGeographicalUnits(cityId, level)` in `api-service.ts`
  - The response format adapts to either District or Neighborhood types based on the level parameter

### GeoJSON Data

#### Get GeoJSON for a City

Retrieves GeoJSON data for a specific city at a specific granularity level.

- **URL**: `/api/cities/{cityId}/geojson`
- **Method**: `GET`
- **URL Parameters**:
  - `cityId`: ID of the city
- **Query Parameters**:
  - `level`: Granularity level (`district` or `neighbourhood`)
- **Response Format**:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": 1,
        "name": "Ciutat Vella",
        "district_code": 1,
        "city_id": 1,
        "population": 100000,
        "avg_income": 30000,
        "surface": 4.5,
        "disposable_income": 22000,
        "level": "district",
        "index": 0
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [2.14, 41.37],
            [2.16, 41.37],
            [2.16, 41.39],
            [2.14, 41.39],
            [2.14, 41.37]
          ]
        ]
      }
    }
  ]
}
```

- **Integration Notes**:
  - This endpoint is called by `getGeoJSON(cityId, level)` in `api-service.ts`
  - The response format exactly matches the `GeoJSONResponse` type in `api-types.ts`
  - This is a critical endpoint for the map visualization
  - The response must include all properties needed for tooltips and styling

### Feature Definitions

#### Get Feature Definitions

Retrieves all feature definitions for point features.

- **URL**: `/api/feature-definitions`
- **Method**: `GET`
- **Response Format**:

```json
[
  {
    "id": 1,
    "name": "library",
    "description": "Public libraries and book repositories"
  },
  {
    "id": 2,
    "name": "cultural_center",
    "description": "Cultural and community centers"
  },
  {
    "id": 3,
    "name": "auditorium",
    "description": "Auditoriums and concert halls"
  }
]
```

- **Integration Notes**:
  - This endpoint is called by `getFeatureDefinitions()` in `api-service.ts`
  - The response format exactly matches the `FeatureDefinition` type in `api-types.ts`
  - Used for the point features toggle component

### Point Features

#### Get Point Features for a City

Retrieves all point features for a specific city.

- **URL**: `/api/cities/{cityId}/point-features`
- **Method**: `GET`
- **URL Parameters**:
  - `cityId`: ID of the city
- **Response Format**:

```json
[
  {
    "id": 1,
    "feature_definition_id": 1,
    "name": "Biblioteca Jaume Fuster",
    "latitude": 41.4085,
    "longitude": 2.1487,
    "geo_level_id": 2,
    "geo_id": 6,
    "city_id": 1,
    "properties": {
      "address": "Plaça de Lesseps, 20-22",
      "phone": "+34 933 68 45 64",
      "website": "https://ajuntament.barcelona.cat/biblioteques/bibjaumeruster/ca"
    },
    "created_at": "2023-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "feature_definition_id": 2,
    "name": "Centre Cultural El Born",
    "latitude": 41.3851,
    "longitude": 2.1839,
    "geo_level_id": 2,
    "geo_id": 1,
    "city_id": 1,
    "properties": {
      "address": "Plaça Comercial, 12",
      "phone": "+34 932 56 68 51",
      "website": "https://elbornculturaimemoria.barcelona.cat/"
    },
    "created_at": "2023-01-01T00:00:00Z"
  }
]
```

- **Integration Notes**:
  - This endpoint is called by `getCityPointFeatures(cityId)` in `api-service.ts`
  - The response format exactly matches the `PointFeature` type in `api-types.ts`
  - Critical for displaying markers on the map
  - The `feature_definition_id` is used to determine the marker type and color

### Indicator Definitions

#### Get Indicator Definitions

Retrieves all indicator definitions.

- **URL**: `/api/indicator-definitions`
- **Method**: `GET`
- **Response Format**:

```json
[
  {
    "id": 1,
    "name": "Population",
    "unit": "people",
    "description": "Total number of residents",
    "category": "demographics",
    "created_at": "2023-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Average Income",
    "unit": "€",
    "description": "Average annual income per capita",
    "category": "economics",
    "created_at": "2023-01-01T00:00:00Z"
  }
]
```

- **Integration Notes**:
  - This endpoint is called by `getIndicatorDefinitions()` in `api-service.ts`
  - The response format exactly matches the `IndicatorDefinition` type in `api-types.ts`
  - Used for visualization and comparison views

### Indicators

#### Get Indicators for a City

Retrieves all indicators for a specific city at a specific granularity level.

- **URL**: `/api/cities/{cityId}/indicators`
- **Method**: `GET`
- **URL Parameters**:
  - `cityId`: ID of the city
- **Query Parameters**:
  - `level`: Granularity level (`district` or `neighbourhood`)
  - `year`: Year for the data (optional, defaults to latest)
- **Response Format**:

```json
[
  {
    "id": 1,
    "indicator_def_id": 1,
    "geo_level_id": 2,
    "geo_id": 1,
    "year": 2023,
    "value": 100000,
    "created_at": "2023-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "indicator_def_id": 2,
    "geo_level_id": 2,
    "geo_id": 1,
    "year": 2023,
    "value": 30000,
    "created_at": "2023-01-01T00:00:00Z"
  }
]
```

- **Integration Notes**:
  - This endpoint is called by `getCityIndicators(cityId, level, year)` in `api-service.ts`
  - The response format exactly matches the `Indicator` type in `api-types.ts`
  - Used for visualization charts and comparison views

## Advanced Endpoints

### Comparison

#### Compare Areas

Compares two areas within a city.

- **URL**: `/api/cities/{cityId}/compare`
- **Method**: `GET`
- **URL Parameters**:
  - `cityId`: ID of the city
- **Query Parameters**:
  - `area1`: ID of the first area
  - `area2`: ID of the second area
  - `level`: Granularity level (`district` or `neighbourhood`)
- **Response Format**:

```json
{
  "area1": {
    "id": 1,
    "name": "Ciutat Vella",
    "indicators": [
      {
        "id": 1,
        "name": "Population",
        "value": 100000,
        "unit": "people"
      },
      {
        "id": 2,
        "name": "Average Income",
        "value": 30000,
        "unit": "€"
      }
    ]
  },
  "area2": {
    "id": 2,
    "name": "Eixample",
    "indicators": [
      {
        "id": 1,
        "name": "Population",
        "value": 200000,
        "unit": "people"
      },
      {
        "id": 2,
        "name": "Average Income",
        "value": 40000,
        "unit": "€"
      }
    ]
  }
}
```

- **Integration Notes**:
  - This endpoint is used by the comparison view
  - The response format matches the `ComparisonResponse` type in `api-types.ts`

### Filtering

#### Filter Areas

Filters areas in a city based on criteria.

- **URL**: `/api/cities/{cityId}/filter`
- **Method**: `GET`
- **URL Parameters**:
  - `cityId`: ID of the city
- **Query Parameters**:
  - `level`: Granularity level (`district` or `neighbourhood`)
  - `populationMin`: Minimum population
  - `populationMax`: Maximum population
  - `incomeMin`: Minimum average income
  - `incomeMax`: Maximum average income
  - `surfaceMin`: Minimum surface area
  - `surfaceMax`: Maximum surface area
  - `disposableIncomeMin`: Minimum disposable income
  - `disposableIncomeMax`: Maximum disposable income
- **Response Format**:

```json
[
  {
    "id": 1,
    "name": "Ciutat Vella",
    "district_code": 1,
    "city_id": 1,
    "population": 100000,
    "avg_income": 30000,
    "surface": 4.5,
    "disposable_income": 22000
  },
  {
    "id": 3,
    "name": "Sants-Montjuïc",
    "district_code": 3,
    "city_id": 1,
    "population": 150000,
    "avg_income": 35000,
    "surface": 8.2,
    "disposable_income": 25000
  }
]
```

- **Integration Notes**:
  - This endpoint supports the filter panel functionality
  - The response format matches the `FilterResponse` type in `api-types.ts`

## Implementation Details

### API Routes Implementation

The API should be implemented as a set of Next.js API routes under the `/api` directory:

```bash
/api
├── cities
│   ├── index.js                    # GET /api/cities
│   ├── [cityId]
│   │   ├── districts.js            # GET /api/cities/{cityId}/districts
│   │   ├── geojson.js              # GET /api/cities/{cityId}/geojson
│   │   ├── indicators.js           # GET /api/cities/{cityId}/indicators
│   │   ├── point-features.js       # GET /api/cities/{cityId}/point-features
│   │   ├── geo-units.js            # GET /api/cities/{cityId}/geo-units
│   │   ├── compare.js              # GET /api/cities/{cityId}/compare
│   │   └── filter.js               # GET /api/cities/{cityId}/filter
├── districts
│   └── [districtId]
│       └── neighborhoods.js        # GET /api/districts/{districtId}/neighborhoods
├── geographical-levels
│   └── index.js                    # GET /api/geographical-levels
├── feature-definitions
│   └── index.js                    # GET /api/feature-definitions
├── indicator-definitions
│   └── index.js                    # GET /api/indicator-definitions
└── point-features
    └── index.js                    # GET /api/point-features
```

### Database Queries

Each API route should use Supabase queries similar to those in the existing `supabase-client.ts` file. For example:

```javascript
// GET /api/cities
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching cities:', error);
    return res.status(500).json({ error: 'Failed to fetch cities' });
  }
}
```

### GeoJSON Handling

For GeoJSON endpoints, use PostGIS functions to generate GeoJSON directly from the database:

```javascript
// GET /api/cities/{cityId}/geojson
export default async function handler(req, res) {
  const { cityId } = req.query;
  const { level = 'district' } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let query;
    
    if (level === 'district') {
      query = supabase.rpc('get_district_geojson', { city_id: cityId });
    } else if (level === 'neighbourhood') {
      query = supabase.rpc('get_neighbourhood_geojson', { city_id: cityId });
    } else {
      return res.status(400).json({ error: 'Invalid level parameter' });
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching GeoJSON for city ${cityId}:`, error);
    return res.status(500).json({ error: 'Failed to fetch GeoJSON data' });
  }
}
```

### Caching Strategy

Implement caching for all API routes to improve performance:

```javascript
export default async function handler(req, res) {
  // Set cache headers
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  
  // Rest of the handler code...
}
```

For GeoJSON data which changes infrequently, use longer cache times:

```javascript
res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
```

### Error Handling

Implement consistent error handling across all API routes:

```javascript
try {
  // API logic
} catch (error) {
  console.error(`Error in API route: ${req.url}`, error);
  
  // Determine appropriate status code
  const statusCode = error.status || 500;
  
  // Return structured error response
  return res.status(statusCode).json({
    error: {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'INTERNAL_SERVER_ERROR'
    }
  });
}
```

### Authentication and Authorization

Implement authentication middleware for protected routes:

```javascript
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Rest of the handler code...
}
```

## Integration with Frontend

### Switching Between Supabase and API

The frontend already has a mechanism to switch between direct Supabase access and API calls:

```typescript
// Flag to determine whether to use Supabase or API
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE !== "false"

export async function getCities(): Promise<City[]> {
  return getCachedData("cities", async () => {
    if (USE_SUPABASE) {
      return await getSupabaseCities()
    } else {
      return await fetchAPI("/api/cities")
    }
  })
}
```

To ensure seamless integration:

1. Match all API response formats exactly to what the Supabase functions return
2. Ensure all field names and data types are consistent
3. Implement all endpoints used by the frontend
4. Maintain the same caching behavior

### API Client Implementation

The existing `fetchAPI` function in `api-utils.ts` should be enhanced:

```typescript
export async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.areuqueryous.com/v1';
  const url = `${apiUrl}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  };
  
  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  return await response.json();
}
```

## Testing and Validation

### API Testing

Each API endpoint should be tested for:

1. Correct response format
2. Handling of edge cases (empty results, large datasets)
3. Error handling
4. Performance under load

### Integration Testing

Test the frontend with the API to ensure:

1. All components render correctly with API data
2. Map visualization works as expected
3. Charts and comparisons display correctly
4. Filtering and selection work properly

## Deployment

### API Deployment

The API should be deployed as:

1. Serverless functions (for scaling and cost efficiency)
2. With a CDN for caching static responses
3. With proper monitoring and logging
4. With rate limiting to prevent abuse

### Environment Configuration

Set up environment variables for different environments:

```bash
# Development
NEXT_PUBLIC_USE_SUPABASE=true
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Production
NEXT_PUBLIC_USE_SUPABASE=false
NEXT_PUBLIC_API_URL=https://api.areuqueryous.com/v1
```

## Migration Plan

1. Implement API routes one by one, starting with core endpoints
2. Test each endpoint against the existing Supabase implementation
3. Update frontend to use API in staging environment
4. Monitor performance and fix any issues
5. Switch production to API mode

## Conclusion

This API design provides a complete blueprint for implementing a backend that integrates seamlessly with the existing "Are U Query-ous" frontend. By following this specification, we will create an API that:

1. Matches the exact data structures expected by the frontend
2. Supports all existing functionality
3. Maintains consistent field names and response formats
4. Enables seamless switching between direct Supabase and API modes
5. Provides a scalable, performant solution for production use

This API design document provides a comprehensive blueprint for implementing the backend API that will integrate perfectly with our existing frontend. It includes:

1. **Exact endpoint specifications** that match our current data structures
2. **Response formats** that align with our existing types
3. **Implementation details** for each API route
4. **Integration guidance** for connecting with our frontend
5. **Caching strategies** for optimal performance
6. **Error handling** patterns for robustness
7. **Authentication** mechanisms for security
8. **Testing and deployment** recommendations

## License & Ownership

This **API definition** was designed and documented by Nico Dalessandro  
for the UOC Final Degree Project (TFG) — "Are-u-Queryous?"

All code and scripts in this repository are released under the [MIT License](./LICENSE).  
You are free to use, modify, and distribute them with proper attribution.
