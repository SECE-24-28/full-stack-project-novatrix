import { GraphQLError } from "graphql";
import { createProductSchema, updateProductSchema, createCategorySchema, updateCategorySchema } from "@/lib/validators/product";
import { productService, categoryService } from "@/lib/services/product.service";
import { requirePermission } from "@/lib/auth/guards";
import type { GraphQLContext } from "@/types/auth";
import type { ProductStatus } from "@prisma/client";

// ─── Input types ──────────────────────────────────────────────────────────────

interface ProductsArgs {
  filter?:     { search?: string; categoryId?: string; status?: ProductStatus; supplierId?: string };
  pagination?: { page: number; limit: number };
}

interface CreateProductArgs {
  input: {
    sku: string; name: string; description?: string;
    categoryId: string; supplierId?: string; unitOfMeasure: string;
    costPrice: number; sellingPrice: number;
    reorderPoint: number; reorderQuantity: number;
    weight?: number; barcode?: string; imageUrl?: string; status?: ProductStatus;
  };
}

interface UpdateProductArgs {
  input: Partial<CreateProductArgs["input"]> & { id: string };
}

interface CategoriesArgs {
  parentId?:   string;
  pagination?: { page: number; limit: number };
}

// ─── Audit helper ─────────────────────────────────────────────────────────────

async function audit(
  ctx: GraphQLContext,
  action: "CREATE" | "UPDATE" | "DELETE",
  resource: "Product" | "Category",
  resourceId: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
) {
  await ctx.prisma.auditLog.create({
    data: {
      userId:     ctx.auth?.userId ?? null,
      action,
      resource,
      resourceId,
      oldValues:  oldValues ? (oldValues as unknown as import("@prisma/client").Prisma.InputJsonValue) : undefined,
      newValues:  newValues ? (newValues as unknown as import("@prisma/client").Prisma.InputJsonValue) : undefined,
      ipAddress:  ctx.ipAddress,
      userAgent:  ctx.userAgent,
    },
  });
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

export const productResolvers = {
  // ── Category field resolvers ──────────────────────────────────────────────
  Category: {
    productCount: (parent: { _count?: { products: number } }) =>
      parent._count?.products ?? 0,
    children: async (parent: { id: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.category.findMany({
        where:   { parentId: parent.id },
        include: { parent: true, _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      }),
  },

  // ── Queries ───────────────────────────────────────────────────────────────
  Query: {
    product: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:products");
      const product = await productService.findById(ctx.prisma, id);
      if (!product) throw new GraphQLError("Product not found.", { extensions: { code: "NOT_FOUND" } });
      return product;
    },

    productBySku: async (_: unknown, { sku }: { sku: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:products");
      const product = await productService.findBySku(ctx.prisma, sku);
      if (!product) throw new GraphQLError("Product not found.", { extensions: { code: "NOT_FOUND" } });
      return product;
    },

    products: async (_: unknown, args: ProductsArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:products");
      return productService.findMany(ctx.prisma, args.filter, args.pagination);
    },

    category: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:categories");
      const cat = await categoryService.findById(ctx.prisma, id);
      if (!cat) throw new GraphQLError("Category not found.", { extensions: { code: "NOT_FOUND" } });
      return cat;
    },

    categories: async (_: unknown, args: CategoriesArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:categories");
      return categoryService.findAll(ctx.prisma, args.parentId, args.pagination);
    },
  },

  // ── Mutations ─────────────────────────────────────────────────────────────
  Mutation: {
    // ── createProduct ────────────────────────────────────────────────────────
    createProduct: async (_: unknown, { input }: CreateProductArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "create:products");

      const parsed = createProductSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT", fields: parsed.error.flatten().fieldErrors },
        });
      }

      // SKU uniqueness check
      const existing = await productService.findBySku(ctx.prisma, input.sku);
      if (existing) {
        throw new GraphQLError(`SKU "${input.sku}" is already in use.`, {
          extensions: { code: "CONFLICT" },
        });
      }

      const product = await productService.create(ctx.prisma, parsed.data);
      await audit(ctx, "CREATE", "Product", product.id, undefined, { sku: product.sku, name: product.name });
      return product;
    },

    // ── updateProduct ────────────────────────────────────────────────────────
    updateProduct: async (_: unknown, { input }: UpdateProductArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:products");

      const parsed = updateProductSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT", fields: parsed.error.flatten().fieldErrors },
        });
      }

      const before = await productService.findById(ctx.prisma, input.id);
      if (!before) throw new GraphQLError("Product not found.", { extensions: { code: "NOT_FOUND" } });

      // SKU conflict check (if SKU is being changed)
      if (input.sku && input.sku !== before.sku) {
        const conflict = await productService.findBySku(ctx.prisma, input.sku);
        if (conflict) {
          throw new GraphQLError(`SKU "${input.sku}" is already in use.`, {
            extensions: { code: "CONFLICT" },
          });
        }
      }

      const { id, ...rest } = parsed.data;
      const updated = await productService.update(ctx.prisma, id, rest);
      await audit(ctx, "UPDATE", "Product", id,
        { sku: before.sku, name: before.name, status: before.status },
        { sku: updated.sku, name: updated.name, status: updated.status }
      );
      return updated;
    },

    // ── deleteProduct ────────────────────────────────────────────────────────
    deleteProduct: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "delete:products");

      const product = await productService.findById(ctx.prisma, id);
      if (!product) throw new GraphQLError("Product not found.", { extensions: { code: "NOT_FOUND" } });

      try {
        await productService.delete(ctx.prisma, id);
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }

      await audit(ctx, "DELETE", "Product", id, { sku: product.sku, name: product.name });
      return true;
    },

    // ── createCategory ────────────────────────────────────────────────────────
    createCategory: async (_: unknown, { input }: { input: { name: string; description?: string; parentId?: string } }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "create:categories");

      const parsed = createCategorySchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const existing = await ctx.prisma.category.findUnique({ where: { name: input.name } });
      if (existing) {
        throw new GraphQLError(`Category "${input.name}" already exists.`, { extensions: { code: "CONFLICT" } });
      }

      const cat = await categoryService.create(ctx.prisma, parsed.data);
      await audit(ctx, "CREATE", "Category", cat.id, undefined, { name: cat.name });
      return cat;
    },

    // ── updateCategory ────────────────────────────────────────────────────────
    updateCategory: async (_: unknown, { input }: { input: { id: string; name?: string; description?: string; parentId?: string } }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:categories");

      const parsed = updateCategorySchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const { id, ...rest } = parsed.data;
      const cat = await categoryService.update(ctx.prisma, id, rest);
      await audit(ctx, "UPDATE", "Category", id, undefined, { name: cat.name });
      return cat;
    },

    // ── deleteCategory ────────────────────────────────────────────────────────
    deleteCategory: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "delete:categories");

      try {
        await categoryService.delete(ctx.prisma, id);
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }

      await audit(ctx, "DELETE", "Category", id);
      return true;
    },
  },
};
