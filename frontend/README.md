# Frontend React + Vite (100% statique)

## Prérequis

- Node.js 20+
- Aucun backend
- Aucune base MySQL

## Installation

```bash
cd frontend
npm install
```

## Lancement

```bash
npm run dev
```

## Build production

```bash
npm run build
```

## Déploiement Vercel (statique)

1. Importer le repo dans Vercel
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Framework preset: `Vite`

## Notes de fidélité UI

- Le CSS original PHP est réutilisé tel quel via `public/Assets/CSS/*`.
- Les routes frontend reprennent les chemins d'origine (`/Salle`, `/Profil`, `/admin/*`, etc.).
- La navigation et les formulaires reproduisent la structure HTML des templates PHP.
- Les données de base proviennent de `public/data/*.json`.
- Les modifications (auth, CRUD, réservations) sont simulées via `localStorage`.

## JSON utilisés

- `public/data/users.json`
- `public/data/categories.json`
- `public/data/rooms.json`
- `public/data/equipments.json`
- `public/data/roomEquipments.json`
- `public/data/bookings.json`

## Services

- Le moteur de données statiques est centralisé dans `src/services/fakeApi.js`.
- Le frontend continue d'appeler une API interne simulée (`apiRequest`) mais sans réseau backend.
