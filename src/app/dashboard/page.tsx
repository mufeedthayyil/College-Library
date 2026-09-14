import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  BookOpen,
  Library,
  Plus,
  ScanBarcode,
  Users,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

function displayCount(count: number | null) {
  return count === null ? "—" : count.toLocaleString();
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const [books, copies, members, fines] = await Promise.all([
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase.from("book_copies").select("id", { count: "exact", head: true }),
    supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("fines").select("id", { count: "exact", head: true }).neq("status", "paid"),
  ]);
  const [borrowed, overdue, available, reservations] = await Promise.all([
    supabase.from("loans").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("loans").select("id", { count: "exact", head: true }).eq("status", "active").lt("due_at", new Date().toISOString()),
    supabase.from("book_copies").select("id", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("reservations").select("id", { count: "exact", head: true }).in("status", ["queued", "ready"]),
  ]);

  const metrics = [
    { label: "Book titles", value: books.error ? null : books.count, icon: BookOpen, note: "Titles in the collection" },
    { label: "Physical copies", value: copies.error ? null : copies.count, icon: Library, note: "Copies tracked in inventory" },
    { label: "Active members", value: members.error ? null : members.count, icon: Users, note: "Current borrowing members" },
    { label: "Outstanding fines", value: fines.error ? null : fines.count, icon: Banknote, note: "Unpaid or partial balances" },
    { label: "Currently borrowed", value: borrowed.error ? null : borrowed.count, icon: ArrowUpFromLine, note: "Active loans" },
    { label: "Overdue", value: overdue.error ? null : overdue.count, icon: ArrowDownToLine, note: "Past due date" },
    { label: "Available copies", value: available.error ? null : available.count, icon: Library, note: "Ready to issue" },
    { label: "Reservations", value: reservations.error ? null : reservations.count, icon: Users, note: "Queued or ready" },
  ];

  const databaseConnected = !books.error && !copies.error;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Library operations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Good morning, librarian</h1>
          <p className="mt-1 text-sm text-muted-foreground">A clear view of today&apos;s circulation desk and collection health.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/barcodes" className={cn(buttonVariants({ variant: "outline" }))}><ScanBarcode /> Generate barcodes</Link>
          <Link href="/dashboard/books" className={cn(buttonVariants())}><Plus /> Add a book</Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="transition-transform duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <metric.icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-foreground">{displayCount(metric.value)}</div>
              <p className="mt-1 text-xs text-muted-foreground">{metric.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Today&apos;s desk</CardTitle>
            <p className="text-sm text-muted-foreground">Fast actions for the circulation counter.</p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/circulation" className="group rounded-2xl border border-white/70 bg-white/35 p-5 transition-all hover:-translate-y-1 hover:bg-white/70">
              <ArrowUpFromLine className="mb-8 size-5 text-primary" />
              <p className="font-medium">Issue a book</p>
              <p className="mt-1 text-xs text-muted-foreground">Scan a member, then a copy.</p>
            </Link>
            <Link href="/dashboard/circulation" className="group rounded-2xl border border-white/70 bg-white/35 p-5 transition-all hover:-translate-y-1 hover:bg-white/70">
              <ArrowDownToLine className="mb-8 size-5 text-primary" />
              <p className="font-medium">Return a book</p>
              <p className="mt-1 text-xs text-muted-foreground">Calculate overdue fines at return.</p>
            </Link>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>System status</CardTitle>
            <p className="text-sm text-muted-foreground">The live connection will appear here once configured.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Database", databaseConnected ? "Connected" : "Check configuration", databaseConnected ? "bg-emerald-500" : "bg-amber-500"],
              ["Authentication", "Active", "bg-emerald-500"],
              ["Barcode engine", "Ready for setup", "bg-emerald-500"],
            ].map(([label, value, color]) => (
              <div key={label} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="flex items-center gap-2 font-medium"><span className={`size-2 rounded-full ${color}`} />{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

