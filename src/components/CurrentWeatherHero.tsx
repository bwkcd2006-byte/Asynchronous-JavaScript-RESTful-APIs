import React from 'react';
import {
  MapPin,
  Clock,
  ArrowUp,
  ArrowDown,
  CloudRain,
  Eye,
  Activity,
  Layers,
} from 'lucide-react';
import { GeocodingResult, WeatherApiResponse, TemperatureUnit } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';
import { getWeatherCodeInfo } from '../utils/weatherCodes';
import { formatTemperature, formatLocalFullDate, formatTimeInZone } from '../utils/formatters';

interface CurrentWeatherHeroProps {
  city: GeocodingResult;
  weather: WeatherApiResponse;
  tempUnit: TemperatureUnit;
  latencyMs: number;
  source: 'live' | 'fallback';
}

export const CurrentWeatherHero: React.FC<CurrentWeatherHeroProps> = ({
  city,
  weather,
  tempUnit,
  latencyMs,
  source,
}) => {
  const current = weather.current;
  const condition = getWeatherCodeInfo(current.weather_code);
  const daily = weather.daily;

  const todayMax = daily?.temperature_2m_max?.[0] ?? current.temperature_2m + 2;
  const todayMin = daily?.temperature_2m_min?.[0] ?? current.temperature_2m - 3;
  const localTimeStr = formatTimeInZone(current.time, weather.timezone);
  const localDateStr = formatLocalFullDate(weather.timezone);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 p-6 md:p-8 backdrop-blur-xl">
      {/* Atmospheric subtle ambient glow */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            condition.category === 'clear'
              ? 'radial-gradient(circle, #f59e0b, transparent)'
              : condition.category === 'rain'
              ? 'radial-gradient(circle, #38bdf8, transparent)'
              : condition.category === 'thunderstorm'
              ? 'radial-gradient(circle, #a855f7, transparent)'
              : 'radial-gradient(circle, #94a3b8, transparent)',
        }}
      />

      <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        {/* Left: Location and Time */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
            <span className="flex items-center gap-1 text-sky-400">
              <MapPin size={14} />
              <span className="font-sans font-semibold text-slate-300">
                {city.latitude.toFixed(2)}°N, {city.longitude.toFixed(2)}°E
              </span>
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Alt: {city.elevation ?? weather.elevation ?? 0}m</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">{weather.timezone}</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              {city.name}
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-1">
              {[city.admin1, city.country].filter(Boolean).join(', ')}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock size={13} className="text-slate-400" />
            <span className="font-medium text-slate-300">{localDateStr}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono text-sky-300 font-semibold">{localTimeStr} local time</span>
          </div>
        </div>

        {/* Right: Weather Hero Numbers & Icon */}
        <div className="flex items-center gap-6 sm:gap-10 border-t border-slate-800/80 pt-6 lg:border-t-0 lg:pt-0">
          <div className="flex flex-col items-start lg:items-end">
            <div className="flex items-baseline gap-3">
              <span className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white font-mono tabular-nums">
                {formatTemperature(current.temperature_2m, tempUnit)}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 mt-1">
              <span>
                Feels like{' '}
                <strong className="text-white font-mono">
                  {formatTemperature(current.apparent_temperature, tempUnit)}
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <div className="flex items-center gap-1 font-mono text-emerald-400">
                <ArrowUp size={13} />
                <span>{formatTemperature(todayMax, tempUnit)}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-sky-400">
                <ArrowDown size={13} />
                <span>{formatTemperature(todayMin, tempUnit)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-400">
              <span className="capitalize text-sky-200 font-semibold text-sm">
                {condition.description}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Cloud cover {current.cloud_cover}%</span>
              {current.precipitation > 0 && (
                <>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-cyan-300 font-mono">
                    Precip: {current.precipitation} mm
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 shrink-0">
            <WeatherIcon
              code={current.weather_code}
              isDay={current.is_day}
              className="h-16 w-16 sm:h-20 sm:w-20"
            />
            <span className="text-[11px] font-mono text-slate-400 mt-2">
              WMO {current.weather_code}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Bar showing real API response metrics */}
      <div className="mt-6 pt-4 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-400">
            <Activity size={12} className="text-emerald-400" />
            <span>Response Latency:</span>
            <span className="text-emerald-400 tabular-nums font-semibold">{latencyMs}ms</span>
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            <Layers size={12} className="text-sky-400" />
            <span>Protocol:</span>
            <span className="text-slate-300">HTTPS / REST JSON</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>Data Provider:</span>
          <span className="text-slate-300">Open-Meteo European Weather Model</span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className={source === 'live' ? 'text-emerald-400' : 'text-amber-400'}>
            {source === 'live' ? 'Synchronized' : 'Offline Snapshot'}
          </span>
        </div>
      </div>
    </div>
  );
};
