export const TABS = {
  POINTS: "points",
  FILTERS: "filters",
  INFO: "info",
} as const

export type TabType = typeof TABS[keyof typeof TABS]

export const isValidTab = (tab: string): tab is TabType => {
  return Object.values(TABS).includes(tab as TabType)
}

// URL Parameter Names
export const URL_PARAMS = {
  TAB: "tab",
  CITY: "city",
  AREA: "area",
  LEVEL: "level",
} as const

// Storage Keys
export const STORAGE_KEYS = {
  ACTIVE_TAB: "activeTab",
  SELECTED_CITY: "selectedCity",
} as const 