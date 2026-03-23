export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ redirect: "/connexion" });
  }

  return next();
}

export function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ redirect: "/connexion" });
  }

  if (req.session.user.uti_role !== "admin") {
    return res.status(403).json({ redirect: "/" });
  }

  return next();
}
