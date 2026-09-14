import Link from "next/link";
import { ArrowRight, BookOpen, Library, Search, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <section className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col justify-between px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Library className="size-5" />
            </span>
            <span>College Library</span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Staff sign in
          </Link>
        </header>

        <div className="grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-24">
          <div>
            <p className="mb-5 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
              <BookOpen className="size-4" /> Your campus collection
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
              Find your next good read.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Explore the college library collection, discover new authors, and keep your reading life moving.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">
                Open the library desk <ArrowRight className="size-4" />
              </Link>
              <a href="#services" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/80 bg-white/55 px-5 text-sm font-medium transition-colors hover:bg-white/80">
                See what&apos;s available
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-primary/10 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/75 bg-white/55 p-5 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between border-b border-border/60 pb-5">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Library catalogue</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">What will you discover?</p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Search className="size-5" />
                </div>
              </div>
              <div className="space-y-3 py-5" id="services">
                {[
                  ["New arrivals", "Fresh titles ready for your next visit", "12 this month"],
                  ["Quiet study spaces", "Reserve a focused place to work", "Available today"],
                  ["Reading support", "Friendly help from the library team", "Ask a librarian"],
                ].map(([title, description, detail]) => (
                  <div key={title} className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/55 p-4">
                    <div className="size-2 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{title}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{description}</p>
                    </div>
                    <span className="hidden text-xs font-medium text-primary sm:block">{detail}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-secondary/70 p-4 text-sm text-secondary-foreground">
                <ShieldCheck className="size-5 shrink-0" />
                <span>Staff tools are protected behind a secure sign-in.</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-2 border-t border-border/60 pt-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Open to every reader on campus.</span>
          <span>Library hours · Monday to Friday, 8:00–18:00</span>
        </footer>
      </section>
    </main>
  );
}
