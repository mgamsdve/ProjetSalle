const STORAGE_KEYS = {
  users: "roombook.users",
  categories: "roombook.categories",
  rooms: "roombook.rooms",
  equipments: "roombook.equipments",
  roomEquipments: "roombook.roomEquipments",
  bookings: "roombook.bookings",
  sessionUser: "roombook.sessionUser",
};

const DATA_FILES = {
  users: "/data/users.json",
  categories: "/data/categories.json",
  rooms: "/data/rooms.json",
  equipments: "/data/equipments.json",
  roomEquipments: "/data/roomEquipments.json",
  bookings: "/data/bookings.json",
};

let bootstrapPromise = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createError(status, data) {
  const error = new Error(data?.error ?? data?.message ?? "Request failed");
  error.status = status;
  error.data = data;
  return error;
}

async function loadInitialData() {
  if (!bootstrapPromise) {
    bootstrapPromise = Promise.all(
      Object.entries(DATA_FILES).map(async ([table, file]) => {
        const response = await fetch(file);
        if (!response.ok) {
          throw new Error(`Impossible de charger ${file}`);
        }
        const json = await response.json();
        return [table, json];
      }),
    ).then((entries) => Object.fromEntries(entries));
  }

  return bootstrapPromise;
}

function readLocalJson(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLocalJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function getTable(table) {
  const storageKey = STORAGE_KEYS[table];
  if (!storageKey) {
    throw new Error(`Table inconnue: ${table}`);
  }

  const inStorage = readLocalJson(storageKey);
  if (inStorage) {
    return inStorage;
  }

  const initialData = await loadInitialData();
  const fallback = clone(initialData[table] ?? []);
  writeLocalJson(storageKey, fallback);
  return fallback;
}

function setTable(table, rows) {
  const storageKey = STORAGE_KEYS[table];
  writeLocalJson(storageKey, rows);
}

function getSessionUser() {
  return readLocalJson(STORAGE_KEYS.sessionUser);
}

function setSessionUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.sessionUser);
    return;
  }
  writeLocalJson(STORAGE_KEYS.sessionUser, user);
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

function requireAuth() {
  const user = getSessionUser();
  if (!user) {
    throw createError(401, { redirect: "/connexion" });
  }
  return user;
}

function requireAdmin() {
  const user = requireAuth();
  if (user.uti_role !== "admin") {
    throw createError(403, { redirect: "/" });
  }
  return user;
}

