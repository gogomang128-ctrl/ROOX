import { getCurrentUser } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ user: await getCurrentUser() });
}
