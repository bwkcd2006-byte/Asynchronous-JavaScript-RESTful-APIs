import React from 'react';
import {
  Droplets,
  Wind,
  Compass,
  Gauge,
  Sun,
  Cloud,
  Sunrise,
  Sunset,
  CloudRain,
  Thermometer,
} from 'lucide-react';
import {
  WeatherApiResponse,
  TemperatureUnit,
  WindSpeedUnit,
  PressureUnit,
} from '../types/weather';
import {
  formatTemperature,
  formatWindSpeed,
  formatPressure,
  getWindDirectionLabel,
  getBeaufortScale,
  getUvCategory,
  getHumidityComfort,
  calculateDewPoint,
  formatTimeInZone,
} from '../utils/formatters';

interface MetricsGridProps {
  weather: WeatherApiResponse;
  tempUnit: TemperatureUnit;
  windUnit: WindSpeedUnit;
  pressureUnit: PressureUnit;
  onTogglePressureUnit: (unit: PressureUnit) => void;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  weather,
  tempUnit,
  windUnit,
  pressureUnit,
  onTogglePressureUnit,
}) => {
  const current = weather.current;
  const daily = weather.daily;

  const humidity = current.relative_humidity_2m;
  const humidityInfo = getHumidityComfort(humidity);
  const dewPoint = calculateDewPoint(current.temperature_2m, humidity);

  const windSpeed = current.wind_speed_10m;
  const windDir = current.wind_direction_10m;
  const windDirLabel = getWindDirectionLabel(windDir);
  const beaufort = getBeaufortScale(windSpeed);

  const uvToday = daily?.uv_index_max?.[0] ?? 4.5;
  const uvCategory = getUvCategory(uvToday);

  const sunriseIso = daily?.sunrise?.[0];
  const sunsetIso = daily?.sunset?.[0];
  const sunriseTime = sunriseIso ? formatTimeInZone(sunriseIso, weather.timezone) : '--:--';
  const sunsetTime = sunsetIso ? formatTimeInZone(sunsetIso, weather.timezone) : '--:--';

  // Calculate daylight progress if possible
  let daylightPercentage = 50;
  if (sunriseIso && sunsetIso) {
    const rise = new Date(sunriseIso).getTime();
    const set = new Date(sunsetIso).getTime();
    const now = new Date().getTime();
    if (now <= rise) daylightPercentage = 0;
    else if (now >= set) daylightPercentage = 100;
    else daylightPercentage = Math.round(((now - rise) / (set - rise)) * 100);
  }

  const precipSum = daily?.precipitation_sum?.[0] ?? current.precipitation;
  const precipProb = daily?.precipitation_probability_max?.[0] ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Humidity & Dew Point */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Relative Humidity
          </span>
          <Droplets size={16} className="text-sky-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tabular-nums text-white">
            {humidity}%
          </span>
          <span className={`text-xs font-medium ${humidityInfo.textClass}`}>
            {humidityInfo.label}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, humidity))}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Dew point</span>
          <span className="text-slate-200">
            {formatTemperature(dewPoint, tempUnit)}
          </span>
        </div>
      </div>

      {/* 2. Wind & Direction */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Wind & Gusts
          </span>
          <Wind size={16} className="text-teal-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tabular-nums text-white">
            {formatWindSpeed(windSpeed, windUnit)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-1 font-mono text-teal-300">
            <Compass
              size={14}
              style={{ transform: `rotate(${windDir}deg)` }}
              className="transition-transform duration-700"
            />
            <span>{windDirLabel} ({windDir}°)</span>
          </div>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{beaufort.description}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono border-t border-slate-800/80 pt-2">
          <span>Peak gusts</span>
          <span className="text-slate-200">
            {formatWindSpeed(current.wind_gusts_10m, windUnit)}
          </span>
        </div>
      </div>

      {/* 3. Barometric Pressure */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Air Pressure
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onTogglePressureUnit(pressureUnit === 'hPa' ? 'inHg' : 'hPa')}
              className="text-[10px] text-sky-400 hover:text-sky-300 underline font-mono"
              title="Switch pressure unit"
            >
              {pressureUnit}
            </button>
            <Gauge size={16} className="text-indigo-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tabular-nums text-white">
            {formatPressure(current.pressure_msl, pressureUnit)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {current.pressure_msl > 1013
            ? 'High pressure system (stable atmospheric conditions)'
            : 'Low pressure system (increased storm potential)'}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono border-t border-slate-800/80 pt-2">
          <span>Surface pressure</span>
          <span className="text-slate-200">
            {formatPressure(current.surface_pressure, pressureUnit)}
          </span>
        </div>
      </div>

      {/* 4. UV Index */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            UV Index Max
          </span>
          <Sun size={16} className="text-amber-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tabular-nums text-white">
            {uvToday.toFixed(1)}
          </span>
          <span className={`text-xs font-semibold ${uvCategory.color}`}>
            {uvCategory.label}
          </span>
        </div>
        {/* UV meter */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-purple-500 rounded-full"
            style={{ width: `${Math.min(100, (uvToday / 12) * 100)}%` }}
          />
        </div>
        <p className="mt-2.5 text-xs text-slate-400 line-clamp-1">
          {uvCategory.advice}
        </p>
      </div>

      {/* 5. Cloud Cover */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cloud Cover
          </span>
          <Cloud size={16} className="text-slate-300" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tabular-nums text-white">
            {current.cloud_cover}%
          </span>
          <span className="text-xs text-slate-400">
            {current.cloud_cover < 20
              ? 'Clear sky'
              : current.cloud_cover < 60
              ? 'Scattered clouds'
              : 'Overcast'}
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-slate-400 rounded-full"
            style={{ width: `${current.cloud_cover}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Sky visibility</span>
          <span className="text-slate-200">
            {100 - current.cloud_cover}% clear
          </span>
        </div>
      </div>

      {/* 6. Sunrise & Sunset */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Solar Cycle
          </span>
          <Sunrise size={16} className="text-amber-400" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sunrise size={12} className="text-amber-300" /> Rise
            </span>
            <span className="text-lg font-bold font-mono text-white">
              {sunriseTime}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sunset size={12} className="text-orange-400" /> Set
            </span>
            <span className="text-lg font-bold font-mono text-white">
              {sunsetTime}
            </span>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-amber-400 rounded-full"
            style={{ width: `${daylightPercentage}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Daylight progress</span>
          <span>{daylightPercentage}%</span>
        </div>
      </div>

      {/* 7. Precipitation & Rainfall */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Precipitation
          </span>
          <CloudRain size={16} className="text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tabular-nums text-white">
            {precipSum.toFixed(1)}
            <span className="text-base text-slate-400 ml-1">mm</span>
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {precipProb > 0
            ? `${precipProb}% maximum probability today`
            : 'Zero precipitation expected today'}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono border-t border-slate-800/80 pt-2">
          <span>Current rate</span>
          <span className="text-cyan-300 font-semibold">
            {current.precipitation} mm/h
          </span>
        </div>
      </div>

      {/* 8. Thermal Comfort Index */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Thermal Index
          </span>
          <Thermometer size={16} className="text-rose-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tabular-nums text-white">
            {formatTemperature(current.apparent_temperature, tempUnit)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Delta of{' '}
          <strong className="text-slate-200 font-mono">
            {Math.abs(current.apparent_temperature - current.temperature_2m).toFixed(1)}°
          </strong>{' '}
          from air temperature
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono border-t border-slate-800/80 pt-2">
          <span>Air State</span>
          <span className="text-slate-200">
            {current.is_day ? 'Daylight cycle' : 'Night cycle'}
          </span>
        </div>
      </div>
    </div>
  );
};
