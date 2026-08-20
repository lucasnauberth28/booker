# KDP Factory — Studio SPA (Amazon KDP Coloring Book Automation)

O **KDP Factory** é um micro-SaaS interno estruturado como uma **Single Page Application (SPA)** moderna para automação, geração por IA e compilação de livros de colorir voltados para a **Amazon KDP**.

---

## 🛠️ Stack Tecnológica

- **Backend:** Laravel 12 (API RESTful com SQLite & Database Queue Driver)
- **Frontend:** Next.js 16 (React 19, TypeScript, TailwindCSS v4, shadcn/ui, Embla Carousel, Sonner)
- **Compilação de PDF:** FPDF (formatação milimétrica em pontos `72 pt/in`, margens de segurança e páginas em branco no verso)
- **Armazenamento:** Cloudflare R2 (API compatível com S3) com fallback local
- **IA Generativa:** Google Gemini / Imagen 3 + gerador procedural vetorial offline

---

## 🚀 Como Executar o Projeto

### 1. Backend (Laravel 12)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link

# Iniciar o servidor da API
php artisan serve

# Iniciar o worker de filas para geração de imagens por IA
php artisan queue:listen
```

### 2. Frontend (Next.js 16 SPA)

```bash
cd frontend
npm install
npm run dev
```

Acesse a aplicação no navegador em: `http://localhost:3000`

---

## 📁 Estrutura do Repositório

```
├── backend/                   # Laravel 12 API RESTful
│   ├── app/
│   │   ├── Http/Controllers/Api/  # Controllers REST (Setups, Books, Prompts, Images, Generation, Compilation)
│   │   ├── Jobs/                  # GenerateImageFromAi (Processamento assíncrono em fila)
│   │   ├── Models/                # Eloquent Models (Setup, Book, Prompt, Image)
│   │   └── Services/              # GeminiImageService, R2StorageService, BookPdfCompilerService
│   ├── database/migrations/       # Esquema do banco de dados relacional
│   └── tests/Feature/             # Testes de integração automatizados
│
└── frontend/                  # Next.js 16 SPA
    ├── src/
    │   ├── app/page.tsx           # Hub SPA principal com Vitrine 3D
    │   ├── components/            # Topbar, BookCarousel, BookManagementSheet, Dialogs
    │   ├── components/ui/         # Componentes shadcn/ui (Button, Badge, Sheet, Dialog, Carousel, Toaster, etc.)
    │   └── lib/                   # Cliente API HTTP e SWR Fetcher
```

---

## 📄 Licença
Propriedade interna KDP Factory.
