import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { AppUser } from "@/lib/types";

export interface ParentStudentLinkRecord {
  parentId: string;
  studentId: string;
  linkedAt: string;
}

type ParentIdentity = Pick<AppUser, "id" | "auth_user_id">;
type ParentMetadata = Record<string, unknown> & {
  linkedStudentId?: string | null;
  linkedAt?: string | null;
};

async function fetchParentUsers() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,auth_user_id,email,name,role,created_at")
    .eq("role", "parent")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AppUser[];
}

async function getAuthUserById(authUserId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.auth.admin.getUserById(authUserId);

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

async function updateParentMetadata(
  authUserId: string,
  updater: (metadata: ParentMetadata) => ParentMetadata,
) {
  const supabase = createServiceRoleSupabaseClient();
  const authUser = await getAuthUserById(authUserId);
  const currentMetadata = (authUser.user_metadata ?? {}) as ParentMetadata;
  const { error } = await supabase.auth.admin.updateUserById(authUserId, {
    user_metadata: updater(currentMetadata),
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function readParentLink(parent: ParentIdentity) {
  if (!parent.auth_user_id) {
    return null;
  }

  const authUser = await getAuthUserById(parent.auth_user_id);
  const metadata = (authUser.user_metadata ?? {}) as ParentMetadata;
  const linkedStudentId = String(metadata.linkedStudentId ?? "").trim();

  if (!linkedStudentId) {
    return null;
  }

  return {
    parentId: parent.id,
    studentId: linkedStudentId,
    linkedAt: String(metadata.linkedAt ?? authUser.updated_at ?? authUser.created_at ?? new Date().toISOString()),
  } satisfies ParentStudentLinkRecord;
}

export async function linkParentToStudent(parent: ParentIdentity, studentId: string) {
  if (!parent.auth_user_id) {
    throw new Error("Selected parent does not have a linked auth user.");
  }

  await updateParentMetadata(parent.auth_user_id, (metadata) => ({
    ...metadata,
    linkedStudentId: studentId,
    linkedAt: new Date().toISOString(),
  }));
}

export async function unlinkParent(parent: ParentIdentity) {
  if (!parent.auth_user_id) {
    return;
  }

  await updateParentMetadata(parent.auth_user_id, (metadata) => ({
    ...metadata,
    linkedStudentId: null,
    linkedAt: null,
  }));
}

export async function removeParentStudentLinkByStudentId(studentId: string) {
  const parents = await fetchParentUsers();
  const links = await getAllParentLinks(parents);
  const parentMap = new Map(parents.map((parent) => [parent.id, parent]));

  await Promise.all(
    links
      .filter((link) => link.studentId === studentId)
      .map(async (link) => {
        const parent = parentMap.get(link.parentId);

        if (parent) {
          await unlinkParent(parent);
        }
      }),
  );
}

export async function getLinkedStudentIdForParent(parent: ParentIdentity) {
  return (await readParentLink(parent))?.studentId ?? null;
}

export async function getLinkedParentIdForStudent(studentId: string, parents?: AppUser[]) {
  const links = await getAllParentLinks(parents);
  return links.find((link) => link.studentId === studentId)?.parentId ?? null;
}

export async function getAllParentLinks(parents?: AppUser[]) {
  const sourceParents = parents ?? (await fetchParentUsers());
  const links = await Promise.all(sourceParents.map((parent) => readParentLink(parent)));

  return links
    .filter((link): link is ParentStudentLinkRecord => Boolean(link))
    .sort((left, right) => right.linkedAt.localeCompare(left.linkedAt));
}
