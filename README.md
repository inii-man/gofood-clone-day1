# GoFood Clone — Day 1

Hands-on project berdasarkan materi Hari 1: Mobile Fullstack Development.

## Scope Day 1
- React Native + Expo + TypeScript
- GoFood Home Screen
- Restaurant Detail
- Native Stack Navigation
- Context API untuk Cart State
- Node.js + Express + TypeScript
- PostgreSQL + Prisma
- REST API:
  - GET /health
  - GET /api/restaurants
  - GET /api/restaurants/:id
  - GET /api/restaurants/:id/menu
- Prisma seed data
- Mobile terhubung ke Backend API

## Struktur

```text
gofood-clone/
├── mobile/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/
│   │   └── types/
│   ├── .env.example
│   ├── App.tsx
│   └── package.json
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── prisma/
│   │   ├── routes/
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Test:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/restaurants
```

## 2. Mobile

Set API URL in `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
```

Then:

```bash
cd mobile
npm install
npx expo start
```

For a real device, replace `YOUR_LOCAL_IP` with the computer's LAN IP.

## Important

`.env.example` is a template only. Never commit real secrets in `.env`.
