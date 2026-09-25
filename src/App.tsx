/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  WeatherDashboardState,
  GeocodingResult,
  TemperatureUnit,
  WindSpeedUnit,
  PressureUnit,
} from './types/weather';
import { fetchWeatherData, WeatherApiError } from './services/weatherApi';
import { POPULAR_CITIES, generateSyntheticSnapshot } from './data/fallbackCities';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { CurrentWeatherHero } from './components/CurrentWeatherHero';
import { MetricsGrid } from './components/MetricsGrid';
import { HourlyForecast } from './components/HourlyForecast';
import { DailyForecast } from './components/DailyForecast';
import { JsonInspector } from './components/JsonInspector';
import { ErrorAlert } from './components/ErrorAlert';
import { Loader2, RefreshCw, Wifi } from 'lucide-react';

export default function App() {
  // Primary state
  const [activeCity, setActiveCity] = useState<GeocodingResult>(POPULAR_CITIES[0]); // Default to New York
  const [dashboardState, setDashboardState] = useState<WeatherDashboardState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [error, setError] = useState<Error | WeatherApiError | null>(null);

  // User preferences with localStorage persistence
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>(() => {
    return (localStorage.getItem('atmosphere_temp_unit') as TemperatureUnit) || 'celsius';
  });
  const [windUnit, setWindUnit] = useState<WindSpeedUnit>('kmh');
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>('hPa');
  const [activeTab, setActiveTab] = useState<'overview' | 'hourly' | 'daily' | 'json'>('overview');

  const activeCityRef = useRef(activeCity);
  activeCityRef.current = activeCity;

  // Persist temperature unit
  const handleToggleTempUnit = (unit: TemperatureUnit) => {
    setTempUnit(unit);
    localStorage.setItem('atmosphere_temp_unit', unit);
  };

  /**
   * Asynchronous fetch function using modern async/await and Fetch API
   */
  const loadWeatherData = useCallback(
    async (city: GeocodingResult, isBackgroundRefresh = false) => {
      if (isBackgroundRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const { weather, latencyMs, requestUrl } = await fetchWeatherData(
          city.latitude,
          city.longitude,
          city.timezone || 'auto'
        );

        setDashboardState({
          city,
          weather,
          fetchedAt: new Date(),
          source: 'live',
          latencyMs,
          requestUrl,
        });
      } catch (err: any) {
        console.error('Weather fetch error:', err);
        setError(err);

        // If network failed and we don't have current state, use resilient local snapshot
        setDashboardState((prev) => {
          if (prev) return prev;
          const fallbackSnapshot = generateSyntheticSnapshot(city);
          return {
            city,
            weather: fallbackSnapshot,
            fetchedAt: new Date(),
            source: 'fallback',
            latencyMs: 14,
            requestUrl: `internal://cache-fallback/${city.name.toLowerCase()}`,
          };
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    loadWeatherData(activeCity);
  }, [activeCity, loadWeatherData]);

  // City selection
  const handleSelectCity = (city: GeocodingResult) => {
    setActiveCity(city);
    setError(null);
  };

  // Browser Geolocation
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError(
        new WeatherApiError(
          'Geolocation is not supported by your browser.',
          'NOT_FOUND',
          undefined,
          'Please search for your city name in the search box.'
        )
      );
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const geoCity: GeocodingResult = {
          id: Date.now(),
          name: 'Current Location',
          latitude,
          longitude,
          country_code: '',
          country: 'Local Device Position',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto',
        };
        setActiveCity(geoCity);
      },
      (err) => {
        setIsLocating(false);
        let hint = 'Location permission was denied. You can still search for any city.';
        if (err.code === err.POSITION_UNAVAILABLE) {
          hint = 'Location information is unavailable on this device.';
        } else if (err.code === err.TIMEOUT) {
          hint = 'Location request timed out. Please try again or search by name.';
        }
        setError(
          new WeatherApiError(
            `Unable to retrieve device coordinates: ${err.message}`,
            'OFFLINE',
            undefined,
            hint
          )
        );
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // Retry action
  const handleRetry = () => {
    loadWeatherData(activeCityRef.current);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Bar Contract (3 zones) */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        tempUnit={tempUnit}
        onToggleTempUnit={handleToggleTempUnit}
        windUnit={windUnit}
        onToggleWindUnit={setWindUnit}
        isRefreshing={isRefreshing}
        onRefresh={() => loadWeatherData(activeCity, true)}
        isLive={dashboardState?.source === 'live'}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search & Location Bar */}
        <section aria-label="City Search">
          <SearchBar
            onSelectCity={handleSelectCity}
            isLoading={isLoading && !dashboardState}
            selectedCityName={activeCity.name}
            onUseLocation={handleUseLocation}
            isLocating={isLocating}
          />
        </section>

        {/* Network & Error Alert */}
        {error && (
          <section aria-label="Error Alert">
            <ErrorAlert
              error={error}
              onRetry={handleRetry}
              isRetrying={isLoading || isRefreshing}
              onSelectFallbackCity={handleSelectCity}
            />
          </section>
        )}

        {/* Loading Skeleton */}
        {isLoading && !dashboardState && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
            <p className="text-sm font-medium">
              Fetching real-time atmospheric telemetry via Open-Meteo REST API...
            </p>
          </div>
        )}

        {/* Weather Content Sections */}
        {dashboardState && (
          <>
            {/* 1. Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Hero Anchor */}
                <CurrentWeatherHero
                  city={dashboardState.city}
                  weather={dashboardState.weather}
                  tempUnit={tempUnit}
                  latencyMs={dashboardState.latencyMs}
                  source={dashboardState.source}
                />

                {/* Core Atmospheric Metrics Grid */}
                <MetricsGrid
                  weather={dashboardState.weather}
                  tempUnit={tempUnit}
                  windUnit={windUnit}
                  pressureUnit={pressureUnit}
                  onTogglePressureUnit={setPressureUnit}
                />

                {/* 24-Hour Forecast preview */}
                <HourlyForecast
                  weather={dashboardState.weather}
                  tempUnit={tempUnit}
                  windUnit={windUnit}
                />

                {/* 7-Day Synoptic Outlook preview */}
                <DailyForecast
                  weather={dashboardState.weather}
                  tempUnit={tempUnit}
                />
              </div>
            )}

            {/* 2. Hourly Tab */}
            {activeTab === 'hourly' && (
              <div className="space-y-6">
                <HourlyForecast
                  weather={dashboardState.weather}
                  tempUnit={tempUnit}
                  windUnit={windUnit}
                />
                <MetricsGrid
                  weather={dashboardState.weather}
                  tempUnit={tempUnit}
                  windUnit={windUnit}
                  pressureUnit={pressureUnit}
                  onTogglePressureUnit={setPressureUnit}
                />
              </div>
            )}

            {/* 3. 7-Day Daily Tab */}
            {activeTab === 'daily' && (
              <div className="space-y-6">
                <DailyForecast
                  weather={dashboardState.weather}
                  tempUnit={tempUnit}
                />
                <HourlyForecast
                  weather={dashboardState.weather}
                  tempUnit={tempUnit}
                  windUnit={windUnit}
                />
              </div>
            )}

            {/* 4. REST API & JSON Inspector Tab */}
            {activeTab === 'json' && (
              <div className="space-y-6">
                <JsonInspector dashboardState={dashboardState} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Atmosphere Telemetry</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>Real-time REST data via Open-Meteo & WMO Meteorological Standards</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>Client Engine: Modern Fetch API + Async/Await</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>WCAG AA Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
