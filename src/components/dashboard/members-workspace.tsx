"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Search, Users, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

export type MemberRecord = {
  id: string;
  member_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  member_type: string;
  status: string;
  membership_expiry: string | null;
  created_at: string;
};

export function MembersWorkspace({ members }: { members: MemberRecord[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editingMember, setEditingMember] = useState<MemberRecord | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingMember, setDeletingMember] = useState<MemberRecord | null>(null);
  const filteredMembers = members.filter((member) => `${member.member_id} ${member.full_name} ${member.email ?? ""} ${member.phone ?? ""}`.toLowerCase().includes(query.toLowerCase()));

  function openEdit(member: MemberRecord) {
    setEditingMember(member);
    setName(member.full_name);
    setEmail(member.email ?? "");
    setPhone(member.phone ?? "");
    setError("");
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingMember) return;
    setIsSaving(true);
    setError("");
    const { error: updateError } = await createClient().from("members").update({ full_name: name.trim(), email: email.trim() || null, phone: phone.trim() || null }).eq("id", editingMember.id);
    if (updateError) {
      setError(updateError.code === "42501" ? "Your account is not assigned a staff role." : updateError.message);
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    setEditingMember(null);
    router.refresh();
  }

  async function deleteMember() {
    if (!deletingMember) return;
    setIsSaving(true);
    setError("");
    const { error: deleteError } = await createClient().from("members").delete().eq("id", deletingMember.id);
    if (deleteError) {
      setError(deleteError.code === "42501" ? "Your account is not assigned a staff role." : deleteError.message);
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    setDeletingMember(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Library directory</p><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Members</h1><p className="mt-2 text-muted-foreground">Search and maintain borrowing access.</p></div>
        <Button onClick={() => router.push("/dashboard/members?action=create")}><Users /> Add a member</Button>
      </div>
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><CardTitle>{filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"}</CardTitle><div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, ID, or email" className="pl-9" /></div></CardHeader>
        <CardContent>{filteredMembers.length === 0 ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{members.length === 0 ? "No members have been added yet." : "No members match your search."}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-3 pr-4">Member</th><th className="pb-3 pr-4">Contact</th><th className="pb-3 pr-4">Type</th><th className="pb-3 pr-4">Status</th><th className="pb-3 text-right">Action</th></tr></thead><tbody>{filteredMembers.map((member) => <tr key={member.id} className="border-b last:border-0"><td className="py-4 pr-4"><p className="font-medium">{member.full_name}</p><p className="mt-1 text-xs text-muted-foreground">{member.member_id}</p></td><td className="py-4 pr-4 text-muted-foreground">{member.email ?? member.phone ?? "-"}</td><td className="py-4 pr-4 capitalize">{member.member_type}</td><td className="py-4 pr-4 capitalize text-muted-foreground">{member.status}</td><td className="py-4 text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(member)}><Pencil /> Edit</Button><Button variant="destructive" size="sm" onClick={() => { setDeletingMember(member); setError(""); }}><Trash2 /> Delete</Button></div></td></tr>)}</tbody></table></div>}</CardContent>
      </Card>
      <Dialog open={Boolean(editingMember)} onOpenChange={(open) => !open && setEditingMember(null)}><DialogContent><DialogHeader><DialogTitle>Edit member</DialogTitle><DialogDescription>Update contact details for this member.</DialogDescription></DialogHeader><form onSubmit={saveEdit} className="space-y-4"><div className="space-y-2"><Label htmlFor="edit-member-name">Full name</Label><Input id="edit-member-name" required value={name} onChange={(event) => setName(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="edit-member-email">Email</Label><Input id="edit-member-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="edit-member-phone">Phone</Label><Input id="edit-member-phone" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>{error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<DialogFooter><Button type="button" variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={Boolean(deletingMember)} onOpenChange={(open) => !open && setDeletingMember(null)}><DialogContent><DialogHeader><DialogTitle>Delete member?</DialogTitle><DialogDescription>This permanently removes {deletingMember?.full_name ?? "this member"}. Members with borrowing history cannot be removed.</DialogDescription></DialogHeader>{error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<DialogFooter><Button variant="outline" onClick={() => setDeletingMember(null)}>Cancel</Button><Button variant="destructive" onClick={deleteMember} disabled={isSaving}>{isSaving ? "Deleting..." : "Delete member"}</Button></DialogFooter></DialogContent></Dialog>
    </>
  );
}