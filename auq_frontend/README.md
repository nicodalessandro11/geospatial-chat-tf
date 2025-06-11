# *Are-u-Queryous?* — Frontend Application

This document outlines the structure and functionality of the **frontend interface** for the Are U Query-ous platform. Built with **Next.js 14**, **React 19**, **Tailwind CSS**, and **Supabase**, the app provides a geospatial visualization experience, enabling users to compare and analyze open urban data interactively.

## Features Overview

* Interactive map with **district** and **neighbourhood** polygons
* Marker layers for **point features** (parks, libraries, etc.)
* Visual dashboards and data **comparison views**
* Supabase integration for fetching live **geospatial** and **statistical** data
* Context-based **filtering**, **selection**, and **state sharing**
* User authentication and profile management
* Admin dashboard (protected)
* Mobile-responsive and dark-mode ready
* Data export capabilities
* Custom visualization tools

## Page Architecture

Each page is built with the **Next.js App Router** structure:

* `app/page.tsx`: Default **Map View**
* `app/compare/page.tsx`: Compare view between selected areas
* `app/visualize/page.tsx`: Data visualization (charts)
* `app/admin/page.tsx`: Admin tools (secured)
* `app/auth/*`: Authentication pages
* `app/profile/*`: User profile management
* `app/signup/*`: User registration
* `app/info/*`: Help and documentation
* `app/config/*`: User settings

All pages are wrapped with shared providers for global state and include modular components.

## Component Structure

### Layout and Routing

```bash
auq_frontend/
├── app/                # Next.js App Router pages
│   ├── layout.tsx      # Root layout + providers
│   ├── page.tsx        # Home (map view)
│   ├── compare/        # Area comparison
│   ├── visualize/      # Data visualization
│   ├── admin/          # Admin dashboard
│   ├── auth/           # Authentication
│   ├── profile/        # User profiles
│   ├── signup/         # Registration
│   ├── info/           # Documentation
│   └── config/         # Settings
```

### Logic & State

```bash
├── contexts/
│   ├── map-context.tsx     # Manages selected city/area and filters
│   └── auth-context.tsx    # Manages user auth state
```

### Core Components

```bash
├── components/
│   ├── ui/                 # Shadcn UI components
│   ├── map-view.tsx        # View wrapper
│   ├── map-component.tsx   # Loader
│   ├── leaflet-map.jsx     # Leaflet implementation
│   ├── city-selector.tsx   # Dropdown
│   ├── filter-panel.tsx    # Filtering UI
│   ├── district-comparison-chart.tsx  # Comparison visualization
│   ├── income-chart.tsx    # Income data visualization
│   ├── admin-view.tsx      # Admin interface
│   └── ...                 # Other shared components
```

### Data Layer

```bash
├── lib/
│   ├── supabase-client.ts      # Direct Supabase access
│   ├── api-service.ts          # Unified API abstraction
│   ├── api-types.ts            # TypeScript interfaces
│   ├── api-utils.ts            # Utility functions
│   ├── mock-data.ts            # Local fallback data
│   ├── feature-styles.ts       # Map styling
│   ├── constants.ts            # Application constants
│   └── log-user-event.ts       # Analytics tracking
```

## Data Flow Summary

* **Data Source**: Supabase (PostgreSQL + PostGIS)
* **Fetcher**: `api-service.ts` or `supabase-client.ts`
* **Context**: `map-context.tsx` handles selected city, view mode, filters
* **Consumers**: UI components subscribe to changes and update display

## User Flowchart & Data Load

| Action                             | Component(s)                                                       | URL State                                                                                   | Endpoint/API Called                                                               | Notes                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1. User lands on `/`               | components/map-view.tsx                                            | `/?tab=points`                                                                              | (none)                                                                            | Welcome banner shown, no city or level selected. Tab defaults to 'points'.             |
| 2. Select city                     | components/city-selector.tsx                                       | `/?tab=points&city=[city]`                                                                  | `getCities`, `getCityPointFeatures`                                               | URL updates, point features for city are loaded.                                       |
| 3. Select granularity (level)      | components/granularity-selector.tsx                                | `/?tab=points&city=[city]&level=[level]`                                                    | `getGeographicalLevels`, `getEnrichedGeoJSON`                                     | URL updates, polygons and data for the level are loaded.                               |
| 4. Select area/polygon             | components/map-view.tsx                                            | `/?tab=points&city=[city]&level=[level]&area=[area]`                                        | (none, cached)                                                                    | Area is selected, highlight and info shown.                                            |
| 5. Change visible point type       | components/point-features-toggle.tsx                               | (no change)                                                                                 | (none, cached)                                                                    | Changes visibility of point types on the map.                                          |
| 6. Change city or level            | components/city-selector.tsx / components/granularity-selector.tsx | `/?tab=points&city=[city2]&level=[level]` or `/?tab=points&city=[city]&level=[other-level]` | `getCityPointFeatures` (if city changes), `getEnrichedGeoJSON` (if level changes) | Area selection is reset, data is reloaded as needed.                                   |
| 7. Change level with area selected | components/granularity-selector.tsx                                | `/?tab=points&city=[city]&level=[other-level]`                                              | `getEnrichedGeoJSON`                                                              | Selected area is reset, `area` param removed from URL, filters reset, info disappears. |

> **Note:** All endpoints use local cache and only fetch if no data is in memory.

## Development Workflow

### 1. Setup

```bash
cd auq_frontend
pnpm install
```

Create `.env.local` with Supabase credentials if needed.

### 2. Dev Server

```bash
pnpm dev
```

Opens at `localhost:3000`.

### 3. Build for Production

```bash
pnpm build
```

## Styling System

* Tailwind CSS configured via `tailwind.config.ts`
* Uses **Slate** color palette and **New York** layout via `shadcn/ui`
* Responsive grid layout for map, filters, dashboards
* Dark mode support with theme switching

## Debug & Auth Tools

* `debug-panel.tsx`: Internal debug switch
* `connection-status.tsx`: Supabase status
* `login-modal.tsx`: Admin login
* `auth-context.tsx`: Supabase JWT auth
* `log-user-event.ts`: Analytics tracking

---

## Tech Stack

| Tool           | Role                              |
| -------------- | --------------------------------- |
| **Next.js 14** | Application framework             |
| **React 19**   | UI components                     |
| **Leaflet**    | Interactive mapping engine        |
| **Tailwind**   | Styling and layout                |
| **Supabase**   | Backend DB and auth               |
| **Shadcn/ui**  | UI system (buttons, modals, etc.) |
| **TypeScript** | Type safety and development       |
| **PostGIS**    | Geospatial data handling          |

## License & Ownership

All frontend code is released under the [MIT License](../LICENSE).
You are free to use, modify, and distribute it with attribution.