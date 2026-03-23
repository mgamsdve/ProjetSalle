# Frontend React + Vite (migration PHP views)

## Prérequis

- Node.js 20+
- Backend lancé sur `http://localhost:3001`

## Installation

```bash
cd frontend
cp .env.example .env
npm install
```

## Variable d'environnement

```env
VITE_API_URL=http://localhost:3001
```

## Lancement

```bash
npm run dev
```

## Build production

```bash
npm run build
```

## Notes de fidélité UI

- Le CSS original PHP est réutilisé tel quel via `public/Assets/CSS/*`.
- Les routes frontend reprennent les chemins d'origine (`/Salle`, `/Profil`, `/admin/*`, etc.).
- La navigation et les formulaires reproduisent la structure HTML des templates PHP.
