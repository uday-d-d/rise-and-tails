import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, LogOut, MapPin, Phone, Mail, Home, Check, X,
  FileText, Dog, Cat, PawPrint, Users, ClipboardList, Printer, MessageSquare,
} from "lucide-react";
import {
  adminCheck, adminLoadAll, adminLogin, adminLogout, adminSaveSettings,
  adminGetSettings, adminSetAdoptionStatus, adminSetAlertStatus, adminLoadReport,
  type AdoptionRow, type AlertRow,
} from "@/lib/admin.functions";
import { PETS } from "@/lib/pets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ResponsiveContainer,
} from "recharts";

type Adoption = AdoptionRow;
type Alert = AlertRow;

export const Route = createFileRoute("/ngo")({
  head: () => ({
    meta: [
      { title: "NGO Admin Panel — Rise and Tails" },
      { name: "description", content: "Admin login to manage adoption requests and rescue alerts." },
      { property: "og:title", content: "NGO Admin Panel — Rise and Tails" },
      { property: "og:description", content: "Admin login to manage adoption requests and rescue alerts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NgoPage,
});

function NgoPage() {
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    adminCheck().then((r) => setSignedIn(r.signedIn)).catch(() => setSignedIn(false));
  }, []);

  if (signedIn === undefined) return <Spinner />;
  if (!signedIn) return <LoginForm onSuccess={() => setSignedIn(true)} />;
  return <Dashboard onSignedOut={() => setSignedIn(false)} />;
}

const Spinner = () => <div className="flex justify-center py-24"><Loader2 className="size-8 animate-spin text-primary" /></div>;

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await adminLogin({ data: { username, password } });
      if (res.ok) { toast.success("Welcome back!"); onSuccess(); }
      else toast.error(res.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-soft">
        <h1 className="text-2xl font-semibold">NGO Admin Login</h1>
        <div className="space-y-1.5"><Label htmlFor="un">Username</Label><Input id="un" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Sign in</Button>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════════ */
function Dashboard({ onSignedOut }: { onSignedOut: () => void }) {
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const knownAlerts = useRef<Set<string> | null>(null);

  const handleError = useCallback((err: unknown) => {
    const msg = err instanceof Error ? err.message : "Something went wrong";
    if (msg.startsWith("Unauthorized")) { toast.error("Session expired. Please sign in again."); onSignedOut(); }
    else toast.error(msg);
  }, [onSignedOut]);

  const load = useCallback(async () => {
    try {
      const d = await adminLoadAll();
      setAdoptions(d.adoptions);
      setAlerts(d.alerts);
      setPhotos(d.photos);
      // Tell staff when a brand-new rescue alert arrives (skip the very first load).
      const ids = new Set(d.alerts.map((a) => a.id));
      if (knownAlerts.current && d.alerts.some((a) => !knownAlerts.current!.has(a.id))) toast.warning("New rescue alert received!");
      knownAlerts.current = ids;
      setLoaded(true);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000); // refresh every 10 seconds so new requests show up automatically
    return () => clearInterval(t);
  }, [load]);

  async function signOut() {
    try { await adminLogout(); } finally { onSignedOut(); }
  }

  if (!loaded) return <Spinner />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">NGO Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Signed in as Admin · refreshes automatically</p>
        </div>
        <Button variant="outline" onClick={signOut}><LogOut /> Sign out</Button>
      </div>

      <Tabs defaultValue="adoptions" className="mt-8">
        <TabsList className="flex-wrap">
          <TabsTrigger value="adoptions">Adoption Requests ({adoptions.length})</TabsTrigger>
          <TabsTrigger value="alerts">Rescue Alerts ({alerts.filter((a) => a.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="reports"><FileText className="size-4 mr-1" />Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ──── Adoption Requests Tab ──── */}
        <TabsContent value="adoptions" className="mt-6 space-y-4">
          {adoptions.length === 0 && <Empty text="No adoption applications yet." />}
          {adoptions.map((a) => (
            <AdoptionCard key={a.id} adoption={a} onAction={load} onError={handleError} />
          ))}
        </TabsContent>

        {/* ──── Rescue Alerts Tab ──── */}
        <TabsContent value="alerts" className="mt-6 grid gap-4 md:grid-cols-2">
          {alerts.length === 0 && <Empty text="No rescue alerts. Live updates are on." />}
          {alerts.map((a) => (
            <AlertCard key={a.id} alert={a} photoUrl={a.photo_path ? photos[a.photo_path] : undefined} onAction={load} onError={handleError} />
          ))}
        </TabsContent>

        {/* ──── Reports Tab ──── */}
        <TabsContent value="reports" className="mt-6">
          <ReportsTab adoptions={adoptions} alerts={alerts} onError={handleError} />
        </TabsContent>

        {/* ──── Settings Tab ──── */}
        <TabsContent value="settings" className="mt-6"><SettingsForm onError={handleError} /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ADOPTION CARD (with admin note dialog)
   ═══════════════════════════════════════════════════════════════════════ */
function AdoptionCard({ adoption: a, onAction, onError }: { adoption: Adoption; onAction: () => void; onError: (e: unknown) => void }) {
  const [noteDialog, setNoteDialog] = useState<"approved" | "rejected" | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleStatusChange(status: "approved" | "rejected", adminNote?: string) {
    setBusy(true);
    try {
      await adminSetAdoptionStatus({ data: { id: a.id, status, admin_note: adminNote || undefined } });
      toast.success(`Application ${status}${adminNote ? " with note" : ""}`);
      setNoteDialog(null);
      setNote("");
      onAction();
    } catch (err) { onError(err); }
    finally { setBusy(false); }
  }

  return (
    <>
      <div className="rounded-2xl border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">{a.full_name} <span className="text-base font-normal text-muted-foreground">wants to adopt {a.pet_name} ({a.pet_species})</span></h3>
            <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()} · {a.distance_km?.toFixed(1)} km away</p>
          </div>
          <StatusBadge status={a.status} />
        </div>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p className="flex items-center gap-2"><Mail className="size-4 text-primary" />{a.email}</p>
          <p className="flex items-center gap-2"><Phone className="size-4 text-primary" />{a.phone}</p>
          <p className="flex items-center gap-2"><MapPin className="size-4 text-primary" />{a.address}, {a.city}</p>
          <p className="flex items-center gap-2"><Home className="size-4 text-primary" />{a.housing_type}</p>
        </div>
        <p className="mt-3 rounded-lg bg-muted p-3 text-sm"><strong>Experience:</strong> {a.experience}</p>
        {a.admin_note && (
          <p className="mt-2 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
            <MessageSquare className="size-4 mt-0.5 text-primary shrink-0" />
            <span><strong>Admin Note:</strong> {a.admin_note}</span>
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant={a.status === "approved" ? "default" : "outline"} onClick={() => setNoteDialog("approved")}><Check /> Approve</Button>
          <Button size="sm" variant={a.status === "rejected" ? "destructive" : "outline"} onClick={() => setNoteDialog("rejected")}><X /> Reject</Button>
        </div>
      </div>

      {/* Admin Note Dialog */}
      <Dialog open={!!noteDialog} onOpenChange={(o) => !o && setNoteDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">{noteDialog} — {a.pet_name}</DialogTitle>
            <DialogDescription>
              Add a note for the applicant ({a.full_name}). They will see this when they track their request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={noteDialog === "approved"
              ? "e.g. Congratulations! Please visit our shelter with your ID on Saturday 10 AM."
              : "e.g. We found a better match for this pet. Please consider other animals."}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={4}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setNoteDialog(null); setNote(""); }}>Cancel</Button>
            <Button
              variant={noteDialog === "rejected" ? "destructive" : "default"}
              disabled={busy}
              onClick={() => noteDialog && handleStatusChange(noteDialog, note.trim())}
            >
              {busy && <Loader2 className="animate-spin" />}
              {noteDialog === "approved" ? "Approve" : "Reject"} {note.trim() ? "with Note" : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ALERT CARD (with admin note dialog)
   ═══════════════════════════════════════════════════════════════════════ */
function AlertCard({ alert: a, photoUrl, onAction, onError }: { alert: Alert; photoUrl?: string; onAction: () => void; onError: (e: unknown) => void }) {
  const [noteDialog, setNoteDialog] = useState<"dispatched" | "resolved" | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleStatusChange(status: "dispatched" | "resolved", adminNote?: string) {
    setBusy(true);
    try {
      await adminSetAlertStatus({ data: { id: a.id, status, admin_note: adminNote || undefined } });
      toast.success(`Alert marked ${status}${adminNote ? " with note" : ""}`);
      setNoteDialog(null);
      setNote("");
      onAction();
    } catch (err) { onError(err); }
    finally { setBusy(false); }
  }

  return (
    <>
      <div className={`overflow-hidden rounded-2xl border bg-card shadow-soft ${a.status === "pending" ? "border-alert" : ""}`}>
        {photoUrl && <img src={photoUrl} alt="Reported animal" className="aspect-video w-full object-cover" />}
        <div className="space-y-2 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()} · {a.distance_km?.toFixed(1)} km</p>
            <StatusBadge status={a.status} />
          </div>
          {a.description && <p className="font-semibold">{a.description}</p>}
          {a.address && <p className="text-sm">{a.address}</p>}
          <a className="flex items-center gap-2 text-sm text-primary underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${a.lat},${a.lng}`}><MapPin className="size-4" />Open in maps</a>
          <a className="flex items-center gap-2 text-sm font-bold" href={`tel:${a.contact}`}><Phone className="size-4" />{a.contact}</a>
          {a.admin_note && (
            <p className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <MessageSquare className="size-4 mt-0.5 text-primary shrink-0" />
              <span><strong>Note:</strong> {a.admin_note}</span>
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="alert" onClick={() => setNoteDialog("dispatched")}>Dispatch</Button>
            <Button size="sm" variant="outline" onClick={() => setNoteDialog("resolved")}>Resolved</Button>
          </div>
        </div>
      </div>

      <Dialog open={!!noteDialog} onOpenChange={(o) => !o && setNoteDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">Mark as {noteDialog}</DialogTitle>
            <DialogDescription>Optionally add a note about this rescue action.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Team dispatched at 3:15 PM. Animal secured."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setNoteDialog(null); setNote(""); }}>Cancel</Button>
            <Button disabled={busy} onClick={() => noteDialog && handleStatusChange(noteDialog, note.trim())}>
              {busy && <Loader2 className="animate-spin" />} Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTS TAB — NGO Audit Section
   ═══════════════════════════════════════════════════════════════════════ */
const COLORS = ["#16a34a", "#f97316", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];

function ReportsTab({ adoptions, alerts, onError }: { adoptions: Adoption[]; alerts: Alert[]; onError: (e: unknown) => void }) {
  // ── Animal inventory from hardcoded PETS ──
  const totalAnimals = PETS.length;
  const totalDogs = PETS.filter((p) => p.species === "dog").length;
  const totalCats = PETS.filter((p) => p.species === "cat").length;

  // ── Adoption stats ──
  const approvedAdoptions = adoptions.filter((a) => a.status === "approved");
  const rejectedAdoptions = adoptions.filter((a) => a.status === "rejected");
  const pendingAdoptions = adoptions.filter((a) => a.status === "pending");

  // ── Rescue stats ──
  const pendingAlerts = alerts.filter((a) => a.status === "pending");
  const dispatchedAlerts = alerts.filter((a) => a.status === "dispatched");
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved");

  // ── Charts data ──
  const speciesPieData = [
    { name: "Dogs", value: totalDogs },
    { name: "Cats", value: totalCats },
  ];

  const adoptionStatusData = [
    { name: "Pending", count: pendingAdoptions.length, fill: "#f97316" },
    { name: "Approved", count: approvedAdoptions.length, fill: "#16a34a" },
    { name: "Rejected", count: rejectedAdoptions.length, fill: "#ef4444" },
  ];

  const rescueStatusData = [
    { name: "Pending", count: pendingAlerts.length, fill: "#f97316" },
    { name: "Dispatched", count: dispatchedAlerts.length, fill: "#3b82f6" },
    { name: "Resolved", count: resolvedAlerts.length, fill: "#16a34a" },
  ];

  // ── Monthly trend (last 6 months) ──
  const monthlyData = useMemo(() => {
    const months: { month: string; adoptions: number; rescues: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      const m = d.getMonth();
      const y = d.getFullYear();
      months.push({
        month: label,
        adoptions: adoptions.filter((a) => { const c = new Date(a.created_at); return c.getMonth() === m && c.getFullYear() === y; }).length,
        rescues: alerts.filter((a) => { const c = new Date(a.created_at); return c.getMonth() === m && c.getFullYear() === y; }).length,
      });
    }
    return months;
  }, [adoptions, alerts]);

  return (
    <div className="space-y-8" id="report-section">
      {/* Print Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Print Report</Button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={PawPrint} label="Total Animals" value={totalAnimals} color="text-primary" />
        <StatCard icon={Dog} label="Dogs" value={totalDogs} color="text-blue-600" />
        <StatCard icon={Cat} label="Cats" value={totalCats} color="text-orange-500" />
        <StatCard icon={Users} label="Total Adoptions" value={approvedAdoptions.length} color="text-green-600" />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Species Pie */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-4">Dogs vs Cats Ratio</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={speciesPieData} cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`} dataKey="value">
                {speciesPieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <RTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-4">Monthly Trends (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis allowDecimals={false} />
              <RTooltip />
              <Legend />
              <Bar dataKey="adoptions" fill="#16a34a" name="Adoption Requests" />
              <Bar dataKey="rescues" fill="#f97316" name="Rescue Alerts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Status Breakdown ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-4">Adoption Request Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={adoptionStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={80} fontSize={12} />
              <RTooltip />
              <Bar dataKey="count" name="Count">
                {adoptionStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-4">Rescue Alert Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rescueStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={80} fontSize={12} />
              <RTooltip />
              <Bar dataKey="count" name="Count">
                {rescueStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Animal Inventory ── */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h3 className="flex items-center gap-2 text-lg font-semibold mb-4"><ClipboardList className="size-5" /> Animal Inventory</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-semibold">Reg. No.</th>
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">Species</th>
                <th className="py-2 pr-4 font-semibold">Breed</th>
                <th className="py-2 pr-4 font-semibold">Age</th>
                <th className="py-2 pr-4 font-semibold">Gender</th>
                <th className="py-2 pr-4 font-semibold">Vaccinated</th>
                <th className="py-2 font-semibold">Rescued From</th>
              </tr>
            </thead>
            <tbody>
              {PETS.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs">{p.registrationNo ?? "—"}</td>
                  <td className="py-2 pr-4 font-semibold">{p.name}</td>
                  <td className="py-2 pr-4 capitalize">{p.species === "dog" ? "🐕 Dog" : "🐈 Cat"}</td>
                  <td className="py-2 pr-4">{p.breed}</td>
                  <td className="py-2 pr-4">{p.age}</td>
                  <td className="py-2 pr-4 capitalize">{p.gender}</td>
                  <td className="py-2 pr-4">{p.vaccinated ? "✅ Yes" : "❌ No"}</td>
                  <td className="py-2 text-muted-foreground">{p.rescuedFrom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Approved Adoptions — Who Adopted Whom ── */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h3 className="flex items-center gap-2 text-lg font-semibold mb-4"><Users className="size-5" /> Adoption Records — Who Adopted Whom</h3>
        {approvedAdoptions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No approved adoptions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-semibold">Date</th>
                  <th className="py-2 pr-4 font-semibold">Adopter Name</th>
                  <th className="py-2 pr-4 font-semibold">Phone</th>
                  <th className="py-2 pr-4 font-semibold">Email</th>
                  <th className="py-2 pr-4 font-semibold">Pet Adopted</th>
                  <th className="py-2 pr-4 font-semibold">Species</th>
                  <th className="py-2 pr-4 font-semibold">Address</th>
                  <th className="py-2 font-semibold">Distance</th>
                </tr>
              </thead>
              <tbody>
                {approvedAdoptions.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-xs">{new Date(a.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="py-2 pr-4 font-semibold">{a.full_name}</td>
                    <td className="py-2 pr-4">{a.phone}</td>
                    <td className="py-2 pr-4">{a.email}</td>
                    <td className="py-2 pr-4 font-semibold">{a.pet_name}</td>
                    <td className="py-2 pr-4 capitalize">{a.pet_species}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{a.address}, {a.city}</td>
                    <td className="py-2">{a.distance_km?.toFixed(1)} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={`rounded-full bg-muted p-2.5 ${color}`}><Icon className="size-5" /></div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SETTINGS FORM
   ═══════════════════════════════════════════════════════════════════════ */
function SettingsForm({ onError }: { onError: (e: unknown) => void }) {
  const [s, setS] = useState({ name: "", lat: "", lng: "" });
  useEffect(() => {
    adminGetSettings().then((data) => setS({ name: data.name, lat: String(data.lat), lng: String(data.lng) })).catch(onError);
  }, [onError]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const lat = Number(s.lat), lng = Number(s.lng);
    if (!s.name.trim() || isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) { toast.error("Enter a valid name and coordinates"); return; }
    try { await adminSaveSettings({ data: { name: s.name.trim(), lat, lng } }); toast.success("Shelter location saved"); }
    catch (err) { onError(err); }
  }
  return (
    <form onSubmit={save} className="max-w-md space-y-4 rounded-2xl border bg-card p-6 shadow-soft">
      <h3 className="text-xl font-semibold">Shelter location</h3>
      <p className="text-sm text-muted-foreground">Requests within 25 km of this point are accepted.</p>
      <div className="space-y-1.5"><Label>Name</Label><Input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Latitude</Label><Input value={s.lat} onChange={(e) => setS({ ...s, lat: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Longitude</Label><Input value={s.lng} onChange={(e) => setS({ ...s, lng: e.target.value })} /></div>
      </div>
      <Button type="submit">Save</Button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SHARED UI
   ═══════════════════════════════════════════════════════════════════════ */
const Empty = ({ text }: { text: string }) => <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground md:col-span-2">{text}</p>;

function StatusBadge({ status }: { status: string }) {
  const v = status === "approved" || status === "resolved" ? "default" : status === "rejected" ? "destructive" : "secondary";
  return <Badge variant={v} className="capitalize">{status}</Badge>;
}
