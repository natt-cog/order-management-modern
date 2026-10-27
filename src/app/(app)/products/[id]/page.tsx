import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireRole } from "@/lib/auth";
import ProductForm from "./ProductForm";

export const dynamic = "force-dynamic";

export default async function ProductDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireRole();
  const { id } = await params;
  const { saved } = await searchParams;
  const isNew = id === "new";
  const [cats, brands, models] = await Promise.all([
    db.select({ id: s.productCategories.id, name: s.productCategories.name }).from(s.productCategories).where(eq(s.productCategories.isActive, true)).orderBy(asc(s.productCategories.name)),
    db.select({ id: s.brands.id, name: s.brands.name }).from(s.brands).where(eq(s.brands.isActive, true)).orderBy(asc(s.brands.name)),
    db.select({ id: s.models.id, name: s.models.name, brandId: s.models.brandId }).from(s.models).where(eq(s.models.isActive, true)).orderBy(asc(s.models.name)),
  ]);
  if (isNew) {
    return <ProductForm product={null} features={[]} pictures={[]} categories={cats} brands={brands} models={models} justSaved={false} />;
  }
  const [p] = await db.select().from(s.products).where(eq(s.products.id, Number(id)));
  if (!p) {
    return (
      <div className="card empty">
        <p>The product you were looking for doesn’t exist.</p>
        <Link className="btn" href="/">Go to Homepage</Link>
      </div>
    );
  }
  const [features, pictures] = await Promise.all([
    db.select({ id: s.productFeatures.id, description: s.productFeatures.description }).from(s.productFeatures)
      .where(and(eq(s.productFeatures.productId, p.id), eq(s.productFeatures.isActive, true))).orderBy(asc(s.productFeatures.id)).limit(4),
    db.select({ id: s.productPictures.id, isCover: s.productPictures.isCover }).from(s.productPictures)
      .where(and(eq(s.productPictures.productId, p.id), eq(s.productPictures.isActive, true))).orderBy(asc(s.productPictures.id)).limit(6),
  ]);
  return (
    <ProductForm
      product={{ id: p.id, name: p.name, description: p.description ?? "", categoryId: p.categoryId, modelId: p.modelId,
        price: Number(p.price), discount: Number(p.discount ?? 0), stock: p.stock ?? 0, reference: p.reference ?? "",
        ean: p.ean ?? "", weight: p.weight ?? "", dimensions: p.dimensions ?? "", isActive: p.isActive ?? true }}
      features={features.map((f) => f.description ?? "")} pictures={pictures} categories={cats} brands={brands} models={models}
      justSaved={saved === "1"} />
  );
}
