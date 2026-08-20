'use client';

import React from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { api } from '@/lib/api';
import { ImageRecord } from '@/types';
import { ImageCard } from './ImageCard';

export function ImageGrid({ bookId }: { bookId: number }) {
  const { data: images, error, mutate } = useSWR<ImageRecord[]>(`/books/${bookId}/images`, fetcher, { refreshInterval: 5000 });

  if (error) return <div className="text-red-500">Erro ao carregar imagens.</div>;
  if (!images) return <div className="text-gray-500">Carregando imagens...</div>;

  const approved = images.filter(i => i.status === 'approved').length;
  const rejected = images.filter(i => i.status === 'rejected').length;
  const pending = images.filter(i => i.status === 'queued' || i.status === 'generating').length;

  const handleStatusChange = async (imageId: number, status: 'approved' | 'rejected') => {
    try {
      await api.images.updateStatus(imageId, status);
      mutate();
    } catch (e) {
      alert('Erro ao atualizar status');
    }
  };

  const handleBulkAction = async (status: 'approved' | 'rejected') => {
    if (!confirm(`Tem certeza que deseja marcar todas como ${status === 'approved' ? 'aprovadas' : 'rejeitadas'}?`)) return;
    try {
      await Promise.all(images.map(img => api.images.updateStatus(img.id, status)));
      mutate();
    } catch (e) {
      alert('Erro em ação em massa');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4 text-sm font-medium">
          <span className="text-green-600">Aprovadas: {approved}</span>
          <span className="text-red-600">Rejeitadas: {rejected}</span>
          <span className="text-yellow-600">Pendentes/Gerando: {pending}</span>
          <span className="text-gray-600">Total: {images.length}</span>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button onClick={() => handleBulkAction('approved')} className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-sm font-medium">Aprovar Todas</button>
          <button onClick={() => handleBulkAction('rejected')} className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-sm font-medium">Rejeitar Todas</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {images.map(img => (
          <ImageCard key={img.id} image={img} onStatusChange={(s) => handleStatusChange(img.id, s)} />
        ))}
        {images.length === 0 && <p className="col-span-full text-gray-500 py-8 text-center">Nenhuma imagem encontrada para este livro.</p>}
      </div>
    </div>
  );
}
