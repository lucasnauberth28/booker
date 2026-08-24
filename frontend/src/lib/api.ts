import { Setup, Book, Prompt, ImageRecord } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  setups: {
    list: () => fetchApi<Setup[]>('/setups'),
    get: (id: number) => fetchApi<Setup>(`/setups/${id}`),
    create: (data: Partial<Setup>) => fetchApi<Setup>('/setups', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Setup>) => fetchApi<Setup>(`/setups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/setups/${id}`, { method: 'DELETE' }),
  },
  books: {
    list: (status?: string) => fetchApi<Book[]>(`/books${status ? `?status=${status}` : ''}`),
    get: (id: number) => fetchApi<Book>(`/books/${id}`),
    create: (data: Partial<Book>) => fetchApi<Book>('/books', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Book>) => fetchApi<Book>(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/books/${id}`, { method: 'DELETE' }),
    generate: (id: number) => fetchApi<{ message: string; total_images: number }>(`/books/${id}/generate`, { method: 'POST' }),
    generateCover: (id: number) => fetchApi<{ message: string; cover_image_url: string; book: Book }>(`/books/${id}/generate-cover`, { method: 'POST' }),
    compile: (id: number) => fetchApi<{ pdf_url: string }>(`/books/${id}/compile`, { method: 'POST' }),
  },
  prompts: {
    listByBook: (bookId: number) => fetchApi<Prompt[]>(`/books/${bookId}/prompts`),
    create: (bookId: number, data: Partial<Prompt>) => fetchApi<Prompt>(`/books/${bookId}/prompts`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Prompt>) => fetchApi<Prompt>(`/prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/prompts/${id}`, { method: 'DELETE' }),
  },
  images: {
    listByBook: (bookId: number) => fetchApi<ImageRecord[]>(`/books/${bookId}/images`),
    updateStatus: (id: number, status: 'approved' | 'rejected') => fetchApi<ImageRecord>(`/images/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    reorder: (bookId: number, images: { id: number; page_order: number }[]) => fetchApi<void>(`/books/${bookId}/images/reorder`, { method: 'POST', body: JSON.stringify({ images }) }),
    regenerate: (id: number) => fetchApi<{ message: string; image: ImageRecord }>(`/images/${id}/regenerate`, { method: 'POST' }),
    delete: (id: number) => fetchApi<{ message: string }>(`/images/${id}`, { method: 'DELETE' }),
  },
  usage: {
    summary: () => fetchApi<any>('/usage/summary'),
    book: (bookId: number) => fetchApi<any>(`/books/${bookId}/usage`),
  },
};
