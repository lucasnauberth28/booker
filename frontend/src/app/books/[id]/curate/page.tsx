'use client';

import React, { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { Book } from '@/types';
import { ImageGrid } from '@/components/ImageGrid';

export default function CuratePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bookId = Number(resolvedParams.id);
  const { data: book } = useSWR<Book>(`/books/${bookId}`, fetcher);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/books" className="hover:text-indigo-600">Livros</Link>
        <span>&gt;</span>
        <Link href={`/books/${bookId}`} className="hover:text-indigo-600">{book?.titulo || 'Carregando...'}</Link>
        <span>&gt;</span>
        <span className="text-gray-900 font-medium">Curadoria</span>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Curadoria - {book?.titulo}</h1>
        <Link href={`/books/${bookId}`} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium">
          Voltar ao Livro
        </Link>
      </div>

      <ImageGrid bookId={bookId} />
    </div>
  );
}
