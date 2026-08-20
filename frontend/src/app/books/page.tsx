'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { Book } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';

export default function BooksPage() {
  const [filter, setFilter] = useState('');
  const { data: books } = useSWR<Book[]>(`/books${filter ? `?status=${filter}` : ''}`, fetcher);

  const tabs = [
    { label: 'Todos', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Generating', value: 'generating' },
    { label: 'Curating', value: 'curating' },
    { label: 'Ready', value: 'ready' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Livros</h1>
        <Link href="/books/new" className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium">
          Novo Livro
        </Link>
      </div>

      <div className="flex space-x-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === tab.value ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books?.map(book => {
          const approved = book.images_count?.approved || 0;
          const total = book.total_paginas_desejadas;
          const progress = Math.min(100, Math.round((approved / total) * 100));
          
          return (
            <Link key={book.id} href={`/books/${book.id}`} className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <StatusBadge status={book.status} />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-1">{book.titulo}</h3>
              <p className="text-sm text-gray-500 mb-4">{book.nicho} • {book.setup?.nome}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span>Progresso</span>
                  <span>{approved} / {total} págs</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </Link>
          );
        })}
        {books?.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum livro encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
