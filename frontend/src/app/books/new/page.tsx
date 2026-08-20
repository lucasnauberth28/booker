'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BookForm } from '@/components/BookForm';
import { Book } from '@/types';

export default function NewBookPage() {
  const router = useRouter();

  const handleSuccess = (book: Book) => {
    router.push(`/books/${book.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Novo Livro</h1>
        <p className="text-gray-500 mt-2">Crie um novo projeto de livro de colorir.</p>
      </div>
      
      <BookForm onSuccess={handleSuccess} />
    </div>
  );
}
