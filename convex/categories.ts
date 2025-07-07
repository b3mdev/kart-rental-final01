import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let categories = await ctx.db.query("categories").collect();
    
    // Filter by active status if provided
    if (args.isActive !== undefined) {
      categories = categories.filter(category => category.isActive === args.isActive);
    }
    
    // Sort by horsepower ascending
    return categories.sort((a, b) => a.horsepower - b.horsepower);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    horsepower: v.number(),
    description: v.optional(v.string()),
    pricePerSession: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if category with same name already exists
    const existingCategory = await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    
    if (existingCategory) {
      throw new Error("Já existe uma categoria com este nome");
    }
    
    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      horsepower: args.horsepower,
      description: args.description,
      pricePerSession: args.pricePerSession,
      isActive: args.isActive,
    });
    
    return categoryId;
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
    horsepower: v.number(),
    description: v.optional(v.string()),
    pricePerSession: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Check if another category with same name exists (excluding current one)
    const existingCategory = await ctx.db
      .query("categories")
      .filter((q) => q.and(
        q.eq(q.field("name"), args.name),
        q.neq(q.field("_id"), id)
      ))
      .first();
    
    if (existingCategory) {
      throw new Error("Já existe uma categoria com este nome");
    }
    
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: {
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    // Check if category is being used in any karts
    const kartsUsingCategory = await ctx.db
      .query("karts")
      .filter((q) => q.eq(q.field("type"), args.id))
      .collect();
    
    if (kartsUsingCategory.length > 0) {
      throw new Error("Não é possível excluir esta categoria pois ela está sendo usada por karts");
    }
    
    // Check if category is being used in any bookings
    const bookingsUsingCategory = await ctx.db
      .query("bookings")
      .filter((q) => q.eq(q.field("kartType"), args.id))
      .collect();
    
    if (bookingsUsingCategory.length > 0) {
      throw new Error("Não é possível excluir esta categoria pois ela está sendo usada em agendamentos");
    }
    
    await ctx.db.delete(args.id);
  },
});

export const getById = query({
  args: {
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getActiveCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    return categories.sort((a, b) => a.horsepower - b.horsepower);
  },
});

export const getCategoryStats = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    
    const stats = {
      total: categories.length,
      active: categories.filter(c => c.isActive).length,
      inactive: categories.filter(c => !c.isActive).length,
      byHorsepower: categories.reduce((acc, category) => {
        const hp = category.horsepower.toString();
        acc[hp] = (acc[hp] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averagePrice: categories.length > 0 
        ? categories.reduce((sum, c) => sum + c.pricePerSession, 0) / categories.length 
        : 0,
    };
    
    return stats;
  },
});
