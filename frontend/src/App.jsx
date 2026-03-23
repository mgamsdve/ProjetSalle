import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  ChevronDown,
  DoorOpen,
  LayoutDashboard,
  Link2,
  Menu,
  Monitor,
  Plus,
  Tag,
  Trash2,
  Users,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function apiRequest(path, options = {}) {
  const { method = "GET", body } = options;
  const init = {
    method,
    credentials: "include",
    headers: {},
  };

  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, init);

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.error ?? data?.message ?? "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function usePageTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

function getUserInitials(user) {
  if (!user) return "";
  return `${user.uti_prenom?.[0] ?? ""}${user.uti_nom?.[0] ?? ""}`.toUpperCase();
}

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
}

function AdminRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  if (user.uti_role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function Header({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={() => setMobileOpen(false)}>
        <Building2 />
        <span>RoomBook</span>
      </Link>

      <div className={`navbar-links ${mobileOpen ? "open" : ""}`} id="navbar-links">
        <Link to="/" onClick={() => setMobileOpen(false)}>
          Accueil
        </Link>
        <Link to="/Salle" onClick={() => setMobileOpen(false)}>
          Salles
        </Link>
        <Link to="/Equipement" onClick={() => setMobileOpen(false)}>
          Équipements
        </Link>

        {user ? (
          <>
            <Link to="/Reservation" onClick={() => setMobileOpen(false)}>
              Mes réservations
            </Link>
            <Link to="/Utilisateur" onClick={() => setMobileOpen(false)}>
              Utilisateurs
            </Link>

            {user.uti_role === "admin" ? (
              <div className="navbar-dropdown">
                <button className="navbar-dropdown-btn" type="button">
                  Admin <ChevronDown size={14} />
                </button>
                <div className="navbar-dropdown-menu">
                  <Link to="/admin" onClick={() => setMobileOpen(false)}>
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <Link to="/admin/users" onClick={() => setMobileOpen(false)}>
                    <Users size={14} /> Utilisateurs
                  </Link>
                  <Link to="/admin/categories" onClick={() => setMobileOpen(false)}>
                    <Tag size={14} /> Catégories
                  </Link>
                  <Link to="/admin/salles" onClick={() => setMobileOpen(false)}>
                    <DoorOpen size={14} /> Salles
                  </Link>
                  <Link to="/admin/equipements" onClick={() => setMobileOpen(false)}>
                    <Monitor size={14} /> Équipements
                  </Link>
                  <Link to="/admin/contenances" onClick={() => setMobileOpen(false)}>
                    <Link2 size={14} /> Contenances
                  </Link>
                  <Link to="/admin/reservations" onClick={() => setMobileOpen(false)}>
                    <Calendar size={14} /> Réservations
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="navbar-actions">
        {user ? (
          <>
            <div className="navbar-user">
              <div className="navbar-avatar">{getUserInitials(user)}</div>
              <span>{user.uti_prenom}</span>
            </div>
            <Link to="/Profil" className="btn-outline-sm">
              Profil
            </Link>
            <Link to="/deconnexion" className="btn-sm">
              Déconnexion
            </Link>
          </>
        ) : (
          <>
            <Link to="/connexion" className="btn-outline-sm">
              Connexion
            </Link>
            <Link to="/inscription" className="btn-sm">
              Inscription
            </Link>
          </>
        )}
      </div>

      <button
        className="navbar-mobile-toggle"
        type="button"
        aria-label="Menu"
        onClick={() => setMobileOpen((value) => !value)}
      >
        <Menu size={18} />
      </button>
    </nav>
  );
}

function Footer() {
  return <p>&copy; {new Date().getFullYear()} RoomBook &mdash; Réservation de salles</p>;
}

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <Building2 size={20} />
        <span>RoomBook</span>
      </div>

      <Link to="/admin" className="sidebar-link">
        <LayoutDashboard size={16} />
        <span>Dashboard</span>
      </Link>
      <Link to="/admin/users" className="sidebar-link">
        <Users size={16} />
        <span>Utilisateurs</span>
      </Link>
      <Link to="/admin/categories" className="sidebar-link">
        <Tag size={16} />
        <span>Catégories</span>
      </Link>
      <Link to="/admin/salles" className="sidebar-link">
        <DoorOpen size={16} />
        <span>Salles</span>
      </Link>
      <Link to="/admin/equipements" className="sidebar-link">
        <Monitor size={16} />
        <span>Équipements</span>
      </Link>
      <Link to="/admin/contenances" className="sidebar-link">
        <Link2 size={16} />
        <span>Contenances</span>
      </Link>
      <Link to="/admin/reservations" className="sidebar-link">
        <Calendar size={16} />
        <span>Réservations</span>
      </Link>

      <div className="admin-sidebar-footer">
        <Link to="/" className="sidebar-link">
          <ArrowLeft size={16} />
          <span>Site public</span>
        </Link>
      </div>
    </aside>
  );
}

function HomePage() {
  usePageTitle("Accueil");

  const [salles, setSalles] = useState([]);

  useEffect(() => {
    apiRequest("/api/salles")
      .then((rows) => setSalles(rows ?? []))
      .catch(() => setSalles([]));
  }, []);

  const featuredSalles = salles.slice(0, 3);
  const sallesCount = salles.length;

  useEffect(() => {
    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 },
    );

    const elements = Array.from(document.querySelectorAll(".animate-on-scroll"));
    elements.forEach((element) => {
      scrollObserver.observe(element);
    });

    function animateCounter(el, target, duration = 1500) {
      let start = 0;
      const step = target / (duration / 16);

      const timer = setInterval(() => {
        start += step;

        if (start >= target) {
          el.textContent = String(target);
          clearInterval(timer);
          return;
        }

        el.textContent = String(Math.floor(start));
      }, 16);

      return timer;
    }

    let timers = [];
    const statsSection = document.querySelector("#stats-section");
    let countersStarted = false;

    const countersObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !countersStarted) {
            countersStarted = true;

            document.querySelectorAll("[data-counter-target]").forEach((counter) => {
              const target = Number.parseInt(counter.getAttribute("data-counter-target"), 10);
              if (!Number.isNaN(target)) {
                const timer = animateCounter(counter, target);
                timers.push(timer);
              }
            });

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 },
    );

    if (statsSection) {
      countersObserver.observe(statsSection);
    }

    return () => {
      elements.forEach((element) => scrollObserver.unobserve(element));
      scrollObserver.disconnect();
      countersObserver.disconnect();
      timers.forEach((timer) => clearInterval(timer));
      timers = [];
    };
  }, [sallesCount]);

  return (
    <div className="home-page">
      <section className="hero-section animate-on-scroll">
        <div className="hero-inner">
          <h1 className="hero-title">Reservez vos espaces de travail en toute simplicite</h1>
          <p className="hero-subtitle">
            Centralisez les salles, planifiez vos reunions et gagnez du temps avec une experience
            fluide et elegante.
          </p>
          <Link to="/Salle" className="btn cta-button">
            Voir les salles
          </Link>

          <div className="hero-illustration" aria-hidden="true">
            <svg viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="28" y="22" width="164" height="136" rx="20" stroke="currentColor" strokeWidth="8" />
              <rect x="54" y="50" width="40" height="28" rx="6" fill="currentColor" opacity="0.25" />
              <rect x="106" y="50" width="60" height="10" rx="5" fill="currentColor" opacity="0.5" />
              <rect x="106" y="68" width="48" height="10" rx="5" fill="currentColor" opacity="0.35" />
              <rect x="54" y="92" width="112" height="14" rx="7" fill="currentColor" opacity="0.45" />
              <rect x="54" y="114" width="70" height="14" rx="7" fill="currentColor" opacity="0.3" />
              <circle cx="174" cy="122" r="18" stroke="currentColor" strokeWidth="8" />
              <path d="M174 108V122L184 130" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </section>

      <section className="stats-section animate-on-scroll" id="stats-section">
        <div className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon">&#127970;</div>
            <div className="stat-value" data-counter-target={Math.max(12, sallesCount)}>
              0
            </div>
            <p className="stat-label">Salles disponibles</p>
          </article>
          <article className="stat-card">
            <div className="stat-icon">&#128197;</div>
            <div className="stat-value" data-counter-target={340}>
              0
            </div>
            <p className="stat-label">Reservations ce mois</p>
          </article>
          <article className="stat-card">
            <div className="stat-icon">&#128421;</div>
            <div className="stat-value" data-counter-target={45}>
              0
            </div>
            <p className="stat-label">Equipements references</p>
          </article>
        </div>
      </section>

      <section className="how-it-works animate-on-scroll">
        <div className="steps-row">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Choisissez</h3>
            <p>Trouvez une salle adaptee a votre besoin en quelques secondes.</p>
          </div>
          <div className="step-connector" aria-hidden="true" />
          <div className="step">
            <div className="step-number">2</div>
            <h3>Reservez</h3>
            <p>Validez votre demande en ligne avec un parcours simple et rapide.</p>
          </div>
          <div className="step-connector" aria-hidden="true" />
          <div className="step">
            <div className="step-number">3</div>
            <h3>Profitez</h3>
            <p>Accedez a un espace prete a l'emploi pour vos reunions.</p>
          </div>
        </div>
      </section>

      <section className="featured-section animate-on-scroll">
        <h2 className="section-title">Salles en vedette</h2>
        <div className="featured-grid">
          {featuredSalles.length > 0
            ? featuredSalles.map((salle) => (
                <article className="room-card" key={salle.id_salle}>
                  <div className="room-media">
                    {salle.sal_image ? (
                      <img src={salle.sal_image} alt={`Salle ${salle.sal_nom}`} />
                    ) : (
                      <svg
                        width="72"
                        height="72"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        style={{ color: "var(--primary)" }}
                      >
                        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M7 10H17M7 14H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <h3>{salle.sal_nom}</h3>
                  <p className="room-meta">Capacite: {Number(salle.sal_taille ?? 10)} personnes</p>
                  <Link className="btn outline-button" to={`/Salle/Details/${encodeURIComponent(salle.sal_numero)}`}>
                    Reserver
                  </Link>
                </article>
              ))
            : [1, 2, 3].map((i) => (
                <article className="room-card" key={i}>
                  <div className="room-media">
                    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--primary)" }}>
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M7 10H17M7 14H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h3>Salle Premium {i}</h3>
                  <p className="room-meta">Capacite: {8 + i * 2} personnes</p>
                  <Link className="btn outline-button" to="/Salle">
                    Reserver
                  </Link>
                </article>
              ))}
        </div>
      </section>

      <section className="final-cta animate-on-scroll">
        <h2>Pret a reserver votre espace ?</h2>
        <Link to="/Salle" className="btn final-button">
          Voir toutes les salles
        </Link>
      </section>
    </div>
  );
}

