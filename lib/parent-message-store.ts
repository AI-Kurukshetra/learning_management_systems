import { randomUUID } from "crypto";

export interface ParentMessageRecord {
  id: string;
  parentId: string;
  teacherId: string;
  content: string;
  timestamp: string;
}

declare global {
  var __eduflowParentMessages: ParentMessageRecord[] | undefined;
}

const parentMessageStore = globalThis.__eduflowParentMessages ?? [];

globalThis.__eduflowParentMessages = parentMessageStore;

export function addParentMessage(parentId: string, teacherId: string, content: string) {
  const message: ParentMessageRecord = {
    id: randomUUID(),
    parentId,
    teacherId,
    content,
    timestamp: new Date().toISOString(),
  };

  parentMessageStore.unshift(message);
  return message;
}

export function getMessagesForParent(parentId: string) {
  return parentMessageStore.filter((message) => message.parentId === parentId);
}
