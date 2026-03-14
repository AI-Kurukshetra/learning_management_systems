import { AppShell } from "@/components/AppShell";
import { MessageThread } from "@/components/MessageThread";
import { getCurrentViewer } from "@/lib/dbActions";
import {
  getParentChild,
  getParentMessages,
  getParentTeacherContacts,
  initialParentMessageState,
  sendParentMessage,
} from "@/lib/parent-actions";

export const dynamic = "force-dynamic";

export default async function ParentMessagesPage() {
  const [viewer, childState, contacts, messages] = await Promise.all([
    getCurrentViewer(),
    getParentChild(),
    getParentTeacherContacts(),
    getParentMessages(),
  ]);

  return (
    <AppShell
      title="Parent Messages"
      description="Send direct notes to teachers connected to your linked child."
      viewer={viewer}
    >
      {childState.child ? (
        <MessageThread
          contacts={contacts}
          messages={messages}
          action={sendParentMessage}
          initialState={initialParentMessageState}
        />
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          No child is linked to this parent account yet.
        </div>
      )}
    </AppShell>
  );
}
