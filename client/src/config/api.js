// Production: set VITE_API_URL in Vercel to your Render backend URL (e.g. https://your-app.onrender.com)
// Development: falls back to localhost:3001 if not set
const raw = import.meta.env.VITE_API_URL;
const devFallback = 'http://localhost:3001';
export const API_BASE_URL =
  typeof raw === 'string' && raw.trim() !== ''
    ? raw.replace(/\/+$/, '') // strip trailing slashes
    : import.meta.env.DEV
      ? devFallback
      : '';
