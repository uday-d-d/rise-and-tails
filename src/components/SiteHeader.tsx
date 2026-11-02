import { Link, useRouterState } from "@tanstack/react-router";
import { PawPrint, LogIn, LayoutDashboard, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { adminCheck } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

const tabs = [
  { to: "/", label: "Home" },
  { to: "/adopt", label: "Adopt" },
  { to: "/rescue", label: "Urgent Rescue" },
  { to: "/track", label: "Track Request" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  // Re-check on every page change so the button flips between "NGO Login" and "Dashboard" after sign in/out.
  useEffect(() => {
    adminCheck().then((r) => setSignedIn(r.signedIn)).catch(() => setSignedIn(false));
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
          <PawPrint className="size-6" /> <span className="hidden sm:inline">Rise and Tails</span>
        </Link>
        <nav className="ml-2 flex flex-1 items-center gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: true }}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-secondary ${t.to === "/rescue" ? "text-alert" : t.to === "/track" ? "text-blue-600" : "text-muted-foreground"}`}
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
            >
              {t.to === "/track" && <Search className="inline size-3.5 mr-1 mb-0.5" />}
              {t.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm" variant={signedIn ? "secondary" : "default"}>
          <Link to="/ngo">
            {signedIn ? <LayoutDashboard /> : <LogIn />}
            <span className="hidden sm:inline">{signedIn ? "Dashboard" : "NGO Login"}</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
