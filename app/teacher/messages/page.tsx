import { AppShell } from "@/components/AppShell";
import { MessagingPanel } from "@/components/MessagingPanel";
import { getCurrentViewer } from "@/lib/dbActions";
import { createMessage, getMessageThreads, getMessages, getMessagingRecipients } from "@/lib/messaging-actions";

export const dynamic = "force-dynamic";

export default async function TeacherMessagesPage({ searchParams }: { searchParams: { with?: string } }) {
  const viewer = await getCurrentViewer();
  const selectedRecipientId = searchParams.with ?? null;
  const [recipients, threads, messages] = await Promise.all([
    getMessagingRecipients(),
    getMessageThreads(),
    selectedRecipientId ? getMessages(selectedRecipientId) : Promise.resolve([]),
  ]);

  return (
    <AppShell title="Messages" description="Send internal updates to admins and students in your teaching network." viewer={viewer}>
      <MessagingPanel recipients={recipients} threads={threads} messages={messages} selectedRecipientId={selectedRecipientId} createMessageAction={createMessage} />
    </AppShell>
  );
}