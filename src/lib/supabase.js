import { createClient } from "@supabase/supabase-js";

function need(name) {
  const value = (process.env[name] || "").trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}. See .env.example`);
  }
  return value;
}

let client;

// The database connection used by all our server code.
// It uses the secret key, so it must NEVER be used in browser code.
export function db() {
  if (!client) {
    client = createClient(need("SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
