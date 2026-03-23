import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";

import { query } from "./db.js";
import { requireAdmin, requireAuth } from "./middleware/auth.js";
import { getRandomSalleImageUrl } from "./constants/salleImages.js";
import { hashPassword, verifyPassword } from "./utils/password.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "roombook.sid",
    secret: process.env.SESSION_SECRET ?? "change-me-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
  }),
);

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function sanitizeUser(user) {
  if (!user) return null;

  return {
    id_utilisateur: user.id_utilisateur,
    uti_nom: user.uti_nom,
    uti_prenom: user.uti_prenom,
    uti_email: user.uti_email,
    uti_role: user.uti_role,
  };
}

async function refreshSessionUser(req, userId) {
  const rows = await query(
    "SELECT id_utilisateur, uti_nom, uti_prenom, uti_email, uti_role FROM Utilisateur WHERE id_utilisateur = ?",
    [userId],
  );

  req.session.user = sanitizeUser(rows[0] ?? null);
  return req.session.user;
}

function hasEmptyField(value) {
  if (typeof value !== "string") return true;
  return value.replace(/ /g, "") === "";
}

function isValidDateYmd(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value;
}

function diffDays(startYmd, endYmd) {
  const start = new Date(`${startYmd}T00:00:00Z`);
  const end = new Date(`${endYmd}T00:00:00Z`);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  res.json({ user: req.session.user ?? null });
});

app.get("/api/me", (req, res) => {
  res.json({ user: req.session.user ?? null });
});

app.post(
  "/api/auth/register",
  asyncHandler(async (req, res) => {
    const fields = ["nom", "prenom", "email", "mdp"];
    const messageError = {};

    for (const key of fields) {
      if (hasEmptyField(req.body[key])) {
        messageError[key] = `Votre ${key} est vide.`;
      }
    }

    if (Object.keys(messageError).length > 0) {
      return res.status(400).json({ messageError });
    }

    const existingUserRows = await query(
      "SELECT * FROM Utilisateur WHERE uti_email = ?",
      [req.body.email],
    );

    if (existingUserRows[0]) {
      return res.status(409).json({
        messageError: { email: "Cette adresse email est déjà utilisée." },
      });
    }

    await query(
      "INSERT INTO Utilisateur (uti_nom, uti_prenom, uti_email, uti_mdp, uti_role) VALUES (?, ?, ?, ?, ?)",
      [
        req.body.nom,
        req.body.prenom,
        req.body.email,
        await hashPassword(req.body.mdp),
        "utilisateur",
      ],
    );

    return res.json({ redirect: "/connexion" });
  }),
);

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const users = await query("SELECT * FROM Utilisateur WHERE uti_email = ?", [
      req.body.email,
    ]);

    const user = users[0];

    if (user && (await verifyPassword(req.body.mdp ?? "", user.uti_mdp))) {
      req.session.user = sanitizeUser(user);
      return res.json({ message: "Connecté", user: req.session.user });
    }

    return res.status(401).json({ message: "Mauvais email ou MDP" });
  }),
);

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ redirect: "/" });
  });
});

app.get(
  "/api/users",
  asyncHandler(async (_req, res) => {
    const users = await query("select * from utilisateur");
    res.json(users.map((user) => sanitizeUser(user)));
  }),
);

app.put(
  "/api/users/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (
      !req.body.nom ||
      !req.body.prenom ||
      !req.body.email ||
      req.body.nom === "" ||
      req.body.prenom === "" ||
      req.body.email === ""
    ) {
      return res
        .status(400)
        .json({ erreur: "Tous les champs doivent être remplis" });
    }

    await query(
      "UPDATE utilisateur SET uti_nom = ?, uti_prenom = ?, uti_email = ? WHERE id_utilisateur = ?",
      [
        req.body.nom,
        req.body.prenom,
        req.body.email,
        req.session.user.id_utilisateur,
      ],
    );

    const user = await refreshSessionUser(req, req.session.user.id_utilisateur);
    return res.json({ user, redirect: "/Profil" });
  }),
);

