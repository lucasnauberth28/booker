'use client';

import React from 'react';
import { ImageRecord } from '@/types';
import { StatusBadge } from './StatusBadge';

interface ImageCardProps {
  image: ImageRecord;
  onStatusChange: (status: 'approved' | 'rejected') => void;
}

export function ImageCard({ image, onStatusChange }: ImageCardProps) {
  const isApproved = image.status === 'approved';
  const isRejected = image.status === 'rejected';

  return (
    <div className={`relative flex flex-col bg-white rounded-lg shadow-sm overflow-hidden border-2 transition-all ${isApproved ? 'border-green-500' : isRejected ? 'border-red-500 opacity-50' : 'border-transparent'}`}>
      <div className="absolute top-2 left-2 z-10">
        <StatusBadge status={image.status} />
      </div>
      <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded">
        #{image.page_order}
      </div>
      
      <div className="w-full aspect-square bg-gray-100 relative">
        {image.r2_file_url ? (
          <img src={image.r2_file_url} alt={`Page ${image.page_order}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {image.status === 'generating' ? 'Gerando...' : 'Sem imagem'}
          </div>
        )}
      </div>

      <div className="p-3 bg-gray-50 flex gap-2 justify-between mt-auto border-t">
        <button
          onClick={() => onStatusChange('approved')}
          className="flex-1 bg-green-100 text-green-700 hover:bg-green-200 py-1.5 rounded font-medium text-sm transition-colors"
        >
          ✓ Aprovar
        </button>
        <button
          onClick={() => onStatusChange('rejected')}
          className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-1.5 rounded font-medium text-sm transition-colors"
        >
          ✗ Rejeitar
        </button>
      </div>
    </div>
  );
}
