import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, CheckCircle2, XCircle, Clock, MessageSquare, ArrowRight } from "lucide-react";
import { trackByEmail } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Request — Rise and Tails" },
      { name: "description", content: "Check the status of your adoption request." },
      { property: "og:title", content: "Track Your Request — Rise and Tails" },
      { property: "og:description", content: "Check the status of your adoption request." },
    ],
  }),
  component: TrackPage,
});

type TrackedAdoption = {
  id: string;
  pet_name: string;
  pet_species: string;
  status: string;
  admin_note: string | null;
  created_at: string;
};

function TrackPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [adoptions, setAdoptions] = useState<TrackedAdoption[]>([]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return void toast.error("Please enter your email address.");
    setBusy(true);
    try {
      const result = await trackByEmail({ data: { email: trimmed } });
      setAdoptions(result.adoptions as TrackedAdoption[]);
      setSearched(true);
      if (result.adoptions.length === 0) toast.info("No requests found for this email.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-4xl font-semibold">Track Your Request</h1>
      <p className="mt-2 text-muted-foreground">
        Enter the email you used when submitting your adoption application to check its current status and any messages from our team.
      </p>

      <form onSubmit={search} className="mt-8 flex gap-3">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="track-email" className="sr-only">Email address</Label>
          <Input
            id="track-email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={busy} className="shrink-0">
          {busy ? <Loader2 className="animate-spin" /> : <Search />}
          Search
        </Button>
      </form>

      {searched && (
        <div className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold">
            Your Applications {adoptions.length > 0 && <span className="text-base font-normal text-muted-foreground">({adoptions.length} found)</span>}
          </h2>

          {adoptions.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
                No adoption requests found for this email address. Please check that you entered the correct email.
              </div>
              <div className="text-center">
                <Button asChild variant="outline">
                  <Link to="/adopt"><ArrowRight className="size-4" /> Browse pets for adoption</Link>
                </Button>
              </div>
            </div>
          ) : (
            adoptions.map((a) => (
              <div key={a.id} className="rounded-2xl border bg-card p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {a.pet_name}{" "}
                      <span className="text-base font-normal text-muted-foreground capitalize">({a.pet_species})</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Submitted on {new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <TrackStatusBadge status={a.status} />
                </div>

                <div className="mt-3 rounded-lg bg-muted p-4">
                  <StatusMessage status={a.status} petName={a.pet_name} />
                </div>

                {a.admin_note && (
                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <MessageSquare className="size-4" /> Message from Rise and Tails
                    </p>
                    <p className="mt-1 text-sm">{a.admin_note}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* How it works section */}
      <div className="mt-12 rounded-2xl border bg-muted/50 p-6">
        <h3 className="text-lg font-semibold">How does tracking work?</h3>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>You submit an adoption request on the <Link to="/adopt" className="text-primary underline font-semibold">Adopt</Link> page.</li>
          <li>Our NGO admin team reviews your application in the dashboard.</li>
          <li>They <strong>approve</strong> or <strong>reject</strong> your application and may leave you a personal message.</li>
          <li>Come back here and enter your email to see the updated status and any message from the team.</li>
        </ol>
      </div>
    </div>
  );
}

function TrackStatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return <Badge className="gap-1 bg-green-600 text-white capitalize"><CheckCircle2 className="size-3" /> {status}</Badge>;
  if (status === "rejected")
    return <Badge variant="destructive" className="gap-1 capitalize"><XCircle className="size-3" /> {status}</Badge>;
  return <Badge variant="secondary" className="gap-1 capitalize"><Clock className="size-3" /> {status}</Badge>;
}

function StatusMessage({ status, petName }: { status: string; petName: string }) {
  if (status === "approved")
    return (
      <p className="text-sm text-green-700">
        🎉 <strong>Great news!</strong> Your adoption application for <strong>{petName}</strong> has been approved!
        Our team will contact you shortly to arrange the handover. Please keep your phone available.
      </p>
    );
  if (status === "rejected")
    return (
      <p className="text-sm text-red-700">
        We're sorry, your application for <strong>{petName}</strong> was not approved at this time.
        Please check the message from our team below for details, or contact us for more information.
      </p>
    );
  return (
    <p className="text-sm text-muted-foreground">
      ⏳ Your application for <strong>{petName}</strong> is currently <strong>under review</strong>.
      Our team will evaluate it shortly. Check back here for updates.
    </p>
  );
}
