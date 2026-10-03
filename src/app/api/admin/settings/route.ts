import { getSettings, isAdmin, readJson, saveSettings, unauthorized } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  await saveSettings(await readJson(req));
  return Response.json({ settings: await getSettings() });
}
