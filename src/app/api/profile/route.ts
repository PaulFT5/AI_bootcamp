import { getSessionUser } from "@/lib/session";
import { getProfile, ProfilePatch, updateProfile } from "@/services/profile";

export async function GET() {
  const user = await getSessionUser();
  return Response.json(await getProfile(user.id));
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  const parsed = ProfilePatch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  return Response.json(await updateProfile(user.id, parsed.data));
}
