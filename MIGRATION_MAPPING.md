# Mapping de migration PHP -> React/Node

## Point d'entrée

- `index.php` -> `frontend/src/main.jsx`, `frontend/src/App.jsx`, `backend/src/server.js`
- `Config/connectDatabase.php` -> `backend/src/db.js` + `.env`

## Contrôleurs PHP -> API Node

- `Controllers/userController.php` -> `backend/src/server.js`
  - `/inscription` -> `POST /api/auth/register`
  - `/connexion` -> `POST /api/auth/login`
  - `/deconnexion` -> `POST /api/auth/logout`
  - `/Profil` -> `PUT /api/users/me`
  - `/deleteProfil` -> `DELETE /api/users/me`
  - `/Utilisateur` -> `GET /api/users`
- `Controllers/salleController.php` -> `backend/src/server.js`
  - `/` et `/Salle` -> `GET /api/salles`
  - `/Salle/Details/{numero}` -> `GET /api/salles/:numero`
- `Controllers/equipementController.php` -> `backend/src/server.js`
  - `/Equipement` -> `GET /api/equipements`
- `Controllers/reservationController.php` -> `backend/src/server.js`
  - `/Reservation` -> `GET /api/reservations/me`
  - `/create-reservation` -> `POST /api/reservations`
  - `/delete-reservation?id={id}` -> `DELETE /api/reservations/:id`
- `Controllers/adminController.php` -> `backend/src/server.js`
  - `/admin` -> contrôle d'accès admin (route frontend)
  - `/admin/users` -> `GET/POST/PUT /api/admin/users`
  - `/admin/categories` -> `GET/POST/PUT/DELETE /api/admin/categories`
  - `/admin/salles` -> `GET/POST/PUT/DELETE /api/admin/salles`
  - `/admin/equipements` -> `GET/POST/PUT/DELETE /api/admin/equipements`
  - `/admin/contenances` -> `GET/POST/PUT/DELETE /api/admin/contenances`
  - `/admin/reservations` -> `GET/POST/PUT/DELETE /api/admin/reservations`

## Modèles PHP -> SQL Node (requêtes conservées)

- `Models/userModel.php` -> `backend/src/server.js` (requêtes utilisateur + hash bcrypt + session)
- `Models/salleModel.php` -> `backend/src/server.js`, `backend/src/constants/salleImages.js`
- `Models/reservationModel.php` -> `backend/src/server.js`
- `Models/equipementModel.php` -> `backend/src/server.js`
- `Models/categorieModel.php` -> `backend/src/server.js`
- `Models/contenanceModel.php` -> `backend/src/server.js`

## Vues PHP -> Pages React

- `Views/base.php` -> layout global dans `frontend/src/App.jsx` (`header/main/footer`)
- `Views/Components/header.php` -> composant `Header` dans `frontend/src/App.jsx`
- `Views/Components/footer.php` -> composant `Footer` dans `frontend/src/App.jsx`
- `Views/Components/admin-sidebar.php` -> composant `AdminSidebar` dans `frontend/src/App.jsx`

- `Views/salle/pageAccueil.php` -> `HomePage`
- `Views/salle/pageSalle.php` -> `SallesPage`
- `Views/salle/pageSalleDetails.php` -> `SalleDetailsPage`
- `Views/equipement/pageEquipement.php` -> `EquipementsPage`
- `Views/reservation/pageReservation.php` -> `ReservationsPage`
- `Views/reservation/pageCreerReservation.php` -> `CreateReservationPage`
- `Views/users/pageConnexion.php` -> `ConnexionPage`
- `Views/users/pageInscription.php` -> `InscriptionPage`
- `Views/users/pageProfil.php` -> `ProfilPage`
- `Views/users/pageUtilisateur.php` -> `UtilisateursPage`
- `Views/admin/pageAdmin.php` -> `AdminDashboardPage`
- `Views/admin/pageAdminUsers.php` -> `AdminUsersPage`
- `Views/admin/pageAdminCategories.php` -> `AdminCategoriesPage`
- `Views/admin/pageAdminSalles.php` -> `AdminSallesPage`
- `Views/admin/pageAdminEquipements.php` -> `AdminEquipementsPage`
- `Views/admin/pageAdminContenances.php` -> `AdminContenancesPage`
- `Views/admin/pageAdminReservations.php` -> `AdminReservationsPage`

## Assets

- `Assets/CSS/*` -> `frontend/public/Assets/CSS/*` (copie directe)
- `Assets/JS/home.js` -> logique reproduite dans `HomePage` (observateurs + compteurs)

## Base de données

- Schéma inchangé (MySQL): `SQL/sqlDeBase.txt`
- Tables réutilisées sans refonte: `Utilisateur`, `Categorie`, `Salle`, `Equipement`, `Contenance`, `Reservation`
