import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    date: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const sessions = args.date 
      ? await ctx.db
          .query("raceSessions")
          .withIndex("by_date", (q) => q.eq("date", args.date!))
          .collect()
      : await ctx.db.query("raceSessions").collect();
    
    return args.isActive !== undefined 
      ? sessions.filter(s => s.isActive === args.isActive)
      : sessions;
  },
});

export const create = mutation({
  args: {
    sessionId: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    trackCondition: v.string(),
    weather: v.optional(v.string()),
    sessionType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("raceSessions", {
      ...args,
      isActive: true,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("raceSessions"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: args.isActive,
    });
  },
});

export const getSessionStats = query({
  args: {
    sessionId: v.id("raceSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    
    // Buscar todos os tempos de volta da sessão
    const lapTimes = await ctx.db
      .query("lapTimes")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    
    // Buscar dados dos pilotos
    const lapTimesWithPilots = await Promise.all(
      lapTimes.map(async (lapTime) => {
        const pilot = await ctx.db.get(lapTime.pilotId);
        return {
          ...lapTime,
          pilot,
        };
      })
    );
    
    // Calcular estatísticas
    const fastestLap = lapTimes.length > 0 
      ? Math.min(...lapTimes.map(l => l.lapTime))
      : null;
    
    const averageLap = lapTimes.length > 0
      ? lapTimes.reduce((sum, l) => sum + l.lapTime, 0) / lapTimes.length
      : null;
    
    // Agrupar por piloto
    const pilotStats = lapTimesWithPilots.reduce((acc, lapTime) => {
      const pilotId = lapTime.pilotId;
      if (!acc[pilotId]) {
        acc[pilotId] = {
          pilot: lapTime.pilot,
          laps: [],
          bestLap: Infinity,
          totalLaps: 0,
        };
      }
      acc[pilotId].laps.push(lapTime);
      acc[pilotId].bestLap = Math.min(acc[pilotId].bestLap, lapTime.lapTime);
      acc[pilotId].totalLaps++;
      return acc;
    }, {} as Record<string, any>);
    
    return {
      session,
      totalLaps: lapTimes.length,
      fastestLap,
      averageLap,
      pilotStats: Object.values(pilotStats),
      lapTimes: lapTimesWithPilots.sort((a, b) => a.lapTime - b.lapTime),
    };
  },
});
