# Backend Node.js (migration PHP)

## Prérequis

- Node.js 20+
- MySQL 8+
- Base `sys` initialisée (utiliser `SQL/sqlDeBase.txt` du projet original)

## Installation

```bash
cd backend
cp .env.example .env
npm install
```

## Variables d'environnement

```env
PORT=3001
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=change-me-in-production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sys
DB_USER=root
DB_PASSWORD=root
```

## Lancement

```bash
npm run dev
```

## API (équivalence PHP)

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Public:
  - `GET /api/salles`
  - `GET /api/salles/:numero`
  - `GET /api/equipements`
  - `GET /api/users`
  - `GET /api/categories`
- Utilisateur connecté:
  - `GET /api/reservations/me`
  - `POST /api/reservations`
  - `DELETE /api/reservations/:id`
  - `PUT /api/users/me`
  - `DELETE /api/users/me`
- Admin:
  - `GET/POST/PUT /api/admin/users`
  - `GET/POST/PUT/DELETE /api/admin/categories`
  - `GET/POST/PUT/DELETE /api/admin/salles`
  - `GET/POST/PUT/DELETE /api/admin/equipements`
  - `GET/POST/PUT/DELETE /api/admin/contenances`
  - `GET/POST/PUT/DELETE /api/admin/reservations`

Toutes les règles de validation PHP ont été conservées (notamment réservation utilisateur: champs requis, date fin > début, format date valide, durée max 5 jours).
