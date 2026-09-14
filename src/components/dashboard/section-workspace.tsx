"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Download, Pencil, Plus, Printer, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

type RecordValue = string | number | null | undefined;

type SectionRow = {
  id: string;
  values: Record<string, RecordValue>;
};

type SectionConfig = {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  columns: { key: string; label: string }[];
  stats: { label: string; value: string | number }[];
  tabs?: string[];
};

const configs: Record<string, SectionConfig> = {
  copies: {
    eyebrow: "Collection inventory",
    title: "Book Copies",
    description: "Track every physical copy, barcode, condition, and shelf location.",
    action: "Add Book Copy",
    columns: [{ key: "accession", label: "Copy ID" }, { key: "barcode", label: "Barcode" }, { key: "book", label: "Book Title" }, { key: "status", label: "Status" }, { key: "location", label: "Location" }, { key: "condition", label: "Condition" }],
    stats: [],
  },
  barcodes: {
    eyebrow: "Collection tools",
    title: "Barcode Generator",
    description: "Generate and print labels from barcode numbers already registered in your inventory.",
    action: "Generate Barcode",
    columns: [{ key: "barcode", label: "Barcode" }, { key: "book", label: "Book" }, { key: "status", label: "Status" }, { key: "location", label: "Location" }],
    stats: [],
  },
  circulation: {
    eyebrow: "Circulation desk",
    title: "Circulation",
    description: "Issue, return, renew, and review borrowing activity from one place.",
    action: "Issue Book",
    columns: [{ key: "member", label: "Member" }, { key: "book", label: "Book" }, { key: "copy", label: "Copy / Barcode" }, { key: "issued", label: "Issued Date" }, { key: "due", label: "Due Date" }, { key: "returned", label: "Returned Date" }, { key: "status", label: "Status" }],
    stats: [],
    tabs: ["All", "Issued", "Due Today", "Overdue", "Returned"],
  },
  fines: {
    eyebrow: "Account balances",
    title: "Fines",
    description: "Review outstanding balances, payments, and overdue charges.",
    action: "Record Payment",
    columns: [{ key: "member", label: "Member" }, { key: "reason", label: "Reason" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }, { key: "date", label: "Date" }],
    stats: [],
  },
  reservations: {
    eyebrow: "Holds and queues",
    title: "Reservations",
    description: "Manage book holds, queue priority, and fulfilment status.",
    action: "Create Reservation",
    columns: [{ key: "member", label: "Member" }, { key: "book", label: "Book" }, { key: "date", label: "Reserved" }, { key: "status", label: "Status" }, { key: "priority", label: "Queue" }],
    stats: [],
  },
  inventory: {
    eyebrow: "Stock control",
    title: "Inventory",
    description: "Review availability, condition, location, and recent stock changes.",
    action: "Start Inventory Check",
    columns: [{ key: "book", label: "Book" }, { key: "barcode", label: "Copy / Barcode" }, { key: "location", label: "Location" }, { key: "condition", label: "Condition" }, { key: "status", label: "Status" }],
    stats: [],
  },
  reports: {
    eyebrow: "Insights",
    title: "Reports",
    description: "Build operational reports using a selected date range.",
    action: "Generate Report",
    columns: [],
    stats: [],
  },
  acquisitions: {
    eyebrow: "Collection growth",
    title: "Acquisitions",
    description: "Track suppliers, purchases, quantities, costs, and new materials.",
    action: "Add Acquisition",
    columns: [{ key: "invoice", label: "Invoice" }, { key: "supplier", label: "Supplier" }, { key: "date", label: "Purchase Date" }, { key: "notes", label: "Notes" }],
    stats: [],
  },
  users: {
    eyebrow: "Access control",
    title: "Users & Roles",
    description: "Review staff accounts and the roles that control library access.",
    action: "Add User",
    columns: [{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }, { key: "created", label: "Created" }],
    stats: [],
  },
  activity: {
    eyebrow: "Audit trail",
    title: "Activity Logs",
    description: "Search changes made by staff across every library module.",
    action: "Export Logs",
    columns: [{ key: "date", label: "Date / Time" }, { key: "user", label: "User" }, { key: "action", label: "Action" }, { key: "entity", label: "Module" }, { key: "description", label: "Description" }],
    stats: [],
  },
  settings: {
    eyebrow: "Library configuration",
    title: "Settings",
    description: "Manage library identity, circulation rules, fine policies, and reservations.",
    action: "Save Settings",
    columns: [{ key: "setting", label: "Setting" }, { key: "value", label: "Current Value" }, { key: "updated", label: "Last Updated" }],
    stats: [],
  },
};

const reportCards = ["Borrowing Report", "Overdue Report", "Member Report", "Book Report", "Inventory Report", "Fine Report", "Reservation Report"];

type IssueOption = { id: string; label: string };

