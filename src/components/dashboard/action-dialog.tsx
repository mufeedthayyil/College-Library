"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ActionDialogProps = {
  open: boolean;
  section: string;
  title: string;
  action: string;
};

const sectionGuidance: Record<string, string> = {
  copies: "Register a physical copy with its accession number, barcode, condition, and shelf location.",
  barcodes: "Choose copies from your inventory to generate and print barcode labels.",
  circulation: "Select a member and book copy to issue or return an item and calculate its due date.",
  fines: "Review unpaid balances and record payments against completed loans.",
  reservations: "Select a book and member to place a hold in the reservation queue.",
  inventory: "Start a stock check and record changes to copy condition or availability.",
  reports: "Choose a date range and report type to review collection and circulation activity.",
  acquisitions: "Record a supplier purchase and add the titles and copies received.",
  users: "Invite a staff account and assign its library role.",
  activity: "Review changes made by staff across the operations desk.",
  settings: "Update loan rules, fine settings, reservation limits, and library contact details.",
};

const sectionActionCopy: Record<string, { heading: string; detail: string; button: string }> = {
  copies: { heading: "Register a physical copy", detail: "Add accession and barcode details, then connect the copy to a title in your collection.", button: "Manage copies" },
  barcodes: { heading: "Create barcode labels", detail: "Select registered copies and prepare a printable barcode batch.", button: "Open barcode generator" },
  circulation: { heading: "Start circulation", detail: "Choose whether you are issuing or returning a copy, then select the member and copy.", button: "Open circulation desk" },
  fines: { heading: "Review fines", detail: "Review unpaid and partially paid balances, then record payments against a loan.", button: "Review fines" },
  reservations: { heading: "Create reservation", detail: "Place a book on hold for a member and monitor its queue status.", button: "Manage reservations" },
  inventory: { heading: "Start inventory check", detail: "Scan or review copies and record their current condition and availability.", button: "Open inventory" },
  reports: { heading: "Build a report", detail: "Choose a report type and date range to inspect collection and circulation activity.", button: "Open reports" },
  acquisitions: { heading: "Record acquisition", detail: "Record a supplier purchase and the titles received for the collection.", button: "Manage acquisitions" },
  users: { heading: "Manage staff access", detail: "Invite staff through Supabase Authentication, then assign their library role.", button: "Open users and roles" },
  activity: { heading: "Review activity", detail: "Inspect the audit trail of changes made across the operations desk.", button: "Open activity logs" },
  settings: { heading: "Update library settings", detail: "Adjust loan periods, fine rules, reservation limits, and library contact details.", button: "Open settings" },
};

export function ActionDialog({ open, section, title, action }: ActionDialogProps) {
  const router = useRouter();
  const actionCopy = sectionActionCopy[section] ?? { heading: action, detail: `Manage ${title.toLowerCase()} in the library workspace.`, button: `Open ${title.toLowerCase()}` };
  const [bookId, setBookId] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [isbn, setIsbn] = useState("");
  const [price, setPrice] = useState("");
  const [memberId, setMemberId] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function closeDialog() {
    router.replace(`/dashboard/${section}`);
    router.refresh();
  }

  async function createBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const { error: insertError } = await createClient().from("books").insert({
      book_id: bookId.trim(),
      title: bookTitle.trim(),
      isbn: isbn.trim() || null,
      price: price ? Number(price) : null,
    });

    if (insertError) {
      setError(
        insertError.code === "42501"
          ? "Your account is not assigned a staff role. Apply the staff profile migration, then sign in again."
          : insertError.message,
      );
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    closeDialog();
  }

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const { error: insertError } = await createClient().from("members").insert({
      member_id: memberId.trim(),
      full_name: memberName.trim(),
      email: memberEmail.trim() || null,
      phone: memberPhone.trim() || null,
    });

    if (insertError) {
      setError(insertError.code === "42501" ? "Your account is not assigned a staff role. Apply the staff profile migration, then sign in again." : insertError.message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    closeDialog();
  }

  return (
    <Dialog key={String(open)} open={open} onOpenChange={(nextOpen) => !nextOpen && closeDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{section === "books" || section === "members" ? action : actionCopy.heading}</DialogTitle>
          <DialogDescription>{section === "books" ? "Add a title to your library collection." : section === "members" ? "Add a member to the library directory." : sectionGuidance[section] ?? `Manage ${title.toLowerCase()} from the library workspace.`}</DialogDescription>
        </DialogHeader>
        {section === "books" ? (
          <form onSubmit={createBook} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="book-id">Book ID</Label>
              <Input id="book-id" required value={bookId} onChange={(event) => setBookId(event.target.value)} placeholder="BK-0001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-title">Title</Label>
              <Input id="book-title" required value={bookTitle} onChange={(event) => setBookTitle(event.target.value)} placeholder="The book title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-isbn">ISBN <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="book-isbn" value={isbn} onChange={(event) => setIsbn(event.target.value)} placeholder="978..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-price">Price <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="book-price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" />
            </div>
            {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save book"}</Button>
            </DialogFooter>
          </form>
        ) : section === "members" ? (
          <form onSubmit={createMember} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="member-id">Member ID</Label><Input id="member-id" required value={memberId} onChange={(event) => setMemberId(event.target.value)} placeholder="MEM-0001" /></div>
            <div className="space-y-2"><Label htmlFor="member-name">Full name</Label><Input id="member-name" required value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder="Member name" /></div>
            <div className="space-y-2"><Label htmlFor="member-email">Email <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="member-email" type="email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="member@college.edu" /></div>
            <div className="space-y-2"><Label htmlFor="member-phone">Phone <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="member-phone" value={memberPhone} onChange={(event) => setMemberPhone(event.target.value)} placeholder="Phone number" /></div>
            {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save member"}</Button></DialogFooter>
          </form>
        ) : (
          <>
            <div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
              {actionCopy.detail}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={closeDialog}>{actionCopy.button}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}