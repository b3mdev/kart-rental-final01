import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const list = query({
  args: {
    date: v.optional(v.string()),
    pilotId: v.optional(v.id("pilots")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let bookings;
    
    if (args.date) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_date", (q) => q.eq("date", args.date!))
        .collect();
    } else {
      bookings = await ctx.db.query("bookings").collect();
    }
    
    // Filter by pilot if provided
    if (args.pilotId) {
      bookings = bookings.filter(booking => booking.pilotId === args.pilotId);
    }
    
    // Filter by status if provided
    if (args.status) {
      bookings = bookings.filter(booking => booking.status === args.status);
    }
    
    // Fetch related data for each booking
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const [pilot, assignedKart, timeSlot] = await Promise.all([
          ctx.db.get(booking.pilotId),
          booking.assignedKartId ? ctx.db.get(booking.assignedKartId) : null,
          booking.timeSlotId ? ctx.db.get(booking.timeSlotId) : null,
        ]);
        return {
          ...booking,
          pilot,
          assignedKart,
          timeSlot,
        };
      })
    );
    
    return bookingsWithDetails.sort((a, b) => a.startTime.localeCompare(b.startTime));
  },
});

export const getMonthBookings = query({
  args: {
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all bookings for the month
    const startDate = `${args.year}-${args.month.toString().padStart(2, '0')}-01`;
    const endDate = `${args.year}-${args.month.toString().padStart(2, '0')}-31`;
    
    const bookings = await ctx.db.query("bookings").collect();
    
    const monthBookings = bookings.filter(booking => 
      booking.date >= startDate && booking.date <= endDate
    );
    
    // Fetch related data for each booking
    const bookingsWithDetails = await Promise.all(
      monthBookings.map(async (booking) => {
        const [pilot, assignedKart] = await Promise.all([
          ctx.db.get(booking.pilotId),
          booking.assignedKartId ? ctx.db.get(booking.assignedKartId) : null,
        ]);
        return {
          ...booking,
          pilot,
          assignedKart,
        };
      })
    );
    
    return bookingsWithDetails;
  },
});

export const create = mutation({
  args: {
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    pilotId: v.id("pilots"),
    kartType: v.string(),
    price: v.number(),
    notes: v.optional(v.string()),
    timeSlotId: v.optional(v.id("timeSlots")),
    autoAssignKart: v.optional(v.boolean()),
    preferredKartId: v.optional(v.id("karts")),
  },
  handler: async (ctx, args) => {
    let assignedKartId = null;
    let finalTimeSlotId = args.timeSlotId;
    
    // If no time slot provided, try to find one
    if (!finalTimeSlotId) {
      const timeSlots = await ctx.db
        .query("timeSlots")
        .withIndex("by_date", (q) => q.eq("date", args.date))
        .collect();
      
      const matchingSlot = timeSlots.find(slot => 
        slot.startTime === args.startTime && 
        slot.kartType === args.kartType &&
        slot.isActive
      );
      
      if (matchingSlot) {
        finalTimeSlotId = matchingSlot._id;
      }
    }
    
    // Auto-assign kart if requested
    if (args.autoAssignKart !== false) {
      if (args.preferredKartId) {
        // Check if preferred kart is available
        const availableKarts: any[] = await ctx.runQuery(api.karts.getAvailableKarts, {
          kartType: args.kartType,
          date: args.date,
          timeSlotId: finalTimeSlotId,
        });
        
        const preferredKart = availableKarts.find((kart: any) => kart._id === args.preferredKartId);
        if (preferredKart) {
          assignedKartId = args.preferredKartId;
        }
      }
      
      // If no preferred kart or preferred kart not available, auto-assign
      if (!assignedKartId && finalTimeSlotId) {
        const autoAssignedKart: any = await ctx.runMutation(api.karts.autoAssignKart, {
          kartType: args.kartType,
          date: args.date,
          timeSlotId: finalTimeSlotId,
        });
        
        if (autoAssignedKart) {
          assignedKartId = autoAssignedKart._id;
        }
      }
    }
    
    const bookingId: any = await ctx.db.insert("bookings", {
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      pilotId: args.pilotId,
      kartType: args.kartType,
      price: args.price,
      notes: args.notes,
      status: "scheduled",
      paymentStatus: "pending",
      assignedKartId,
      timeSlotId: finalTimeSlotId,
      autoAssignKart: args.autoAssignKart !== false,
    });
    
    // Update time slot current pilots count
    if (finalTimeSlotId) {
      const timeSlot = await ctx.db.get(finalTimeSlotId);
      if (timeSlot) {
        await ctx.db.patch(finalTimeSlotId, {
          currentPilots: (timeSlot.currentPilots || 0) + 1,
        });
      }
    }
    
    // Create notification for new booking
    const pilot = await ctx.db.get(args.pilotId);
    const kartInfo = assignedKartId ? await ctx.db.get(assignedKartId) : null;
    
    await ctx.db.insert("notifications", {
      title: "Novo Agendamento",
      message: `Agendamento criado para ${pilot?.name} em ${args.date} às ${args.startTime}${kartInfo && 'number' in kartInfo ? ` - Kart #${kartInfo.number}` : ''}`,
      type: "booking",
      relatedId: bookingId,
      isRead: false,
    });
    
    return bookingId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("bookings"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);
    if (!booking) throw new Error("Booking not found");
    
    const oldStatus = booking.status;
    await ctx.db.patch(args.id, { status: args.status });
    
    // Update time slot current pilots count
    if (booking.timeSlotId) {
      const timeSlot = await ctx.db.get(booking.timeSlotId);
      if (timeSlot) {
        let currentPilots = timeSlot.currentPilots || 0;
        
        // If booking was cancelled, decrease count
        if (args.status === "cancelled" && oldStatus !== "cancelled") {
          currentPilots = Math.max(0, currentPilots - 1);
        }
        // If booking was reactivated, increase count
        else if (oldStatus === "cancelled" && args.status !== "cancelled") {
          currentPilots = currentPilots + 1;
        }
        
        await ctx.db.patch(booking.timeSlotId, { currentPilots });
      }
    }
    
    // Create notification for status change
    const pilot = await ctx.db.get(booking.pilotId);
    await ctx.db.insert("notifications", {
      title: "Status do Agendamento Atualizado",
      message: `Agendamento de ${pilot?.name} para ${booking.date} às ${booking.startTime} - Status: ${args.status}`,
      type: "booking",
      relatedId: args.id,
      isRead: false,
    });
  },
});

