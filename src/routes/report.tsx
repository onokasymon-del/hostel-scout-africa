import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/auth/auth-context";
import { listHostels, type Hostel } from "@/lib/hostels-api";
import { submitHostelReport } from "@/lib/reports-api";

const searchSchema = z.object({ hostel: z.string().optional() });

export const Route = createFileRoute("/report")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Report a hostel — UniStay" },
      {
        name: "description",
        content: "Report a fake, unsafe or misleading hostel listing so our team can review it.",
      },
      { property: "og:title", content: "Report a hostel — UniStay" },
      {
        property: "og:description",
        content: "Help us keep UniStay safe by reporting bad listings.",
      },
    ],
  }),
  component: ReportPage,
});

const REASONS = [
  "Fake or non-existent hostel",
  "Misleading photos or description",
  "Scam / asked for payment off-platform",
  "Unsafe living conditions",
  "Harassment by landlord",
  "Other",
];

function ReportPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const search = useSearch({ from: "/report" });

  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [hostelId, setHostelId] = useState<string>(search.hostel ?? "");
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    listHostels({}).then((res) => setHostels(res.items));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to submit a report");
      return;
    }
    if (!hostelId) {
      toast.error("Please choose a hostel");
      return;
    }
    setSubmitting(true);
    try {
      await submitHostelReport({
        hostel_id: hostelId,
        reporter_id: user.id,
        reason,
        details: details.trim() || undefined,
      });
      setDone(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not submit the report");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="container-page py-16 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container-page py-20 max-w-md text-center">
        <AlertTriangle className="h-10 w-10 mx-auto text-accent" />
        <h1 className="mt-4 text-2xl font-bold">Sign in to report a hostel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We require a signed-in account so admins can follow up if needed.
        </p>
        <Link
          to="/login"
          search={{ redirect: "/report" }}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container-page py-20 max-w-md text-center">
        <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-success/15 text-success">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold">Report submitted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you. Our admin team will review it shortly and take action where needed.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium"
          >
            Back to home
          </Link>
          <button
            onClick={() => {
              setDone(false);
              setDetails("");
            }}
            className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground"
          >
            Report another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 max-w-2xl">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive px-3 py-1 text-xs font-semibold">
        <AlertTriangle className="h-3.5 w-3.5" /> Report a hostel
      </span>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Tell us what's wrong</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Reports are confidential and go straight to our admin team.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="text-sm font-medium">Hostel</label>
          <select
            value={hostelId}
            onChange={(e) => setHostelId(e.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
            required
          >
            <option value="">Select a hostel…</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} — {h.location}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Details (optional)</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="What happened? Include dates, room numbers or anything that will help us investigate."
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="mt-1 text-[11px] text-muted-foreground">{details.length}/2000</div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit report
        </button>
      </form>
    </div>
  );
}
