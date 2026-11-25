const appBase = (import.meta.env.VITE_APP_BASE || "/").replace(/\/$/, "") || "/";

export const APP_BASE_URL = appBase === "/" ? "/" : `${appBase}/`;
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${appBase}/api`;
export const API_ORIGIN_URL =
  import.meta.env.VITE_API_BASE_URLS || `${appBase}/`;