export const assignKart = mutation({
  args: {
    bookingId: v.id("bookings"),
    kartId: v.optional(v.id("karts")),
    autoAssign: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");
    
    let newKartId = args.kartId;
    
    // Auto-assign if requested and no specific kart provided
    if (args.autoAssign && !newKartId && booking.timeSlotId) {
      const autoAssignedKart: any = await ctx.runMutation(api.karts.autoAssignKart, {
        kartType: booking.kartType,
        date: booking.date,
        timeSlotId: booking.timeSlotId,
        excludeKartIds: booking.assignedKartId ? [booking.assignedKartId] : undefined,
      });
      
      if (autoAssignedKart) {
        newKartId = autoAssignedKart._id;
      }
    }
    
    // Update booking with new kart assignment
    await ctx.db.patch(args.bookingId, {
      assignedKartId: newKartId,
    });
    
    // Create notification
    const pilot = await ctx.db.get(booking.pilotId);
    const kart = newKartId ? await ctx.db.get(newKartId) : null;
    
    await ctx.db.insert("notifications", {
      title: "Kart Atribuído",
      message: `Kart ${kart ? `#${kart.number}` : 'removido'} ${newKartId ? 'atribuído a' : 'removido de'} ${pilot?.name} - ${booking.date} às ${booking.startTime}`,
      type: "booking",
      relatedId: args.bookingId,
      isRead: false,
    });
    
    return newKartId;
  },
});

export const getBookingStats = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const bookings = await ctx.db.query("bookings").collect();
    
    const filteredBookings = bookings.filter(booking => 
      booking.date >= args.startDate && 
      booking.date <= args.endDate &&
      booking.status !== "cancelled"
    );
    
    // Group by kart type
    const byKartType = filteredBookings.reduce((acc, booking) => {
      acc[booking.kartType] = (acc[booking.kartType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by date
    const byDate = filteredBookings.reduce((acc, booking) => {
      acc[booking.date] = (acc[booking.date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalRevenue = filteredBookings.reduce((sum, booking) => sum + booking.price, 0);
    
    return {
      totalBookings: filteredBookings.length,
      totalRevenue,
      byKartType,
      byDate,
      averagePrice: filteredBookings.length > 0 ? totalRevenue / filteredBookings.length : 0,
    };
  },
});
