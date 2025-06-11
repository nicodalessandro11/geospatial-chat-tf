export const cities = [
  { id: 1, name: "Barcelona" },
  { id: 2, name: "Madrid" },
]

export const indicatorDefinitions = [
  {
    id: 1,
    name: "Population",
    unit: "people",
    description: "Total number of residents",
    category: "demographics",
  },
  {
    id: 2,
    name: "Surface",
    unit: "km²",
    description: "Area in square kilometers",
    category: "geography",
  },
  {
    id: 3,
    name: "Average Income",
    unit: "€",
    description: "Average gross taxable income per person",
    category: "economics",
  },
  {
    id: 4,
    name: "Disposable Income",
    unit: "€",
    description: "Disposable income per capita",
    category: "economics",
  },
  {
    id: 5,
    name: "Population Density",
    unit: "people/km²",
    description: "Number of residents per square kilometer",
    category: "demographics",
  },
  {
    id: 6,
    name: "Education Level",
    unit: "%",
    description: "Percentage of population with higher education",
    category: "education",
  },
  {
    id: 7,
    name: "Unemployment Rate",
    unit: "%",
    description: "Percentage of working-age population without employment",
    category: "employment",
  },
]

export function getIndicatorValue(areaId: number, indicatorId: number, level: string): number {
  // Mock implementation for indicator values
  // Replace with actual data retrieval logic if available
  const baseValue = areaId * 1000
  switch (indicatorId) {
    case 1: // Population
      return baseValue + (level === "district" ? 500 : 200)
    case 2: // Surface
      return 5 + areaId * 0.1
    case 3: // Average Income
      return 30000 + baseValue
    case 4: // Disposable Income
      return 25000 + baseValue
    case 5: // Population Density
      return 100 + baseValue / 1000
    default:
      return baseValue
  }
}
