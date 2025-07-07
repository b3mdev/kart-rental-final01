import { query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getRankingData = query({
  args: {
    period: v.union(v.literal("today"), v.literal("week"), v.literal("month"), v.literal("all")),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let lapTimes = await ctx.db.query("lapTimes").collect();
    
    // Filter by period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (args.period) {
      case "today":
        lapTimes = lapTimes.filter(lapTime => {
          const lapDate = new Date(lapTime.timestamp);
          return lapDate >= today;
        });
        break;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        lapTimes = lapTimes.filter(lapTime => {
          const lapDate = new Date(lapTime.timestamp);
          return lapDate >= weekAgo;
        });
        break;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        lapTimes = lapTimes.filter(lapTime => {
          const lapDate = new Date(lapTime.timestamp);
          return lapDate >= monthAgo;
        });
        break;
      case "all":
      default:
        // No filtering for "all"
        break;
    }
    
    // Get session details for category filtering
    const lapTimesWithSessions = await Promise.all(
      lapTimes.map(async (lapTime) => {
        const session = await ctx.db.get(lapTime.sessionId);
        return {
          ...lapTime,
          session,
        };
      })
    );
    
    // Filter by category if provided
    if (args.category) {
      // This would need to be implemented based on how categories are linked to sessions
      // For now, we'll return all lap times
    }
    
    return lapTimesWithSessions;
  },
});

export const getPilotRankings = query({
  args: {
    period: v.union(v.literal("today"), v.literal("week"), v.literal("month"), v.literal("all")),
    rankingType: v.union(v.literal("bestLap"), v.literal("consistency"), v.literal("totalLaps")),
  },
  handler: async (ctx, args) => {
    // Get lap times for the period
    const lapTimes: any[] = await ctx.runQuery(api.rankings.getRankingData, {
      period: args.period,
    });
    
    // Group by pilot
    const pilotStats = new Map();
    
    for (const lapTime of lapTimes) {
      if (!pilotStats.has(lapTime.pilotId)) {
        const pilot = await ctx.db.get(lapTime.pilotId);
        pilotStats.set(lapTime.pilotId, {
          pilot,
          lapTimes: [],
          sessions: new Set(),
        });
      }
      
      const stats = pilotStats.get(lapTime.pilotId);
      stats.lapTimes.push(lapTime.lapTime);
      stats.sessions.add(lapTime.sessionId);
    }
    
    // Calculate rankings
    const rankings = Array.from(pilotStats.entries()).map(([pilotId, stats]: [string, any]) => {
      const bestLapTime = Math.min(...stats.lapTimes);
      const averageLapTime = stats.lapTimes.reduce((sum: number, time: number) => sum + time, 0) / stats.lapTimes.length;
      
      // Calculate consistency (lower standard deviation = higher consistency)
      const variance = stats.lapTimes.reduce((sum: number, time: number) => sum + Math.pow(time - averageLapTime, 2), 0) / stats.lapTimes.length;
      const standardDeviation = Math.sqrt(variance);
      const consistency = Math.max(0, 100 - (standardDeviation / averageLapTime) * 100);
      
      return {
        pilotId,
        pilotName: stats.pilot?.name || 'Piloto Desconhecido',
        bestLapTime,
        averageLapTime,
        totalLaps: stats.lapTimes.length,
        totalSessions: stats.sessions.size,
        consistency,
      };
    });
    
    // Sort by ranking type
    switch (args.rankingType) {
      case "bestLap":
        return rankings.sort((a, b) => a.bestLapTime - b.bestLapTime);
      case "consistency":
        return rankings.sort((a, b) => b.consistency - a.consistency);
      case "totalLaps":
        return rankings.sort((a, b) => b.totalLaps - a.totalLaps);
      default:
        return rankings.sort((a, b) => a.bestLapTime - b.bestLapTime);
    }
  },
});