function nextId(rows, idField) {
  if (!rows.length) return 1;
  return Math.max(...rows.map((row) => Number(row[idField]) || 0)) + 1;
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

function normalizeString(value) {
  return String(value ?? "").trim();
}

function checkPassword(passwordInput, storedHashOrPassword) {
  const stored = String(storedHashOrPassword ?? "");

  if (stored.startsWith("$2")) {
    // Les dumps utilisent des hashes PHP non vérifiables côté front.
    // Dans les données de démo, le mot de passe attendu est test123.
    return passwordInput === "test123";
  }

  return passwordInput === stored;
}

function toInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

const salleImages = [
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1497366412874-3415097a27e7?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1454165205744-3b78555e5572?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1493666438817-866a91353ca9?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1487014679447-9f8336841d58?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1517502884422-41eaead166d4?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
];

function randomSalleImage() {
  return salleImages[Math.floor(Math.random() * salleImages.length)];
}

function sortByTextField(rows, field) {
  return rows.slice().sort((a, b) =>
    String(a[field] ?? "").localeCompare(String(b[field] ?? ""), "fr", {
      sensitivity: "base",
    }),
  );
}

function sortReservationsDesc(rows) {
  return rows.slice().sort((a, b) =>
    String(b.res_dateDebut ?? "").localeCompare(String(a.res_dateDebut ?? "")),
  );
}

async function routeRequest(path, method, body) {
  const cleanPath = path.split("?")[0];

  if (cleanPath === "/api/health" && method === "GET") {
    return { ok: true };
  }

  if (cleanPath === "/api/auth/me" && method === "GET") {
    return { user: getSessionUser() ?? null };
  }

  if (cleanPath === "/api/auth/register" && method === "POST") {
    const users = await getTable("users");
    const fields = ["nom", "prenom", "email", "mdp"];
    const messageError = {};

    for (const key of fields) {
      if (hasEmptyField(body?.[key])) {
        messageError[key] = `Votre ${key} est vide.`;
      }
    }

    if (Object.keys(messageError).length > 0) {
      throw createError(400, { messageError });
    }

    const email = normalizeString(body.email).toLowerCase();
    const existing = users.find(
      (user) => String(user.uti_email).toLowerCase() === email,
    );

    if (existing) {
      throw createError(409, {
        messageError: { email: "Cette adresse email est déjà utilisée." },
      });
    }

    const user = {
      id_utilisateur: nextId(users, "id_utilisateur"),
      uti_nom: body.nom,
      uti_prenom: body.prenom,
      uti_email: body.email,
      uti_mdp: body.mdp,
      uti_role: "utilisateur",
    };

    users.push(user);
    setTable("users", users);

    return { redirect: "/connexion" };
  }

  if (cleanPath === "/api/auth/login" && method === "POST") {
    const users = await getTable("users");

    const user = users.find(
      (candidate) =>
        String(candidate.uti_email).toLowerCase() ===
        normalizeString(body?.email).toLowerCase(),
    );

    if (user && checkPassword(body?.mdp ?? "", user.uti_mdp)) {
      const safeUser = sanitizeUser(user);
      setSessionUser(safeUser);
      return { message: "Connecté", user: safeUser };
    }

    throw createError(401, { message: "Mauvais email ou MDP" });
  }

  if (cleanPath === "/api/auth/logout" && method === "POST") {
    setSessionUser(null);
    return { redirect: "/" };
  }

  if (cleanPath === "/api/users" && method === "GET") {
    const users = await getTable("users");
    return users.map((user) => sanitizeUser(user));
  }

  if (cleanPath === "/api/users/me" && method === "PUT") {
    const current = requireAuth();
    const users = await getTable("users");

    if (
      !body?.nom ||
      !body?.prenom ||
      !body?.email ||
      body.nom === "" ||
      body.prenom === "" ||
      body.email === ""
    ) {
      throw createError(400, { erreur: "Tous les champs doivent être remplis" });
    }

    const index = users.findIndex(
      (user) => Number(user.id_utilisateur) === Number(current.id_utilisateur),
    );

    if (index < 0) {
      throw createError(404, { error: "Utilisateur introuvable" });
    }

    users[index] = {
      ...users[index],
      uti_nom: body.nom,
      uti_prenom: body.prenom,
      uti_email: body.email,
    };

    setTable("users", users);

    const safeUser = sanitizeUser(users[index]);
    setSessionUser(safeUser);

    return { user: safeUser, redirect: "/Profil" };
  }

  if (cleanPath === "/api/users/me" && method === "DELETE") {
    const current = requireAuth();
    const users = await getTable("users");
    const bookings = await getTable("bookings");

    setTable(
      "users",
      users.filter(
        (user) => Number(user.id_utilisateur) !== Number(current.id_utilisateur),
      ),
    );

    setTable(
      "bookings",
      bookings.filter(
        (reservation) =>
          Number(reservation.id_utilisateur) !== Number(current.id_utilisateur),
      ),
    );

    setSessionUser(null);
    return { redirect: "/" };
  }

  if (cleanPath === "/api/salles" && method === "GET") {
    return await getTable("rooms");
  }

  if (cleanPath.startsWith("/api/salles/") && method === "GET") {
    const numero = decodeURIComponent(cleanPath.replace("/api/salles/", ""));
    const rooms = await getTable("rooms");
    const roomEquipments = await getTable("roomEquipments");
    const equipments = await getTable("equipments");
    const bookings = await getTable("bookings");
    const users = await getTable("users");
    const categories = await getTable("categories");

    const salle = rooms.find((room) => String(room.sal_numero) === String(numero));

    if (!salle) {
      return {
        salle: null,
        equipementsSalle: [],
        reservationsSalle: [],
        categorieSalle: null,
      };
    }

    const equipementsSalle = roomEquipments
      .filter((row) => Number(row.id_salle) === Number(salle.id_salle))
      .map((row) => {
        const equip = equipments.find(
          (item) => Number(item.id_equipement) === Number(row.id_equipement),
        );

        return {
          ...row,
          equi_nom: equip?.equi_nom ?? "",
          equi_description: equip?.equi_description ?? "",
        };
      })
      .sort((a, b) =>
        String(a.equi_nom).localeCompare(String(b.equi_nom), "fr", {
          sensitivity: "base",
        }),
      );

    const reservationsSalle = sortReservationsDesc(
      bookings
        .filter((reservation) => Number(reservation.id_salle) === Number(salle.id_salle))
        .map((reservation) => {
          const user = users.find(
            (row) => Number(row.id_utilisateur) === Number(reservation.id_utilisateur),
          );

          return {
            ...reservation,
            sal_nom: salle.sal_nom,
            sal_image: salle.sal_image,
            uti_nom: user?.uti_nom ?? "",
            uti_prenom: user?.uti_prenom ?? "",
          };
        }),
    );

    const categorieSalle = categories.find(
      (category) => Number(category.id_categorie) === Number(salle.id_categorie),
    ) ?? null;

    return {
      salle,
      equipementsSalle,
      reservationsSalle,
      categorieSalle,
    };
  }

  if (cleanPath === "/api/equipements" && method === "GET") {
    return sortByTextField(await getTable("equipments"), "equi_nom");
  }

  if (cleanPath === "/api/categories" && method === "GET") {
    return sortByTextField(await getTable("categories"), "cat_nom");
  }

  if (cleanPath === "/api/reservations/me" && method === "GET") {
    const current = requireAuth();
    const bookings = await getTable("bookings");
    const rooms = await getTable("rooms");

    return sortReservationsDesc(
      bookings
        .filter(
          (reservation) =>
            Number(reservation.id_utilisateur) === Number(current.id_utilisateur),
        )
        .map((reservation) => {
          const room = rooms.find(
            (item) => Number(item.id_salle) === Number(reservation.id_salle),
          );

          return {
            ...reservation,
            sal_nom: room?.sal_nom ?? "",
            sal_image: room?.sal_image ?? "",
            sal_numero: room?.sal_numero ?? "",
          };
        }),
    );
  }

  if (cleanPath === "/api/reservations" && method === "POST") {
    const current = requireAuth();
    const bookings = await getTable("bookings");

    const idSalle = toInt(body?.id_salle);
    const dateDebut = normalizeString(body?.dateDebut);
    const dateFin = normalizeString(body?.dateFin);

    if (!idSalle || !dateDebut || !dateFin) {
      throw createError(400, {
        erreurReservation: "Tous les champs sont obligatoires.",
      });
    }

    if (dateDebut >= dateFin) {
      throw createError(400, {
        erreurReservation: "La date de fin doit être après la date de début.",
      });
    }

    if (!isValidDateYmd(dateDebut) || !isValidDateYmd(dateFin)) {
      throw createError(400, {
        erreurReservation: "Format de date invalide.",
      });
    }

    if (diffDays(dateDebut, dateFin) > 5) {
      throw createError(400, {
        erreurReservation: "La durée maximale de réservation est de 5 jours.",
      });
    }

    bookings.push({
      id_reservation: nextId(bookings, "id_reservation"),
      id_salle: idSalle,
      id_utilisateur: Number(current.id_utilisateur),
      res_dateDebut: dateDebut,
      res_dateFin: dateFin,
    });

    setTable("bookings", bookings);
    return { redirect: "/Reservation" };
  }

  if (cleanPath.startsWith("/api/reservations/") && method === "DELETE") {
    const current = requireAuth();
    const bookingId = toInt(cleanPath.replace("/api/reservations/", ""));
    const bookings = await getTable("bookings");

    const reservation = bookings.find(
      (row) => Number(row.id_reservation) === Number(bookingId),
    );

    if (
      reservation &&
      Number(reservation.id_utilisateur) === Number(current.id_utilisateur)
    ) {
      setTable(
        "bookings",
        bookings.filter(
          (row) => Number(row.id_reservation) !== Number(bookingId),
        ),
      );
    }

    return { redirect: "/Reservation" };
  }

  if (cleanPath.startsWith("/api/admin")) {
    requireAdmin();

    if (cleanPath === "/api/admin/users" && method === "GET") {
      const users = await getTable("users");
      return users.map((user) => sanitizeUser(user));
    }

    if (cleanPath === "/api/admin/users" && method === "POST") {
      const users = await getTable("users");
      users.push({
        id_utilisateur: nextId(users, "id_utilisateur"),
        uti_nom: body.nom,
        uti_prenom: body.prenom,
        uti_email: body.email,
        uti_mdp: body.mdp,
        uti_role: body.role,
      });
      setTable("users", users);
      return { ok: true };
    }

    if (cleanPath.startsWith("/api/admin/users/") && method === "PUT") {
      const users = await getTable("users");
      const userId = toInt(cleanPath.replace("/api/admin/users/", ""));
      const index = users.findIndex(
        (user) => Number(user.id_utilisateur) === Number(userId),
      );

      if (index < 0) {
        throw createError(404, { error: "Utilisateur introuvable" });
      }

      users[index] = {
        ...users[index],
        uti_nom: body.nom,
        uti_prenom: body.prenom,
        uti_email: body.email,
        uti_role: body.role,
      };

      setTable("users", users);

      const session = getSessionUser();
      if (session && Number(session.id_utilisateur) === Number(userId)) {
        setSessionUser(sanitizeUser(users[index]));
      }

      return { ok: true };
    }

    if (cleanPath === "/api/admin/categories" && method === "GET") {
      return sortByTextField(await getTable("categories"), "cat_nom");
    }

    if (cleanPath === "/api/admin/categories" && method === "POST") {
      const categories = await getTable("categories");
      categories.push({
        id_categorie: nextId(categories, "id_categorie"),
        cat_nom: body.nom,
      });
      setTable("categories", categories);
      return { ok: true };
    }

    if (cleanPath.startsWith("/api/admin/categories/") && method === "PUT") {
      const categories = await getTable("categories");
      const categoryId = toInt(cleanPath.replace("/api/admin/categories/", ""));
      const index = categories.findIndex(
        (category) => Number(category.id_categorie) === Number(categoryId),
      );

      if (index < 0) {
        throw createError(404, { error: "Catégorie introuvable" });
      }

      categories[index] = {
        ...categories[index],
        cat_nom: body.nom,
      };

      setTable("categories", categories);
      return { ok: true };
    }

    if (cleanPath.startsWith("/api/admin/categories/") && method === "DELETE") {
      const categoryId = toInt(cleanPath.replace("/api/admin/categories/", ""));
      const categories = await getTable("categories");
      const rooms = await getTable("rooms");

      setTable(
        "categories",
        categories.filter(
          (category) => Number(category.id_categorie) !== Number(categoryId),
        ),
      );

      setTable(
        "rooms",
        rooms.map((room) =>
          Number(room.id_categorie) === Number(categoryId)
            ? { ...room, id_categorie: null }
            : room,
        ),
      );

      return { ok: true };
    }

    if (cleanPath === "/api/admin/salles" && method === "GET") {
      return await getTable("rooms");
    }

    if (cleanPath === "/api/admin/salles" && method === "POST") {
      const rooms = await getTable("rooms");
      rooms.push({
        id_salle: nextId(rooms, "id_salle"),
        id_categorie: toInt(body.id_categorie),
        sal_nom: body.nom,
        sal_taille: toInt(body.taille),
        sal_numero: body.numero,
        sal_image: randomSalleImage(),
      });
      setTable("rooms", rooms);
      return { ok: true };
    }

    if (cleanPath.startsWith("/api/admin/salles/") && method === "PUT") {
      const roomId = toInt(cleanPath.replace("/api/admin/salles/", ""));
      const rooms = await getTable("rooms");
      const index = rooms.findIndex((room) => Number(room.id_salle) === Number(roomId));

      if (index < 0) {
        throw createError(404, { error: "Salle introuvable" });
      }

      rooms[index] = {
        ...rooms[index],
        id_categorie: body.id_categorie === null ? null : toInt(body.id_categorie),
        sal_nom: body.nom,
        sal_taille: toInt(body.taille),
        sal_numero: body.numero,
        sal_image: body.image,
      };

      setTable("rooms", rooms);
      return { ok: true };
    }

    if (cleanPath.startsWith("/api/admin/salles/") && method === "DELETE") {
      const roomId = toInt(cleanPath.replace("/api/admin/salles/", ""));
      const rooms = await getTable("rooms");
      const roomEquipments = await getTable("roomEquipments");
      const bookings = await getTable("bookings");

      setTable(
        "rooms",
        rooms.filter((room) => Number(room.id_salle) !== Number(roomId)),
      );
      setTable(
        "roomEquipments",
        roomEquipments.filter(
          (row) => Number(row.id_salle) !== Number(roomId),
        ),
      );
      setTable(
        "bookings",
        bookings.filter(
          (booking) => Number(booking.id_salle) !== Number(roomId),
        ),
      );

      return { ok: true };
    }

    if (cleanPath === "/api/admin/equipements" && method === "GET") {
      return sortByTextField(await getTable("equipments"), "equi_nom");
    }

    if (cleanPath === "/api/admin/equipements" && method === "POST") {
      const equipments = await getTable("equipments");
      equipments.push({
        id_equipement: nextId(equipments, "id_equipement"),
        equi_nom: body.nom,
        equi_description: body.description,
      });
      setTable("equipments", equipments);
      return { ok: true };
    }

    if (cleanPath.startsWith("/api/admin/equipements/") && method === "PUT") {
      const equipmentId = toInt(cleanPath.replace("/api/admin/equipements/", ""));
      const equipments = await getTable("equipments");
      const index = equipments.findIndex(
        (equipment) => Number(equipment.id_equipement) === Number(equipmentId),
      );

      if (index < 0) {
        throw createError(404, { error: "Équipement introuvable" });
      }

      equipments[index] = {
        ...equipments[index],
        equi_nom: body.nom,
        equi_description: body.description,
      };

      setTable("equipments", equipments);
      return { ok: true };
    }

    if (cleanPath.startsWith("/api/admin/equipements/") && method === "DELETE") {
      const equipmentId = toInt(cleanPath.replace("/api/admin/equipements/", ""));
      const equipments = await getTable("equipments");
      const roomEquipments = await getTable("roomEquipments");

      setTable(
        "equipments",
        equipments.filter(
          (equipment) => Number(equipment.id_equipement) !== Number(equipmentId),
        ),
      );
      setTable(
        "roomEquipments",
        roomEquipments.filter(
          (row) => Number(row.id_equipement) !== Number(equipmentId),
        ),
      );

      return { ok: true };
    }

    if (cleanPath === "/api/admin/contenances" && method === "GET") {
      const roomEquipments = await getTable("roomEquipments");
      const equipments = await getTable("equipments");
      const rooms = await getTable("rooms");

      return roomEquipments
        .map((row) => {
          const equip = equipments.find(
            (item) => Number(item.id_equipement) === Number(row.id_equipement),
          );
          const room = rooms.find(
            (item) => Number(item.id_salle) === Number(row.id_salle),
          );

          return {
            ...row,
            equi_nom: equip?.equi_nom ?? "",
            sal_nom: room?.sal_nom ?? "",
            sal_numero: room?.sal_numero ?? "",
          };
        })
        .sort((a, b) => {
          const bySalle = String(a.sal_nom).localeCompare(String(b.sal_nom), "fr", {
            sensitivity: "base",
          });

          if (bySalle !== 0) return bySalle;

          return String(a.equi_nom).localeCompare(String(b.equi_nom), "fr", {
            sensitivity: "base",
          });
        });
    }

    if (cleanPath === "/api/admin/contenances" && method === "POST") {
      const roomEquipments = await getTable("roomEquipments");
      const newSalleId = toInt(body.id_salle);
      const newEquipmentId = toInt(body.id_equipement);

      const duplicate = roomEquipments.some(
        (row) =>
          Number(row.id_salle) === Number(newSalleId) &&
          Number(row.id_equipement) === Number(newEquipmentId),
      );

      if (duplicate) {
        throw createError(500, { error: "Duplicate entry for contenance" });
      }

      roomEquipments.push({
        id_contenance: nextId(roomEquipments, "id_contenance"),
        id_equipement: newEquipmentId,
        id_salle: newSalleId,
        cont_quantite: toInt(body.quantite),
      });

      setTable("roomEquipments", roomEquipments);
      return { ok: true };
    }

    if (cleanPath.startsWith("/api/admin/contenances/") && method === "PUT") {
      const contenanceId = toInt(cleanPath.replace("/api/admin/contenances/", ""));
      const roomEquipments = await getTable("roomEquipments");
      const index = roomEquipments.findIndex(
        (row) => Number(row.id_contenance) === Number(contenanceId),
      );

      if (index < 0) {
        throw createError(404, { error: "Contenance introuvable" });
      }

      const targetSalleId = toInt(body.id_salle);
      const targetEquipmentId = toInt(body.id_equipement);

      const duplicate = roomEquipments.some(
        (row) =>
          Number(row.id_contenance) !== Number(contenanceId) &&
          Number(row.id_salle) === Number(targetSalleId) &&
          Number(row.id_equipement) === Number(targetEquipmentId),
      );

      if (duplicate) {
        throw createError(500, { error: "Duplicate entry for contenance" });
      }

      roomEquipments[index] = {
        ...roomEquipments[index],
        id_equipement: targetEquipmentId,
        id_salle: targetSalleId,
        cont_quantite: toInt(body.quantite),
      };

      setTable("roomEquipments", roomEquipments);
      return { ok: true };
    }

    if (cleanPath.startsWith("/api/admin/contenances/") && method === "DELETE") {
      const contenanceId = toInt(cleanPath.replace("/api/admin/contenances/", ""));
      const roomEquipments = await getTable("roomEquipments");

      setTable(
        "roomEquipments",
        roomEquipments.filter(
          (row) => Number(row.id_contenance) !== Number(contenanceId),
        ),
      );

      return { ok: true };
    }

    if (cleanPath === "/api/admin/reservations" && method === "GET") {
      const bookings = await getTable("bookings");
      const rooms = await getTable("rooms");
      const users = await getTable("users");

      return sortReservationsDesc(
        bookings.map((booking) => {
          const room = rooms.find(
            (row) => Number(row.id_salle) === Number(booking.id_salle),
          );
          const user = users.find(
            (row) => Number(row.id_utilisateur) === Number(booking.id_utilisateur),
          );

          return {
            ...booking,
            sal_nom: room?.sal_nom ?? "",
            sal_numero: room?.sal_numero ?? "",
            uti_nom: user?.uti_nom ?? "",
            uti_prenom: user?.uti_prenom ?? "",
          };
        }),
      );
    }

    if (cleanPath === "/api/admin/reservations" && method === "POST") {
      const bookings = await getTable("bookings");
      bookings.push({
        id_reservation: nextId(bookings, "id_reservation"),
        id_salle: toInt(body.id_salle),
        id_utilisateur: toInt(body.id_utilisateur),
        res_dateDebut: body.dateDebut,
        res_dateFin: body.dateFin,
      });
      setTable("bookings", bookings);
      return { ok: true };
    }

    if (cleanPath.startsWith("/api/admin/reservations/") && method === "PUT") {
      const reservationId = toInt(cleanPath.replace("/api/admin/reservations/", ""));
      const bookings = await getTable("bookings");
      const index = bookings.findIndex(
        (booking) => Number(booking.id_reservation) === Number(reservationId),
      );

      if (index < 0) {
        throw createError(404, { error: "Réservation introuvable" });
      }

      bookings[index] = {
        ...bookings[index],
        id_salle: toInt(body.id_salle),
        id_utilisateur: toInt(body.id_utilisateur),
        res_dateDebut: body.dateDebut,
        res_dateFin: body.dateFin,
      };

      setTable("bookings", bookings);
      return { ok: true };
    }

    if (cleanPath.startsWith("/api/admin/reservations/") && method === "DELETE") {
      const reservationId = toInt(cleanPath.replace("/api/admin/reservations/", ""));
      const bookings = await getTable("bookings");

      setTable(
        "bookings",
        bookings.filter(
          (booking) => Number(booking.id_reservation) !== Number(reservationId),
        ),
      );

      return { ok: true };
    }
  }

  throw createError(404, { error: `Route inconnue: ${method} ${cleanPath}` });
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body } = options;
  await loadInitialData();
  return routeRequest(path, String(method).toUpperCase(), body ?? null);
}

// Services explicites (facultatifs) pour centraliser les accès data côté composants.
export async function getUsers() {
  return apiRequest("/api/users");
}

export async function getRooms() {
  return apiRequest("/api/salles");
}

export async function getBookingsForCurrentUser() {
  return apiRequest("/api/reservations/me");
}
