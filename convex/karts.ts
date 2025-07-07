import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const list = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    isAvailableForBooking: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let karts;
    
    if (args.type && args.isAvailableForBooking !== undefined) {
      karts = await ctx.db
        .query("karts")
        .withIndex("by_type_and_availability", (q) => 
          q.eq("type", args.type!).eq("isAvailableForBooking", args.isAvailableForBooking!)
        )
        .collect();
    } else if (args.type) {
      karts = await ctx.db
        .query("karts")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .collect();
    } else if (args.isAvailableForBooking !== undefined) {
      karts = await ctx.db
        .query("karts")
        .withIndex("by_availability", (q) => q.eq("isAvailableForBooking", args.isAvailableForBooking!))
        .collect();
    } else {
      karts = await ctx.db.query("karts").collect();
    }
    
    // Filter by status if provided
    if (args.status) {
      karts = karts.filter(kart => kart.status === args.status);
    }
    
    // Get engine data for each kart
    const kartsWithEngines = await Promise.all(
      karts.map(async (kart) => {
        const engine = kart.engineId ? await ctx.db.get(kart.engineId) : null;
        return {
          ...kart,
          engine,
        };
      })
    );
    
    return kartsWithEngines.sort((a, b) => a.number.localeCompare(b.number));
  },
});

export const getAvailableKarts = query({
  args: {
    kartType: v.string(),
    date: v.string(),
    timeSlotId: v.optional(v.id("timeSlots")),
  },
  handler: async (ctx, args) => {
    // Get all karts of the specified type that are available for booking
    const karts = await ctx.db
      .query("karts")
      .withIndex("by_type_and_availability", (q) => 
        q.eq("type", args.kartType).eq("isAvailableForBooking", true)
      )
      .collect();
    
    // Filter by status (only active karts)
    const activeKarts = karts.filter(kart => kart.status === "active");
    
    if (!args.timeSlotId) {
      return activeKarts;
    }
    
    // Check kart availability for specific time slot
    const availabilityRecords = await ctx.db
      .query("kartAvailability")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    
    const timeSlotAvailability = availabilityRecords.filter(
      record => record.timeSlotId === args.timeSlotId
    );
    
    // Get karts that are specifically marked as unavailable for this slot
    const unavailableKartIds = timeSlotAvailability
      .filter(record => !record.isAvailable)
      .map(record => record.kartId);
    
    // Filter out unavailable karts
    const availableKarts = activeKarts.filter(
      kart => !unavailableKartIds.includes(kart._id)
    );
    
    // Get bookings for this time slot to exclude already booked karts
    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_time_slot", (q) => q.eq("timeSlotId", args.timeSlotId))
      .collect();
    
    const bookedKartIds = existingBookings
      .filter(booking => booking.assignedKartId && booking.status !== "cancelled")
      .map(booking => booking.assignedKartId);
    
    const finalAvailableKarts = availableKarts.filter(
      kart => !bookedKartIds.includes(kart._id)
    );
    
    return finalAvailableKarts;
  },
});

export const create = mutation({
  args: {
    number: v.string(),
    type: v.string(),
    brand: v.string(),
    model: v.string(),
    engineId: v.optional(v.id("engines")),
    notes: v.optional(v.string()),
    isAvailableForBooking: v.optional(v.boolean()),
    maxDailyHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("karts", {
      ...args,
      status: "active",
      totalHours: 0,
      isAvailableForBooking: args.isAvailableForBooking ?? true,
      maxDailyHours: args.maxDailyHours ?? 8,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("karts"),
    number: v.optional(v.string()),
    type: v.optional(v.string()),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    engineId: v.optional(v.id("engines")),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    isAvailableForBooking: v.optional(v.boolean()),
    maxDailyHours: v.optional(v.number()),
    lastMaintenance: v.optional(v.string()),
    nextMaintenance: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const setKartAvailability = mutation({
  args: {
    kartId: v.id("karts"),
    date: v.string(),
    timeSlotId: v.id("timeSlots"),
    isAvailable: v.boolean(),
    maintenanceReason: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if availability record already exists
    const existingRecord = await ctx.db
      .query("kartAvailability")
      .withIndex("by_kart_and_date", (q) => 
        q.eq("kartId", args.kartId).eq("date", args.date)
      )
      .filter((q) => q.eq(q.field("timeSlotId"), args.timeSlotId))
      .first();
    
    if (existingRecord) {
      // Update existing record
      await ctx.db.patch(existingRecord._id, {
        isAvailable: args.isAvailable,
        maintenanceReason: args.maintenanceReason,
        notes: args.notes,
      });
      return existingRecord._id;
    } else {
      // Create new record
      return await ctx.db.insert("kartAvailability", args);
    }
  },
});

export const getKartAvailability = query({
  args: {
    kartId: v.optional(v.id("karts")),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    let availabilityRecords;
    
    if (args.kartId) {
      availabilityRecords = await ctx.db
        .query("kartAvailability")
        .withIndex("by_kart_and_date", (q) => 
          q.eq("kartId", args.kartId!).eq("date", args.date)
        )
        .collect();
    } else {
      availabilityRecords = await ctx.db
        .query("kartAvailability")
        .withIndex("by_date", (q) => q.eq("date", args.date))
        .collect();
    }
    
    // Get kart and time slot details
    const recordsWithDetails = await Promise.all(
      availabilityRecords.map(async (record) => {
        const [kart, timeSlot] = await Promise.all([
          ctx.db.get(record.kartId),
          ctx.db.get(record.timeSlotId),
        ]);
        return {
          ...record,
          kart,
          timeSlot,
        };
      })
    );
    
    return recordsWithDetails;
  },
});

export const autoAssignKart = mutation({
  args: {
    kartType: v.string(),
    date: v.string(),
    timeSlotId: v.id("timeSlots"),
    excludeKartIds: v.optional(v.array(v.id("karts"))),
  },
  handler: async (ctx, args) => {
    // Get available karts for this type and time slot
    const availableKarts: any[] = await ctx.runQuery(api.karts.getAvailableKarts, {
      kartType: args.kartType,
      date: args.date,
      timeSlotId: args.timeSlotId,
    });
    
    // Exclude specific karts if provided
    const filteredKarts = args.excludeKartIds 
      ? availableKarts.filter(kart => !args.excludeKartIds!.includes(kart._id))
      : availableKarts;
    
    if (filteredKarts.length === 0) {
      return null; // No available karts
    }
    
    // Sort by total hours (prefer karts with fewer hours)
    const sortedKarts = filteredKarts.sort((a, b) => 
      (a.totalHours || 0) - (b.totalHours || 0)
    );
    
    return sortedKarts[0]; // Return the kart with the least hours
  },
});

export const getKartUtilization = query({
  args: {
    kartId: v.id("karts"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all bookings for this kart in the date range
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_kart", (q) => q.eq("assignedKartId", args.kartId))
      .collect();
    
    const filteredBookings = bookings.filter(booking => 
      booking.date >= args.startDate && 
      booking.date <= args.endDate &&
      booking.status !== "cancelled"
    );
    
    // Calculate total hours and revenue
    const totalBookings = filteredBookings.length;
    const totalRevenue = filteredBookings.reduce((sum, booking) => sum + booking.price, 0);
    
    // Get kart details
    const kart = await ctx.db.get(args.kartId);
    
    return {
      kart,
      totalBookings,
      totalRevenue,
      bookings: filteredBookings,
      utilizationRate: totalBookings > 0 ? (totalBookings / 30) * 100 : 0, // Assuming 30 possible slots per month
    };
  },
});
