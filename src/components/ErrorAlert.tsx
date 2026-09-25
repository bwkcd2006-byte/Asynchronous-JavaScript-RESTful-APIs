import React from 'react';
import {
  AlertTriangle,
  WifiOff,
  Clock,
  SearchX,
  ServerCrash,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { WeatherApiError } from '../services/weatherApi';
import { POPULAR_CITIES } from '../data/fallbackCities';
import { GeocodingResult } from '../types/weather';

interface ErrorAlertProps {
  error: Error | WeatherApiError;
  onRetry: () => void;
  isRetrying: boolean;
  onSelectFallbackCity: (city: GeocodingResult) => void;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onRetry,
  isRetrying,
  onSelectFallbackCity,
}) => {
  const isApiError = error instanceof WeatherApiError;
  const errorCode = isApiError ? error.code : 'UNKNOWN';
  const userHint = isApiError ? error.userHint : 'Please check your connection and try again.';
  const endpoint = isApiError ? error.endpoint : undefined;

  const getErrorIcon = () => {
    switch (errorCode) {
      case 'OFFLINE':
        return <WifiOff className="h-6 w-6 text-rose-400" />;
      case 'TIMEOUT':
        return <Clock className="h-6 w-6 text-amber-400" />;
      case 'NOT_FOUND':
        return <SearchX className="h-6 w-6 text-sky-400" />;
      case 'SERVER_ERROR':
      case 'RATE_LIMIT':
        return <ServerCrash className="h-6 w-6 text-rose-400" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-amber-400" />;
    }
  };

  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 backdrop-blur-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800 shrink-0">
            {getErrorIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase font-mono text-rose-300">
                {errorCode}
              </span>
              <h3 className="text-base font-bold text-white">
                {error.message || 'Network Request Interrupted'}
              </h3>
            </div>
            <p className="mt-1 text-sm text-slate-300">
              {userHint}
            </p>
            {endpoint && (
              <p className="mt-1 text-xs font-mono text-slate-500 break-all">
                Target: {endpoint}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-rose-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
            <span>{isRetrying ? 'Retrying fetch...' : 'Retry Request'}</span>
          </button>
        </div>
      </div>

      {/* Suggested Resilient Fallback Options */}
      <div className="mt-5 border-t border-rose-900/40 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Sparkles size={13} className="text-amber-400" />
          <span>Or load resilient telemetry for:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {POPULAR_CITIES.slice(0, 4).map((city) => (
            <button
              key={city.id}
              onClick={() => onSelectFallbackCity(city)}
              className="rounded-lg bg-slate-900/80 px-2.5 py-1 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
