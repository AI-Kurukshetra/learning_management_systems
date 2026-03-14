"use server";

import { requireAuthenticatedViewer } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { revalidateWorkspace } from "@/lib/lms-common";
import type { NotificationItem, NotificationType } from "@/lib/types";

interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string | null;
}

function mapNotification(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function createNotification(payload: CreateNotificationPayload) {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body ?? "",
    link: payload.link ?? null,
    is_read: false,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createNotifications(payloads: CreateNotificationPayload[]) {
  if (payloads.length === 0) {
    return;
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("notifications").insert(
    payloads.map((payload) => ({
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body ?? "",
      link: payload.link ?? null,
      is_read: false,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function getNotifications(limit = 8) {
  const viewer = await requireAuthenticatedViewer();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id,user_id,type,title,body,link,is_read,created_at")
    .eq("user_id", viewer.currentUser.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return ((data ?? []) as NotificationRow[]).map(mapNotification);
}

export async function markAllNotificationsRead() {
  const viewer = await requireAuthenticatedViewer();
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", viewer.currentUser.id)
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }

  revalidateWorkspace(viewer.role);
}