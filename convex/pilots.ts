import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const pilots = args.category 
      ? await ctx.db
          .query("pilots")
          .withIndex("by_category", (q) => q.eq("category", args.category!))
          .collect()
      : await ctx.db.query("pilots").collect();
    
    return args.isActive !== undefined 
      ? pilots.filter(p => p.isActive === args.isActive)
      : pilots;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    birthDate: v.string(),
    category: v.string(),
    kartTypes: v.array(v.string()),
    emergencyContact: v.string(),
    emergencyPhone: v.string(),
    medicalInfo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pilots", {
      ...args,
      isActive: true,
      registrationDate: new Date().toISOString().split('T')[0],
      totalRaces: 0,
    });
  },
});

export const getStats = query({
  args: {
    pilotId: v.id("pilots"),
  },
  handler: async (ctx, args) => {
    const pilot = await ctx.db.get(args.pilotId);
    if (!pilot) return null;
    
    // Buscar tempos de volta
    const lapTimes = await ctx.db
      .query("lapTimes")
      .withIndex("by_pilot", (q) => q.eq("pilotId", args.pilotId))
      .collect();
    
    // Buscar corridas
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_pilot", (q) => q.eq("pilotId", args.pilotId))
      .collect();
    
    const bestLap = lapTimes.length > 0 
      ? Math.min(...lapTimes.map(l => l.lapTime))
      : null;
    
    const averageLap = lapTimes.length > 0
      ? lapTimes.reduce((sum, l) => sum + l.lapTime, 0) / lapTimes.length
      : null;
    
    return {
      pilot,
      totalRaces: bookings.filter(b => b.status === "completed").length,
      totalLaps: lapTimes.length,
      bestLapTime: bestLap,
      averageLapTime: averageLap,
      recentBookings: bookings.slice(-5),
    };
  },
});