export function SectionWorkspace({ section, rows, stats, members = [], copies = [] }: { section: string; rows: SectionRow[]; stats: { label: string; value: string | number }[]; members?: IssueOption[]; copies?: IssueOption[] }) {
  const router = useRouter();
  const config = configs[section] ?? configs.reports;
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(config.tabs?.[0] ?? "Overview");
  const [showAction, setShowAction] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [copyId, setCopyId] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const filteredRows = rows.filter((row) => {
    const matchesSearch = Object.values(row.values).join(" ").toLowerCase().includes(query.toLowerCase());
    if (section !== "circulation" || tab === "All") return matchesSearch;
    const status = String(row.values.status);
    const due = String(row.values.due);
    const today = new Date().toISOString().slice(0, 10);
    const matchesTab = tab === "Issued" ? status === "active" : tab === "Returned" ? status === "returned" : tab === "Due Today" ? status === "active" && due === today : status === "active" && due < today;
    return matchesSearch && matchesTab;
  });

  function openAction() {
    if (section === "activity") {
      window.print();
      return;
    }
    setShowAction(true);
  }

  async function issueBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    const client = createClient();
    const { error: insertError } = await client.from("loans").insert({ copy_id: copyId, member_id: memberId, due_at: `${dueDate}T23:59:59` });
    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }
    await client.from("book_copies").update({ status: "issued" }).eq("id", copyId);
    setIsSaving(false);
    setShowAction(false);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">{config.eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{config.title}</h1><p className="mt-2 text-muted-foreground">{config.description}</p></div>
        <Button onClick={openAction}>{section === "circulation" && <ArrowUpFromLine />} {section === "barcodes" && <Printer />} {section !== "activity" && section !== "circulation" && section !== "barcodes" && <Plus />} {config.action}</Button>
      </div>

      {stats.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map((stat) => <Card key={stat.label}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{stat.value}</p></CardContent></Card>)}</div>}

      {config.tabs && <div className="flex flex-wrap gap-2">{config.tabs.map((item) => <Button key={item} variant={tab === item ? "default" : "outline"} onClick={() => setTab(item)}>{item === "Issue" && <ArrowUpFromLine />} {item === "Return" && <ArrowDownToLine />} {item}</Button>)}</div>}

      {section === "reports" && <Card><CardHeader><CardTitle>Available reports</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{reportCards.map((report) => <Button key={report} variant="outline" className="h-auto justify-between p-4" onClick={() => setShowAction(true)}>{report}<Download className="size-4" /></Button>)}</div></CardContent></Card>}

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><CardTitle>{filteredRows.length} {filteredRows.length === 1 ? "record" : "records"}</CardTitle><div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}`} className="pl-9" /></div></CardHeader>
        <CardContent>{config.columns.length === 0 ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Choose a report above to set a date range and generate an export.</div> : filteredRows.length === 0 ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No {config.title.toLowerCase()} records found.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{config.columns.map((column) => <th key={column.key} className="pb-3 pr-4">{column.label}</th>)}<th className="pb-3 text-right">Action</th></tr></thead><tbody>{filteredRows.map((row) => <tr key={row.id} className="border-b last:border-0">{config.columns.map((column) => <td key={column.key} className="py-4 pr-4 capitalize text-muted-foreground">{row.values[column.key] ?? "-"}</td>)}<td className="py-4 text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setShowAction(true)}><Pencil /> Edit</Button><Button variant="destructive" size="sm" onClick={() => setShowAction(true)}><Trash2 /> Delete</Button></div></td></tr>)}</tbody></table></div>}</CardContent>
      </Card>

      <Dialog open={showAction} onOpenChange={setShowAction}><DialogContent><DialogHeader><DialogTitle>{config.action}</DialogTitle><DialogDescription>{section === "circulation" ? "Select a member, an available copy, and a due date." : section === "barcodes" ? "Enter an existing barcode number or select a registered copy before generating labels." : `Use this ${config.title.toLowerCase()} workspace to complete the operation.`}</DialogDescription></DialogHeader>{section === "circulation" ? <form onSubmit={issueBook} className="space-y-4"><div className="space-y-2"><Label htmlFor="issue-member">Member</Label><select id="issue-member" required value={memberId} onChange={(event) => setMemberId(event.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select a member</option>{members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}</select></div><div className="space-y-2"><Label htmlFor="issue-copy">Available book copy</Label><select id="issue-copy" required value={copyId} onChange={(event) => setCopyId(event.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select a copy</option>{copies.map((copy) => <option key={copy.id} value={copy.id}>{copy.label}</option>)}</select></div><div className="space-y-2"><Label htmlFor="issue-due">Due date</Label><Input id="issue-due" type="date" required value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></div>{error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<DialogFooter><Button type="button" variant="outline" onClick={() => setShowAction(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Issuing..." : "Issue Book"}</Button></DialogFooter></form> : <><div className="space-y-2"><Label htmlFor="workspace-search">Search or reference</Label><Input id="workspace-search" placeholder="Enter an existing ID, barcode, or name" /></div><div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">This action is available from the full {config.title.toLowerCase()} workspace.</div><DialogFooter><Button variant="outline" onClick={() => setShowAction(false)}>Cancel</Button><Button onClick={() => setShowAction(false)}>Close</Button></DialogFooter></>}</DialogContent></Dialog>
    </div>
  );
}
