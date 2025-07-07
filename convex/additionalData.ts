import { mutation } from "./_generated/server";
import { faker } from "@faker-js/faker/locale/pt_BR";

const kartBrands = ["Tony Kart", "CRG", "Birel ART", "Kosmic", "FA Kart"] as const;
type KartBrand = typeof kartBrands[number];

const kartModels: Record<KartBrand, string[]> = {
  "Tony Kart": ["Racer 401R", "Rookie EV", "Dragon EVO"],
  "CRG": ["Road Rebel", "Hero", "KT2"],
  "Birel ART": ["RY30-S8", "CRY30", "N-35"],
  "Kosmic": ["Mercury", "Lynx", "Dragon"],
  "FA Kart": ["Victory", "Sonic", "Storm"]
};

const kartTypes = ["rental", "competition", "junior"] as const;

export const setupAdditionalData = mutation({
  args: {},
  handler: async (ctx) => {
    // Create 12 new karts
    const newKarts: any[] = [];
    for (let i = 0; i < 12; i++) {
      const brand: KartBrand = kartBrands[Math.floor(Math.random() * kartBrands.length)];
      const models: string[] = kartModels[brand];
      const model: string = models[Math.floor(Math.random() * models.length)];
      const type: typeof kartTypes[number] = kartTypes[Math.floor(Math.random() * kartTypes.length)];
      
      const kart = await ctx.db.insert("karts", {
        number: (i + 5).toString().padStart(2, "0"), // Starting from 05 since we already have 01-04
        type,
        brand,
        model,
        status: Math.random() > 0.1 ? "active" : "maintenance", // 90% chance of being active
        totalHours: Math.floor(Math.random() * 300),
        lastMaintenance: faker.date.recent({ days: 30 }).toISOString().split("T")[0],
        nextMaintenance: faker.date.soon({ days: 90 }).toISOString().split("T")[0],
        isAvailableForBooking: Math.random() > 0.1, // 90% chance of being available
      });
      newKarts.push(kart);
    }

    // Create 50 new pilots
    const newPilots: any[] = [];
    for (let i = 0; i < 50; i++) {
      const birthDate: string = faker.date.between({ 
        from: "1980-01-01", 
        to: "2012-12-31" 
      }).toISOString().split("T")[0];
      
      const age: number = new Date().getFullYear() - new Date(birthDate).getFullYear();
      const category: "junior" | "adult" = age < 14 ? "junior" : "adult";
      
      const pilot = await ctx.db.insert("pilots", {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        birthDate,
        category,
        kartTypes: category === "junior" ? ["junior"] : 
                  Math.random() > 0.7 ? ["rental", "competition"] : ["rental"],
        emergencyContact: faker.person.fullName(),
        emergencyPhone: faker.phone.number(),
        medicalInfo: Math.random() > 0.8 ? faker.lorem.sentence() : "",
        isActive: Math.random() > 0.1, // 90% chance of being active
        registrationDate: faker.date.recent({ days: 180 }).toISOString().split("T")[0],
        totalRaces: Math.floor(Math.random() * 50),
        bestLapTime: 45000 + Math.floor(Math.random() * 10000), // Between 45s and 55s
        averageLapTime: 47000 + Math.floor(Math.random() * 10000), // Between 47s and 57s
      });
      newPilots.push(pilot);
    }

    // Create 50 new bookings across the next 7 days
    const bookingStatuses = ["confirmed", "scheduled", "completed", "cancelled"];
    const paymentStatuses = ["paid", "pending", "refunded"];
    const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30", "16:00"];
    
    for (let i = 0; i < 50; i++) {
      const bookingDate: string = faker.date.soon({ days: 7 }).toISOString().split("T")[0];
      const startTime: string = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      const endTime: string = startTime.replace(":00", ":30").replace(":30", ":00");
      const pilot: any = newPilots[Math.floor(Math.random() * newPilots.length)];
      
      // Get pilot data to determine kart type
      const pilotData: any = await ctx.db.get(pilot);
      if (!pilotData) {
        console.warn(`Pilot with ID ${pilot} not found`);
        continue; // Skip this iteration if pilot not found
      }
      const kartType: typeof kartTypes[number] = pilotData.category === "junior" ? "junior" : "rental";
      
      const status: typeof bookingStatuses[number] = bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];
      const paymentStatus: typeof paymentStatuses[number] = status === "cancelled" ? "refunded" : 
                          status === "completed" ? "paid" :
                          paymentStatuses[Math.floor(Math.random() * 2)]; // Only paid or pending for non-completed
      
      const booking = await ctx.db.insert("bookings", {
        date: bookingDate,
        startTime,
        endTime,
        pilotId: pilot,
        kartType,
        status,
        price: kartType === "junior" ? 35.00 : 50.00,
        paymentStatus,
        notes: Math.random() > 0.7 ? faker.lorem.sentence() : "",
        autoAssignKart: true,
      });

      // Create time slot if it doesn't exist
      const existingSlot: any = await ctx.db
        .query("timeSlots")
        .filter(q => q.eq(q.field("date"), bookingDate))
        .filter(q => q.eq(q.field("startTime"), startTime))
        .first();

      if (!existingSlot) {
        await ctx.db.insert("timeSlots", {
          date: bookingDate,
          startTime,
          endTime,
          kartType,
          totalKarts: kartType === "junior" ? 2 : 5,
          availableKarts: kartType === "junior" ? 1 : 3,
          maxPilots: kartType === "junior" ? 2 : 5,
          currentPilots: 1,
          isActive: true,
        });
      }

      // Create transaction for paid bookings
      if (paymentStatus === "paid") {
        await ctx.db.insert("transactions", {
          type: "booking",
          amount: kartType === "junior" ? 35.00 : 50.00,
          description: `Corrida - ${pilotData?.name || 'Unknown Pilot'}`,
          paymentMethod: Math.random() > 0.5 ? "card" : "pix",
          status: "completed",
          relatedId: booking,
          date: bookingDate,
        });
      }
    }

    return "Additional data setup completed successfully";
  },
});