function SallesPage() {
  usePageTitle("Salle");

  const [salles, setSalles] = useState([]);

  useEffect(() => {
    apiRequest("/api/salles")
      .then((rows) => setSalles(rows ?? []))
      .catch(() => setSalles([]));
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>Salles disponibles</h1>
        <Link to="/create-reservation" className="btn">
          <Plus size={16} />
          Nouvelle réservation
        </Link>
      </div>

      <div className="Salle-container">
        {salles.map((salle) => (
          <div className="salle" key={salle.id_salle}>
            <Link to={`/Salle/Details/${salle.sal_numero}`}>
              <img
                src={salle.sal_image}
                alt={`Image de ${salle.sal_nom}`}
                className="salle-image"
              />
            </Link>
            <h3>{salle.sal_nom}</h3>
            <p>
              <strong>Capacité :</strong> {salle.sal_taille} m²
            </p>
            <p>
              <strong>Référence :</strong> {salle.sal_numero}
            </p>
            <div className="salle-link">
              <Link to={`/Salle/Details/${salle.sal_numero}`}>Voir détails</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SalleDetailsPage() {
  usePageTitle("Details Salle");

  const { numero } = useParams();
  const [data, setData] = useState({
    salle: null,
    equipementsSalle: [],
    reservationsSalle: [],
    categorieSalle: null,
  });

  useEffect(() => {
    apiRequest(`/api/salles/${encodeURIComponent(numero)}`)
      .then((response) => setData(response))
      .catch(() =>
        setData({
          salle: null,
          equipementsSalle: [],
          reservationsSalle: [],
          categorieSalle: null,
        }),
      );
  }, [numero]);

  const { salle, equipementsSalle, reservationsSalle, categorieSalle } = data;

  if (!salle) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <h1>Salle introuvable</h1>
        <p style={{ marginBottom: 24 }}>La salle demandée n'existe pas.</p>
        <Link to="/Salle" className="btn">
          Retour aux salles
        </Link>
      </div>
    );
  }

  return (
    <div className="details-layout">
      <div className="details-main">
        <h1>{salle.sal_nom}</h1>

        {categorieSalle ? (
          <span className="badge" style={{ marginBottom: 20, display: "inline-block" }}>
            {categorieSalle.cat_nom}
          </span>
        ) : null}

        <img
          src={salle.sal_image}
          alt={`Image de ${salle.sal_nom}`}
          className="salle-image"
          style={{ height: 280, marginBottom: 20 }}
        />

        <div className="details-info-row">
          <p>
            <strong>Référence :</strong> {salle.sal_numero}
          </p>
          <p>
            <strong>Surface :</strong> {salle.sal_taille} m²
          </p>
          {categorieSalle ? (
            <p>
              <strong>Catégorie :</strong> {categorieSalle.cat_nom}
            </p>
          ) : null}
        </div>

        <h2>Équipements</h2>
        {equipementsSalle.length === 0 ? (
          <p style={{ marginBottom: 24 }}>Aucun équipement pour cette salle.</p>
        ) : (
          <div className="equipment-pills" style={{ marginBottom: 24 }}>
            {equipementsSalle.map((equipementSalle) => (
              <div className="equipment-pill" key={equipementSalle.id_contenance}>
                <Monitor style={{ width: 14, height: 14 }} />
                {equipementSalle.equi_nom}
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  × {equipementSalle.cont_quantite}
                </span>
              </div>
            ))}
          </div>
        )}

        <h2>Réservations existantes</h2>
        {reservationsSalle.length === 0 ? (
          <p>Aucune réservation pour cette salle.</p>
        ) : (
          <div className="reservation-list">
            {reservationsSalle.map((reservationSalle) => (
              <div className="reservation-item" key={reservationSalle.id_reservation}>
                <Calendar style={{ width: 16, height: 16, color: "var(--primary)", flexShrink: 0 }} />
                <div>
                  <strong>
                    {reservationSalle.uti_prenom} {reservationSalle.uti_nom}
                  </strong>{" "}
                  &mdash; Du {reservationSalle.res_dateDebut} au {reservationSalle.res_dateFin}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="salle-link" style={{ marginTop: 32 }}>
          <Link to="/Salle">← Retour aux salles</Link>
        </div>
      </div>

      <div>
        <div className="booking-panel">
          <h3>Réserver cette salle</h3>
          <p>
            <strong>Référence :</strong> {salle.sal_numero}
          </p>
          <p>
            <strong>Surface :</strong> {salle.sal_taille} m²
          </p>
          {categorieSalle ? (
            <p>
              <strong>Catégorie :</strong> {categorieSalle.cat_nom}
            </p>
          ) : null}
          <Link to={`/create-reservation?id_salle=${encodeURIComponent(salle.id_salle)}`} className="btn">
            <CalendarPlus size={16} />
            Réserver maintenant
          </Link>
        </div>
      </div>
    </div>
  );
}

function EquipementsPage() {
  usePageTitle("Equipement");

  const [equipements, setEquipements] = useState([]);

  useEffect(() => {
    apiRequest("/api/equipements")
      .then((rows) => setEquipements(rows ?? []))
      .catch(() => setEquipements([]));
  }, []);

  return (
    <>
      <h1>Équipements</h1>

      {equipements.length === 0 ? (
        <p>Aucun équipement disponible pour le moment.</p>
      ) : (
        <div className="Salle-container">
          {equipements.map((equipement) => (
            <div className="salle" key={equipement.id_equipement}>
              <div className="equipement-icon">🛠️</div>
              <h3>{equipement.equi_nom}</h3>
              {equipement.equi_description ? <p>{equipement.equi_description}</p> : null}
              <p className="equipement-id">
                <strong>Ref. :</strong> #{equipement.id_equipement}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ConnexionPage({ setUser }) {
  usePageTitle("Connexion");

  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", mdp: "" });
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: form,
      });

      setUser(data.user);
      setMessage("Connecté");
      navigate("/");
    } catch (error) {
      setMessage(error?.data?.message ?? "Mauvais email ou MDP");
    }
  }

  return (
    <div className="auth-card">
      <h1>Connexion</h1>
      {message ? <p className="form-error">{message}</p> : null}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="votre@email.com"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="mdp">Mot de passe</label>
          <input
            type="password"
            name="mdp"
            id="mdp"
            placeholder="••••••••"
            value={form.mdp}
            onChange={(event) => setForm((current) => ({ ...current, mdp: event.target.value }))}
          />
        </div>
        <input type="submit" value="Se connecter" id="envoyer" name="envoyer" />
      </form>

      <p className="auth-footer">
        Pas encore de compte ? <Link to="/inscription">S'inscrire</Link>
      </p>
    </div>
  );
}

function InscriptionPage() {
  usePageTitle("Inscription");

  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", mdp: "" });
  const [messageError, setMessageError] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setMessageError({});

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: form,
      });
      navigate("/connexion");
    } catch (error) {
      setMessageError(error?.data?.messageError ?? {});
    }
  }

  return (
    <div className="auth-card">
      <h1>Inscription</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nom">Nom</label>
          <input
            type="text"
            name="nom"
            id="nom"
            value={form.nom}
            placeholder="Nom"
            onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
          />
          {messageError.nom ? <small className="form-error">{messageError.nom}</small> : null}
        </div>

        <div className="form-group">
          <label htmlFor="prenom">Prénom</label>
          <input
            type="text"
            name="prenom"
            id="prenom"
            value={form.prenom}
            placeholder="Prénom"
            onChange={(event) => setForm((current) => ({ ...current, prenom: event.target.value }))}
          />
          {messageError.prenom ? <small className="form-error">{messageError.prenom}</small> : null}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={form.email}
            placeholder="votre.email@example.com"
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
          {messageError.email ? <small className="form-error">{messageError.email}</small> : null}
        </div>

        <div className="form-group">
          <label htmlFor="mdp">Mot de passe</label>
          <input
            type="password"
            name="mdp"
            id="mdp"
            placeholder="Votre mot de passe"
            value={form.mdp}
            onChange={(event) => setForm((current) => ({ ...current, mdp: event.target.value }))}
          />
          {messageError.mdp ? <small className="form-error">{messageError.mdp}</small> : null}
        </div>

        <input type="submit" value="S'inscrire" name="envoyer" />
      </form>

      <p className="auth-footer">
        Déjà un compte ? <Link to="/connexion">Se connecter</Link>
      </p>
    </div>
  );
}

function ProfilPage({ user, setUser }) {
  usePageTitle("Mon Profil");

  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: "", prenom: "", email: "" });

  useEffect(() => {
    if (user) {
      setForm({
        nom: user.uti_nom,
        prenom: user.uti_prenom,
        email: user.uti_email,
      });
    }
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const data = await apiRequest("/api/users/me", {
        method: "PUT",
        body: form,
      });

      if (data.user) {
        setUser(data.user);
      }
    } catch {
      // La vue PHP d'origine ne montre pas l'erreur dans la page profil.
    }
  }

  async function handleDeleteProfile(event) {
    event.preventDefault();
    await apiRequest("/api/users/me", { method: "DELETE" });
    setUser(null);
    navigate("/");
  }

  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  return (
    <div className="auth-card" style={{ maxWidth: 520 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28, gap: 12 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--primary-light)",
            color: "var(--primary)",
            fontSize: "1.5rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {getUserInitials(user)}
        </div>
        <h1 style={{ marginBottom: 0, fontSize: "1.4rem" }}>Votre Profil</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nom">Nom</label>
          <input
            type="text"
            name="nom"
            id="nom"
            value={form.nom}
            onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="prenom">Prénom</label>
          <input
            type="text"
            name="prenom"
            id="prenom"
            value={form.prenom}
            onChange={(event) => setForm((current) => ({ ...current, prenom: event.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </div>

        <input
          type="submit"
          value="Mettre à jour"
          name="envoyer"
          style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}
        />
      </form>

      <div id="profile-links">
        <a
          href=""
          className="btn-link"
          onClick={(event) => {
            event.preventDefault();
          }}
        >
          Réinitialiser le mot de passe
        </a>
        <Link to="/deconnexion" className="btn-link">
          Se déconnecter
        </Link>
        <a
          href="/deleteProfil"
          className="btn-danger"
          style={{ padding: "8px 16px", fontSize: "0.85rem", borderRadius: "var(--radius-sm)" }}
          onClick={handleDeleteProfile}
        >
          Supprimer le compte
        </a>
      </div>
    </div>
  );
}

function UtilisateursPage() {
  usePageTitle("Utilisateurs");

  const [users, setUsers] = useState([]);

  useEffect(() => {
    apiRequest("/api/users")
      .then((rows) => setUsers(rows ?? []))
      .catch(() => setUsers([]));
  }, []);

  return (
    <>
      <h1>Utilisateurs</h1>

      <div className="Salle-container">
        {users.map((user) => (
          <div className="salle" key={user.id_utilisateur}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--primary-light)",
                  color: "var(--primary)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {getUserInitials(user)}
              </div>
              <h3>
                {user.uti_nom} {user.uti_prenom}
              </h3>
            </div>
            <p>
              <strong>Email :</strong> {user.uti_email}
            </p>
            <p>
              <strong>Rôle :</strong>{" "}
              <span className={`role ${String(user.uti_role).toLowerCase()}`}>{user.uti_role}</span>
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>ID : #{user.id_utilisateur}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function ReservationsPage({ user }) {
  usePageTitle("Mes Réservations");

  const [reservations, setReservations] = useState([]);

  async function loadReservations() {
    try {
      const rows = await apiRequest("/api/reservations/me");
      setReservations(rows ?? []);
    } catch {
      setReservations([]);
    }
  }

  useEffect(() => {
    loadReservations();
  }, []);

  async function handleDeleteReservation(id) {
    const confirmed = window.confirm("Confirmer la suppression de cette réservation ?");

    if (!confirmed) {
      return;
    }

    await apiRequest(`/api/reservations/${id}`, { method: "DELETE" });
    await loadReservations();
  }

  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  return (
    <>
      <div className="page-header">
        <h1>Mes Réservations</h1>
        <Link to="/create-reservation" className="btn">
          <Plus size={16} />
          Nouvelle réservation
        </Link>
      </div>

      {reservations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
          <CalendarX
            style={{ width: 48, height: 48, margin: "0 auto 16px", display: "block", color: "var(--text-muted)" }}
          />
          <p style={{ fontSize: "1rem", marginBottom: 20 }}>
            Vous n'avez aucune réservation pour le moment.
          </p>
          <Link to="/Salle" className="btn">
            Voir les salles disponibles
          </Link>
        </div>
      ) : (
        <div className="Salle-container">
          {reservations.map((reservation) => (
            <div className="salle" key={reservation.id_reservation}>
              <Link to={`/Salle/Details/${reservation.sal_numero}`}>
                <img
                  src={reservation.sal_image}
                  alt={`Image de ${reservation.sal_nom}`}
                  className="salle-image"
                />
              </Link>
              <h3>{reservation.sal_nom}</h3>
              <p>
                <Calendar style={{ width: 13, height: 13, display: "inline", verticalAlign: "middle" }} />{" "}
                <strong>Début :</strong> {reservation.res_dateDebut}
              </p>
              <p>
                <CalendarCheck style={{ width: 13, height: 13, display: "inline", verticalAlign: "middle" }} />{" "}
                <strong>Fin :</strong> {reservation.res_dateFin}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Réservation #{reservation.id_reservation}
              </p>
              <div className="salle-link">
                <a
                  href={`/delete-reservation?id=${reservation.id_reservation}`}
                  className="btn-delete"
                  onClick={(event) => {
                    event.preventDefault();
                    handleDeleteReservation(reservation.id_reservation);
                  }}
                >
                  <Trash2 style={{ width: 13, height: 13 }} />
                  Annuler
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function CreateReservationPage({ user }) {
  usePageTitle("Nouvelle réservation");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSalleId = searchParams.get("id_salle") ?? "";
  const [salles, setSalles] = useState([]);
  const [erreurReservation, setErreurReservation] = useState("");
  const [form, setForm] = useState({ id_salle: "", dateDebut: "", dateFin: "" });

  useEffect(() => {
    apiRequest("/api/salles")
      .then((rows) => {
        const safeRows = rows ?? [];
        setSalles(safeRows);

        setForm((current) => {
          if (current.id_salle || !preselectedSalleId) {
            return current;
          }

          const exists = safeRows.some(
            (salle) => String(salle.id_salle) === String(preselectedSalleId),
          );

          if (!exists) {
            return current;
          }

          return { ...current, id_salle: String(preselectedSalleId) };
        });
      })
      .catch(() => setSalles([]));
  }, [preselectedSalleId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErreurReservation("");

    try {
      await apiRequest("/api/reservations", {
        method: "POST",
        body: form,
      });

      navigate("/Reservation");
    } catch (error) {
      setErreurReservation(error?.data?.erreurReservation ?? "Erreur inattendue");
    }
  }

  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  return (
    <div className="auth-card">
      <h1>Nouvelle réservation</h1>

      {erreurReservation ? <p className="form-error">{erreurReservation}</p> : null}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="id_salle">Salle</label>
          <select
            name="id_salle"
            id="id_salle"
            required
            value={form.id_salle}
            onChange={(event) => setForm((current) => ({ ...current, id_salle: event.target.value }))}
          >
            <option value="">-- Choisir une salle --</option>
            {salles.map((salle) => (
              <option value={salle.id_salle} key={salle.id_salle}>
                {salle.sal_nom} (N°{salle.sal_numero})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="dateDebut">Date de début</label>
          <input
            type="date"
            name="dateDebut"
            id="dateDebut"
            required
            value={form.dateDebut}
            onChange={(event) => setForm((current) => ({ ...current, dateDebut: event.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="dateFin">Date de fin</label>
          <input
            type="date"
            name="dateFin"
            id="dateFin"
            required
            value={form.dateFin}
            onChange={(event) => setForm((current) => ({ ...current, dateFin: event.target.value }))}
          />
        </div>

        <div className="form-actions">
          <input type="submit" name="creerReservation" value="Créer la réservation" />
          <Link to="/Reservation" className="btn btn-secondary">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}

function AdminDashboardPage() {
  usePageTitle("Administration");

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h1>Administration</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>
          Gérez toutes les ressources de l'application.
        </p>

        <div className="admin-kpi-grid">
          <div className="admin-kpi">
            <div className="admin-kpi-icon">
              <Users />
            </div>
            <div className="admin-kpi-label">Utilisateurs</div>
            <p>Gérer les comptes et les rôles.</p>
            <Link to="/admin/users" className="btn">
              Ouvrir
            </Link>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-icon">
              <Tag />
            </div>
            <div className="admin-kpi-label">Catégories</div>
            <p>Gérer les catégories des salles.</p>
            <Link to="/admin/categories" className="btn">
              Ouvrir
            </Link>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-icon">
              <DoorOpen />
            </div>
            <div className="admin-kpi-label">Salles</div>
            <p>Gérer les salles et leurs infos.</p>
            <Link to="/admin/salles" className="btn">
              Ouvrir
            </Link>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-icon">
              <Monitor />
            </div>
            <div className="admin-kpi-label">Équipements</div>
            <p>Gérer les équipements disponibles.</p>
            <Link to="/admin/equipements" className="btn">
              Ouvrir
            </Link>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-icon">
              <Link2 />
            </div>
            <div className="admin-kpi-label">Contenances</div>
            <p>Associer équipements et salles.</p>
            <Link to="/admin/contenances" className="btn">
              Ouvrir
            </Link>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-icon">
              <Calendar />
            </div>
            <div className="admin-kpi-label">Réservations</div>
            <p>Gérer toutes les réservations.</p>
            <Link to="/admin/reservations" className="btn">
              Ouvrir
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUsersPage() {
  usePageTitle("Admin Utilisateurs");

  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    nom: "",
    prenom: "",
    email: "",
    mdp: "",
    role: "utilisateur",
  });

  async function loadUsers() {
    const rows = await apiRequest("/api/admin/users");
    setUsers(rows ?? []);
  }

  useEffect(() => {
    loadUsers().catch(() => setUsers([]));
  }, []);

  async function handleAddUser(event) {
    event.preventDefault();
    await apiRequest("/api/admin/users", {
      method: "POST",
      body: newUser,
    });

    setNewUser({ nom: "", prenom: "", email: "", mdp: "", role: "utilisateur" });
    await loadUsers();
  }

  async function handleUpdateUser(event, user) {
    event.preventDefault();
    await apiRequest(`/api/admin/users/${user.id_utilisateur}`, {
      method: "PUT",
      body: {
        nom: user.uti_nom,
        prenom: user.uti_prenom,
        email: user.uti_email,
        role: user.uti_role,
      },
    });

    await loadUsers();
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h1>Utilisateurs</h1>
        <Link to="/admin" className="admin-back">
          <ArrowLeft style={{ width: 14, height: 14 }} /> Retour à l'administration
        </Link>

        <section className="admin-section">
          <form className="admin-form" onSubmit={handleAddUser}>
            <input type="hidden" name="action" value="addUser" />

            <label htmlFor="user_nom">Nom</label>
            <input
              type="text"
              id="user_nom"
              required
              value={newUser.nom}
              onChange={(event) => setNewUser((current) => ({ ...current, nom: event.target.value }))}
            />

            <label htmlFor="user_prenom">Prénom</label>
            <input
              type="text"
              id="user_prenom"
              required
              value={newUser.prenom}
              onChange={(event) => setNewUser((current) => ({ ...current, prenom: event.target.value }))}
            />

            <label htmlFor="user_email">Email</label>
            <input
              type="email"
              id="user_email"
              required
              value={newUser.email}
              onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))}
            />

            <label htmlFor="user_mdp">Mot de passe</label>
            <input
              type="password"
              id="user_mdp"
              required
              value={newUser.mdp}
              onChange={(event) => setNewUser((current) => ({ ...current, mdp: event.target.value }))}
            />

            <label htmlFor="user_role">Rôle</label>
            <select
              id="user_role"
              value={newUser.role}
              onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value }))}
            >
              <option value="utilisateur">utilisateur</option>
              <option value="admin">admin</option>
            </select>

            <input type="submit" value="Ajouter un utilisateur" />
          </form>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id_utilisateur}>
                    <td>{user.id_utilisateur}</td>
                    <td>
                      <input
                        type="text"
                        required
                        value={user.uti_nom}
                        onChange={(event) =>
                          setUsers((rows) =>
                            rows.map((row) =>
                              row.id_utilisateur === user.id_utilisateur
                                ? { ...row, uti_nom: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        required
                        value={user.uti_prenom}
                        onChange={(event) =>
                          setUsers((rows) =>
                            rows.map((row) =>
                              row.id_utilisateur === user.id_utilisateur
                                ? { ...row, uti_prenom: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        required
                        value={user.uti_email}
                        onChange={(event) =>
                          setUsers((rows) =>
                            rows.map((row) =>
                              row.id_utilisateur === user.id_utilisateur
                                ? { ...row, uti_email: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={user.uti_role}
                        onChange={(event) =>
                          setUsers((rows) =>
                            rows.map((row) =>
                              row.id_utilisateur === user.id_utilisateur
                                ? { ...row, uti_role: event.target.value }
                                : row,
                            ),
                          )
                        }
                      >
                        <option value="utilisateur">utilisateur</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <form className="admin-inline-form" onSubmit={(event) => handleUpdateUser(event, user)}>
                        <button type="submit">Modifier</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminCategoriesPage() {
  usePageTitle("Admin Categories");

  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");

  async function loadCategories() {
    const rows = await apiRequest("/api/admin/categories");
    setCategories(rows ?? []);
  }

  useEffect(() => {
    loadCategories().catch(() => setCategories([]));
  }, []);

  async function handleAddCategory(event) {
    event.preventDefault();
    await apiRequest("/api/admin/categories", {
      method: "POST",
      body: { nom: newName },
    });
    setNewName("");
    await loadCategories();
  }

  async function handleUpdateCategory(event, category) {
    event.preventDefault();
    await apiRequest(`/api/admin/categories/${category.id_categorie}`, {
      method: "PUT",
      body: { nom: category.cat_nom },
    });
    await loadCategories();
  }

  async function handleDeleteCategory(event, categoryId) {
    event.preventDefault();
    await apiRequest(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
    await loadCategories();
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h1>Catégories</h1>
        <Link to="/admin" className="admin-back">
          <ArrowLeft style={{ width: 14, height: 14 }} /> Retour à l'administration
        </Link>

        <section className="admin-section">
          <form className="admin-form" onSubmit={handleAddCategory}>
            <input type="hidden" name="action" value="addCategory" />

            <label htmlFor="cat_nom">Nom</label>
            <input
              type="text"
              id="cat_nom"
              required
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />

            <input type="submit" value="Ajouter une catégorie" />
          </form>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Modifier</th>
                  <th>Supprimer</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id_categorie}>
                    <td>{category.id_categorie}</td>
                    <td>
                      <input
                        type="text"
                        required
                        value={category.cat_nom}
                        onChange={(event) =>
                          setCategories((rows) =>
                            rows.map((row) =>
                              row.id_categorie === category.id_categorie
                                ? { ...row, cat_nom: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <form className="admin-inline-form" onSubmit={(event) => handleUpdateCategory(event, category)}>
                        <button type="submit">Modifier</button>
                      </form>
                    </td>
                    <td>
                      <form className="admin-inline-form" onSubmit={(event) => handleDeleteCategory(event, category.id_categorie)}>
                        <button type="submit" className="btn-danger">
                          Supprimer
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminSallesPage() {
  usePageTitle("Admin Salles");

  const [categories, setCategories] = useState([]);
  const [salles, setSalles] = useState([]);
  const [newSalle, setNewSalle] = useState({
    id_categorie: "",
    nom: "",
    taille: "",
    numero: "",
  });

  async function loadData() {
    const [categoriesRows, sallesRows] = await Promise.all([
      apiRequest("/api/admin/categories"),
      apiRequest("/api/admin/salles"),
    ]);

    setCategories(categoriesRows ?? []);
    setSalles(sallesRows ?? []);

    if (!newSalle.id_categorie && categoriesRows?.[0]?.id_categorie) {
      setNewSalle((current) => ({
        ...current,
        id_categorie: String(categoriesRows[0].id_categorie),
      }));
    }
  }

  useEffect(() => {
    loadData().catch(() => {
      setCategories([]);
      setSalles([]);
    });
  }, []);

  async function handleAddSalle(event) {
    event.preventDefault();
    await apiRequest("/api/admin/salles", {
      method: "POST",
      body: newSalle,
    });

    setNewSalle((current) => ({
      ...current,
      nom: "",
      taille: "",
      numero: "",
    }));

    await loadData();
  }

  async function handleUpdateSalle(event, salle) {
    event.preventDefault();
    await apiRequest(`/api/admin/salles/${salle.id_salle}`, {
      method: "PUT",
      body: {
        id_categorie: salle.id_categorie,
        nom: salle.sal_nom,
        taille: salle.sal_taille,
        numero: salle.sal_numero,
        image: salle.sal_image,
      },
    });

    await loadData();
  }

  async function handleDeleteSalle(event, idSalle) {
    event.preventDefault();
    await apiRequest(`/api/admin/salles/${idSalle}`, { method: "DELETE" });
    await loadData();
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h1>Salles</h1>
        <Link to="/admin" className="admin-back">
          <ArrowLeft style={{ width: 14, height: 14 }} /> Retour à l'administration
        </Link>

        <section className="admin-section">
          <form className="admin-form" onSubmit={handleAddSalle}>
            <input type="hidden" name="action" value="addSalle" />

            <label htmlFor="salle_categorie">Catégorie</label>
            <select
              id="salle_categorie"
              value={newSalle.id_categorie}
              onChange={(event) =>
                setNewSalle((current) => ({ ...current, id_categorie: event.target.value }))
              }
            >
              {categories.map((category) => (
                <option key={category.id_categorie} value={category.id_categorie}>
                  {category.cat_nom}
                </option>
              ))}
            </select>

            <label htmlFor="salle_nom">Nom</label>
            <input
              type="text"
              id="salle_nom"
              required
              value={newSalle.nom}
              onChange={(event) =>
                setNewSalle((current) => ({ ...current, nom: event.target.value }))
              }
            />

            <label htmlFor="salle_taille">Taille</label>
            <input
              type="number"
              id="salle_taille"
              required
              value={newSalle.taille}
              onChange={(event) =>
                setNewSalle((current) => ({ ...current, taille: event.target.value }))
              }
            />

            <label htmlFor="salle_numero">Numéro</label>
            <input
              type="text"
              id="salle_numero"
              required
              value={newSalle.numero}
              onChange={(event) =>
                setNewSalle((current) => ({ ...current, numero: event.target.value }))
              }
            />

            <p>Image : lien Unsplash aléatoire ajouté automatiquement.</p>

            <input type="submit" value="Ajouter une salle" />
          </form>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Catégorie</th>
                  <th>Nom</th>
                  <th>Taille</th>
                  <th>Numéro</th>
                  <th>Image</th>
                  <th>Modifier</th>
                  <th>Supprimer</th>
                </tr>
              </thead>
              <tbody>
                {salles.map((salle) => (
                  <tr key={salle.id_salle}>
                    <td>{salle.id_salle}</td>
                    <td>
                      <select
                        value={salle.id_categorie}
                        onChange={(event) =>
                          setSalles((rows) =>
                            rows.map((row) =>
                              row.id_salle === salle.id_salle
                                ? { ...row, id_categorie: event.target.value }
                                : row,
                            ),
                          )
                        }
                      >
                        {categories.map((category) => (
                          <option key={category.id_categorie} value={category.id_categorie}>
                            {category.cat_nom}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        required
                        value={salle.sal_nom}
                        onChange={(event) =>
                          setSalles((rows) =>
                            rows.map((row) =>
                              row.id_salle === salle.id_salle
                                ? { ...row, sal_nom: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        required
                        value={salle.sal_taille}
                        onChange={(event) =>
                          setSalles((rows) =>
                            rows.map((row) =>
                              row.id_salle === salle.id_salle
                                ? { ...row, sal_taille: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        required
                        value={salle.sal_numero}
                        onChange={(event) =>
                          setSalles((rows) =>
                            rows.map((row) =>
                              row.id_salle === salle.id_salle
                                ? { ...row, sal_numero: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={salle.sal_image ?? ""}
                        onChange={(event) =>
                          setSalles((rows) =>
                            rows.map((row) =>
                              row.id_salle === salle.id_salle
                                ? { ...row, sal_image: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <form className="admin-inline-form" onSubmit={(event) => handleUpdateSalle(event, salle)}>
                        <button type="submit">Modifier</button>
                      </form>
                    </td>
                    <td>
                      <form className="admin-inline-form" onSubmit={(event) => handleDeleteSalle(event, salle.id_salle)}>
                        <button type="submit" className="btn-danger">
                          Supprimer
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminEquipementsPage() {
  usePageTitle("Admin Equipements");

  const [equipements, setEquipements] = useState([]);
  const [newEquipement, setNewEquipement] = useState({ nom: "", description: "" });

  async function loadEquipements() {
    const rows = await apiRequest("/api/admin/equipements");
    setEquipements(rows ?? []);
  }

  useEffect(() => {
    loadEquipements().catch(() => setEquipements([]));
  }, []);

  async function handleAddEquipement(event) {
    event.preventDefault();
    await apiRequest("/api/admin/equipements", {
      method: "POST",
      body: newEquipement,
    });

    setNewEquipement({ nom: "", description: "" });
    await loadEquipements();
  }

  async function handleUpdateEquipement(event, equipement) {
    event.preventDefault();
    await apiRequest(`/api/admin/equipements/${equipement.id_equipement}`, {
      method: "PUT",
      body: {
        nom: equipement.equi_nom,
        description: equipement.equi_description,
      },
    });

    await loadEquipements();
  }

  async function handleDeleteEquipement(event, idEquipement) {
    event.preventDefault();
    await apiRequest(`/api/admin/equipements/${idEquipement}`, { method: "DELETE" });
    await loadEquipements();
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h1>Équipements</h1>
        <Link to="/admin" className="admin-back">
          <ArrowLeft style={{ width: 14, height: 14 }} /> Retour à l'administration
        </Link>

        <section className="admin-section">
          <form className="admin-form" onSubmit={handleAddEquipement}>
            <input type="hidden" name="action" value="addEquipement" />

            <label htmlFor="equipement_nom">Nom</label>
            <input
              type="text"
              id="equipement_nom"
              required
              value={newEquipement.nom}
              onChange={(event) =>
                setNewEquipement((current) => ({ ...current, nom: event.target.value }))
              }
            />

            <label htmlFor="equipement_description">Description</label>
            <input
              type="text"
              id="equipement_description"
              required
              value={newEquipement.description}
              onChange={(event) =>
                setNewEquipement((current) => ({ ...current, description: event.target.value }))
              }
            />

            <input type="submit" value="Ajouter un équipement" />
          </form>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Description</th>
                  <th>Modifier</th>
                  <th>Supprimer</th>
                </tr>
              </thead>
              <tbody>
                {equipements.map((equipement) => (
                  <tr key={equipement.id_equipement}>
                    <td>{equipement.id_equipement}</td>
                    <td>
                      <input
                        type="text"
                        required
                        value={equipement.equi_nom}
                        onChange={(event) =>
                          setEquipements((rows) =>
                            rows.map((row) =>
                              row.id_equipement === equipement.id_equipement
                                ? { ...row, equi_nom: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        required
                        value={equipement.equi_description}
                        onChange={(event) =>
                          setEquipements((rows) =>
                            rows.map((row) =>
                              row.id_equipement === equipement.id_equipement
                                ? { ...row, equi_description: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <form className="admin-inline-form" onSubmit={(event) => handleUpdateEquipement(event, equipement)}>
                        <button type="submit">Modifier</button>
                      </form>
                    </td>
                    <td>
                      <form className="admin-inline-form" onSubmit={(event) => handleDeleteEquipement(event, equipement.id_equipement)}>
                        <button type="submit" className="btn-danger">
                          Supprimer
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminContenancesPage() {
  usePageTitle("Admin Contenances");

  const [salles, setSalles] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [contenances, setContenances] = useState([]);
  const [newContenance, setNewContenance] = useState({
    id_salle: "",
    id_equipement: "",
    quantite: "",
  });

  async function loadData() {
    const [sallesRows, equipementsRows, contenancesRows] = await Promise.all([
      apiRequest("/api/admin/salles"),
      apiRequest("/api/admin/equipements"),
      apiRequest("/api/admin/contenances"),
    ]);

    setSalles(sallesRows ?? []);
    setEquipements(equipementsRows ?? []);
    setContenances(contenancesRows ?? []);

    setNewContenance((current) => ({
      ...current,
      id_salle:
        current.id_salle || (sallesRows?.[0] ? String(sallesRows[0].id_salle) : ""),
      id_equipement:
        current.id_equipement ||
        (equipementsRows?.[0] ? String(equipementsRows[0].id_equipement) : ""),
    }));
  }

  useEffect(() => {
    loadData().catch(() => {
      setSalles([]);
      setEquipements([]);
      setContenances([]);
    });
  }, []);

  async function handleAddContenance(event) {
    event.preventDefault();
    await apiRequest("/api/admin/contenances", {
      method: "POST",
      body: newContenance,
    });

    setNewContenance((current) => ({ ...current, quantite: "" }));
    await loadData();
  }

  async function handleUpdateContenance(event, contenance) {
    event.preventDefault();
    await apiRequest(`/api/admin/contenances/${contenance.id_contenance}`, {
      method: "PUT",
      body: {
        id_salle: contenance.id_salle,
        id_equipement: contenance.id_equipement,
        quantite: contenance.cont_quantite,
      },
    });

    await loadData();
  }

  async function handleDeleteContenance(event, idContenance) {
    event.preventDefault();
    await apiRequest(`/api/admin/contenances/${idContenance}`, { method: "DELETE" });
    await loadData();
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h1>Contenances</h1>
        <Link to="/admin" className="admin-back">
          <ArrowLeft style={{ width: 14, height: 14 }} /> Retour à l'administration
        </Link>

        <section className="admin-section">
          <form className="admin-form" onSubmit={handleAddContenance}>
            <input type="hidden" name="action" value="addContenance" />

            <label htmlFor="contenance_salle">Salle</label>
            <select
              id="contenance_salle"
              value={newContenance.id_salle}
              onChange={(event) =>
                setNewContenance((current) => ({ ...current, id_salle: event.target.value }))
              }
            >
              {salles.map((salle) => (
                <option key={salle.id_salle} value={salle.id_salle}>
                  {salle.sal_nom} ({salle.sal_numero})
                </option>
              ))}
            </select>

            <label htmlFor="contenance_equipement">Équipement</label>
            <select
              id="contenance_equipement"
              value={newContenance.id_equipement}
              onChange={(event) =>
                setNewContenance((current) => ({ ...current, id_equipement: event.target.value }))
              }
            >
              {equipements.map((equipement) => (
                <option key={equipement.id_equipement} value={equipement.id_equipement}>
                  {equipement.equi_nom}
                </option>
              ))}
            </select>

            <label htmlFor="contenance_quantite">Quantité</label>
            <input
              type="number"
              id="contenance_quantite"
              required
              value={newContenance.quantite}
              onChange={(event) =>
                setNewContenance((current) => ({ ...current, quantite: event.target.value }))
              }
            />

            <input type="submit" value="Ajouter une contenance" />
          </form>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Salle</th>
                  <th>Équipement</th>
                  <th>Quantité</th>
                  <th>Modifier</th>
                  <th>Supprimer</th>
                </tr>
              </thead>
              <tbody>
                {contenances.map((contenance) => (
                  <tr key={contenance.id_contenance}>
                    <td>{contenance.id_contenance}</td>
                    <td>
                      <select
                        value={contenance.id_salle}
                        onChange={(event) =>
                          setContenances((rows) =>
                            rows.map((row) =>
                              row.id_contenance === contenance.id_contenance
                                ? { ...row, id_salle: event.target.value }
                                : row,
                            ),
                          )
                        }
                      >
                        {salles.map((salle) => (
                          <option key={salle.id_salle} value={salle.id_salle}>
                            {salle.sal_nom} ({salle.sal_numero})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={contenance.id_equipement}
                        onChange={(event) =>
                          setContenances((rows) =>
                            rows.map((row) =>
                              row.id_contenance === contenance.id_contenance
                                ? { ...row, id_equipement: event.target.value }
                                : row,
                            ),
                          )
                        }
                      >
                        {equipements.map((equipement) => (
                          <option key={equipement.id_equipement} value={equipement.id_equipement}>
                            {equipement.equi_nom}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        required
                        value={contenance.cont_quantite}
                        onChange={(event) =>
                          setContenances((rows) =>
                            rows.map((row) =>
                              row.id_contenance === contenance.id_contenance
                                ? { ...row, cont_quantite: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <form className="admin-inline-form" onSubmit={(event) => handleUpdateContenance(event, contenance)}>
                        <button type="submit">Modifier</button>
                      </form>
                    </td>
                    <td>
                      <form className="admin-inline-form" onSubmit={(event) => handleDeleteContenance(event, contenance.id_contenance)}>
                        <button type="submit" className="btn-danger">
                          Supprimer
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminReservationsPage() {
  usePageTitle("Admin Reservations");

  const [salles, setSalles] = useState([]);
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [newReservation, setNewReservation] = useState({
    id_salle: "",
    id_utilisateur: "",
    dateDebut: "",
    dateFin: "",
  });

  async function loadData() {
    const [sallesRows, usersRows, reservationsRows] = await Promise.all([
      apiRequest("/api/admin/salles"),
      apiRequest("/api/admin/users"),
      apiRequest("/api/admin/reservations"),
    ]);

    setSalles(sallesRows ?? []);
    setUsers(usersRows ?? []);
    setReservations(reservationsRows ?? []);

    setNewReservation((current) => ({
      ...current,
      id_salle: current.id_salle || (sallesRows?.[0] ? String(sallesRows[0].id_salle) : ""),
      id_utilisateur:
        current.id_utilisateur || (usersRows?.[0] ? String(usersRows[0].id_utilisateur) : ""),
    }));
  }

  useEffect(() => {
    loadData().catch(() => {
      setSalles([]);
      setUsers([]);
      setReservations([]);
    });
  }, []);

  async function handleAddReservation(event) {
    event.preventDefault();
    await apiRequest("/api/admin/reservations", {
      method: "POST",
      body: newReservation,
    });

    setNewReservation((current) => ({ ...current, dateDebut: "", dateFin: "" }));
    await loadData();
  }

  async function handleUpdateReservation(event, reservation) {
    event.preventDefault();
    await apiRequest(`/api/admin/reservations/${reservation.id_reservation}`, {
      method: "PUT",
      body: {
        id_salle: reservation.id_salle,
        id_utilisateur: reservation.id_utilisateur,
        dateDebut: reservation.res_dateDebut,
        dateFin: reservation.res_dateFin,
      },
    });

    await loadData();
  }

  async function handleDeleteReservation(event, idReservation) {
    event.preventDefault();
    await apiRequest(`/api/admin/reservations/${idReservation}`, { method: "DELETE" });
    await loadData();
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h1>Réservations</h1>
        <Link to="/admin" className="admin-back">
          <ArrowLeft style={{ width: 14, height: 14 }} /> Retour à l'administration
        </Link>

        <section className="admin-section">
          <form className="admin-form" onSubmit={handleAddReservation}>
            <input type="hidden" name="action" value="addReservation" />

            <label htmlFor="reservation_salle">Salle</label>
            <select
              id="reservation_salle"
              value={newReservation.id_salle}
              onChange={(event) =>
                setNewReservation((current) => ({ ...current, id_salle: event.target.value }))
              }
            >
              {salles.map((salle) => (
                <option key={salle.id_salle} value={salle.id_salle}>
                  {salle.sal_nom} ({salle.sal_numero})
                </option>
              ))}
            </select>

            <label htmlFor="reservation_user">Utilisateur</label>
            <select
              id="reservation_user"
              value={newReservation.id_utilisateur}
              onChange={(event) =>
                setNewReservation((current) => ({ ...current, id_utilisateur: event.target.value }))
              }
            >
              {users.map((user) => (
                <option key={user.id_utilisateur} value={user.id_utilisateur}>
                  {user.uti_nom} {user.uti_prenom}
                </option>
              ))}
            </select>

            <label htmlFor="reservation_debut">Date de début</label>
            <input
              type="date"
              id="reservation_debut"
              required
              value={newReservation.dateDebut}
              onChange={(event) =>
                setNewReservation((current) => ({ ...current, dateDebut: event.target.value }))
              }
            />

            <label htmlFor="reservation_fin">Date de fin</label>
            <input
              type="date"
              id="reservation_fin"
              required
              value={newReservation.dateFin}
              onChange={(event) =>
                setNewReservation((current) => ({ ...current, dateFin: event.target.value }))
              }
            />

            <input type="submit" value="Ajouter une réservation" />
          </form>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Salle</th>
                  <th>Utilisateur</th>
                  <th>Date début</th>
                  <th>Date fin</th>
                  <th>Modifier</th>
                  <th>Supprimer</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id_reservation}>
                    <td>{reservation.id_reservation}</td>
                    <td>
                      <select
                        value={reservation.id_salle}
                        onChange={(event) =>
                          setReservations((rows) =>
                            rows.map((row) =>
                              row.id_reservation === reservation.id_reservation
                                ? { ...row, id_salle: event.target.value }
                                : row,
                            ),
                          )
                        }
                      >
                        {salles.map((salle) => (
                          <option key={salle.id_salle} value={salle.id_salle}>
                            {salle.sal_nom} ({salle.sal_numero})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={reservation.id_utilisateur}
                        onChange={(event) =>
                          setReservations((rows) =>
                            rows.map((row) =>
                              row.id_reservation === reservation.id_reservation
                                ? { ...row, id_utilisateur: event.target.value }
                                : row,
                            ),
                          )
                        }
                      >
                        {users.map((user) => (
                          <option key={user.id_utilisateur} value={user.id_utilisateur}>
                            {user.uti_nom} {user.uti_prenom}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="date"
                        required
                        value={reservation.res_dateDebut}
                        onChange={(event) =>
                          setReservations((rows) =>
                            rows.map((row) =>
                              row.id_reservation === reservation.id_reservation
                                ? { ...row, res_dateDebut: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        required
                        value={reservation.res_dateFin}
                        onChange={(event) =>
                          setReservations((rows) =>
                            rows.map((row) =>
                              row.id_reservation === reservation.id_reservation
                                ? { ...row, res_dateFin: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <form className="admin-inline-form" onSubmit={(event) => handleUpdateReservation(event, reservation)}>
                        <button type="submit">Modifier</button>
                      </form>
                    </td>
                    <td>
                      <form className="admin-inline-form" onSubmit={(event) => handleDeleteReservation(event, reservation.id_reservation)}>
                        <button type="submit" className="btn-danger">
                          Supprimer
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function LogoutPage({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    apiRequest("/api/auth/logout", { method: "POST" })
      .catch(() => null)
      .finally(() => {
        setUser(null);
        navigate("/");
      });
  }, [navigate, setUser]);

  return null;
}

function AppContent({ user, setUser }) {
  return (
    <>
      <header>
        <Header user={user} />
      </header>

      <main className="fade-in">
        <Routes>
          <Route caseSensitive path="/" element={<HomePage />} />
          <Route caseSensitive path="/Salle" element={<SallesPage />} />
          <Route caseSensitive path="/Salle/Details/:numero" element={<SalleDetailsPage />} />
          <Route caseSensitive path="/Equipement" element={<EquipementsPage />} />
          <Route caseSensitive path="/connexion" element={<ConnexionPage setUser={setUser} />} />
          <Route caseSensitive path="/inscription" element={<InscriptionPage />} />
          <Route
            caseSensitive
            path="/Reservation"
            element={
              <ProtectedRoute user={user}>
                <ReservationsPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            caseSensitive
            path="/create-reservation"
            element={
              <ProtectedRoute user={user}>
                <CreateReservationPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            caseSensitive
            path="/Profil"
            element={
              <ProtectedRoute user={user}>
                <ProfilPage user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route caseSensitive path="/Utilisateur" element={<UtilisateursPage />} />
          <Route caseSensitive path="/deconnexion" element={<LogoutPage setUser={setUser} />} />

          <Route
            caseSensitive
            path="/admin"
            element={
              <AdminRoute user={user}>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            caseSensitive
            path="/admin/users"
            element={
              <AdminRoute user={user}>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route
            caseSensitive
            path="/admin/categories"
            element={
              <AdminRoute user={user}>
                <AdminCategoriesPage />
              </AdminRoute>
            }
          />
          <Route
            caseSensitive
            path="/admin/salles"
            element={
              <AdminRoute user={user}>
                <AdminSallesPage />
              </AdminRoute>
            }
          />
          <Route
            caseSensitive
            path="/admin/equipements"
            element={
              <AdminRoute user={user}>
                <AdminEquipementsPage />
              </AdminRoute>
            }
          />
          <Route
            caseSensitive
            path="/admin/contenances"
            element={
              <AdminRoute user={user}>
                <AdminContenancesPage />
              </AdminRoute>
            }
          />
          <Route
            caseSensitive
            path="/admin/reservations"
            element={
              <AdminRoute user={user}>
                <AdminReservationsPage />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer>
        <Footer />
      </footer>
    </>
  );
}

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    apiRequest("/api/auth/me")
      .then((data) => {
        setUser(data?.user ?? null);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setAuthChecked(true);
      });
  }, []);

  if (!authChecked) {
    return null;
  }

  return <AppContent user={user} setUser={setUser} />;
}
