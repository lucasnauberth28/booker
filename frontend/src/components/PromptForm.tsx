'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

interface PromptFormProps {
  bookId: number;
  onSuccess: () => void;
}

export function PromptForm({ bookId, onSuccess }: PromptFormProps) {
  const [basePrompt, setBasePrompt] = useState('');
  const [styleModifiers, setStyleModifiers] = useState('');
  const [peso, setPeso] = useState(1.0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const modifiers = styleModifiers.split(',').map(s => s.trim()).filter(Boolean);
      await api.prompts.create(bookId, {
        base_prompt: basePrompt,
        style_modifiers: modifiers.length > 0 ? modifiers : null,
        peso_distribuicao: Number(peso)
      });
      setBasePrompt('');
      setStyleModifiers('');
      setPeso(1.0);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar o prompt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Base Prompt</label>
        <textarea required rows={3} value={basePrompt} onChange={e => setBasePrompt(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Ex: A cute unicorn coloring page..."></textarea>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style Modifiers (separados por vírgula)</label>
        <input type="text" value={styleModifiers} onChange={e => setStyleModifiers(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Ex: thick lines, pure white background, line art" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Peso de Distribuição ({peso})</label>
        <input type="range" min="0" max="1" step="0.1" value={peso} onChange={e => setPeso(Number(e.target.value))} className="w-full" />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
        {loading ? 'Salvando...' : 'Adicionar Prompt'}
      </button>
    </form>
  );
}
