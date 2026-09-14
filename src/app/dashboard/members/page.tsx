import { createClient } from "@/lib/supabase/server";
import { ActionDialog } from "@/components/dashboard/action-dialog";
import { MembersWorkspace, type MemberRecord } from "@/components/dashboard/members-workspace";

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ action?: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("id, member_id, full_name, email, phone, member_type, status, membership_expiry, created_at")
    .order("created_at", { ascending: false });
  const { action } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7">
      <MembersWorkspace members={(data ?? []) as MemberRecord[]} />
      <ActionDialog open={action === "create"} section="members" title="Members" action="Add a member" />
    </div>
  );
}