'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { api } from '@/lib/api';
import { Book, Setup } from '@/types';

interface BookFormProps {
  book?: Book;
  onSuccess: (book: Book) => void;
}

export function BookForm({ book, onSuccess }: BookFormProps) {
  const { data: setups } = useSWR<Setup[]>('/setups', fetcher);
  
  const [titulo, setTitulo] = useState(book?.titulo || '');
  const [nicho, setNicho] = useState(book?.nicho || '');
  const [totalPaginas, setTotalPaginas] = useState(book?.total_paginas_desejadas || 50);
  const [setupId, setSetupId] = useState(book?.setup_id || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { titulo, nicho, total_paginas_desejadas: Number(totalPaginas), setup_id: Number(setupId) };
      const savedBook = book ? await api.books.update(book.id, data) : await api.books.create(data);
      onSuccess(savedBook);
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar o livro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input type="text" required value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nicho</label>
        <input type="text" required value={nicho} onChange={e => setNicho(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Total de Páginas Desejadas</label>
        <input type="number" required min="1" value={totalPaginas} onChange={e => setTotalPaginas(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Setup (Dimensões)</label>
        <select required value={setupId} onChange={e => setSetupId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option value="">Selecione um setup...</option>
          {setups?.map(s => (
            <option key={s.id} value={s.id}>{s.nome} ({s.largura_polegadas}x{s.altura_polegadas})</option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
        {loading ? 'Salvando...' : 'Salvar Livro'}
      </button>
    </form>
  );
}
