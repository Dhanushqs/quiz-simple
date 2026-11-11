// Simple admin login: ONE password, stored in the ADMIN_PASSWORD setting on Vercel.
// No Supabase login, no email addresses.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { HttpError } from "./errors.js";

const COOKIE = "admin_session";
const WEEK = 60 * 60 * 24 * 7;

const cookieOptions = {
  httpOnly: true, // JavaScript in the browser cannot read this cookie
  sameSite: "lax", // not sent on cross-site POST requests (CSRF protection)
  secure: process.env.NODE_ENV === "production", // HTTPS only on Vercel
  path: "/",
  maxAge: WEEK,
};

const sha = (text) => createHash("sha256").update(String(text)).digest();

export function passwordLoginEnabled() {
  return (process.env.ADMIN_PASSWORD || "").length >= 8;
}

// Constant-time comparison, so response timing reveals nothing about the password.
export function checkAdminPassword(candidate) {
  if (!passwordLoginEnabled() || typeof candidate !== "string") return false;
  return timingSafeEqual(sha(candidate), sha(process.env.ADMIN_PASSWORD));
}

// The cookie holds "expiry.signature". Only our server knows the secret, so nobody can forge it.
function sign(value) {
  const secret = `${process.env.ADMIN_PASSWORD || ""}|${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`;
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function setAdminSession() {
  const expires = String(Date.now() + WEEK * 1000);
  const jar = await cookies();
  jar.set(COOKIE, `${expires}.${sign(expires)}`, cookieOptions);
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

// true if the visitor holds a valid admin cookie
export async function isAdmin() {
  if (!passwordLoginEnabled()) return false;
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return false;
  const [expires, signature] = raw.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return timingSafeEqual(sha(signature), sha(sign(expires)));
}

// Call this at the top of EVERY admin API route.
export async function requireAdmin() {
  if (!(await isAdmin())) throw new HttpError(401, "Please log in as admin.");
}
