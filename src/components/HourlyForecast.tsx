import React, { useState } from 'react';
import { Clock, Droplets, Wind } from 'lucide-react';
import { WeatherApiResponse, TemperatureUnit, WindSpeedUnit } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';
import { formatTemperature, formatWindSpeed, formatTimeInZone } from '../utils/formatters';

interface HourlyForecastProps {
  weather: WeatherApiResponse;
  tempUnit: TemperatureUnit;
  windUnit: WindSpeedUnit;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({
  weather,
  tempUnit,
  windUnit,
}) => {
  const hourly = weather.hourly;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!hourly || !hourly.time || hourly.time.length === 0) {
    return null;
  }

  // Slice first 24 hours
  const hoursCount = Math.min(24, hourly.time.length);
  const times = hourly.time.slice(0, hoursCount);
  const temps = hourly.temperature_2m.slice(0, hoursCount);
  const rainProbs = hourly.precipitation_probability.slice(0, hoursCount);
  const codes = hourly.weather_code.slice(0, hoursCount);
  const winds = hourly.wind_speed_10m.slice(0, hoursCount);

  // SVG Chart calculation
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = Math.max(1, maxTemp - minTemp);
  const svgWidth = 800;
  const svgHeight = 120;
  const paddingX = 24;
  const paddingY = 24;

  const points = temps.map((t, idx) => {
    const x = paddingX + (idx / (hoursCount - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((t - minTemp) / tempRange) * (svgHeight - paddingY * 2);
    return { x, y, temp: t, time: times[idx] };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-sky-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            24-Hour Atmospheric Trajectory
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span>Range: {formatTemperature(minTemp, tempUnit)} – {formatTemperature(maxTemp, tempUnit)}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Hourly Step: 1h</span>
        </div>
      </div>

      {/* Interactive SVG Chart for 24h temperature curve */}
      <div className="relative mb-5 w-full overflow-hidden rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1 px-1">
          <span>Temperature Curve (°C/°F)</span>
          {hoverIndex !== null && (
            <span className="text-sky-300 font-semibold">
              {formatTimeInZone(times[hoverIndex], weather.timezone)}: {formatTemperature(temps[hoverIndex], tempUnit)} · Rain: {rainProbs[hoverIndex]}%
            </span>
          )}
        </div>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-28 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="hourlyTempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={areaD} fill="url(#hourlyTempGrad)" />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoverIndex === idx ? 5 : 2.5}
              className={`transition-all ${
                hoverIndex === idx
                  ? 'fill-white stroke-sky-400 stroke-2'
                  : 'fill-sky-400'
              }`}
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          ))}
        </svg>
      </div>

      {/* Horizontal Scroller Cards */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        {times.map((t, idx) => {
          const isSelected = hoverIndex === idx;
          const timeStr = formatTimeInZone(t, weather.timezone);
          const tempVal = temps[idx];
          const rainVal = rainProbs[idx];
          const windVal = winds[idx];
          const codeVal = codes[idx];

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
              className={`flex min-w-[90px] flex-col items-center justify-between rounded-xl p-3 border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-sky-500/10 border-sky-400/80 text-white shadow-md'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <span className="text-xs font-mono text-slate-400">{timeStr}</span>

              <div className="my-2">
                <WeatherIcon code={codeVal} className="h-6 w-6" />
              </div>

              <span className="text-base font-bold font-mono tabular-nums text-white">
                {formatTemperature(tempVal, tempUnit)}
              </span>

              <div className="mt-2 flex flex-col items-center gap-1 w-full text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-0.5 text-cyan-400">
                  <Droplets size={10} />
                  <span>{rainVal}%</span>
                </span>
                <span className="flex items-center gap-0.5 text-slate-400 text-[10px]">
                  <Wind size={9} />
                  <span>{formatWindSpeed(windVal, windUnit).split(' ')[0]}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
