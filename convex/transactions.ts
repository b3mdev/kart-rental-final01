import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transactions = args.type 
      ? await ctx.db
          .query("transactions")
          .withIndex("by_type", (q) => q.eq("type", args.type as any))
          .collect()
      : await ctx.db
          .query("transactions")
          .withIndex("by_date")
          .collect();
    
    let filteredTransactions = transactions;
    
    // Filtrar por data se especificado
    if (args.startDate || args.endDate) {
      filteredTransactions = filteredTransactions.filter(t => {
        if (args.startDate && t.date < args.startDate) return false;
        if (args.endDate && t.date > args.endDate) return false;
        return true;
      });
    }
    
    // Filtrar por status se especificado
    if (args.status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === args.status);
    }
    
    return filteredTransactions.sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const create = mutation({
  args: {
    type: v.string(),
    amount: v.number(),
    description: v.string(),
    paymentMethod: v.string(),
    relatedId: v.optional(v.id("bookings")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", {
      ...args,
      type: args.type as any,
      paymentMethod: args.paymentMethod as any,
      status: "completed",
      date: new Date().toISOString().split('T')[0],
    });
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);
    
    const transactions = await ctx.db.query("transactions").collect();
    
    const todayTransactions = transactions.filter(t => t.date === today && t.status === "completed");
    const monthTransactions = transactions.filter(t => t.date.startsWith(thisMonth) && t.status === "completed");
    
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthRevenue = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      todayRevenue,
      monthRevenue,
      todayTransactions: todayTransactions.length,
      monthTransactions: monthTransactions.length,
      pendingTransactions: transactions.filter(t => t.status === "pending").length,
    };
  },
});
