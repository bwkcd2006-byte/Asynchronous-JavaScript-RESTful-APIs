import { GeocodingResult, WeatherApiResponse } from '../types/weather';

export interface CityPreset {
  city: GeocodingResult;
  snapshot: WeatherApiResponse;
}

export const POPULAR_CITIES: GeocodingResult[] = [
  {
    id: 5128581,
    name: 'New York',
    latitude: 40.7128,
    longitude: -74.006,
    country_code: 'US',
    country: 'United States',
    admin1: 'New York',
    timezone: 'America/New_York',
    population: 8804190,
  },
  {
    id: 2643743,
    name: 'London',
    latitude: 51.5085,
    longitude: -0.1257,
    country_code: 'GB',
    country: 'United Kingdom',
    admin1: 'England',
    timezone: 'Europe/London',
    population: 8961989,
  },
  {
    id: 1850147,
    name: 'Tokyo',
    latitude: 35.6895,
    longitude: 139.6917,
    country_code: 'JP',
    country: 'Japan',
    admin1: 'Tokyo',
    timezone: 'Asia/Tokyo',
    population: 13960000,
  },
  {
    id: 2988507,
    name: 'Paris',
    latitude: 48.8534,
    longitude: 2.3488,
    country_code: 'FR',
    country: 'France',
    admin1: 'Île-de-France',
    timezone: 'Europe/Paris',
    population: 2161000,
  },
  {
    id: 2147714,
    name: 'Sydney',
    latitude: -33.8688,
    longitude: 151.2093,
    country_code: 'AU',
    country: 'Australia',
    admin1: 'New South Wales',
    timezone: 'Australia/Sydney',
    population: 5312000,
  },
  {
    id: 292223,
    name: 'Dubai',
    latitude: 25.2048,
    longitude: 55.2708,
    country_code: 'AE',
    country: 'United Arab Emirates',
    admin1: 'Dubai',
    timezone: 'Asia/Dubai',
    population: 3331420,
  },
  {
    id: 1880252,
    name: 'Singapore',
    latitude: 1.2897,
    longitude: 103.8501,
    country_code: 'SG',
    country: 'Singapore',
    timezone: 'Asia/Singapore',
    population: 5686000,
  },
  {
    id: 3413829,
    name: 'Reykjavik',
    latitude: 64.1355,
    longitude: -21.8954,
    country_code: 'IS',
    country: 'Iceland',
    admin1: 'Capital Region',
    timezone: 'Atlantic/Reykjavik',
    population: 131136,
  }
];

