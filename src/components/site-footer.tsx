import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary">
      <div className="container-page py-10 grid gap-8 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">
              U
            </div>
            <span className="text-lg font-bold tracking-tight">
              Uni<span className="text-accent">Stay</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Find, compare and book student hostels near your campus — built for African students, on any phone, on any network.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">For students</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground transition-colors">Browse hostels</Link></li>
            <li><Link to="/roommates" className="hover:text-foreground transition-colors">Find a roommate</Link></li>
            <li><Link to="/wishlist" className="hover:text-foreground transition-colors">Wishlist</Link></li>
            <li><Link to="/about" className="hover:text-foreground transition-colors">Reviews</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">For landlords</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/list-hostel" className="hover:text-foreground transition-colors">List a hostel</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Verification</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Manage bookings</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Support</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/help" className="hover:text-foreground transition-colors">Help centre</Link></li>
            <li><Link to="/report" className="hover:text-foreground transition-colors">Report a hostel</Link></li>
            <li>
              <a
                href="mailto:unistaybookings@gmail.com"
                className="hover:text-foreground transition-colors"
              >
                unistaybookings@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} UniStay. Built for Kenyan students.
        </div>
      </div>
    </footer>
  );
}
