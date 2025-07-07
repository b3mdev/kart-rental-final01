import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    isRead: v.optional(v.boolean()),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let notifications = await ctx.db.query("notifications").collect();
    
    // Filter by read status
    if (args.isRead !== undefined) {
      notifications = notifications.filter(n => n.isRead === args.isRead);
    }
    
    // Filter by type
    if (args.type) {
      notifications = notifications.filter(n => n.type === args.type);
    }
    
    // Sort by creation time (newest first)
    notifications.sort((a, b) => b._creationTime - a._creationTime);
    
    // Apply limit
    if (args.limit) {
      notifications = notifications.slice(0, args.limit);
    }
    
    return notifications;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.string(),
    relatedId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
    });
  },
});

export const markAsRead = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isRead: true });
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();
    
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
    
    return unreadNotifications.length;
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();
    
    return unreadNotifications.length;
  },
});
