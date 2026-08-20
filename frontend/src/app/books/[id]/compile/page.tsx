'use client';

import React, { use, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { api } from '@/lib/api';
import { Book } from '@/types';

export default function CompilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bookId = Number(resolvedParams.id);
  const { data: book } = useSWR<Book>(`/books/${bookId}`, fetcher);
  
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  if (!book) return <div>Carregando...</div>;

  const approvedImages = book.images_count?.approved || 0;
  const insertBlank = book.setup?.inserir_paginas_em_branco_verso;
  const estimatedPages = insertBlank ? approvedImages * 2 : approvedImages;

  const handleCompile = async () => {
    setLoading(true);
    setPdfUrl(null);
    try {
      const res = await api.books.compile(bookId);
      setPdfUrl(res.pdf_url);
    } catch (e) {
      alert('Erro ao compilar o PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href={`/books/${bookId}`} className="hover:text-indigo-600">Voltar ao Livro</Link>
      </div>

      <h1 className="text-3xl font-bold">Compilar PDF - {book.titulo}</h1>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <h2 className="text-xl font-bold border-b pb-4">Resumo da Compilação</h2>
        
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Setup / Dimensões</p>
            <p className="font-medium text-gray-900">{book.setup?.nome} ({book.setup?.largura_polegadas}" x {book.setup?.altura_polegadas}")</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Imagens Aprovadas</p>
            <p className="font-medium text-gray-900">{approvedImages}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Páginas em Branco (Verso)</p>
            <p className="font-medium text-gray-900">{insertBlank ? 'Sim' : 'Não'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Total Estimado de Páginas</p>
            <p className="font-medium text-gray-900">{estimatedPages} páginas</p>
          </div>
        </div>

        <div className="pt-6 border-t">
          {pdfUrl ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg font-medium">PDF compilado com sucesso!</div>
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="inline-block bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-3 rounded-lg font-bold transition-colors">
                Baixar PDF
              </a>
            </div>
          ) : (
            <button
              onClick={handleCompile}
              disabled={loading || approvedImages === 0}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Compilando...' : 'Compilar PDF'}
            </button>
          )}
          {approvedImages === 0 && !pdfUrl && (
            <p className="text-red-500 text-center mt-2 text-sm">Você precisa aprovar imagens antes de compilar.</p>
          )}
        </div>
      </div>
    </div>
  );
}
