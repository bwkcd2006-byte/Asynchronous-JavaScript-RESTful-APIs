import { TemperatureUnit, WindSpeedUnit, PressureUnit } from '../types/weather';

export function formatTemperature(celsius: number, unit: TemperatureUnit): string {
  if (celsius === undefined || celsius === null || isNaN(celsius)) return '--';
  if (unit === 'fahrenheit') {
    const f = (celsius * 9) / 5 + 32;
    return `${Math.round(f)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

export function formatTemperatureValue(celsius: number, unit: TemperatureUnit): number {
  if (celsius === undefined || celsius === null || isNaN(celsius)) return 0;
  if (unit === 'fahrenheit') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

export function formatWindSpeed(kmh: number, unit: WindSpeedUnit): string {
  if (kmh === undefined || kmh === null || isNaN(kmh)) return '--';
  switch (unit) {
    case 'mph':
      return `${(kmh * 0.621371).toFixed(1)} mph`;
    case 'ms':
      return `${(kmh / 3.6).toFixed(1)} m/s`;
    case 'kmh':
    default:
      return `${kmh.toFixed(1)} km/h`;
  }
}

export function formatPressure(hPa: number, unit: PressureUnit): string {
  if (hPa === undefined || hPa === null || isNaN(hPa)) return '--';
  if (unit === 'inHg') {
    return `${(hPa * 0.02953).toFixed(2)} inHg`;
  }
  return `${Math.round(hPa)} hPa`;
}

export function getWindDirectionLabel(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return directions[index] || 'N';
}

export function getBeaufortScale(kmh: number): { scale: number; description: string } {
  if (kmh < 1) return { scale: 0, description: 'Calm' };
  if (kmh <= 5) return { scale: 1, description: 'Light air' };
  if (kmh <= 11) return { scale: 2, description: 'Light breeze' };
  if (kmh <= 19) return { scale: 3, description: 'Gentle breeze' };
  if (kmh <= 28) return { scale: 4, description: 'Moderate breeze' };
  if (kmh <= 38) return { scale: 5, description: 'Fresh breeze' };
  if (kmh <= 49) return { scale: 6, description: 'Strong breeze' };
  if (kmh <= 61) return { scale: 7, description: 'High wind' };
  if (kmh <= 74) return { scale: 8, description: 'Gale' };
  if (kmh <= 88) return { scale: 9, description: 'Strong gale' };
  if (kmh <= 102) return { scale: 10, description: 'Storm' };
  if (kmh <= 117) return { scale: 11, description: 'Violent storm' };
  return { scale: 12, description: 'Hurricane force' };
}

export function getUvCategory(uv: number): { label: string; color: string; advice: string } {
  if (uv < 3) return { label: 'Low', color: 'text-emerald-400', advice: 'Minimal sun protection required' };
  if (uv < 6) return { label: 'Moderate', color: 'text-amber-400', advice: 'Wear sunglasses & SPF 30+' };
  if (uv < 8) return { label: 'High', color: 'text-orange-400', advice: 'Protection essential; seek shade mid-day' };
  if (uv < 11) return { label: 'Very High', color: 'text-red-400', advice: 'Extra protection needed; avoid midday sun' };
  return { label: 'Extreme', color: 'text-purple-400', advice: 'Take all precautions; skin burns in minutes' };
}

export function getHumidityComfort(humidity: number): { label: string; textClass: string } {
  if (humidity < 30) return { label: 'Dry air', textClass: 'text-amber-300' };
  if (humidity <= 60) return { label: 'Optimal comfort', textClass: 'text-emerald-400' };
  if (humidity <= 75) return { label: 'Humid', textClass: 'text-sky-300' };
  return { label: 'Very humid / stifling', textClass: 'text-blue-400' };
}

export function formatTimeInZone(isoString: string, timezone?: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    return isoString.split('T')[1]?.slice(0, 5) || isoString;
  }
}

export function formatDayOfWeek(isoDateString: string, timezone?: string): string {
  try {
    const date = new Date(isoDateString + 'T12:00:00');
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    return isoDateString;
  }
}

export function formatLocalFullDate(timezone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone || undefined,
    }).format(new Date());
  } catch {
    return new Date().toLocaleDateString();
  }
}

export function calculateDewPoint(celsius: number, humidity: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * celsius) / (b + celsius)) + Math.log(humidity / 100);
  return (b * alpha) / (a - alpha);
}
