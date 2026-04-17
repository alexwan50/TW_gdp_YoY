
// Centralized state management with localStorage persistence
import { GDP_YOY_DATA } from './gdpData.js';

const STORAGE_KEY = 'sovereign-analyst-config';
const GDP_STORAGE_KEY = 'sovereign-analyst-gdp';

const DEFAULT_CONFIG = {
  indices: {
    sp500: true,
    taiex: false,
    vix: true,
    sox: false,
  },
  indicators: {
    rsi: true,
    ma: false,
  },
  macro: {
    interestRate: true,
    inflation: false,
  },
};

let _config = null;

export function getConfig() {
  if (_config) return _config;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      _config = JSON.parse(saved);
      return _config;
    }
  } catch (e) {
    // ignore
  }
  _config = structuredClone(DEFAULT_CONFIG);
  return _config;
}

export function saveConfig(config) {
  _config = config;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function resetConfig() {
  _config = structuredClone(DEFAULT_CONFIG);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_config));
  return _config;
}

export function getDefaults() {
  return structuredClone(DEFAULT_CONFIG);
}

/** 
 * Returns the GDP data array. 
 * Checks localStorage first for user-uploaded data, falls back to static gdpData.js.
 */
export function getGdpData() {
  try {
    const saved = localStorage.getItem(GDP_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      // VALIDATION: Ensure data has same length as default and is not truncated/null-filled
      if (Array.isArray(data) && data.length >= GDP_YOY_DATA.length) {
        const lastFew = data.slice(-4);
        const hasForecast = lastFew.some(v => v !== null && v !== undefined);
        if (hasForecast) return data;
      }
      console.warn('Stored GDP data is invalid or missing forecast, using default.');
    }
  } catch (e) {
    console.warn('Failed to load custom GDP data', e);
  }
  return GDP_YOY_DATA;
}

/** Saves custom GDP data points to localStorage */
export function saveCustomGdpData(data) {
  if (!Array.isArray(data)) return;
  localStorage.setItem(GDP_STORAGE_KEY, JSON.stringify(data));
}

/** Clears custom GDP data and reverts to default */
export function clearCustomGdpData() {
  localStorage.removeItem(GDP_STORAGE_KEY);
}
