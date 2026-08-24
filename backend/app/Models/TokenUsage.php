<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TokenUsage extends Model
{
    protected $fillable = [
        'book_id',
        'model',
        'operation_type',
        'prompt_tokens',
        'candidates_tokens',
        'total_tokens',
        'estimated_cost_usd',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'prompt_tokens' => 'integer',
            'candidates_tokens' => 'integer',
            'total_tokens' => 'integer',
            'estimated_cost_usd' => 'decimal:5',
            'metadata' => 'array',
        ];
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
}