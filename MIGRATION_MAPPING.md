# Migration PHP+MySQL -> Frontend Statique JSON/localStorage

## 1) Analyse complète réalisée

### Tables MySQL utilisées
- `Utilisateur`
- `Categorie`
- `Salle`
- `Equipement`
- `Contenance`
- `Reservation`

### Requêtes SQL (logique métier observée)
- Lecture simple: `SELECT *` sur utilisateurs/salles/catégories/équipements
- Détails salle: jointures `Contenance + Equipement`, `Reservation + Salle + Utilisateur`
- Réservations utilisateur: `Reservation + Salle`
- Admin: CRUD complet sur catégories/salles/équipements/contenances/réservations, CRUD partiel users (create/update)
- Contraintes métier:
  - login par email + mot de passe
  - réservation: champs requis, `dateFin > dateDebut`, durée max 5 jours
  - suppression réservation utilisateur: propriétaire uniquement
  - accès admin réservé au rôle `admin`

### Routes/pages fonctionnelles
- Public: `/`, `/Salle`, `/Salle/Details/:numero`, `/Equipement`, `/connexion`, `/inscription`
- Utilisateur: `/Reservation`, `/create-reservation`, `/Profil`, `/Utilisateur`, `/deconnexion`
- Admin: `/admin`, `/admin/users`, `/admin/categories`, `/admin/salles`, `/admin/equipements`, `/admin/contenances`, `/admin/reservations`

---

## 2) Export MySQL -> JSON statiques

Dossier créé: `frontend/public/data/`

- `users.json` <- `Utilisateur`
- `categories.json` <- `Categorie`
- `rooms.json` <- `Salle`
- `equipments.json` <- `Equipement`
- `roomEquipments.json` <- `Contenance`
- `bookings.json` <- `Reservation`

Les structures de colonnes sont conservées (mêmes clés).

---

## 3) Suppression backend

- Dossier backend supprimé
- Plus aucun appel HTTP vers un serveur Node/PHP
- Plus aucune dépendance MySQL à l'exécution

---

## 4) Couche de services statiques

Fichier central: `frontend/src/services/fakeApi.js`

- Chargement initial via `fetch('/data/*.json')`
- Persistance des modifications via `localStorage`
- Simulation des endpoints historiques (`/api/...`) pour minimiser l'impact sur les composants React
- Gestion des validations et règles métier conservée

Fonctionnalités simulées:
- Authentification (`/api/auth/*`) avec session stockée en `localStorage`
- CRUD admin et utilisateur sur données locales
- Jointures applicatives (rooms + bookings + users + categories + equipments)

---

## 5) Correspondance ancien -> nouveau

- PHP Controllers + Models -> `frontend/src/services/fakeApi.js`
- MySQL tables -> `frontend/public/data/*.json`
- Vues/templates PHP -> composants/pages React déjà présents dans `frontend/src/App.jsx`

---

## 6) Structure finale

```text
frontend/
  public/
    data/
      users.json
      categories.json
      rooms.json
      equipments.json
      roomEquipments.json
      bookings.json
  src/
    services/
      fakeApi.js
    components/
    App.jsx
```

---

## 7) Déploiement

Application désormais déployable en statique (Vercel/Netlify/GitHub Pages):
- `npm install`
- `npm run build`
- publier le dossier `dist`
