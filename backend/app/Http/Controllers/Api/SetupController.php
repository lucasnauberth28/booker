<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setup;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SetupController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Setup::all());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome' => 'required|string|max:255',
            'largura_polegadas' => 'required|numeric|min:1|max:20',
            'altura_polegadas' => 'required|numeric|min:1|max:20',
            'margem_seguranca' => 'nullable|numeric|min:0|max:2',
            'inserir_paginas_em_branco_verso' => 'nullable|boolean',
        ]);

        $setup = Setup::create($validated);
        return response()->json($setup, 201);
    }

    public function show(Setup $setup): JsonResponse
    {
        $setup->loadCount('books');
        return response()->json($setup);
    }

    public function update(Request $request, Setup $setup): JsonResponse
    {
        $validated = $request->validate([
            'nome' => 'required|string|max:255',
            'largura_polegadas' => 'required|numeric|min:1|max:20',
            'altura_polegadas' => 'required|numeric|min:1|max:20',
            'margem_seguranca' => 'nullable|numeric|min:0|max:2',
            'inserir_paginas_em_branco_verso' => 'nullable|boolean',
        ]);

        $setup->update($validated);
        return response()->json($setup);
    }

    public function destroy(Setup $setup): JsonResponse
    {
        $setup->delete();
        return response()->json(null, 204);
    }
}
