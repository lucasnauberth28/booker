import React from 'react';

export function StatusBadge({ status }: { status: string }) {
  let colorClass = 'bg-gray-100 text-gray-800';
  let pulse = false;

  switch (status) {
    case 'draft':
    case 'queued':
      colorClass = 'bg-gray-100 text-gray-800';
      break;
    case 'generating':
      colorClass = 'bg-yellow-100 text-yellow-800';
      pulse = true;
      break;
    case 'curating':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'ready':
    case 'approved':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'rejected':
      colorClass = 'bg-red-100 text-red-800';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass} ${pulse ? 'animate-pulse' : ''}`}>
      {status}
    </span>
  );
}
