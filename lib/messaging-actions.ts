"use server";

import { requireAuthenticatedViewer } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import {
  buildMessageLink,
  fail,
  getAccessibleCourses,
  getAdminUserIds,
  getUserMap,
  normalizeText,
  ok,
  optionalText,
  revalidateWorkspace,
  toSchemaAwareMessage,
} from "@/lib/lms-common";
import { createNotification } from "@/lib/notification-actions";
import type { AppUser, MessageItem, MessageThreadItem, UserRole } from "@/lib/types";
import type { CourseBuilderActionState } from "@/lib/course-builder";

interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export async function getMessagingRecipients() {
  const viewer = await requireAuthenticatedViewer();
  const supabase = createServiceRoleSupabaseClient();

  if (viewer.role === "admin") {
    const { data, error } = await supabase
      .from("users")
      .select("id,auth_user_id,email,name,role,created_at")
      .neq("id", viewer.currentUser.id)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as AppUser[];
  }

  if (viewer.role === "teacher") {
    const courses = await getAccessibleCourses(viewer);
    const courseIds = courses.map((course) => course.id);
    const adminIds = await getAdminUserIds();
    const enrollmentResult =
      courseIds.length > 0
        ? await supabase.from("enrollments").select("student_id").in("course_id", courseIds)
        : { data: [], error: null };
    if (enrollmentResult.error) throw new Error(enrollmentResult.error.message);
    const studentIds = (enrollmentResult.data ?? []).map((row: { student_id: string }) => row.student_id);
    const userIds = [...new Set([...adminIds, ...studentIds])].filter((id) => id !== viewer.currentUser.id);
    if (userIds.length === 0) return [];
    const { data, error } = await supabase
      .from("users")
      .select("id,auth_user_id,email,name,role,created_at")
      .in("id", userIds)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as AppUser[];
  }

  const courses = await getAccessibleCourses(viewer);
  const teacherIds = [...new Set(courses.map((course) => course.teacher_id))];
  const adminIds = await getAdminUserIds();
  const userIds = [...new Set([...teacherIds, ...adminIds])].filter((id) => id !== viewer.currentUser.id);
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("users")
    .select("id,auth_user_id,email,name,role,created_at")
    .in("id", userIds)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AppUser[];
}

export async function getMessageThreads() {
  const viewer = await requireAuthenticatedViewer();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id,sender_id,recipient_id,subject,body,is_read,created_at")
    .or(`sender_id.eq.${viewer.currentUser.id},recipient_id.eq.${viewer.currentUser.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    return [] as MessageThreadItem[];
  }

  const rows = (data ?? []) as MessageRow[];
  const otherIds = [...new Set(rows.map((row) => (row.sender_id === viewer.currentUser.id ? row.recipient_id : row.sender_id)))];
  const userMap = await getUserMap(otherIds);
  const threadMap = new Map<string, MessageThreadItem>();

  rows.forEach((row) => {
    const otherId = row.sender_id === viewer.currentUser.id ? row.recipient_id : row.sender_id;
    const user = userMap.get(otherId);
    if (!user || threadMap.has(otherId)) return;
    threadMap.set(otherId, {
      userId: otherId,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      lastMessage: row.body,
      lastMessageAt: row.created_at,
      unreadCount: rows.filter((message) => message.sender_id === otherId && message.recipient_id === viewer.currentUser.id && !message.is_read).length,
    });
  });

  return Array.from(threadMap.values());
}

export async function getMessages(partnerId: string) {
  const viewer = await requireAuthenticatedViewer();
  const recipients = await getMessagingRecipients();
  if (!recipients.some((user) => user.id === partnerId)) return [] as MessageItem[];

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id,sender_id,recipient_id,subject,body,is_read,created_at")
    .or(`and(sender_id.eq.${viewer.currentUser.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${viewer.currentUser.id})`)
    .order("created_at", { ascending: true });
  if (error) return [] as MessageItem[];

  await supabase.from("messages").update({ is_read: true }).eq("recipient_id", viewer.currentUser.id).eq("sender_id", partnerId).eq("is_read", false);
  const userMap = await getUserMap([viewer.currentUser.id, partnerId]);

  return ((data ?? []) as MessageRow[]).map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    senderName: userMap.get(row.sender_id)?.name ?? "Unknown sender",
    senderEmail: userMap.get(row.sender_id)?.email ?? "",
    recipientName: userMap.get(row.recipient_id)?.name ?? "Unknown recipient",
    recipientEmail: userMap.get(row.recipient_id)?.email ?? "",
    subject: row.subject,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

export async function createMessage(
  _state: CourseBuilderActionState,
  formData: FormData,
): Promise<CourseBuilderActionState> {
  try {
    const viewer = await requireAuthenticatedViewer();
    const recipientId = normalizeText(formData.get("recipientId"), "Recipient");
    const subject = optionalText(formData.get("subject")) ?? "New message";
    const body = normalizeText(formData.get("body"), "Message");
    const recipients = await getMessagingRecipients();
    const recipient = recipients.find((user) => user.id === recipientId);

    if (!recipient) {
      throw new Error("You cannot message this user.");
    }

    const supabase = createServiceRoleSupabaseClient();
    const { error } = await supabase.from("messages").insert({
      sender_id: viewer.currentUser.id,
      recipient_id: recipientId,
      subject,
      body,
      is_read: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    await createNotification({
      userId: recipientId,
      type: "new_message",
      title: `New message from ${viewer.currentUser.name}`,
      body: subject,
      link: buildMessageLink(recipient.role as UserRole, viewer.currentUser.id),
    });

    revalidateWorkspace(viewer.role);
    revalidateWorkspace(recipient.role as UserRole);
    return ok("Message sent.");
  } catch (error) {
    return fail(toSchemaAwareMessage(error));
  }
}