import Image from "next/image";
import Link from "next/link";
import { BookOpen, MessageSquare, Route, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "AI workspace",
    description:
      "Ask questions grounded in your agency knowledge—commissions, policies, and partner details in one place.",
  },
  {
    icon: Users,
    title: "VIC relationships",
    description:
      "Profiles, preferences, and history so every trip reflects how your clients actually travel.",
  },
  {
    icon: Route,
    title: "Itineraries & catalog",
    description:
      "Build and refine trips with a product directory aligned to how luxury advisors work.",
  },
  {
    icon: BookOpen,
    title: "Knowledge & briefings",
    description:
      "Connect sources your team trusts so answers stay accurate, current, and on-brand.",
  },
] as const;

/**
 * Public marketing surface at `/`. The signed-in product lives under `/dashboard`.
 */
export function EnableLandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(201, 169, 110, 0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(122, 163, 200, 0.08), transparent 50%)",
        }}
      />

      <header className="relative border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card">
              <Image src="/TL_logo.svg" alt="" width={28} height={28} />
            </span>
            <span className="text-sm font-semibold tracking-tight">Enable</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Primary">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="cta" size="sm" asChild>
              <Link href="/dashboard">Open app</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main id="main-content" className="relative mx-auto max-w-5xl px-4 pb-20 pt-16 md:px-6 md:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Luxury travel intelligence
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            The workspace for advisors who sell exceptional travel
          </h1>
          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Enable brings together AI assistance, client intelligence, itineraries, and agency knowledge—so your
            team responds faster with confidence.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="cta" size="lg" asChild>
              <Link href="/dashboard">Launch the app</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-2xs text-muted-foreground">
            <Shield className="size-3.5 shrink-0 opacity-70" aria-hidden />
            <span>Prototype environment — data may be sample or local only.</span>
          </p>
        </div>

        <section className="mt-20 md:mt-28" aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">
            Product capabilities
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm transition-colors hover:border-border-strong"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/60">
                  <Icon className="size-5 text-[var(--brand-cta)]" aria-hidden />
                </div>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="relative border-t border-border/80 py-8 text-center text-2xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Enable · Prototype</p>
      </footer>
    </div>
  );
}
