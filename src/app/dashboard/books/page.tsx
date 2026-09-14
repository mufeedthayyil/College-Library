import { createClient } from "@/lib/supabase/server";
import { ActionDialog } from "@/components/dashboard/action-dialog";
import { BooksWorkspace, type BookRecord } from "@/components/dashboard/books-workspace";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("books")
    .select("id, book_id, title, isbn, price, status, publication_year, created_at")
    .order("created_at", { ascending: false });
  const { action } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7">
      <BooksWorkspace books={(data ?? []) as BookRecord[]} />
      <ActionDialog open={action === "create"} section="books" title="Books" action="Add a book" />
    </div>
  );
}