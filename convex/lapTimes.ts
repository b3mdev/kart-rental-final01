import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    sessionId: v.optional(v.id("raceSessions")),
    pilotId: v.optional(v.id("pilots")),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let lapTimes;
    
    if (args.sessionId && args.pilotId) {
      lapTimes = await ctx.db
        .query("lapTimes")
        .withIndex("by_session_and_pilot", (q) => 
          q.eq("sessionId", args.sessionId!).eq("pilotId", args.pilotId!)
        )
        .collect();
    } else if (args.sessionId) {
      lapTimes = await ctx.db
        .query("lapTimes")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId!))
        .collect();
    } else if (args.pilotId) {
      lapTimes = await ctx.db
        .query("lapTimes")
        .withIndex("by_pilot", (q) => q.eq("pilotId", args.pilotId!))
        .collect();
    } else {
      lapTimes = await ctx.db.query("lapTimes").collect();
    }
    
    // Filter by date if provided
    if (args.date) {
      lapTimes = lapTimes.filter(lapTime => {
        const lapDate = new Date(lapTime.timestamp).toISOString().split('T')[0];
        return lapDate === args.date;
      });
    }
    
    // Buscar dados relacionados
    const lapTimesWithDetails = await Promise.all(
      lapTimes.map(async (lapTime) => {
        const [session, pilot] = await Promise.all([
          ctx.db.get(lapTime.sessionId),
          ctx.db.get(lapTime.pilotId),
        ]);
        return {
          ...lapTime,
          session,
          pilot,
        };
      })
    );
    
    return lapTimesWithDetails.sort((a, b) => a.lapTime - b.lapTime);
  },
});

export const create = mutation({
  args: {
    sessionId: v.id("raceSessions"),
    pilotId: v.id("pilots"),
    kartNumber: v.string(),
    lapNumber: v.number(),
    lapTime: v.number(),
    sector1: v.optional(v.number()),
    sector2: v.optional(v.number()),
    sector3: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("lapTimes", {
      ...args,
      timestamp: new Date().toISOString(),
    });
  },
});

export const importFromMyLaps = mutation({
  args: {
    sessionId: v.id("raceSessions"),
    lapData: v.array(v.object({
      pilotId: v.id("pilots"),
      kartNumber: v.string(),
      lapNumber: v.number(),
      lapTime: v.number(),
      sector1: v.optional(v.number()),
      sector2: v.optional(v.number()),
      sector3: v.optional(v.number()),
      timestamp: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const lap of args.lapData) {
      const lapTimeId = await ctx.db.insert("lapTimes", {
        sessionId: args.sessionId,
        ...lap,
      });
      results.push(lapTimeId);
    }
    
    return results;
  },
});

export const getBestLaps = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const allLapTimes = await ctx.db.query("lapTimes").collect();
    
    // Buscar dados dos pilotos e sessões
    const lapTimesWithDetails = await Promise.all(
      allLapTimes.map(async (lapTime) => {
        const [session, pilot] = await Promise.all([
          ctx.db.get(lapTime.sessionId),
          ctx.db.get(lapTime.pilotId),
        ]);
        return {
          ...lapTime,
          session,
          pilot,
        };
      })
    );
    
    // Ordenar por tempo e pegar os melhores
    return lapTimesWithDetails
      .sort((a, b) => a.lapTime - b.lapTime)
      .slice(0, limit);
  },
});
