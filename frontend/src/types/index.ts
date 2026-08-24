export interface Setup {
  id: number;
  nome: string;
  largura_polegadas: number;
  altura_polegadas: number;
  margem_seguranca: number;
  inserir_paginas_em_branco_verso: boolean;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: number;
  setup_id: number;
  titulo: string;
  nicho: string;
  total_paginas_desejadas: number;
  status: 'draft' | 'generating' | 'curating' | 'ready';
  cover_image_url?: string | null;
  setup?: Setup;
  prompts?: Prompt[];
  images?: ImageRecord[];
  images_count?: {
    total: number;
    queued: number;
    generating: number;
    approved: number;
    rejected: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: number;
  book_id: number;
  base_prompt: string;
  style_modifiers: string[] | null;
  peso_distribuicao: number;
  created_at: string;
  updated_at: string;
}

export interface ImageRecord {
  id: number;
  book_id: number;
  prompt_id: number | null;
  external_task_id: string | null;
  r2_file_url: string | null;
  status: 'queued' | 'generating' | 'approved' | 'rejected';
  page_order: number;
  prompt?: Prompt;
  created_at: string;
  updated_at: string;
}

export interface TokenUsageRecord {
  id: number;
  book_id: number | null;
  model: string;
  operation_type: string;
  prompt_tokens: number;
  candidates_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  metadata: any;
  book?: {
    id: number;
    titulo: string;
    nicho: string;
  };
  created_at: string;
  updated_at: string;
}

export interface UsageSummary {
  total_tokens: number;
  prompt_tokens: number;
  candidates_tokens: number;
  total_requests: number;
  estimated_cost_usd: number;
  estimated_cost_brl: number;
  quota: {
    configured: boolean;
    status: 'active' | 'missing_key' | 'invalid_key' | 'unreachable';
    message: string;
    model?: string;
    tier?: string;
    rate_limit_remaining?: string | null;
    limits?: {
      rpm: string;
      tpm: string;
      rpd: string;
    };
  };
  recent_calls: TokenUsageRecord[];
}
