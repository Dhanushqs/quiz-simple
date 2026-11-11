import { checkAdminPassword, passwordLoginEnabled, setAdminSession } from "@/lib/auth";
import { HttpError, json, readJson, withErrors } from "@/lib/http";

// POST /api/admin/login  { password }
export const POST = withErrors(async (request) => {
  const { password } = await readJson(request);

  if (!passwordLoginEnabled()) {
    throw new HttpError(
      500,
      "ADMIN_PASSWORD is missing (or shorter than 8 characters) in the Vercel settings. Add it, then redeploy."
    );
  }

  if (typeof password !== "string" || !checkAdminPassword(password)) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // slows down password guessing
    throw new HttpError(401, "Wrong password.");
  }

  await setAdminSession();
  return json({ ok: true });
});
