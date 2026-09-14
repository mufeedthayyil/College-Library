/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { SectionWorkspace } from "@/components/dashboard/section-workspace";
import { RemainingWorkspace } from "@/components/dashboard/remaining-workspace";

function value(input: unknown) {
  return input === null || input === undefined ? null : String(input);
}

export default async function SectionPage({ params }: { params: Promise<{ section: string[] }> }) {
  const { section } = await params;
  const key = section.at(-1) ?? "dashboard";
    const supabase = await createClient();
    let rows: { id: string; values: Record<string, string | number | null> }[] = [];
    let stats: { label: string; value: string | number }[] = [];
    let members: { id: string; label: string }[] = [];
    let copies: { id: string; label: string }[] = [];

    if (key === "copies" || key === "barcodes" || key === "inventory") {
      const { data } = await supabase.from("book_copies").select("id, accession_number, barcode_value, status, condition, location, books(title)").order("created_at", { ascending: false });
      rows = (data ?? []).map((item: any) => ({ id: item.id, values: { accession: item.accession_number, barcode: item.barcode_value, book: item.books?.title, status: item.status, condition: item.condition, location: item.location } }));
      stats = [
        { label: "Total inventory", value: rows.length },
        { label: "Available", value: rows.filter((row) => row.values.status === "available").length },
        { label: "Borrowed", value: rows.filter((row) => row.values.status === "issued").length },
        { label: "Damaged or lost", value: rows.filter((row) => ["damaged", "lost"].includes(String(row.values.status))).length },
      ];
    } else if (key === "circulation") {
      const { data } = await supabase.from("loans").select("id, status, due_at, issued_at, book_copies(accession_number, books(title)), members(full_name)").order("issued_at", { ascending: false });
      rows = (data ?? []).map((item: any) => ({ id: item.id, values: { member: item.members?.full_name ?? null, book: item.book_copies?.books?.title ?? null, copy: item.book_copies?.accession_number ?? null, issued: (value(item.issued_at) ?? "").slice(0, 10), due: (value(item.due_at) ?? "").slice(0, 10), returned: (value(item.returned_at) ?? "").slice(0, 10), status: item.status ?? null } }));
      const today = new Date().toISOString().slice(0, 10);
      stats = [{ label: "Total borrowed", value: rows.filter((row) => row.values.status === "active").length }, { label: "Due today", value: rows.filter((row) => row.values.status === "active" && row.values.due === today).length }, { label: "Overdue", value: rows.filter((row) => row.values.status === "active" && String(row.values.due) < today).length }, { label: "Returned today", value: rows.filter((row) => row.values.status === "returned" && row.values.returned === today).length }];
      const [memberData, copyData] = await Promise.all([
        supabase.from("members").select("id, member_id, full_name").eq("status", "active").order("full_name"),
        supabase.from("book_copies").select("id, accession_number, barcode_value, books(title)").eq("status", "available").order("accession_number"),
      ]);
      members = (memberData.data ?? []).map((member: any) => ({ id: member.id, label: `${member.full_name} (${member.member_id})` }));
      copies = (copyData.data ?? []).map((copy: any) => ({ id: copy.id, label: `${copy.books?.title ?? "Unknown book"} · ${copy.barcode_value ?? copy.accession_number}` }));
    } else if (key === "fines") {
      const { data } = await supabase.from("fines").select("id, amount, paid_amount, status, reason, created_at, members(full_name)").order("created_at", { ascending: false });
      rows = (data ?? []).map((item: any) => ({ id: item.id, values: { member: item.members?.full_name ?? null, reason: item.reason ?? null, amount: item.amount ?? null, status: item.status ?? null, date: (value(item.created_at) ?? "").slice(0, 10) } }));
      stats = [{ label: "Total fines", value: rows.length }, { label: "Unpaid", value: rows.filter((row) => row.values.status === "unpaid").length }, { label: "Paid", value: rows.filter((row) => row.values.status === "paid").length }];
    } else if (key === "reservations") {
      const { data } = await supabase.from("reservations").select("id, status, reserved_at, book_id, books(title), members(full_name)").order("reserved_at", { ascending: false });
      rows = (data ?? []).map((item: any, index) => ({ id: item.id, values: { member: item.members?.full_name ?? null, book: item.books?.title ?? null, date: (value(item.reserved_at) ?? "").slice(0, 10), status: item.status ?? null, priority: index + 1 } }));
      stats = [{ label: "Open reservations", value: rows.filter((row) => ["queued", "ready"].includes(String(row.values.status))).length }, { label: "Fulfilled", value: rows.filter((row) => row.values.status === "fulfilled").length }];
    } else if (key === "acquisitions") {
      const { data } = await supabase.from("acquisitions").select("id, invoice_number, purchase_date, notes, suppliers(name)").order("purchase_date", { ascending: false });
      rows = (data ?? []).map((item: any) => ({ id: item.id, values: { invoice: item.invoice_number, supplier: item.suppliers?.name, date: item.purchase_date, notes: item.notes } }));
    } else if (key === "users") {
      const { data } = await supabase.from("profiles").select("id, full_name, email, role, created_at").order("created_at", { ascending: false });
      rows = (data ?? []).map((item: any) => ({ id: item.id, values: { name: item.full_name ?? null, email: item.email ?? null, role: item.role ?? null, created: (value(item.created_at) ?? "").slice(0, 10) } }));
    } else if (key === "activity") {
      const { data } = await supabase.from("activity_logs").select("id, action, entity, metadata, created_at, profiles(full_name)").order("created_at", { ascending: false });
      rows = (data ?? []).map((item: any) => ({ id: item.id, values: { date: value(item.created_at), user: item.profiles?.full_name, action: item.action, entity: item.entity, description: JSON.stringify(item.metadata) } }));
    } else if (key === "settings") {
      const { data } = await supabase.from("library_settings").select("id, library_name, default_loan_days, max_books_per_member, fine_per_day, maximum_fine, reservation_days, currency, updated_at").limit(1).maybeSingle();
      if (data) rows = Object.entries(data).filter(([name]) => name !== "id").map(([name, current]) => ({ id: name, values: { setting: name.replaceAll("_", " "), value: value(current), updated: (value((data as any).updated_at) ?? "").slice(0, 10) } }));
    }

  return key === "copies" || key === "circulation"
    ? <SectionWorkspace section={key} rows={rows} stats={stats} members={members} copies={copies} />
    : <RemainingWorkspace section={key} rows={rows} stats={stats} />;
}