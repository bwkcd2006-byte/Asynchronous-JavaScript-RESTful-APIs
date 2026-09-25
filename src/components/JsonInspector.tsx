import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  Terminal,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { WeatherDashboardState, ApiDiagnostics } from '../types/weather';
import { getLatestApiDiagnostics } from '../services/weatherApi';

interface JsonInspectorProps {
  dashboardState: WeatherDashboardState;
}

export const JsonInspector: React.FC<JsonInspectorProps> = ({ dashboardState }) => {
  const [copied, setCopied] = useState(false);
  const [filterKey, setFilterKey] = useState('');
  const [collapsedKeys, setCollapsedKeys] = useState<Record<string, boolean>>({
    hourly: true, // collapse large 168-element arrays by default for neat rendering
  });

  const diagnostics: ApiDiagnostics | null = getLatestApiDiagnostics();
  const jsonPayload = dashboardState.weather;
  const payloadString = JSON.stringify(jsonPayload, null, 2);
  const payloadSizeKb = (new Blob([payloadString]).size / 1024).toFixed(2);

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([payloadString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-telemetry-${dashboardState.city.name.toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleCollapse = (key: string) => {
    setCollapsedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // High-level top-level keys
  const topKeys = Object.keys(jsonPayload);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 md:p-6 backdrop-blur-md space-y-6">
      {/* Header and API Diagnostics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              REST API & Asynchronous Fetch Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Raw nested JSON response retrieved using modern{' '}
            <code className="text-sky-300 font-mono">window.fetch()</code> with{' '}
            <code className="text-sky-300 font-mono">async/await</code> and AbortController signal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy JSON</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Download size={14} />
            <span>Download .json</span>
          </button>
        </div>
      </div>

      {/* Network Request Metadata Card */}
      <div className="rounded-xl bg-slate-950/70 p-4 border border-slate-800/80 space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 font-bold uppercase text-[10px]">
              {diagnostics?.method || 'GET'}
            </span>
            <span className="text-slate-200 font-semibold">
              Status {diagnostics?.status || 200} OK
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Latency: <strong className="text-emerald-400">{dashboardState.latencyMs}ms</strong></span>
            <span>·</span>
            <span>Payload: <strong className="text-sky-300">{payloadSizeKb} KB</strong></span>
            <span>·</span>
            <span>Target: <strong className="text-slate-200">{dashboardState.city.name}</strong></span>
          </div>
        </div>

        <div>
          <span className="text-slate-400 text-[11px] block mb-1">Request Endpoint:</span>
          <div className="flex items-center justify-between gap-2 rounded bg-slate-900/90 p-2 text-slate-300 border border-slate-800 text-[11px] break-all select-all">
            <span>{dashboardState.requestUrl}</span>
            <a
              href={dashboardState.requestUrl.startsWith('http') ? dashboardState.requestUrl : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 shrink-0 p-1"
              title="Open raw API response in new tab"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* JSON Search and Structure Explorer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={filterKey}
              onChange={(e) => setFilterKey(e.target.value)}
              placeholder="Filter keys in JSON (e.g. current, hourly, temperature)..."
              className="w-full rounded-lg bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-400 border border-slate-800 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {topKeys.length} top-level nodes
          </span>
        </div>

        {/* Formatted JSON tree viewer */}
        <div className="max-h-[500px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
          {topKeys
            .filter((key) => !filterKey || key.toLowerCase().includes(filterKey.toLowerCase()))
            .map((key) => {
              const val = (jsonPayload as any)[key];
              const isObject = typeof val === 'object' && val !== null;
              const isArray = Array.isArray(val);
              const isCollapsed = collapsedKeys[key];

              return (
                <div key={key} className="mb-2 border-b border-slate-900/80 pb-2">
                  <div
                    onClick={() => isObject && toggleCollapse(key)}
                    className={`flex items-center gap-2 select-none ${
                      isObject ? 'cursor-pointer hover:text-sky-300' : ''
                    }`}
                  >
                    {isObject ? (
                      isCollapsed ? (
                        <ChevronRight size={14} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={14} className="text-sky-400" />
                      )
                    ) : (
                      <span className="w-3.5" />
                    )}

                    <span className="text-purple-400 font-semibold">"{key}"</span>
                    <span className="text-slate-400">:</span>

                    {isObject ? (
                      <span className="text-slate-400 text-[11px]">
                        {isArray ? `Array(${val.length})` : `Object(${Object.keys(val).length} fields)`}
                        {isCollapsed && ' { ... }'}
                      </span>
                    ) : (
                      <span
                        className={
                          typeof val === 'number'
                            ? 'text-amber-300'
                            : typeof val === 'boolean'
                            ? 'text-rose-400'
                            : 'text-emerald-300'
                        }
                      >
                        {JSON.stringify(val)}
                      </span>
                    )}
                  </div>

                  {isObject && !isCollapsed && (
                    <div className="pl-6 pt-1.5 text-slate-300">
                      <pre className="text-[11px] text-slate-300 whitespace-pre-wrap break-all overflow-x-auto">
                        {JSON.stringify(val, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
