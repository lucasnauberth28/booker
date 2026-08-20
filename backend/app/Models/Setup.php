<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Setup extends Model
{
    protected $fillable = [
        'nome',
        'largura_polegadas',
        'altura_polegadas',
        'margem_seguranca',
        'inserir_paginas_em_branco_verso',
    ];

    protected function casts(): array
    {
        return [
            'inserir_paginas_em_branco_verso' => 'boolean',
            'largura_polegadas' => 'decimal:2',
            'altura_polegadas' => 'decimal:2',
            'margem_seguranca' => 'decimal:3',
        ];
    }

    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }
}
