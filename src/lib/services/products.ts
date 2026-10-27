import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { InvalidArgumentsException, nextCode, PermissionException } from "@/lib/rules";
import { isManager, isRepresentative, type Session } from "@/lib/auth";

export type ProductInput = {
  id?: number | null;
  name: string;
  description: string;
  categoryId: number | null;
  modelId?: number | null;
  price: number;
  /** 画面入力は % (0-100)。DB は O11 と同じく割合 (0-1) で保存 */
  discountPercent: number;
  stock: number;
  reference: string;
  ean?: string | null;
  weight?: string | null;
  dimensions?: string | null;
  isActive: boolean;
  features: string[];
  newPictures: { filename: string; filetype: string; data: Buffer }[];
  deletePictureIds: number[];
};

/** ProductDetail 画面の入力チェック（クライアント側バリデーション） */
export function validateProductForm(p: ProductInput, pictureCount: number): Record<string, string> {
  const e: Record<string, string> = {};
  if (!p.name.trim()) e.name = "Product name must be filled";
  if (!p.categoryId) e.categoryId = "A category must be chosen";
  if (!p.description.trim()) e.description = "Description must be filled";
  if (!(p.price > 0)) e.price = "Price must be filled and higher than zero";
  if (!(p.discountPercent >= 0 && p.discountPercent <= 100)) e.discountPercent = "Discount value not valid";
  if (!(p.stock >= 0)) e.stock = "Stock can't be negative";
  if (!p.reference.trim()) e.reference = "Reference must be filled";
  if (pictureCount < 1) e.pictures = "Please upload at least one image for the cover of the product";
  return e;
}

/** Product_Validate（サーバー側） */
export function validateProduct(p: { name: string; categoryId: number | null; price: number; stock: number }) {
  if (p.name === "") throw new InvalidArgumentsException("Name is required");
  if (!p.categoryId) throw new InvalidArgumentsException("Category is required");
  if (p.price < 0) throw new InvalidArgumentsException("Price must be greater or equal to zero");
  if (p.stock < 0) throw new InvalidArgumentsException("Stock must be greater or equal to zero");
}

/** Product_Edit / Product_Save + ProductFeature_Save + ProductPicture_Save/Delete */
export async function saveProduct(session: Session, input: ProductInput): Promise<number> {
  if (!isManager(session) && !isRepresentative(session)) throw new PermissionException();
  const name = input.name.trim();
  const price = Math.round(input.price * 100) / 100;
  const discount = Math.round(input.discountPercent * 100) / 100 / 100;
  validateProduct({ name, categoryId: input.categoryId, price, stock: input.stock });
  return db.transaction(async (t) => {
    const values = {
      name, description: input.description.trim(), categoryId: input.categoryId!, modelId: input.modelId ?? null,
      price: String(price), discount: String(discount), stock: input.stock, reference: input.reference.trim(),
      ean: input.ean?.trim() || null, weight: input.weight?.trim() || null, dimensions: input.dimensions?.trim() || null,
      isActive: input.isActive,
    };
    let id = input.id ?? 0;
    if (!id) {
      const [last] = await t.select({ code: s.products.code }).from(s.products).orderBy(desc(s.products.code)).limit(1);
      const [r] = await t.insert(s.products).values({ ...values, code: nextCode("P", last?.code ?? null), createdBy: session.userId, createdOn: new Date() }).returning();
      id = r.id;
    } else {
      await t.update(s.products).set({ ...values, updatedBy: session.userId, updatedOn: new Date() }).where(eq(s.products.id, id));
    }
    await t.delete(s.productFeatures).where(eq(s.productFeatures.productId, id));
    const feats = input.features.map((f) => f.trim()).filter(Boolean).slice(0, 4);
    if (feats.length) await t.insert(s.productFeatures).values(feats.map((d) => ({ productId: id, description: d.slice(0, 100), createdBy: session.userId, createdOn: new Date() })));
    if (input.deletePictureIds.length) await t.delete(s.productPictures).where(inArray(s.productPictures.id, input.deletePictureIds));
    const remaining = await t.select({ id: s.productPictures.id, isCover: s.productPictures.isCover }).from(s.productPictures).where(eq(s.productPictures.productId, id));
    for (const [i, p] of input.newPictures.slice(0, Math.max(0, 6 - remaining.length)).entries()) {
      await t.insert(s.productPictures).values({ productId: id, filename: p.filename, filetype: p.filetype, file: p.data,
        isCover: remaining.length === 0 && i === 0, createdBy: session.userId, createdOn: new Date() });
    }
    const pics = await t.select({ id: s.productPictures.id, isCover: s.productPictures.isCover }).from(s.productPictures).where(eq(s.productPictures.productId, id));
    if (pics.length && !pics.some((p) => p.isCover)) await t.update(s.productPictures).set({ isCover: true }).where(eq(s.productPictures.id, pics[0].id));
    return id;
  });
}
