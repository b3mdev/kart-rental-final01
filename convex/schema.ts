import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  pilots: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    category: v.string(),
    kartTypes: v.array(v.string()),
    emergencyContact: v.optional(v.string()),
    emergencyPhone: v.optional(v.string()),
    medicalInfo: v.optional(v.string()),
    isActive: v.boolean(),
    registrationDate: v.string(),
    totalRaces: v.optional(v.number()),
    bestLapTime: v.optional(v.number()),
    averageLapTime: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  engines: defineTable({
    serialNumber: v.string(),
    brand: v.string(),
    model: v.string(),
    displacement: v.optional(v.string()),
    power: v.optional(v.string()),
    status: v.string(),
    totalHours: v.optional(v.number()),
    lastMaintenance: v.optional(v.string()),
    nextMaintenance: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_serial", ["serialNumber"])
    .index("by_status", ["status"]),

  karts: defineTable({
    number: v.string(),
    type: v.string(),
    brand: v.string(),
    model: v.string(),
    engineId: v.optional(v.id("engines")),
    status: v.string(),
    totalHours: v.optional(v.number()),
    lastMaintenance: v.optional(v.string()),
    nextMaintenance: v.optional(v.string()),
    notes: v.optional(v.string()),
    // New fields for availability scheduling
    isAvailableForBooking: v.optional(v.boolean()),
    availableTimeSlots: v.optional(v.array(v.string())), // Array of time slot IDs when this kart is available
    maxDailyHours: v.optional(v.number()), // Maximum hours this kart can be used per day
    preferredTimeSlots: v.optional(v.array(v.string())), // Preferred time slots for this kart
  })
    .index("by_number", ["number"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_availability", ["isAvailableForBooking"])
    .index("by_type_and_availability", ["type", "isAvailableForBooking"]),

  timeSlots: defineTable({
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    kartType: v.string(),
    totalKarts: v.number(),
    availableKarts: v.number(),
    isActive: v.boolean(),
    // New fields for better kart management
    assignedKarts: v.optional(v.array(v.id("karts"))), // Specific karts assigned to this slot
    maxPilots: v.optional(v.number()), // Maximum number of pilots allowed on track
    currentPilots: v.optional(v.number()), // Current number of pilots booked
    pricePerPilot: v.optional(v.number()), // Price per pilot for this slot
  })
    .index("by_date", ["date"])
    .index("by_date_and_type", ["date", "kartType"])
    .index("by_kart_type", ["kartType"]),

  bookings: defineTable({
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    pilotId: v.id("pilots"),
    kartType: v.string(),
    status: v.string(),
    price: v.number(),
    paymentStatus: v.string(),
    notes: v.optional(v.string()),
    // New fields for kart assignment
    assignedKartId: v.optional(v.id("karts")), // Specific kart assigned to this booking
    timeSlotId: v.optional(v.id("timeSlots")), // Reference to the time slot
    autoAssignKart: v.optional(v.boolean()), // Whether to auto-assign an available kart
  })
    .index("by_date", ["date"])
    .index("by_pilot", ["pilotId"])
    .index("by_status", ["status"])
    .index("by_kart", ["assignedKartId"])
    .index("by_time_slot", ["timeSlotId"]),

  transactions: defineTable({
    type: v.string(),
    amount: v.number(),
    description: v.string(),
    paymentMethod: v.string(),
    status: v.string(),
    relatedId: v.optional(v.id("bookings")),
    date: v.string(),
  })
    .index("by_date", ["date"])
    .index("by_type", ["type"])
    .index("by_status", ["status"]),

  raceSessions: defineTable({
    sessionId: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    trackCondition: v.string(),
    weather: v.optional(v.string()),
    sessionType: v.string(),
    isActive: v.boolean(),
  })
    .index("by_date", ["date"])
    .index("by_session_id", ["sessionId"]),

  lapTimes: defineTable({
    sessionId: v.id("raceSessions"),
    pilotId: v.id("pilots"),
    kartNumber: v.string(),
    lapNumber: v.number(),
    lapTime: v.number(),
    sector1: v.optional(v.number()),
    sector2: v.optional(v.number()),
    sector3: v.optional(v.number()),
    timestamp: v.string(),
  })
    .index("by_session", ["sessionId"])
    .index("by_pilot", ["pilotId"])
    .index("by_session_and_pilot", ["sessionId", "pilotId"]),

  parts: defineTable({
    name: v.string(),
    category: v.string(),
    brand: v.optional(v.string()),
    partNumber: v.optional(v.string()),
    quantity: v.number(),
    minQuantity: v.number(),
    unitPrice: v.number(),
    supplier: v.optional(v.string()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_category", ["category"])
    .index("by_quantity", ["quantity"]),

  notifications: defineTable({
    title: v.string(),
    message: v.string(),
    type: v.string(),
    relatedId: v.optional(v.string()),
    isRead: v.boolean(),
  })
    .index("by_read", ["isRead"])
    .index("by_type", ["type"]),

  checkIns: defineTable({
    qrCode: v.string(),
    pilotId: v.id("pilots"),
    bookingId: v.id("bookings"),
    kartAssigned: v.optional(v.string()),
    checkInTime: v.string(),
    status: v.string(),
  })
    .index("by_qr_code", ["qrCode"])
    .index("by_pilot", ["pilotId"])
    .index("by_booking", ["bookingId"]),

  // New table for kart availability schedules
  kartAvailability: defineTable({
    kartId: v.id("karts"),
    date: v.string(),
    timeSlotId: v.id("timeSlots"),
    isAvailable: v.boolean(),
    maintenanceReason: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_kart", ["kartId"])
    .index("by_date", ["date"])
    .index("by_time_slot", ["timeSlotId"])
    .index("by_kart_and_date", ["kartId", "date"]),

  // Categories table for different kart types with HP and pricing
  categories: defineTable({
    name: v.string(),
    horsepower: v.number(),
    description: v.optional(v.string()),
    pricePerSession: v.number(),
    isActive: v.boolean(),
  })
    .index("by_active", ["isActive"])
    .index("by_horsepower", ["horsepower"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
