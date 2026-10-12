import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export async function GET(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const [pic] = await db
    .select({ file: schema.productPictures.file, filetype: schema.productPictures.filetype })
    .from(schema.productPictures)
    .where(and(eq(schema.productPictures.productId, Number(productId)), eq(schema.productPictures.isCover, true)))
    .limit(1);
  if (!pic?.file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(pic.file), { headers: { "Content-Type": pic.filetype ?? "image/jpeg", "Cache-Control": "public, max-age=3600" } });
}
