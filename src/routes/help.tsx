import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help centre — UniStay" },
      {
        name: "description",
        content: "Answers to common questions about booking hostels, payments and safety on UniStay.",
      },
      { property: "og:title", content: "Help centre — UniStay" },
      {
        property: "og:description",
        content: "Get help with booking, listings and your UniStay account.",
      },
    ],
  }),
  component: HelpPage,
});

const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I book a hostel on UniStay?",
    a: "Browse hostels near your campus, open one you like and tap “Request to book”. The landlord reviews your request and you'll get a notification (and email) when it's approved.",
  },
  {
    q: "Do I pay through UniStay?",
    a: "Not yet. For now you arrange payment directly with the landlord (M-Pesa or cash on move-in). In-app M-Pesa payments are coming soon.",
  },
  {
    q: "How do I know a hostel is real?",
    a: "Look for the “Verified landlord” badge. Verified landlords have submitted a national ID plus proof of ownership and been manually reviewed by our team.",
  },
  {
    q: "Can I cancel a booking request?",
    a: "Yes — open your dashboard, find the request and tap “Cancel”. If the landlord has already approved you, message them first to let them know.",
  },
  {
    q: "I'm a landlord — how do I list my hostel?",
    a: "Sign up as a landlord, upload your verification documents and then tap “List your hostel” in the header. Your listing goes live as soon as you're verified.",
  },
  {
    q: "I saw a fake or misleading listing — what do I do?",
    a: "Use the “Report a hostel” page (linked in the footer). Reports go straight to our admin team and we usually respond within 24 hours.",
  },
  {
    q: "How do I message a landlord?",
    a: "Once you've sent a booking request, a chat thread opens automatically inside your dashboard. You'll get notifications when they reply.",
  },
];

function HelpPage() {
  return (
    <div className="container-page py-12 max-w-3xl">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 text-accent px-3 py-1 text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" /> Help centre
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance">
          We're here to help you find a safe place to stay.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Quick answers to the questions students and landlords ask us the most.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {FAQS.map((f) => (
          <FaqItem key={f.q} q={f.q} a={f.a} />
        ))}
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <a
          href="mailto:unistaybookings@gmail.com"
          className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 hover:border-accent transition-colors"
        >
          <Mail className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold">Email us</div>
            <div className="text-xs text-muted-foreground">unistaybookings@gmail.com</div>
            <p className="mt-1 text-xs text-muted-foreground">We reply within a working day.</p>
          </div>
        </a>
        <Link
          to="/report"
          className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 hover:border-accent transition-colors"
        >
          <MessageCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold">Report a hostel</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tell us about a fake, unsafe or misleading listing.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <span className="text-sm font-semibold">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</div>
      )}
    </div>
  );
}
