import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X, History, Navigation } from 'lucide-react';
import { GeocodingResult } from '../types/weather';
import { searchCities } from '../services/weatherApi';
import { POPULAR_CITIES } from '../data/fallbackCities';

interface SearchBarProps {
  onSelectCity: (city: GeocodingResult) => void;
  isLoading: boolean;
  selectedCityName?: string;
  onUseLocation: () => void;
  isLocating: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectCity,
  isLoading,
  selectedCityName,
  onUseLocation,
  isLocating,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('atmosphere_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveRecentSearch = (name: string) => {
    try {
      const updated = [name, ...recentSearches.filter((s) => s.toLowerCase() !== name.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('atmosphere_recent_searches', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Debounced search query
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const hits = await searchCities(query);
        setResults(hits);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.warn('Autocomplete fetch failed:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(handler);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city: GeocodingResult) => {
    setQuery('');
    setIsOpen(false);
    setResults([]);
    saveRecentSearch(city.name);
    onSelectCity(city);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        // If query matches a result directly or we pick the first hit
        if (results.length > 0) {
          handleSelect(results[0]);
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full" ref={dropdownRef}>
      <div className="relative flex items-center gap-2">
        {/* Search Input Box */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            {isSearching || isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim().length >= 2 && results.length > 0) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={selectedCityName ? `Search city or coordinates (currently ${selectedCityName})...` : 'Search any city worldwide (e.g. Tokyo, London, Paris)...'}
            className="w-full rounded-xl bg-slate-900/90 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
              aria-label="Clear search input"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Use My Location Button */}
        <button
          onClick={onUseLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors shrink-0 disabled:opacity-50"
          title="Detect your current geographic location via GPS"
        >
          {isLocating ? (
            <Loader2 size={14} className="animate-spin text-sky-400" />
          ) : (
            <Navigation size={14} className="text-sky-400" />
          )}
          <span className="hidden sm:inline">Use Location</span>
        </button>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl p-1.5 shadow-2xl">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 border-b border-slate-800/60 flex items-center justify-between">
            <span>Global Geocoding Results</span>
            <span className="text-[11px] text-slate-400 font-mono">Use ↑↓ keys to navigate</span>
          </div>
          <div className="py-1">
            {results.map((item, idx) => (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg text-sm transition-colors ${
                  selectedIndex === idx
                    ? 'bg-sky-500/15 text-sky-200'
                    : 'text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MapPin size={15} className="text-slate-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-medium text-white">{item.name}</span>
                    {item.admin1 && (
                      <span className="text-xs text-slate-400 ml-1.5">
                        {item.admin1}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 ml-1.5">
                      · {item.country}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono shrink-0 pl-3">
                  <span>{item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°</span>
                  {item.country_code && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase font-semibold text-slate-300">
                      {item.country_code}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Access Popular Cities and Recent History Bar */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-400 font-medium mr-1 shrink-0">Popular:</span>
        {POPULAR_CITIES.slice(0, 6).map((city) => (
          <button
            key={city.id}
            onClick={() => onSelectCity(city)}
            className="rounded-lg bg-slate-900/60 px-2.5 py-1 text-slate-300 border border-slate-800/80 hover:bg-slate-800 hover:text-white hover:border-slate-700 transition-colors"
          >
            {city.name}
          </button>
        ))}

        {recentSearches.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 ml-auto text-slate-400">
            <History size={12} className="text-slate-400" />
            <span>Recent:</span>
            {recentSearches.slice(0, 3).map((term, i) => (
              <button
                key={i}
                onClick={async () => {
                  try {
                    const hits = await searchCities(term);
                    if (hits.length > 0) onSelectCity(hits[0]);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="text-slate-300 hover:text-sky-300 transition-colors underline decoration-slate-700 underline-offset-2"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
