import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "./auth-context";

/**
 * Redirect users away from auth pages (login / signup) if they are already
 * signed in. Landlords/admins are sent to the dashboard, students to home.
 */
export function useRedirectIfAuthed(fallback: string = "/") {
  const { isAuthenticated, loading, role } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const to = role === "landlord" || role === "admin" ? "/dashboard" : fallback;
    navigate({ to, replace: true } as any);
  }, [isAuthenticated, loading, role, navigate, fallback]);
}
