const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const fetcher = (url: string) =>
  fetch(`${API_BASE}${url}`, {
    headers: { 'Accept': 'application/json' },
  }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
