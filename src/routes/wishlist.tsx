import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { listWishlistedHostels, type Hostel } from "@/lib/hostels-api";
import { HostelCard } from "@/components/hostel-card";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your wishlist — UniStay" },
      { name: "description", content: "The hostels you saved to compare and book later." },
      { property: "og:title", content: "Your wishlist — UniStay" },
      { property: "og:description", content: "The hostels you saved on UniStay." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    listWishlistedHostels(user.id)
      .then(setHostels)
      .finally(() => setLoading(false));
  }, [user]);

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
        <Heart className="h-10 w-10 mx-auto text-accent" />
        <h1 className="mt-4 text-2xl font-bold">Sign in to view your wishlist</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save hostels you like and revisit them anytime.
        </p>
        <Link
          to="/login"
          search={{ redirect: "/wishlist" }}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold tracking-tight">Your wishlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {hostels.length} saved hostel{hostels.length === 1 ? "" : "s"}.
      </p>

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading saved hostels…
        </div>
      ) : hostels.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Heart className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            You haven't saved any hostels yet. Tap the heart icon on any hostel to save it here.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            Browse hostels
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hostels.map((h) => (
            <HostelCard key={h.id} hostel={h} wishlisted />
          ))}
        </div>
      )}
    </div>
  );
}
