'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { api } from '@/lib/api';
import { Setup } from '@/types';
import { SetupForm } from '@/components/SetupForm';

export default function SetupsPage() {
  const { data: setups, mutate } = useSWR<Setup[]>('/setups', fetcher);
  const [showForm, setShowForm] = useState(false);
  const [editingSetup, setEditingSetup] = useState<Setup | undefined>();

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este setup?')) return;
    try {
      await api.setups.delete(id);
      mutate();
    } catch (e) {
      alert('Erro ao excluir setup');
    }
  };

  const handleEdit = (setup: Setup) => {
    setEditingSetup(setup);
    setShowForm(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Setups</h1>
        <button
          onClick={() => { setEditingSetup(undefined); setShowForm(!showForm); }}
          className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium"
        >
          {showForm ? 'Cancelar' : 'Novo Setup'}
        </button>
      </div>

      {showForm && (
        <div className="max-w-2xl">
          <SetupForm setup={editingSetup} onSuccess={() => { setShowForm(false); mutate(); }} />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Largura</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Altura</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margem</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Págs. em Branco</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {setups?.map(setup => (
              <tr key={setup.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{setup.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{setup.largura_polegadas}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{setup.altura_polegadas}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{setup.margem_seguranca}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{setup.inserir_paginas_em_branco_verso ? 'Sim' : 'Não'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(setup)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                  <button onClick={() => handleDelete(setup.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                </td>
              </tr>
            ))}
            {!setups?.length && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Nenhum setup encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
