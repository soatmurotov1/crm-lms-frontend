# EduLMS — frontend

React 19 + Vite ilovasi: o'quv markazlari uchun ta'lim boshqaruv platformasi (LMS).
Egasi, menejer, operator, buxgalter va o'qituvchi rollari uchun autentifikatsiyadan
o'tgan ish joyi.

## Ishga tushirish

```bash
cp .env.example .env      # VITE_API_BASE_URL=http://localhost:4040/api/v2
npm install
npm run dev               # http://localhost:8080
```

Backend (`../backend`) `http://localhost:4040` da ishlab turgan bo'lishi kerak.

## Tekshiruvlar

```bash
npm run typecheck
npm test
npm run build
```

## Tuzilma

- `src/routes/` — TanStack Router fayl-asosidagi route'lar (`routeTree.gen.ts` avtomatik).
- `src/features/<domen>/` — har bir domen: `api/` (TanStack Query hook'lari), `components/`, `pages/`, `types.ts`.
- `src/features/lms/` — LMS: fanlar, o'quv dasturi (modul → dars → material),
  kursga yozish, topshiriqlar, testlar/imtihonlar, baholar jurnali, progress,
  bildirishnomalar, dashboard bloki.
- `src/shared/api/schema.d.ts` — backend OpenAPI'dan generatsiya qilinadi, qo'lda tahrirlanmaydi.

## API tiplari

Lokal backend Swagger'i ochiq (`/api-json`), shuning uchun:

```bash
npm run api:types   # OPENAPI_URL standart: http://localhost:4040/api-json
npm run api:check
```

Himoyalangan muhit uchun `OPENAPI_TOKEN` (yoki `OPENAPI_USERNAME` + `OPENAPI_PASSWORD`)
faqat Node muhitida beriladi — hech qachon `VITE_` prefiksi bilan emas.

## Storybook

```bash
npm run storybook
```