export function generateSyntheticSnapshot(city: GeocodingResult): WeatherApiResponse {
  const isCold = Math.abs(city.latitude) > 55 || city.name === 'Reykjavik';
  const isTropical = Math.abs(city.latitude) < 20;
  const baseTemp = isCold ? 4.2 : isTropical ? 29.5 : 18.3;
  const now = new Date();

  const hourlyTimes: string[] = [];
  const hourlyTemps: number[] = [];
  const hourlyHumidity: number[] = [];
  const hourlyRainProb: number[] = [];
  const hourlyCodes: number[] = [];
  const hourlyWind: number[] = [];
  const hourlyUv: number[] = [];

  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getTime() + i * 3600000);
    const hour = d.getHours();
    hourlyTimes.push(d.toISOString().slice(0, 16));
    
    // diurnal cycle
    const tempOffset = Math.sin(((hour - 9) / 24) * 2 * Math.PI) * 4.5;
    hourlyTemps.push(Number((baseTemp + tempOffset).toFixed(1)));
    hourlyHumidity.push(Math.round(55 + Math.cos((hour / 24) * 2 * Math.PI) * 18));
    hourlyRainProb.push(isTropical ? Math.round(20 + Math.sin(hour) * 25) : Math.round(10 + Math.cos(hour) * 15));
    hourlyCodes.push(isCold ? (i % 5 === 0 ? 71 : 3) : isTropical ? (i % 6 === 0 ? 80 : 2) : (i % 7 === 0 ? 61 : 1));
    hourlyWind.push(Number((12.5 + Math.sin(i * 0.8) * 6).toFixed(1)));
    hourlyUv.push(hour >= 8 && hour <= 18 ? Number((Math.sin(((hour - 7) / 11) * Math.PI) * 7.5).toFixed(1)) : 0);
  }

  const dailyTimes: string[] = [];
  const dailyCodes: number[] = [];
  const dailyMax: number[] = [];
  const dailyMin: number[] = [];
  const dailySunrise: string[] = [];
  const dailySunset: string[] = [];
  const dailyPrecipSum: number[] = [];
  const dailyPrecipProb: number[] = [];
  const dailyWindMax: number[] = [];
  const dailyUvMax: number[] = [];

  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(now.getTime() + d * 86400000);
    const dateStr = dayDate.toISOString().slice(0, 10);
    dailyTimes.push(dateStr);
    dailyCodes.push(d === 0 ? 1 : d === 2 ? 61 : d === 4 ? 2 : 0);
    dailyMax.push(Number((baseTemp + 3.2 + Math.sin(d) * 2).toFixed(1)));
    dailyMin.push(Number((baseTemp - 4.5 + Math.cos(d) * 1.5).toFixed(1)));
    dailySunrise.push(`${dateStr}T06:14`);
    dailySunset.push(`${dateStr}T19:42`);
    dailyPrecipSum.push(d === 2 ? 4.2 : 0.2);
    dailyPrecipProb.push(d === 2 ? 65 : 15);
    dailyWindMax.push(Number((18 + Math.sin(d) * 5).toFixed(1)));
    dailyUvMax.push(Number((6.5 + Math.cos(d) * 1.2).toFixed(1)));
  }

  return {
    latitude: city.latitude,
    longitude: city.longitude,
    generationtime_ms: 0.12,
    utc_offset_seconds: 0,
    timezone: city.timezone || 'UTC',
    timezone_abbreviation: 'UTC',
    elevation: city.elevation || 35,
    current_units: {
      time: 'iso8601',
      interval: 'seconds',
      temperature_2m: '°C',
      relative_humidity_2m: '%',
      apparent_temperature: '°C',
      is_day: '',
      precipitation: 'mm',
      rain: 'mm',
      showers: 'mm',
      snowfall: 'cm',
      weather_code: 'wmo code',
      cloud_cover: '%',
      pressure_msl: 'hPa',
      surface_pressure: 'hPa',
      wind_speed_10m: 'km/h',
      wind_direction_10m: '°',
      wind_gusts_10m: 'km/h',
    },
    current: {
      time: now.toISOString().slice(0, 16),
      interval: 900,
      temperature_2m: baseTemp,
      relative_humidity_2m: isTropical ? 78 : 56,
      apparent_temperature: isTropical ? baseTemp + 2.4 : baseTemp - 1.2,
      is_day: 1,
      precipitation: 0.0,
      rain: 0.0,
      showers: 0.0,
      snowfall: 0.0,
      weather_code: isCold ? 3 : isTropical ? 2 : 1,
      cloud_cover: isCold ? 75 : 25,
      pressure_msl: 1014.2,
      surface_pressure: 1010.8,
      wind_speed_10m: 14.8,
      wind_direction_10m: 230,
      wind_gusts_10m: 22.4,
    },
    hourly_units: {
      time: 'iso8601',
      temperature_2m: '°C',
      relative_humidity_2m: '%',
      precipitation_probability: '%',
      weather_code: 'wmo code',
      wind_speed_10m: 'km/h',
      uv_index: '',
    },
    hourly: {
      time: hourlyTimes,
      temperature_2m: hourlyTemps,
      relative_humidity_2m: hourlyHumidity,
      precipitation_probability: hourlyRainProb,
      weather_code: hourlyCodes,
      wind_speed_10m: hourlyWind,
      uv_index: hourlyUv,
    },
    daily_units: {
      time: 'iso8601',
      weather_code: 'wmo code',
      temperature_2m_max: '°C',
      temperature_2m_min: '°C',
      apparent_temperature_max: '°C',
      apparent_temperature_min: '°C',
      sunrise: 'iso8601',
      sunset: 'iso8601',
      precipitation_sum: 'mm',
      precipitation_probability_max: '%',
      wind_speed_10m_max: 'km/h',
      uv_index_max: '',
    },
    daily: {
      time: dailyTimes,
      weather_code: dailyCodes,
      temperature_2m_max: dailyMax,
      temperature_2m_min: dailyMin,
      apparent_temperature_max: dailyMax,
      apparent_temperature_min: dailyMin,
      sunrise: dailySunrise,
      sunset: dailySunset,
      precipitation_sum: dailyPrecipSum,
      precipitation_probability_max: dailyPrecipProb,
      wind_speed_10m_max: dailyWindMax,
      uv_index_max: dailyUvMax,
    },
  };
}
