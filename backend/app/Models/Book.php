<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    protected $fillable = [
        'setup_id',
        'titulo',
        'nicho',
        'total_paginas_desejadas',
        'status',
        'cover_image_url',
    ];

    protected function casts(): array
    {
        return [
            'total_paginas_desejadas' => 'integer',
        ];
    }

    public function getCoverImageUrlAttribute(?string $value): ?string
    {
        if (empty($value)) {
            return null;
        }
        if (str_starts_with($value, 'http://localhost/storage/')) {
            return str_replace('http://localhost/storage/', 'http://localhost:8000/storage/', $value);
        }
        if (str_starts_with($value, '/storage/')) {
            return 'http://localhost:8000' . $value;
        }
        return $value;
    }

    public function setup(): BelongsTo
    {
        return $this->belongsTo(Setup::class);
    }

    public function prompts(): HasMany
    {
        return $this->hasMany(Prompt::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(Image::class);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
