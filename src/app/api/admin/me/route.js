import { requireAdmin } from "@/lib/auth";
import { json, withErrors } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/admin/me -> 200 if logged in as admin, 401 otherwise
export const GET = withErrors(async () => {
  await requireAdmin();
  return json({ ok: true });
});
