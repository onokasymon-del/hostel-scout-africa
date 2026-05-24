import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { INSTITUTIONS_BY_TYPE } from "@/data/institutions";
import { toast } from "sonner";
import { useAuth } from "@/auth/auth-context";
import { useRedirectIfAuthed } from "@/auth/use-redirect-if-authed";
import { VerificationCard } from "@/components/verification-form";

export const Route = createFileRoute("/signup/landlord")({
  head: () => ({
    meta: [
      { title: "Landlord signup — UniStay" },
      { name: "description", content: "List your hostel on UniStay. Verification required." },
    ],
  }),
  component: LandlordSignup,
});

const ALL_INSTITUTIONS = [
  ...INSTITUTIONS_BY_TYPE.university,
  ...INSTITUTIONS_BY_TYPE.college,
  ...INSTITUTIONS_BY_TYPE.tti,
].sort();

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?254|0)?[17]\d{8}$/, "Enter a valid Kenyan phone number")
    .max(20),
  institution_name: z.string().trim().min(2, "Pick a campus area").max(120),
  password: z.string().min(6, "At least 6 characters").max(128),
});

function LandlordSignup() {
  // If a *student* lands here while signed in, bounce. We let logged-in
  // landlords through only when on step 2 (they just signed up).
  const { isAuthenticated, role, user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"account" | "verify">("account");

  // Guard: if someone is already signed in and NOT mid-flow, redirect.
  // (Mid-flow we mount VerificationCard for the newly created landlord.)
  if (!loading && isAuthenticated && step === "account") {
    // existing session — don't allow another signup
    useRedirectIfAuthedNow(role);
  }

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    institution_name: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
          role: "landlord",
          institution_name: parsed.data.institution_name,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      // Email confirmation required — user can't upload docs without a session
      toast.success("Account created! Check your inbox to verify, then sign in to upload documents.");
      navigate({ to: "/login", search: { redirect: undefined } });
      return;
    }
    toast.success("Account created! Now upload your verification documents.");
    setStep("verify");
  };

  if (step === "verify" && user) {
    return (
      <div className="container-page max-w-xl py-10">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-success">
            <ShieldCheck className="h-4 w-4" />
            Step 2 of 2 — Verification
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Upload your documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We need your National ID and a proof of ownership document before you can publish hostels.
            Reviewed in ~24 hours.
          </p>

          <div className="mt-6">
            <VerificationCard landlordId={user.id} />
          </div>

          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-input bg-background text-sm font-semibold hover:bg-secondary"
          >
            Continue to dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-xl py-10">
      <Link to="/signup" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mt-4 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="text-xs font-semibold text-muted-foreground">Step 1 of 2</div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Create landlord account</h1>
        <p className="mt-1 text-sm text-muted-foreground">List your hostel and reach thousands of students.</p>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary-soft p-3 text-sm text-primary">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            After creating your account you'll upload your National ID and proof of ownership.
            Verification takes ~24 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Full name">
            <input
              required
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              className={inputCls}
              autoComplete="name"
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputCls}
              autoComplete="email"
            />
          </Field>
          <Field label="Phone number">
            <input
              required
              type="tel"
              placeholder="07XX XXX XXX"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={inputCls}
              autoComplete="tel"
            />
          </Field>
          <Field label="Campus area">
            <select
              required
              value={form.institution_name}
              onChange={(e) => update("institution_name", e.target.value)}
              className={inputCls}
            >
              <option value="">Select institution near your hostel…</option>
              {ALL_INSTITUTIONS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Password">
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] hover:opacity-95 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>Continue to documents <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Have an account?{" "}
          <Link to="/login" search={{ redirect: undefined }} className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// Inline redirect helper so we can call from a conditional render path.
function useRedirectIfAuthedNow(role: string | null) {
  const navigate = useNavigate();
  const to = role === "landlord" || role === "admin" ? "/dashboard" : "/";
  // Defer to next tick to avoid setState-in-render warnings.
  setTimeout(() => navigate({ to, replace: true } as any), 0);
}

const inputCls =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}
