"use client";

import { useState, type FormEvent } from "react";
import { Search, Pencil, BookOpen, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

export type BookRecord = {
  id: string;
  book_id: string;
  title: string;
  isbn: string | null;
  price: number | null;
  status: string;
  publication_year: number | null;
  created_at: string;
};

function formatPrice(price: number | null) {
  return price === null ? "No price" : price.toFixed(2);
}

export function BooksWorkspace({ books }: { books: BookRecord[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editingBook, setEditingBook] = useState<BookRecord | null>(null);
  const [title, setTitle] = useState("");
  const [isbn, setIsbn] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingBook, setDeletingBook] = useState<BookRecord | null>(null);

  const filteredBooks = books.filter((book) => {
    const searchable = `${book.book_id} ${book.title} ${book.isbn ?? ""}`.toLowerCase();
    return searchable.includes(query.toLowerCase());
  });

  function openEdit(book: BookRecord) {
    setEditingBook(book);
    setTitle(book.title);
    setIsbn(book.isbn ?? "");
    setPrice(book.price === null ? "" : String(book.price));
    setError("");
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingBook) return;
    setIsSaving(true);
    setError("");

    const { error: updateError } = await createClient()
      .from("books")
      .update({ title: title.trim(), isbn: isbn.trim() || null, price: price ? Number(price) : null })
      .eq("id", editingBook.id);

    if (updateError) {
      setError(updateError.code === "42501" ? "Your account is not assigned a staff role." : updateError.message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setEditingBook(null);
    router.refresh();
  }

  async function deleteBook() {
    if (!deletingBook) return;
    setIsSaving(true);
    setError("");
    const { error: deleteError } = await createClient().from("books").delete().eq("id", deletingBook.id);
    if (deleteError) {
      setError(deleteError.code === "42501" ? "Your account is not assigned a staff role." : deleteError.message);
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    setDeletingBook(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Collection management</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Books</h1>
          <p className="mt-2 text-muted-foreground">Search, review, and update the collection.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/books?action=create")}><BookOpen /> Add a book</Button>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"}</CardTitle>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, ID, or ISBN" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {filteredBooks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {books.length === 0 ? "No books have been added yet." : "No books match your search."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="pb-3 pr-4">Book</th><th className="pb-3 pr-4">ISBN</th><th className="pb-3 pr-4">Price</th><th className="pb-3 pr-4">Status</th><th className="pb-3 text-right">Action</th></tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="border-b last:border-0">
                      <td className="py-4 pr-4"><p className="font-medium">{book.title}</p><p className="mt-1 text-xs text-muted-foreground">{book.book_id}</p></td>
                      <td className="py-4 pr-4 text-muted-foreground">{book.isbn ?? "-"}</td>
                      <td className="py-4 pr-4">{formatPrice(book.price)}</td>
                      <td className="py-4 pr-4 capitalize text-muted-foreground">{book.status}</td>
                      <td className="py-4 text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(book)}><Pencil /> Edit</Button><Button variant="destructive" size="sm" onClick={() => { setDeletingBook(book); setError(""); }}><Trash2 /> Delete</Button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingBook)} onOpenChange={(open) => !open && setEditingBook(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit book</DialogTitle><DialogDescription>Update the title, ISBN, or optional price.</DialogDescription></DialogHeader>
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="edit-book-title">Title</Label><Input id="edit-book-title" required value={title} onChange={(event) => setTitle(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="edit-book-isbn">ISBN <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="edit-book-isbn" value={isbn} onChange={(event) => setIsbn(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="edit-book-price">Price <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="edit-book-price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></div>
            {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditingBook(null)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(deletingBook)} onOpenChange={(open) => !open && setDeletingBook(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete book?</DialogTitle><DialogDescription>This permanently removes {deletingBook?.title ?? "this book"} from the collection. Any linked copies must be removed first.</DialogDescription></DialogHeader>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <DialogFooter><Button variant="outline" onClick={() => setDeletingBook(null)}>Cancel</Button><Button variant="destructive" onClick={deleteBook} disabled={isSaving}>{isSaving ? "Deleting..." : "Delete book"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}