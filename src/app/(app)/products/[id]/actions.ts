"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { InvalidArgumentsException, PermissionException } from "@/lib/rules";
import { saveProduct, validateProductForm, type ProductInput } from "@/lib/services/products";

export type ProductFormState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

/** ProductDetail SaveOnClick: フォーム検証 → Product_CreateOrUpdate → 画像・特徴の保存 */
export async function saveProductAction(_: ProductFormState, form: FormData): Promise<ProductFormState> {
  const session = await requireRole();
  const id = form.get("id") ? Number(form.get("id")) : null;
  const files = form.getAll("pictures").filter((f): f is File => f instanceof File && f.size > 0);
  const input: ProductInput = {
    id, name: String(form.get("name") ?? ""), description: String(form.get("description") ?? ""),
    categoryId: form.get("categoryId") ? Number(form.get("categoryId")) : null,
    modelId: form.get("modelId") ? Number(form.get("modelId")) : null,
    price: Number(form.get("price") || 0), discountPercent: Number(form.get("discount") || 0),
    stock: Number(form.get("stock") || 0), reference: String(form.get("reference") ?? ""),
    ean: String(form.get("ean") ?? ""), weight: String(form.get("weight") ?? ""), dimensions: String(form.get("dimensions") ?? ""),
    isActive: form.get("isActive") === "on",
    features: form.getAll("features").map(String).filter((f) => f.trim() !== ""),
    newPictures: await Promise.all(files.map(async (f) => ({ filename: f.name, filetype: f.type, data: Buffer.from(await f.arrayBuffer()) }))),
    deletePictureIds: form.getAll("deletePictureIds").map(Number),
  };
  const remaining = Number(form.get("existingPictureCount") || 0) - input.deletePictureIds.length + input.newPictures.length;
  const errors = validateProductForm(input, remaining);
  if (Object.keys(errors).length) return { ok: false, message: "", errors };
  let savedId: number;
  try {
    savedId = await saveProduct(session, input);
  } catch (e) {
    if (e instanceof InvalidArgumentsException || e instanceof PermissionException) return { ok: false, message: e.message };
    console.error(e);
    return { ok: false, message: "An unexpected error occurred. Please try again later." };
  }
  revalidatePath("/products");
  revalidatePath(`/products/${savedId}`);
  redirect(`/products/${savedId}?saved=1`);
}
