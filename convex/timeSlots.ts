import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const list = query({
  args: {
    date: v.optional(v.string()),
    kartType: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let timeSlots;
    
    if (args.date) {
      timeSlots = await ctx.db
        .query("timeSlots")
        .withIndex("by_date", (q) => q.eq("date", args.date!))
        .collect();
    } else {
      timeSlots = await ctx.db.query("timeSlots").collect();
    }
    
    // Filter by kartType if provided
    if (args.kartType) {
      timeSlots = timeSlots.filter(slot => slot.kartType === args.kartType);
    }
    
    // Filter by isActive if provided
    if (args.isActive !== undefined) {
      timeSlots = timeSlots.filter(slot => slot.isActive === args.isActive);
    }
    
    // Get assigned karts details for each slot
    const timeSlotsWithKarts = await Promise.all(
      timeSlots.map(async (slot) => {
        const assignedKarts = slot.assignedKarts 
          ? await Promise.all(slot.assignedKarts.map(kartId => ctx.db.get(kartId)))
          : [];
        
        // Get current bookings for this slot
        const bookings = await ctx.db
          .query("bookings")
          .withIndex("by_time_slot", (q) => q.eq("timeSlotId", slot._id))
          .collect();
        
        const activeBookings = bookings.filter(b => b.status !== "cancelled");
        
        return {
          ...slot,
          assignedKarts: assignedKarts.filter(Boolean),
          currentBookings: activeBookings.length,
          availableSpots: (slot.maxPilots || slot.totalKarts) - activeBookings.length,
        };
      })
    );
    
    return timeSlotsWithKarts.sort((a, b) => a.startTime.localeCompare(b.startTime));
  },
});

export const create = mutation({
  args: {
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    kartType: v.string(),
    totalKarts: v.number(),
    maxPilots: v.optional(v.number()),
    pricePerPilot: v.optional(v.number()),
    assignedKarts: v.optional(v.array(v.id("karts"))),
  },
  handler: async (ctx, args) => {
    const maxPilots = args.maxPilots || args.totalKarts;
    
    const timeSlotId = await ctx.db.insert("timeSlots", {
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      kartType: args.kartType,
      totalKarts: args.totalKarts,
      availableKarts: args.totalKarts,
      maxPilots,
      currentPilots: 0,
      pricePerPilot: args.pricePerPilot || 50.0,
      assignedKarts: args.assignedKarts || [],
      isActive: true,
    });
    
    // If specific karts are assigned, create availability records
    if (args.assignedKarts && args.assignedKarts.length > 0) {
      for (const kartId of args.assignedKarts) {
        await ctx.db.insert("kartAvailability", {
          kartId,
          date: args.date,
          timeSlotId,
          isAvailable: true,
        });
      }
    }
    
    return timeSlotId;
  },
});

