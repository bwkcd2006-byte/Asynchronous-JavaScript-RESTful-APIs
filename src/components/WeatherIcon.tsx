import React from 'react';
import {
  Sun,
  SunDim,
  Cloud,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Snowflake,
} from 'lucide-react';
import { getWeatherCodeInfo } from '../utils/weatherCodes';

interface WeatherIconProps {
  code: number;
  isDay?: number;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  code,
  isDay = 1,
  className = 'w-6 h-6',
  size,
}) => {
  const info = getWeatherCodeInfo(code);

  const props = {
    className,
    size,
  };

  switch (info.icon) {
    case 'Sun':
      return isDay ? (
        <Sun {...props} className={`${props.className} text-amber-400`} />
      ) : (
        <SunDim {...props} className={`${props.className} text-indigo-300`} />
      );
    case 'SunDim':
      return <SunDim {...props} className={`${props.className} text-amber-300`} />;
    case 'CloudSun':
      return <CloudSun {...props} className={`${props.className} text-sky-300`} />;
    case 'Cloud':
      return <Cloud {...props} className={`${props.className} text-slate-300`} />;
    case 'CloudFog':
      return <CloudFog {...props} className={`${props.className} text-teal-300`} />;
    case 'CloudDrizzle':
      return <CloudDrizzle {...props} className={`${props.className} text-cyan-400`} />;
    case 'CloudRain':
      return <CloudRain {...props} className={`${props.className} text-blue-400`} />;
    case 'CloudSnow':
      return <CloudSnow {...props} className={`${props.className} text-sky-200`} />;
    case 'Snowflake':
      return <Snowflake {...props} className={`${props.className} text-sky-100`} />;
    case 'CloudLightning':
      return <CloudLightning {...props} className={`${props.className} text-amber-400`} />;
    default:
      return <Cloud {...props} className={`${props.className} text-slate-400`} />;
  }
};
