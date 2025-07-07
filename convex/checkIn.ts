import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateQRCode = mutation({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Agendamento não encontrado");
    
    const qrCode = `KARTODROMO_${args.bookingId}_${Date.now()}`;
    
    await ctx.db.insert("checkIns", {
      bookingId: args.bookingId,
      pilotId: booking.pilotId,
      checkInTime: new Date().toISOString(),
      status: "checked_in",
      qrCode,
    });
    
    return qrCode;
  },
});

export const processCheckIn = mutation({
  args: {
    qrCode: v.string(),
    kartAssigned: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const checkIn = await ctx.db
      .query("checkIns")
      .withIndex("by_qr_code", (q) => q.eq("qrCode", args.qrCode))
      .first();
    
    if (!checkIn) throw new Error("QR Code inválido");
    
    await ctx.db.patch(checkIn._id, {
      kartAssigned: args.kartAssigned,
      status: "racing",
    });
    
    // Atualizar status do agendamento
    await ctx.db.patch(checkIn.bookingId, {
      status: "confirmed",
    });
    
    return checkIn;
  },
});

export const listActiveCheckIns = query({
  args: {},
  handler: async (ctx) => {
    const checkIns = await ctx.db
      .query("checkIns")
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "checked_in"),
          q.eq(q.field("status"), "racing")
        )
      )
      .collect();
    
    const checkInsWithDetails = await Promise.all(
      checkIns.map(async (checkIn) => {
        const booking = await ctx.db.get(checkIn.bookingId);
        const pilot = await ctx.db.get(checkIn.pilotId);
        return {
          ...checkIn,
          booking,
          pilot,
        };
      })
    );
    
    return checkInsWithDetails;
  },
});