app.delete(
  "/api/users/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    await query("DELETE FROM utilisateur WHERE id_utilisateur = ?", [
      req.session.user.id_utilisateur,
    ]);

    req.session.destroy(() => {
      res.json({ redirect: "/" });
    });
  }),
);

app.get(
  "/api/salles",
  asyncHandler(async (_req, res) => {
    const salles = await query("select * from salle");
    res.json(salles);
  }),
);

app.get(
  "/api/salles/:numero",
  asyncHandler(async (req, res) => {
    const salleRows = await query("SELECT * FROM Salle WHERE sal_numero = ?", [
      req.params.numero,
    ]);

    const salle = salleRows[0] ?? null;

    if (!salle) {
      return res.json({
        salle: null,
        equipementsSalle: [],
        reservationsSalle: [],
        categorieSalle: null,
      });
    }

    const equipementsSalle = await query(
      `SELECT Contenance.*, Equipement.equi_nom, Equipement.equi_description
       FROM Contenance
       INNER JOIN Equipement ON Equipement.id_equipement = Contenance.id_equipement
       WHERE Contenance.id_salle = ?
       ORDER BY Equipement.equi_nom`,
      [salle.id_salle],
    );

    const reservationsSalle = await query(
      `SELECT Reservation.*, Salle.sal_nom, Salle.sal_image, Utilisateur.uti_nom, Utilisateur.uti_prenom
       FROM Reservation
       INNER JOIN Salle ON Salle.id_salle = Reservation.id_salle
       INNER JOIN Utilisateur ON Utilisateur.id_utilisateur = Reservation.id_utilisateur
       WHERE Reservation.id_salle = ?
       ORDER BY Reservation.res_dateDebut DESC`,
      [salle.id_salle],
    );

    const categories = await query(
      "SELECT * FROM Categorie WHERE id_categorie = ?",
      [salle.id_categorie],
    );

    return res.json({
      salle,
      equipementsSalle,
      reservationsSalle,
      categorieSalle: categories[0] ?? null,
    });
  }),
);

app.get(
  "/api/equipements",
  asyncHandler(async (_req, res) => {
    const equipements = await query("SELECT * FROM Equipement ORDER BY equi_nom");
    res.json(equipements);
  }),
);

app.get(
  "/api/categories",
  asyncHandler(async (_req, res) => {
    const categories = await query("SELECT * FROM Categorie ORDER BY cat_nom");
    res.json(categories);
  }),
);

app.get(
  "/api/reservations/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const reservations = await query(
      `SELECT Reservation.*, Salle.sal_nom, Salle.sal_image, Salle.sal_numero
       FROM Reservation
       INNER JOIN Salle ON Salle.id_salle = Reservation.id_salle
       WHERE Reservation.id_utilisateur = ?
       ORDER BY Reservation.res_dateDebut DESC`,
      [req.session.user.id_utilisateur],
    );

    res.json(reservations);
  }),
);

app.post(
  "/api/reservations",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id_salle, dateDebut, dateFin } = req.body;

    if (!id_salle || !dateDebut || !dateFin) {
      return res
        .status(400)
        .json({ erreurReservation: "Tous les champs sont obligatoires." });
    }

    if (dateDebut >= dateFin) {
      return res.status(400).json({
        erreurReservation: "La date de fin doit être après la date de début.",
      });
    }

    if (!isValidDateYmd(dateDebut) || !isValidDateYmd(dateFin)) {
      return res.status(400).json({ erreurReservation: "Format de date invalide." });
    }

    const dureeReservation = diffDays(dateDebut, dateFin);

    if (dureeReservation > 5) {
      return res.status(400).json({
        erreurReservation: "La durée maximale de réservation est de 5 jours.",
      });
    }

    await query(
      "INSERT INTO Reservation (id_salle, id_utilisateur, res_dateDebut, res_dateFin) VALUES (?, ?, ?, ?)",
      [id_salle, req.session.user.id_utilisateur, dateDebut, dateFin],
    );

    return res.json({ redirect: "/Reservation" });
  }),
);

