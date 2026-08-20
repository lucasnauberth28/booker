'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

interface GenerateButtonProps {
  bookId: number;
  disabled?: boolean;
  onGenerated?: () => void;
}

export function GenerateButton({ bookId, disabled, onGenerated }: GenerateButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!confirm('Deseja iniciar a geração das imagens para este livro?')) return;
    
    setLoading(true);
    try {
      const res = await api.books.generate(bookId);
      alert(`Sucesso! ${res.total_images} imagens foram colocadas na fila.`);
      onGenerated?.();
    } catch (error) {
      console.error(error);
      alert('Erro ao iniciar a geração.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={disabled || loading}
      className="flex items-center justify-center space-x-2 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span>✨</span>
      <span>{loading ? 'Iniciando...' : 'Gerar Imagens'}</span>
    </button>
  );
}
