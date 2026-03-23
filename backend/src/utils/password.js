import bcrypt from "bcryptjs";

function normalizeHash(hash) {
  if (typeof hash !== "string") return hash;

  // PHP password_hash can generate $2y$ prefixes; bcryptjs expects $2a$/$2b$.
  return hash.startsWith("$2y$") ? `$2b$${hash.slice(4)}` : hash;
}

export async function hashPassword(plainText) {
  return bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText, hash) {
  return bcrypt.compare(plainText, normalizeHash(hash));
}
