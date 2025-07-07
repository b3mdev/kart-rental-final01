import { mutation } from "./_generated/server";

export const setupSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingPilots = await ctx.db.query("pilots").collect();
    if (existingPilots.length > 0) {
      return "Sample data already exists";
    }

    // Create sample pilots
    const pilot1 = await ctx.db.insert("pilots", {
      name: "João Silva",
      email: "joao.silva@email.com",
      phone: "(11) 99999-1111",
      birthDate: "1990-05-15",
      category: "adult",
      kartTypes: ["rental", "competition"],
      emergencyContact: "Maria Silva",
      emergencyPhone: "(11) 99999-2222",
      medicalInfo: "Nenhuma restrição",
      isActive: true,
      registrationDate: "2024-01-15",
      totalRaces: 25,
      bestLapTime: 45230,
      averageLapTime: 47500,
    });

    const pilot2 = await ctx.db.insert("pilots", {
      name: "Ana Costa",
      email: "ana.costa@email.com",
      phone: "(11) 99999-3333",
      birthDate: "1995-08-22",
      category: "adult",
      kartTypes: ["rental"],
      emergencyContact: "Pedro Costa",
      emergencyPhone: "(11) 99999-4444",
      isActive: true,
      registrationDate: "2024-02-10",
      totalRaces: 12,
      bestLapTime: 48100,
      averageLapTime: 50200,
    });

    const pilot3 = await ctx.db.insert("pilots", {
      name: "Carlos Junior",
      email: "carlos.junior@email.com",
      phone: "(11) 99999-5555",
      birthDate: "2010-03-10",
      category: "junior",
      kartTypes: ["junior"],
      emergencyContact: "Carlos Senior",
      emergencyPhone: "(11) 99999-6666",
      isActive: true,
      registrationDate: "2024-03-05",
      totalRaces: 8,
      bestLapTime: 52300,
      averageLapTime: 55100,
    });

    // Create sample engines
    const engine1 = await ctx.db.insert("engines", {
      serialNumber: "ENG001",
      brand: "Honda",
      model: "GX160",
      displacement: "163cc",
      power: "5.5HP",
      status: "active",
      totalHours: 150,
      lastMaintenance: "2024-01-15",
      nextMaintenance: "2024-04-15",
    });

    const engine2 = await ctx.db.insert("engines", {
      serialNumber: "ENG002",
      brand: "Briggs & Stratton",
      model: "206",
      displacement: "206cc",
      power: "6.5HP",
      status: "active",
      totalHours: 89,
      lastMaintenance: "2024-02-01",
      nextMaintenance: "2024-05-01",
    });

    // Create sample karts
    const kart1 = await ctx.db.insert("karts", {
      number: "01",
      type: "rental",
      brand: "Tony Kart",
      model: "Racer 401R",
      engineId: engine1,
      status: "active",
      totalHours: 145,
      lastMaintenance: "2024-01-15",
      nextMaintenance: "2024-04-15",
      isAvailableForBooking: true,
    });

    const kart2 = await ctx.db.insert("karts", {
      number: "02",
      type: "rental",
      brand: "CRG",
      model: "Road Rebel",
      engineId: engine2,
      status: "active",
      totalHours: 87,
      lastMaintenance: "2024-02-01",
      nextMaintenance: "2024-05-01",
      isAvailableForBooking: true,
    });

    const kart3 = await ctx.db.insert("karts", {
      number: "03",
      type: "competition",
      brand: "Birel ART",
      model: "RY30-S8",
      status: "maintenance",
      totalHours: 203,
      lastMaintenance: "2024-01-10",
      nextMaintenance: "2024-04-10",
      notes: "Substituir pneus e verificar freios",
      isAvailableForBooking: false,
    });

    const kart4 = await ctx.db.insert("karts", {
      number: "J01",
      type: "junior",
      brand: "Tony Kart",
      model: "Mini Rookie",
      status: "active",
      totalHours: 65,
      lastMaintenance: "2024-02-15",
      nextMaintenance: "2024-05-15",
      isAvailableForBooking: true,
    });

    // Create sample time slots for today
    const today = new Date().toISOString().split('T')[0];
    
    await ctx.db.insert("timeSlots", {
      date: today,
      startTime: "09:00",
      endTime: "09:30",
      kartType: "rental",
      totalKarts: 3,
      availableKarts: 2,
      maxPilots: 3,
      currentPilots: 1,
      isActive: true,
    });

    await ctx.db.insert("timeSlots", {
      date: today,
      startTime: "09:30",
      endTime: "10:00",
      kartType: "rental",
      totalKarts: 3,
      availableKarts: 3,
      maxPilots: 3,
      currentPilots: 0,
      isActive: true,
    });

    await ctx.db.insert("timeSlots", {
      date: today,
      startTime: "10:00",
      endTime: "10:30",
      kartType: "junior",
      totalKarts: 1,
      availableKarts: 1,
      maxPilots: 1,
      currentPilots: 0,
      isActive: true,
    });

    // Create sample bookings for today
    const booking1 = await ctx.db.insert("bookings", {
      date: today,
      startTime: "09:00",
      endTime: "09:30",
      pilotId: pilot1,
      kartType: "rental",
      status: "confirmed",
      price: 50.00,
      paymentStatus: "paid",
      notes: "Cliente regular",
      autoAssignKart: true,
    });

    const booking2 = await ctx.db.insert("bookings", {
      date: today,
      startTime: "10:00",
      endTime: "10:30",
      pilotId: pilot3,
      kartType: "junior",
      status: "scheduled",
      price: 35.00,
      paymentStatus: "pending",
      autoAssignKart: true,
    });

    // Create sample transactions
    await ctx.db.insert("transactions", {
      type: "booking",
      amount: 50.00,
      description: "Corrida - João Silva",
      paymentMethod: "card",
      status: "completed",
      relatedId: booking1,
      date: today,
    });

    await ctx.db.insert("transactions", {
      type: "maintenance",
      amount: -120.00,
      description: "Manutenção Kart #03 - Pneus novos",
      paymentMethod: "cash",
      status: "completed",
      date: today,
    });

    await ctx.db.insert("transactions", {
      type: "equipment",
      amount: -85.50,
      description: "Compra de óleo para motores",
      paymentMethod: "transfer",
      status: "completed",
      date: today,
    });

    // Create sample race sessions
    const session1 = await ctx.db.insert("raceSessions", {
      sessionId: "PRACTICE_001",
      date: today,
      startTime: "09:00",
      endTime: "09:30",
      trackCondition: "dry",
      weather: "Ensolarado, 25°C",
      sessionType: "practice",
      isActive: false,
    });

    const session2 = await ctx.db.insert("raceSessions", {
      sessionId: "QUALIFYING_001",
      date: today,
      startTime: "10:00",
      endTime: "10:15",
      trackCondition: "dry",
      weather: "Ensolarado, 26°C",
      sessionType: "qualifying",
      isActive: false,
    });

    // Create sample lap times
    await ctx.db.insert("lapTimes", {
      sessionId: session1,
      pilotId: pilot1,
      kartNumber: "01",
      lapNumber: 1,
      lapTime: 45230,
      sector1: 15120,
      sector2: 14890,
      sector3: 15220,
      timestamp: new Date().toISOString(),
    });

    // Create sample parts inventory
    await ctx.db.insert("parts", {
      name: "Pneu Vega XM3",
      category: "Pneus",
      brand: "Vega",
      partNumber: "XM3-10x4.50-5",
      quantity: 12,
      minQuantity: 4,
      unitPrice: 85.00,
      supplier: "Kart Parts Brasil",
      location: "Estoque A1",
    });

    await ctx.db.insert("parts", {
      name: "Óleo Motor 4T",
      category: "Lubrificantes",
      brand: "Motul",
      partNumber: "300V-10W40",
      quantity: 8,
      minQuantity: 3,
      unitPrice: 45.00,
      supplier: "Auto Peças SP",
      location: "Estoque B2",
    });

    await ctx.db.insert("parts", {
      name: "Pastilha de Freio",
      category: "Freios",
      brand: "CRG",
      partNumber: "BRK-001",
      quantity: 2,
      minQuantity: 4,
      unitPrice: 35.00,
      supplier: "Kart Parts Brasil",
      location: "Estoque C1",
    });

    return "Sample data created successfully!";
  },
});
