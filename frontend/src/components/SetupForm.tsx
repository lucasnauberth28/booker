'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Setup } from '@/types';

interface SetupFormProps {
  setup?: Setup;
  onSuccess: () => void;
}

export function SetupForm({ setup, onSuccess }: SetupFormProps) {
  const [nome, setNome] = useState(setup?.nome || '');
  const [largura, setLargura] = useState(setup?.largura_polegadas || 8.5);
  const [altura, setAltura] = useState(setup?.altura_polegadas || 11);
  const [margem, setMargem] = useState(setup?.margem_seguranca || 0.125);
  const [paginasBranco, setPaginasBranco] = useState(setup?.inserir_paginas_em_branco_verso ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        nome,
        largura_polegadas: Number(largura),
        altura_polegadas: Number(altura),
        margem_seguranca: Number(margem),
        inserir_paginas_em_branco_verso: paginasBranco
      };
      if (setup) await api.setups.update(setup.id, data);
      else await api.setups.create(data);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar o setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
        <input type="text" required value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Largura (pol)</label>
          <input type="number" step="0.01" required value={largura} onChange={e => setLargura(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Altura (pol)</label>
          <input type="number" step="0.01" required value={altura} onChange={e => setAltura(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Margem de Segurança</label>
        <input type="number" step="0.001" required value={margem} onChange={e => setMargem(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
      </div>
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="branco" checked={paginasBranco} onChange={e => setPaginasBranco(e.target.checked)} className="rounded border-gray-300 text-indigo-600" />
        <label htmlFor="branco" className="text-sm font-medium text-gray-700">Inserir páginas em branco no verso</label>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
        {loading ? 'Salvando...' : 'Salvar Setup'}
      </button>
    </form>
  );
}
