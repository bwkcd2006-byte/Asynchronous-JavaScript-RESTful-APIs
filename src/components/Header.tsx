import React from 'react';
import { RefreshCw, Radio } from 'lucide-react';
import { TemperatureUnit, WindSpeedUnit } from '../types/weather';

interface HeaderProps {
  activeTab: 'overview' | 'hourly' | 'daily' | 'json';
  onSelectTab: (tab: 'overview' | 'hourly' | 'daily' | 'json') => void;
  tempUnit: TemperatureUnit;
  onToggleTempUnit: (unit: TemperatureUnit) => void;
  windUnit: WindSpeedUnit;
  onToggleWindUnit: (unit: WindSpeedUnit) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  isLive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  tempUnit,
  onToggleTempUnit,
  windUnit,
  onToggleWindUnit,
  isRefreshing,
  onRefresh,
  isLive,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element brand wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('overview');
            }}
            className="text-lg font-bold tracking-tight text-white hover:text-sky-400 transition-colors"
          >
            Atmosphere
          </a>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Radio
              size={12}
              className={isLive ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}
            />
            <span>{isLive ? 'Live API' : 'Cached Snapshot'}</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onSelectTab('overview')}
            className={`transition-colors hover:text-white ${
              activeTab === 'overview'
                ? 'text-white border-b-2 border-sky-400 pb-1 -mb-1 font-semibold'
                : ''
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectTab('hourly')}
            className={`transition-colors hover:text-white ${
              activeTab === 'hourly'
                ? 'text-white border-b-2 border-sky-400 pb-1 -mb-1 font-semibold'
                : ''
            }`}
          >
            24h Hourly
          </button>
          <button
            onClick={() => onSelectTab('daily')}
            className={`transition-colors hover:text-white ${
              activeTab === 'daily'
                ? 'text-white border-b-2 border-sky-400 pb-1 -mb-1 font-semibold'
                : ''
            }`}
          >
            7-Day Outlook
          </button>
          <button
            onClick={() => onSelectTab('json')}
            className={`transition-colors hover:text-white ${
              activeTab === 'json'
                ? 'text-white border-b-2 border-sky-400 pb-1 -mb-1 font-semibold'
                : ''
            }`}
          >
            REST API & JSON
          </button>
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Unit Toggle: Celsius / Fahrenheit */}
          <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => onToggleTempUnit('celsius')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                tempUnit === 'celsius'
                  ? 'bg-slate-800 text-sky-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Switch to Celsius"
            >
              °C
            </button>
            <button
              onClick={() => onToggleTempUnit('fahrenheit')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                tempUnit === 'fahrenheit'
                  ? 'bg-slate-800 text-sky-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Switch to Fahrenheit"
            >
              °F
            </button>
          </div>

          {/* Wind Unit Switcher */}
          <button
            onClick={() =>
              onToggleWindUnit(windUnit === 'kmh' ? 'mph' : windUnit === 'mph' ? 'ms' : 'kmh')
            }
            className="hidden sm:inline-flex items-center rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-300 border border-slate-800 hover:bg-slate-800/80 transition-colors"
            title="Toggle wind speed unit (km/h, mph, m/s)"
          >
            {windUnit === 'kmh' ? 'km/h' : windUnit === 'mph' ? 'mph' : 'm/s'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 p-2 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh live telemetry"
            aria-label="Refresh live data"
          >
            <RefreshCw
              size={15}
              className={isRefreshing ? 'animate-spin text-sky-400' : ''}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
