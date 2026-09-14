"use client";

import { useState, type FormEvent } from "react";
import { Download, Eye, Plus, Printer, Search, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

type Row = { id: string; values: Record<string, string | number | null> };
type Stat = { label: string; value: string | number };

type WorkspaceConfig = {
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
  columns: { key: string; label: string }[];
};

const configs: Record<string, WorkspaceConfig> = {
  barcodes: { eyebrow: "Collection tools", title: "Barcode Generator", description: "Generate, preview, and print exact barcode numbers from your inventory.", columns: [{ key: "barcode", label: "Barcode" }, { key: "book", label: "Book" }, { key: "status", label: "Status" }, { key: "location", label: "Location" }] },
  fines: { eyebrow: "Account balances", title: "Fines", description: "Review outstanding balances, payments, and overdue charges.", columns: [{ key: "member", label: "Member" }, { key: "book", label: "Book" }, { key: "reason", label: "Reason" }, { key: "amount", label: "Amount" }, { key: "date", label: "Date" }, { key: "status", label: "Status" }] },
  reservations: { eyebrow: "Holds and queues", title: "Reservations", description: "Manage book holds, queue position, and fulfilment status.", columns: [{ key: "member", label: "Member" }, { key: "book", label: "Book" }, { key: "date", label: "Reservation Date" }, { key: "status", label: "Status" }, { key: "priority", label: "Position" }] },
  inventory: { eyebrow: "Stock control", title: "Inventory", description: "Review availability, condition, location, and recent stock changes.", columns: [{ key: "book", label: "Book" }, { key: "barcode", label: "Barcode" }, { key: "location", label: "Location" }, { key: "condition", label: "Condition" }, { key: "status", label: "Status" }, { key: "updated", label: "Last Updated" }] },
  reports: { eyebrow: "Insights", title: "Reports", description: "Choose a report and date range to inspect library operations.", columns: [] },
  acquisitions: { eyebrow: "Collection growth", title: "Acquisitions", description: "Track suppliers, quantities, costs, and new materials.", action: "Add Acquisition", columns: [{ key: "invoice", label: "Invoice" }, { key: "supplier", label: "Supplier" }, { key: "date", label: "Date" }, { key: "notes", label: "Notes" }] },
  users: { eyebrow: "Access control", title: "Users & Roles", description: "Review staff accounts and their library access roles.", columns: [{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }, { key: "created", label: "Created" }] },
  activity: { eyebrow: "Audit trail", title: "Activity Logs", description: "Search changes made by staff across library modules.", columns: [{ key: "date", label: "Date & Time" }, { key: "user", label: "User" }, { key: "action", label: "Action" }, { key: "entity", label: "Module" }, { key: "description", label: "Description" }] },
  settings: { eyebrow: "Library configuration", title: "Settings", description: "Manage library identity, circulation rules, fine policies, and reservations.", columns: [{ key: "setting", label: "Setting" }, { key: "value", label: "Current Value" }, { key: "updated", label: "Last Updated" }] },
};

const reportTypes = ["Circulation Report", "Overdue Report", "Members Report", "Inventory Report", "Fine Report", "Reservations Report", "Acquisition Report"];

export function RemainingWorkspace({ section, rows, stats }: { section: string; rows: Row[]; stats: Stat[] }) {
  const config = configs[section] ?? configs.reports;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [modal, setModal] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");
  const [barcodeList, setBarcodeList] = useState<string[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const filtered = rows.filter((row) => {
    const text = Object.values(row.values).join(" ").toLowerCase();
    return text.includes(query.toLowerCase()) && (status === "all" || String(row.values.status) === status);
  });

  function addBarcode(event: FormEvent) {
    event.preventDefault();
    const exact = barcode.trim();
    if (exact && !barcodeList.includes(exact)) setBarcodeList((items) => [...items, exact]);
    setBarcode("");
  }

  function printBarcodes() {
    window.print();
  }

  async function markFinePaid(id: string) {
    setSaving(true);
    setError("");
    const { error: updateError } = await createClient().from("fines").update({ status: "paid", paid_amount: undefined }).eq("id", id);
    if (updateError) setError(updateError.message);
    setSaving(false);
  }

  async function updateReservation(id: string, nextStatus: string) {
    setSaving(true);
    setError("");
    const { error: updateError } = await createClient().from("reservations").update({ status: nextStatus }).eq("id", id);
    if (updateError) setError(updateError.message);
    setSaving(false);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">{config.eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{config.title}</h1><p className="mt-2 text-muted-foreground">{config.description}</p></div>{config.action && <Button onClick={() => setModal("acquisition")}><Plus /> {config.action}</Button>}</div>
      {stats.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map((item) => <Card key={item.label}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{item.value}</p></CardContent></Card>)}</div>}
      {section === "barcodes" && <Card><CardHeader><CardTitle>Generate exact barcode numbers</CardTitle></CardHeader><CardContent><form onSubmit={addBarcode} className="flex flex-col gap-3 sm:flex-row"><Input required value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Enter an existing barcode number" /><Button type="submit"><Plus /> Add barcode</Button></form>{barcodeList.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{barcodeList.map((item) => <span key={item} className="rounded-lg border bg-muted/40 px-3 py-2 font-mono text-sm">{item}</span>)}<Button variant="outline" onClick={printBarcodes}><Printer /> Print batch</Button></div>}</CardContent></Card>}
      {section === "reports" && <Card><CardHeader><CardTitle>Report options</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="report-from">From</Label><Input id="report-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="report-to">To</Label><Input id="report-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{reportTypes.map((report) => <Button key={report} variant="outline" className="justify-between" onClick={() => setModal(report)}>{report}<Download className="size-4" /></Button>)}</div></CardContent></Card>}
      <Card><CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><CardTitle>{filtered.length} {filtered.length === 1 ? "record" : "records"}</CardTitle><div className="flex w-full gap-2 sm:max-w-md"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}`} className="pl-9" /></div>{rows.some((row) => row.values.status) && <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm"><option value="all">All status</option>{[...new Set(rows.map((row) => String(row.values.status)))].map((item) => <option key={item} value={item}>{item}</option>)}</select>}</div></CardHeader><CardContent>{config.columns.length === 0 ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Choose a report above to generate or download it.</div> : filtered.length === 0 ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No records found.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{config.columns.map((column) => <th key={column.key} className="pb-3 pr-4">{column.label}</th>)}<th className="pb-3 text-right">Action</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id} className="border-b last:border-0">{config.columns.map((column) => <td key={column.key} className="py-4 pr-4 capitalize text-muted-foreground">{row.values[column.key] ?? "-"}</td>)}<td className="py-4 text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setModal(row.id)}><Eye /> View</Button>{section === "fines" && row.values.status !== "paid" && <Button size="sm" onClick={() => markFinePaid(row.id)} disabled={saving}><Check /> Paid</Button>}{section === "reservations" && <><Button size="sm" onClick={() => updateReservation(row.id, "ready")}><Check /> Approve</Button><Button size="sm" variant="outline" onClick={() => updateReservation(row.id, "cancelled")}><X /> Cancel</Button></>}</div></td></tr>)}</tbody></table></div>}</CardContent></Card>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Dialog open={Boolean(modal)} onOpenChange={(open) => !open && setModal(null)}><DialogContent><DialogHeader><DialogTitle>{section === "acquisitions" ? "Add Acquisition" : modal}</DialogTitle><DialogDescription>{section === "acquisitions" ? "Record a new acquisition from a supplier." : "Review this record or export the selected report."}</DialogDescription></DialogHeader>{section === "acquisitions" ? <div className="space-y-4"><Input placeholder="Invoice number" /><Input placeholder="Supplier" /><Input type="number" min="0" step="0.01" placeholder="Total cost" /><Input type="date" /></div> : <div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">Use the table filters to refine this view before taking action.</div>}<DialogFooter><Button variant="outline" onClick={() => setModal(null)}>Close</Button>{section === "reports" && <Button onClick={printBarcodes}><Download /> Export</Button>}</DialogFooter></DialogContent></Dialog>
    </div>
  );
}