app.delete(
  "/api/reservations/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const reservationRows = await query(
      "SELECT * FROM Reservation WHERE id_reservation = ?",
      [req.params.id],
    );

    const reservation = reservationRows[0];

    if (
      reservation &&
      reservation.id_utilisateur === req.session.user.id_utilisateur
    ) {
      await query("DELETE FROM Reservation WHERE id_reservation = ?", [
        req.params.id,
      ]);
    }

    return res.json({ redirect: "/Reservation" });
  }),
);

app.use("/api/admin", requireAdmin);

app.get(
  "/api/admin/users",
  asyncHandler(async (_req, res) => {
    const users = await query("select * from utilisateur");
    res.json(users.map((user) => sanitizeUser(user)));
  }),
);

app.post(
  "/api/admin/users",
  asyncHandler(async (req, res) => {
    await query(
      "INSERT INTO Utilisateur (uti_nom, uti_prenom, uti_email, uti_mdp, uti_role) VALUES (?, ?, ?, ?, ?)",
      [
        req.body.nom,
        req.body.prenom,
        req.body.email,
        await hashPassword(req.body.mdp),
        req.body.role,
      ],
    );

    return res.json({ ok: true });
  }),
);

app.put(
  "/api/admin/users/:id",
  asyncHandler(async (req, res) => {
    await query(
      "UPDATE Utilisateur SET uti_nom = ?, uti_prenom = ?, uti_email = ?, uti_role = ? WHERE id_utilisateur = ?",
      [
        req.body.nom,
        req.body.prenom,
        req.body.email,
        req.body.role,
        req.params.id,
      ],
    );

    if (Number(req.session.user.id_utilisateur) === Number(req.params.id)) {
      await refreshSessionUser(req, Number(req.params.id));
    }

    return res.json({ ok: true });
  }),
);

app.get(
  "/api/admin/categories",
  asyncHandler(async (_req, res) => {
    const categories = await query("SELECT * FROM Categorie ORDER BY cat_nom");
    res.json(categories);
  }),
);

app.post(
  "/api/admin/categories",
  asyncHandler(async (req, res) => {
    await query("INSERT INTO Categorie (cat_nom) VALUES (?)", [req.body.nom]);
    return res.json({ ok: true });
  }),
);

app.put(
  "/api/admin/categories/:id",
  asyncHandler(async (req, res) => {
    await query("UPDATE Categorie SET cat_nom = ? WHERE id_categorie = ?", [
      req.body.nom,
      req.params.id,
    ]);

    return res.json({ ok: true });
  }),
);

app.delete(
  "/api/admin/categories/:id",
  asyncHandler(async (req, res) => {
    await query("DELETE FROM Categorie WHERE id_categorie = ?", [req.params.id]);
    return res.json({ ok: true });
  }),
);

app.get(
  "/api/admin/salles",
  asyncHandler(async (_req, res) => {
    const salles = await query("select * from salle");
    res.json(salles);
  }),
);

app.post(
  "/api/admin/salles",
  asyncHandler(async (req, res) => {
    await query(
      "INSERT INTO Salle (id_categorie, sal_nom, sal_taille, sal_numero, sal_image) VALUES (?, ?, ?, ?, ?)",
      [
        req.body.id_categorie,
        req.body.nom,
        req.body.taille,
        req.body.numero,
        getRandomSalleImageUrl(),
      ],
    );

    return res.json({ ok: true });
  }),
);

app.put(
  "/api/admin/salles/:id",
  asyncHandler(async (req, res) => {
    await query(
      "UPDATE Salle SET id_categorie = ?, sal_nom = ?, sal_taille = ?, sal_numero = ?, sal_image = ? WHERE id_salle = ?",
      [
        req.body.id_categorie,
        req.body.nom,
        req.body.taille,
        req.body.numero,
        req.body.image,
        req.params.id,
      ],
    );

    return res.json({ ok: true });
  }),
);

app.delete(
  "/api/admin/salles/:id",
  asyncHandler(async (req, res) => {
    await query("DELETE FROM Salle WHERE id_salle = ?", [req.params.id]);
    return res.json({ ok: true });
  }),
);

app.get(
  "/api/admin/equipements",
  asyncHandler(async (_req, res) => {
    const equipements = await query("SELECT * FROM Equipement ORDER BY equi_nom");
    res.json(equipements);
  }),
);