export const update = mutation({
  args: {
    id: v.id("timeSlots"),
    availableKarts: v.optional(v.number()),
    maxPilots: v.optional(v.number()),
    pricePerPilot: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    assignedKarts: v.optional(v.array(v.id("karts"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    
    // Update kart availability if assignedKarts changed
    if (args.assignedKarts !== undefined) {
      const timeSlot = await ctx.db.get(id);
      if (timeSlot) {
        // Remove old availability records for this time slot
        const oldRecords = await ctx.db
          .query("kartAvailability")
          .withIndex("by_time_slot", (q) => q.eq("timeSlotId", id))
          .collect();
        
        for (const record of oldRecords) {
          await ctx.db.delete(record._id);
        }
        
        // Create new availability records
        for (const kartId of args.assignedKarts) {
          await ctx.db.insert("kartAvailability", {
            kartId,
            date: timeSlot.date,
            timeSlotId: id,
            isAvailable: true,
          });
        }
      }
    }
  },
});

export const getAvailability = query({
  args: {
    date: v.string(),
    kartType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timeSlots = await ctx.db
      .query("timeSlots")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    
    const filtered = args.kartType 
      ? timeSlots.filter(slot => slot.kartType === args.kartType)
      : timeSlots;
    
    // Get detailed availability for each slot
    const slotsWithAvailability = await Promise.all(
      filtered.map(async (slot) => {
        // Get current bookings
        const bookings = await ctx.db
          .query("bookings")
          .withIndex("by_time_slot", (q) => q.eq("timeSlotId", slot._id))
          .collect();
        
        const activeBookings = bookings.filter(b => b.status !== "cancelled");
        const availableSpots = (slot.maxPilots || slot.totalKarts) - activeBookings.length;
        
        // Get available karts for this slot
        const availableKarts: any[] = await ctx.runQuery(api.karts.getAvailableKarts, {
          kartType: slot.kartType,
          date: args.date,
          timeSlotId: slot._id,
        });
        
        return {
          ...slot,
          isAvailable: availableSpots > 0 && availableKarts.length > 0,
          availableSpots,
          availableKartsCount: availableKarts.length,
          occupancyRate: (activeBookings.length / (slot.maxPilots || slot.totalKarts)) * 100,
          currentBookings: activeBookings.length,
        };
      })
    );
    
    return slotsWithAvailability;
  },
});

export const getTimeSlotDetails = query({
  args: {
    timeSlotId: v.id("timeSlots"),
  },
  handler: async (ctx, args) => {
    const timeSlot = await ctx.db.get(args.timeSlotId);
    if (!timeSlot) return null;
    
    // Get all bookings for this time slot
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_time_slot", (q) => q.eq("timeSlotId", args.timeSlotId))
      .collect();
    
    // Get pilot details for each booking
    const bookingsWithPilots = await Promise.all(
      bookings.map(async (booking) => {
        const pilot = await ctx.db.get(booking.pilotId);
        const assignedKart = booking.assignedKartId 
          ? await ctx.db.get(booking.assignedKartId)
          : null;
        return {
          ...booking,
          pilot,
          assignedKart,
        };
      })
    );
    
    // Get available karts for this slot
    const availableKarts: any[] = await ctx.runQuery(api.karts.getAvailableKarts, {
      kartType: timeSlot.kartType,
      date: timeSlot.date,
      timeSlotId: args.timeSlotId,
    });
    
    const activeBookings = bookingsWithPilots.filter(b => b.status !== "cancelled");
    
    return {
      ...timeSlot,
      bookings: bookingsWithPilots,
      activeBookings,
      availableKarts,
      availableSpots: (timeSlot.maxPilots || timeSlot.totalKarts) - activeBookings.length,
      revenue: activeBookings.reduce((sum, booking) => sum + booking.price, 0),
    };
  },
});

export const autoAssignKartsToSlot = mutation({
  args: {
    timeSlotId: v.id("timeSlots"),
  },
  handler: async (ctx, args) => {
    const timeSlot = await ctx.db.get(args.timeSlotId);
    if (!timeSlot) throw new Error("Time slot not found");
    
    // Get available karts for this slot type
    const availableKarts: any[] = await ctx.runQuery(api.karts.getAvailableKarts, {
      kartType: timeSlot.kartType,
      date: timeSlot.date,
      timeSlotId: args.timeSlotId,
    });
    
    // Assign up to totalKarts number of karts
    const kartsToAssign = availableKarts.slice(0, timeSlot.totalKarts);
    const kartIds = kartsToAssign.map(kart => kart._id);
    
    // Update the time slot with assigned karts
    await ctx.db.patch(args.timeSlotId, {
      assignedKarts: kartIds,
    });
    
    // Create availability records for assigned karts
    for (const kartId of kartIds) {
      await ctx.db.insert("kartAvailability", {
        kartId,
        date: timeSlot.date,
        timeSlotId: args.timeSlotId,
        isAvailable: true,
      });
    }
    
    return kartIds.length;
  },
});
