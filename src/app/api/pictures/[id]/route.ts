import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const [p] = await db.select().from(s.productPictures).where(eq(s.productPictures.id, Number(id)));
  if (!p?.file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(p.file as Buffer), { headers: { "Content-Type": p.filetype ?? "image/jpeg", "Cache-Control": "private, max-age=300" } });
}
