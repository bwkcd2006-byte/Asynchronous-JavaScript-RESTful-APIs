import {
  GeocodingResponse,
  GeocodingResult,
  WeatherApiResponse,
  ApiDiagnostics,
} from '../types/weather';
import { POPULAR_CITIES, generateSyntheticSnapshot } from '../data/fallbackCities';

export class WeatherApiError extends Error {
  public status?: number;
  public code: 'OFFLINE' | 'TIMEOUT' | 'NOT_FOUND' | 'RATE_LIMIT' | 'SERVER_ERROR' | 'PARSE_ERROR' | 'UNKNOWN';
  public userHint: string;
  public endpoint?: string;

  constructor(message: string, code: WeatherApiError['code'], status?: number, userHint?: string, endpoint?: string) {
    super(message);
    this.name = 'WeatherApiError';
    this.code = code;
    this.status = status;
    this.userHint = userHint || 'Please check your internet connection or try another query.';
    this.endpoint = endpoint;
  }
}

let latestDiagnostics: ApiDiagnostics | null = null;

export function getLatestApiDiagnostics(): ApiDiagnostics | null {
  return latestDiagnostics;
}

/**
 * Searches for cities using the Open-Meteo Geocoding REST API.
 * Uses modern fetch() with AbortController timeout & async/await.
 */
export async function searchCities(query: string, timeoutMs: number = 6000): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  // Pre-filter local popular list for instantaneous prefix match
  const localMatches = POPULAR_CITIES.filter((c) =>
    c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
    c.country.toLowerCase().includes(trimmed.toLowerCase())
  );

  const endpoint = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=10&language=en&format=json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = performance.now();

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      if (response.status === 429) {
        throw new WeatherApiError(
          'Geocoding API rate limit reached. Using offline directory.',
          'RATE_LIMIT',
          429,
          'Open-Meteo free quota reached. Please wait a moment or select a suggested city.',
          endpoint
        );
      }
      throw new WeatherApiError(
        `Geocoding server responded with HTTP ${response.status} (${response.statusText})`,
        'SERVER_ERROR',
        response.status,
        'The geocoding service experienced a temporary error. Try again shortly.',
        endpoint
      );
    }

    const data: GeocodingResponse = await response.json();

    latestDiagnostics = {
      url: endpoint,
      method: 'GET',
      status: response.status,
      statusText: response.statusText,
      latencyMs,
      timestamp: new Date().toISOString(),
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
      responsePayload: data,
    };

    if (!data.results || data.results.length === 0) {
      if (localMatches.length > 0) {
        return localMatches;
      }
      return [];
    }

    return data.results;
  } catch (err: any) {
    clearTimeout(timer);

    if (err instanceof WeatherApiError) {
      if (localMatches.length > 0) return localMatches;
      throw err;
    }

    if (err.name === 'AbortError') {
      if (localMatches.length > 0) return localMatches;
      throw new WeatherApiError(
        'Geocoding request timed out after ' + timeoutMs / 1000 + 's.',
        'TIMEOUT',
        408,
        'The location lookup took too long. Check your network or pick from popular cities.',
        endpoint
      );
    }

    // Network / offline failure
    if (!navigator.onLine || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      if (localMatches.length > 0) return localMatches;
      throw new WeatherApiError(
        'Network error: unable to connect to the geocoding service.',
        'OFFLINE',
        0,
        'Your device appears offline or the public geocoding API is unreachable. You can still view offline cities.',
        endpoint
      );
    }

    if (localMatches.length > 0) {
      return localMatches;
    }

    throw new WeatherApiError(
      err.message || 'Unknown geocoding error occurred.',
      'UNKNOWN',
      500,
      'Could not complete city search. Please try again.',
      endpoint
    );
  }
}

