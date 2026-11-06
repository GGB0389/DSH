export interface GeoLocation {
  latitude: number
  longitude: number
  city: string
  admin1?: string
  country?: string
}

export interface CitySearchItem {
  id: number
  name: string
  latitude: number
  longitude: number
  admin1?: string
  country?: string
  label: string
}

export interface DailyForecast {
  date: string
  weekLabel: string
  weatherCode: number
  icon: string
  description: string
  tempMax: number
  tempMin: number
}

export interface WeatherTips {
  clothing: string
  skincare: string
  temperature: string
  mood: string
}

export interface WeatherData {
  city: string
  latitude: number
  longitude: number
  temperature: number
  feelsLike: number
  humidity: number
  weatherCode: number
  description: string
  icon: string
  windSpeed: number
  windDirection: number
  windText: string
  forecast: DailyForecast[]
  tips: WeatherTips
  updatedAt: string
}
