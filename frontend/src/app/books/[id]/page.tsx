'use client';

import React, { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { api } from '@/lib/api';
import { Book, Prompt } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PromptForm } from '@/components/PromptForm';
import { GenerateButton } from '@/components/GenerateButton';

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bookId = Number(resolvedParams.id);
  const { data: book, mutate: mutateBook } = useSWR<Book>(`/books/${bookId}`, fetcher);
  const { data: prompts, mutate: mutatePrompts } = useSWR<Prompt[]>(`/books/${bookId}/prompts`, fetcher);

  if (!book) return <div>Carregando...</div>;

  const handleDeletePrompt = async (id: number) => {
    if (!confirm('Deseja excluir este prompt?')) return;
    try {
      await api.prompts.delete(id);
      mutatePrompts();
    } catch (e) {
      alert('Erro ao excluir prompt');
    }
  };

  const hasPrompts = prompts && prompts.length > 0;
  const isGenerating = book.status === 'generating';
  const hasApprovedImages = (book.images_count?.approved || 0) > 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold">{book.titulo}</h1>
            <StatusBadge status={book.status} />
          </div>
          <p className="text-gray-500">Nicho: {book.nicho} | Setup: {book.setup?.nome} ({book.setup?.largura_polegadas}x{book.setup?.altura_polegadas})</p>
        </div>
        
        <div className="flex gap-4">
          <GenerateButton bookId={book.id} disabled={!hasPrompts || isGenerating} onGenerated={() => mutateBook()} />
          <Link href={`/books/${book.id}/curate`} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium">
            Curadoria
          </Link>
          <Link 
            href={`/books/${book.id}/compile`} 
            className={`px-4 py-2 rounded-lg font-medium ${hasApprovedImages ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none'}`}
          >
            Compilar PDF
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-sm font-medium text-gray-500">Meta de Páginas</p>
          <p className="text-2xl font-bold mt-1">{book.total_paginas_desejadas}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-sm font-medium text-green-600">Aprovadas</p>
          <p className="text-2xl font-bold mt-1">{book.images_count?.approved || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-sm font-medium text-red-600">Rejeitadas</p>
          <p className="text-2xl font-bold mt-1">{book.images_count?.rejected || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-sm font-medium text-yellow-600">Na Fila / Gerando</p>
          <p className="text-2xl font-bold mt-1">{(book.images_count?.queued || 0) + (book.images_count?.generating || 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold">Prompts</h2>
          <div className="space-y-4">
            {prompts?.map(prompt => (
              <div key={prompt.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-2">{prompt.base_prompt}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {prompt.style_modifiers?.map((mod, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">{mod}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Peso:</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${prompt.peso_distribuicao * 100}%` }}></div>
                    </div>
                    <span className="text-xs font-medium">{prompt.peso_distribuicao}</span>
                  </div>
                </div>
                <button onClick={() => handleDeletePrompt(prompt.id)} className="text-red-500 hover:text-red-700 h-fit">Excluir</button>
              </div>
            ))}
            {prompts?.length === 0 && (
              <p className="text-gray-500 italic">Nenhum prompt adicionado. Adicione um prompt para poder gerar imagens.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6">Adicionar Prompt</h2>
          <PromptForm bookId={bookId} onSuccess={() => mutatePrompts()} />
        </div>
      </div>
    </div>
  );
}
