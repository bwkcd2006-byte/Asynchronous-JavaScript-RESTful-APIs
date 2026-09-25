import React from 'react';
import { Calendar, Droplets, Wind, Sun } from 'lucide-react';
import { WeatherApiResponse, TemperatureUnit } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';
import { getWeatherCodeInfo } from '../utils/weatherCodes';
import { formatTemperature, formatDayOfWeek } from '../utils/formatters';

interface DailyForecastProps {
  weather: WeatherApiResponse;
  tempUnit: TemperatureUnit;
}

export const DailyForecast: React.FC<DailyForecastProps> = ({
  weather,
  tempUnit,
}) => {
  const daily = weather.daily;

  if (!daily || !daily.time || daily.time.length === 0) {
    return null;
  }

  const daysCount = Math.min(7, daily.time.length);
  const times = daily.time.slice(0, daysCount);
  const maxTemps = daily.temperature_2m_max.slice(0, daysCount);
  const minTemps = daily.temperature_2m_min.slice(0, daysCount);
  const codes = daily.weather_code.slice(0, daysCount);
  const precipSums = daily.precipitation_sum.slice(0, daysCount);
  const precipProbs = daily.precipitation_probability_max.slice(0, daysCount);
  const uvMaxs = daily.uv_index_max.slice(0, daysCount);

  // Overall min and max across all 7 days for relative bar rendering
  const globalMin = Math.min(...minTemps);
  const globalMax = Math.max(...maxTemps);
  const globalSpan = Math.max(1, globalMax - globalMin);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-sky-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            7-Day Synoptic Outlook
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Weekly Spectrum: {formatTemperature(globalMin, tempUnit)} to {formatTemperature(globalMax, tempUnit)}
        </span>
      </div>

      <div className="space-y-2">
        {times.map((dateStr, idx) => {
          const isToday = idx === 0;
          const dayTitle = isToday ? 'Today' : formatDayOfWeek(dateStr, weather.timezone);
          const code = codes[idx];
          const cond = getWeatherCodeInfo(code);
          const tMin = minTemps[idx];
          const tMax = maxTemps[idx];
          const pSum = precipSums[idx];
          const pProb = precipProbs[idx];
          const uv = uvMaxs[idx];

          // Normalized positions on 0-100% bar
          const leftPercent = ((tMin - globalMin) / globalSpan) * 100;
          const widthPercent = Math.max(8, ((tMax - tMin) / globalSpan) * 100);

          return (
            <div
              key={dateStr}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-3.5 border transition-colors ${
                isToday
                  ? 'bg-slate-800/60 border-slate-700/80 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/30'
              }`}
            >
              {/* Day title & Condition */}
              <div className="flex items-center gap-3 sm:w-56 shrink-0">
                <WeatherIcon code={code} className="h-6 w-6 shrink-0" />
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-slate-200'}`}>
                      {dayTitle}
                    </span>
                    {isToday && (
                      <span className="text-[10px] text-sky-400 font-mono uppercase tracking-wider font-semibold">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {cond.description}
                  </p>
                </div>
              </div>

              {/* Rain & UV telemetry */}
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 sm:w-44 shrink-0">
                <span className="flex items-center gap-1">
                  <Droplets size={12} className={pProb > 30 ? 'text-cyan-400' : 'text-slate-400'} />
                  <span className={pProb > 30 ? 'text-cyan-300 font-semibold' : 'text-slate-400'}>
                    {pProb}%
                  </span>
                  {pSum > 0 && <span className="text-[11px] text-slate-400">({pSum.toFixed(1)}mm)</span>}
                </span>
                <span className="flex items-center gap-1">
                  <Sun size={12} className="text-amber-400" />
                  <span>UV {uv.toFixed(1)}</span>
                </span>
              </div>

              {/* Min-Max Bar & Tabular values */}
              <div className="flex items-center gap-3 flex-1 sm:justify-end">
                <span className="text-xs font-mono tabular-nums text-slate-400 w-12 text-right">
                  {formatTemperature(tMin, tempUnit)}
                </span>

                {/* Relative Temperature Range Bar */}
                <div className="relative h-2 w-28 sm:w-36 rounded-full bg-slate-800 overflow-hidden shrink-0">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-400"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                  />
                </div>

                <span className="text-xs font-mono tabular-nums font-bold text-white w-12">
                  {formatTemperature(tMax, tempUnit)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