/**
 * Fetches comprehensive real-time weather and forecast data using Open-Meteo REST API.
 * Uses modern fetch() with AbortController timeout & async/await.
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number,
  timezone: string = 'auto',
  timeoutMs: number = 8000
): Promise<{ weather: WeatherApiResponse; latencyMs: number; requestUrl: string }> {
  const currentParams = [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'is_day',
    'precipitation',
    'rain',
    'showers',
    'snowfall',
    'weather_code',
    'cloud_cover',
    'pressure_msl',
    'surface_pressure',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
  ].join(',');

  const hourlyParams = [
    'temperature_2m',
    'relative_humidity_2m',
    'precipitation_probability',
    'weather_code',
    'wind_speed_10m',
    'uv_index',
  ].join(',');

  const dailyParams = [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'apparent_temperature_max',
    'apparent_temperature_min',
    'sunrise',
    'sunset',
    'precipitation_sum',
    'precipitation_probability_max',
    'wind_speed_10m_max',
    'uv_index_max',
  ].join(',');

  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${currentParams}&hourly=${hourlyParams}&daily=${dailyParams}&timezone=${encodeURIComponent(
    timezone || 'auto'
  )}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = performance.now();

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      if (response.status === 429) {
        throw new WeatherApiError(
          'Open-Meteo API rate limit reached (HTTP 429).',
          'RATE_LIMIT',
          429,
          'Too many requests to the weather service. Waiting a moment before retrying.',
          endpoint
        );
      }
      if (response.status >= 500) {
        throw new WeatherApiError(
          `Weather service server error (HTTP ${response.status}: ${response.statusText})`,
          'SERVER_ERROR',
          response.status,
          'The remote weather server is temporarily overloaded or undergoing maintenance.',
          endpoint
        );
      }
      throw new WeatherApiError(
        `Weather API error: HTTP ${response.status} ${response.statusText}`,
        'UNKNOWN',
        response.status,
        'Invalid weather parameters or unexpected API response.',
        endpoint
      );
    }

    const payload: WeatherApiResponse = await response.json();

    // Validate essential nested structures
    if (!payload.current || !payload.hourly || !payload.daily) {
      throw new WeatherApiError(
        'Malformed weather response: missing required nested blocks.',
        'PARSE_ERROR',
        200,
        'The received weather payload was incomplete.',
        endpoint
      );
    }

    latestDiagnostics = {
      url: endpoint,
      method: 'GET',
      status: response.status,
      statusText: response.statusText,
      latencyMs,
      timestamp: new Date().toISOString(),
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
      responsePayload: payload,
    };

    return {
      weather: payload,
      latencyMs,
      requestUrl: endpoint,
    };
  } catch (err: any) {
    clearTimeout(timer);

    if (err instanceof WeatherApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new WeatherApiError(
        `Weather request timed out after ${timeoutMs / 1000}s.`,
        'TIMEOUT',
        408,
        'The public weather server took too long to respond. Check network or click Retry.',
        endpoint
      );
    }

    if (!navigator.onLine || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      throw new WeatherApiError(
        'Failed to connect to Weather API: Network unavailable.',
        'OFFLINE',
        0,
        'Your connection is offline or network access is restricted. You can view offline snapshots.',
        endpoint
      );
    }

    throw new WeatherApiError(
      err.message || 'Failed to fetch weather data.',
      'UNKNOWN',
      500,
      'An unexpected error occurred while fetching meteorological data.',
      endpoint
    );
  }
}

/**
 * High-level orchestration: resolves city name to coordinates, then fetches real-time weather.
 */
export async function fetchWeatherForCity(
  cityName: string
): Promise<{ city: GeocodingResult; weather: WeatherApiResponse; latencyMs: number; requestUrl: string; source: 'live' | 'fallback' }> {
  try {
    const results = await searchCities(cityName);
    if (!results || results.length === 0) {
      throw new WeatherApiError(
        `No location found matching "${cityName}".`,
        'NOT_FOUND',
        404,
        'Please check spelling or search for another city (e.g., Tokyo, London, Paris, New York).'
      );
    }

    const city = results[0];
    const { weather, latencyMs, requestUrl } = await fetchWeatherData(city.latitude, city.longitude, city.timezone);

    return {
      city,
      weather,
      latencyMs,
      requestUrl,
      source: 'live',
    };
  } catch (err: any) {
    // If we have a local city preset matching the query, offer it as a graceful fallback
    const matchedPreset = POPULAR_CITIES.find(
      (c) => c.name.toLowerCase() === cityName.trim().toLowerCase()
    );

    if (matchedPreset) {
      const synthetic = generateSyntheticSnapshot(matchedPreset);
      return {
        city: matchedPreset,
        weather: synthetic,
        latencyMs: 12,
        requestUrl: 'internal://cache-fallback/' + matchedPreset.name.toLowerCase(),
        source: 'fallback',
      };
    }

    throw err;
  }
}
