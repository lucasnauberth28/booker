<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Image extends Model
{
    protected $fillable = [
        'book_id',
        'prompt_id',
        'external_task_id',
        'r2_file_url',
        'status',
        'page_order',
    ];

    protected function casts(): array
    {
        return [
            'page_order' => 'integer',
        ];
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function prompt(): BelongsTo
    {
        return $this->belongsTo(Prompt::class);
    }

    public function getR2FileUrlAttribute(?string $value): ?string
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

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