app.post(
  "/api/admin/equipements",
  asyncHandler(async (req, res) => {
    await query(
      "INSERT INTO Equipement (equi_nom, equi_description) VALUES (?, ?)",
      [req.body.nom, req.body.description],
    );

    return res.json({ ok: true });
  }),
);

app.put(
  "/api/admin/equipements/:id",
  asyncHandler(async (req, res) => {
    await query(
      "UPDATE Equipement SET equi_nom = ?, equi_description = ? WHERE id_equipement = ?",
      [req.body.nom, req.body.description, req.params.id],
    );

    return res.json({ ok: true });
  }),
);

app.delete(
  "/api/admin/equipements/:id",
  asyncHandler(async (req, res) => {
    await query("DELETE FROM Equipement WHERE id_equipement = ?", [req.params.id]);
    return res.json({ ok: true });
  }),
);

app.get(
  "/api/admin/contenances",
  asyncHandler(async (_req, res) => {
    const contenances = await query(
      `SELECT Contenance.*, Equipement.equi_nom, Salle.sal_nom, Salle.sal_numero
       FROM Contenance
       INNER JOIN Equipement ON Equipement.id_equipement = Contenance.id_equipement
       INNER JOIN Salle ON Salle.id_salle = Contenance.id_salle
       ORDER BY Salle.sal_nom, Equipement.equi_nom`,
    );

    res.json(contenances);
  }),
);

app.post(
  "/api/admin/contenances",
  asyncHandler(async (req, res) => {
    await query(
      "INSERT INTO Contenance (id_equipement, id_salle, cont_quantite) VALUES (?, ?, ?)",
      [req.body.id_equipement, req.body.id_salle, req.body.quantite],
    );

    return res.json({ ok: true });
  }),
);

app.put(
  "/api/admin/contenances/:id",
  asyncHandler(async (req, res) => {
    await query(
      "UPDATE Contenance SET id_equipement = ?, id_salle = ?, cont_quantite = ? WHERE id_contenance = ?",
      [
        req.body.id_equipement,
        req.body.id_salle,
        req.body.quantite,
        req.params.id,
      ],
    );

    return res.json({ ok: true });
  }),
);

app.delete(
  "/api/admin/contenances/:id",
  asyncHandler(async (req, res) => {
    await query("DELETE FROM Contenance WHERE id_contenance = ?", [req.params.id]);
    return res.json({ ok: true });
  }),
);

app.get(
  "/api/admin/reservations",
  asyncHandler(async (_req, res) => {
    const reservations = await query(
      `SELECT Reservation.*, Salle.sal_nom, Salle.sal_numero, Utilisateur.uti_nom, Utilisateur.uti_prenom
       FROM Reservation
       INNER JOIN Salle ON Salle.id_salle = Reservation.id_salle
       INNER JOIN Utilisateur ON Utilisateur.id_utilisateur = Reservation.id_utilisateur
       ORDER BY Reservation.res_dateDebut DESC`,
    );

    res.json(reservations);
  }),
);

app.post(
  "/api/admin/reservations",
  asyncHandler(async (req, res) => {
    await query(
      "INSERT INTO Reservation (id_salle, id_utilisateur, res_dateDebut, res_dateFin) VALUES (?, ?, ?, ?)",
      [
        req.body.id_salle,
        req.body.id_utilisateur,
        req.body.dateDebut,
        req.body.dateFin,
      ],
    );

    return res.json({ ok: true });
  }),
);

app.put(
  "/api/admin/reservations/:id",
  asyncHandler(async (req, res) => {
    await query(
      "UPDATE Reservation SET id_salle = ?, id_utilisateur = ?, res_dateDebut = ?, res_dateFin = ? WHERE id_reservation = ?",
      [
        req.body.id_salle,
        req.body.id_utilisateur,
        req.body.dateDebut,
        req.body.dateFin,
        req.params.id,
      ],
    );

    return res.json({ ok: true });
  }),
);

app.delete(
  "/api/admin/reservations/:id",
  asyncHandler(async (req, res) => {
    await query("DELETE FROM Reservation WHERE id_reservation = ?", [req.params.id]);
    return res.json({ ok: true });
  }),
);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
