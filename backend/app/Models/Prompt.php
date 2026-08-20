<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prompt extends Model
{
    protected $fillable = [
        'book_id',
        'base_prompt',
        'style_modifiers',
        'peso_distribuicao',
    ];

    protected function casts(): array
    {
        return [
            'style_modifiers' => 'array',
            'peso_distribuicao' => 'decimal:2',
        ];
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(Image::class);
    }
}
