import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Users, Loader2, Plus, X, Calendar, MapPin, Wallet, Phone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/auth-context";
import {
  createRoommatePost,
  deleteRoommatePost,
  listRoommatePosts,
  type RoommatePost,
} from "@/lib/roommates-api";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/roommates")({
  head: () => ({
    meta: [
      { title: "Find a roommate — UniStay" },
      {
        name: "description",
        content: "Browse roommate posts from other students or post your own to find someone to split rent with near your campus.",
      },
      { property: "og:title", content: "Find a roommate — UniStay" },
      {
        property: "og:description",
        content: "Find a roommate near your campus on UniStay.",
      },
    ],
  }),
  component: RoommatesPage,
});

function RoommatesPage() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<RoommatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setPosts(await listRoommatePosts());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="container-page py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 text-accent px-3 py-1 text-xs font-semibold">
            <Users className="h-3.5 w-3.5" /> Roommates board
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Find a roommate</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Split rent and find a study buddy. Posts are visible to anyone — reach out using the contact below.
          </p>
        </div>
        {isAuthenticated ? (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)]"
          >
            <Plus className="h-4 w-4" /> Post a roommate request
          </button>
        ) : (
          <Link
            to="/login"
            search={{ redirect: "/roommates" }}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)]"
          >
            Sign in to post
          </Link>
        )}
      </div>

      {showForm && user && (
        <NewPostDialog
          authorId={user.id}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : posts.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Users className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No roommate posts yet. Be the first to post.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              canDelete={user?.id === p.author_id}
              onDeleted={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  canDelete,
  onDeleted,
}: {
  post: RoommatePost;
  canDelete: boolean;
  onDeleted: () => void;
}) {
  async function handleDelete() {
    if (!confirm("Delete this post?")) return;
    try {
      await deleteRoommatePost(post.id);
      toast.success("Post removed");
      onDeleted();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not delete");
    }
  }
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-tight">{post.title}</h3>
        {canDelete && (
          <button
            onClick={handleDelete}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Delete
          </button>
        )}
      </div>
      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          <span>{post.institution_name}{post.campus_area ? ` • ${post.campus_area}` : ""}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5" />
          <span>Budget up to {formatPrice(post.budget_max, "KES")}/month</span>
        </div>
        {post.move_in_date && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Move in by {new Date(post.move_in_date).toLocaleDateString()}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span>Prefers: {post.gender_preference}</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-foreground leading-relaxed line-clamp-4">{post.about}</p>
      <div className="mt-auto pt-4 border-t border-border mt-4 flex items-center gap-2 text-sm">
        <Phone className="h-3.5 w-3.5 text-accent" />
        <span className="font-medium">{post.contact}</span>
      </div>
    </div>
  );
}

function NewPostDialog({
  authorId,
  onClose,
  onCreated,
}: {
  authorId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [campusArea, setCampusArea] = useState("");
  const [budget, setBudget] = useState(8000);
  const [gender, setGender] = useState<"any" | "male" | "female">("any");
  const [moveIn, setMoveIn] = useState("");
  const [about, setAbout] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createRoommatePost(authorId, {
        title,
        institution_name: institution,
        campus_area: campusArea || undefined,
        budget_max: budget,
        gender_preference: gender,
        move_in_date: moveIn || undefined,
        about,
        contact,
      });
      toast.success("Posted!");
      onCreated();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-background p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">New roommate post</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Post title" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              placeholder="Looking for a roommate near JKUAT main gate"
              className="input-base"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Institution" required>
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                required
                placeholder="e.g. JKUAT"
                className="input-base"
              />
            </Field>
            <Field label="Campus area">
              <input
                value={campusArea}
                onChange={(e) => setCampusArea(e.target.value)}
                placeholder="e.g. Juja"
                className="input-base"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Max budget (KES/mo)" required>
              <input
                type="number"
                value={budget}
                min={1000}
                max={100000}
                onChange={(e) => setBudget(Number(e.target.value))}
                required
                className="input-base"
              />
            </Field>
            <Field label="Move-in date">
              <input
                type="date"
                value={moveIn}
                onChange={(e) => setMoveIn(e.target.value)}
                className="input-base"
              />
            </Field>
          </div>
          <Field label="Gender preference">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="input-base"
            >
              <option value="any">Any</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </Field>
          <Field label="About you / what you're looking for" required>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              required
              rows={4}
              maxLength={800}
              placeholder="Quiet 2nd-year CS student, non-smoker, prefer ensuite, can move in next month."
              className="input-base"
            />
          </Field>
          <Field label="Contact (phone or email)" required>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
              maxLength={120}
              placeholder="+254 7XX XXX XXX"
              className="input-base"
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Post
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
