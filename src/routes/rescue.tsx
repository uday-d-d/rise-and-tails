import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Phone, MapPin, Camera, Loader2, Siren, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { EMERGENCY_PHONE } from "@/lib/pets";
import { geocodeAddress, getBrowserLocation, haversineKm, isOutOfRadiusError, type LatLng } from "@/lib/geo";
import { centerOf, fetchNgoSettings } from "@/lib/ngo";
import { OutOfRadiusNotice, SuccessScreen } from "@/components/ResultScreens";

export const Route = createFileRoute("/rescue")({
  head: () => ({
    meta: [
      { title: "Urgent Animal Rescue Alert — Rise and Tails" },
      { name: "description", content: "Report an injured or stranded animal in seconds. No login needed." },
      { property: "og:title", content: "Urgent Animal Rescue Alert — Rise and Tails" },
      { property: "og:description", content: "Report an injured or stranded animal in seconds. No login needed." },
    ],
  }),
  component: RescuePage,
});

function RescuePage() {
  const [gps, setGps] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { ok: true; distance: number } | { ok: false }>(null);

  async function pin() {
    setLocating(true);
    try { setGps(await getBrowserLocation()); toast.success("Location pinned"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setLocating(false); }
  }

  function reset() {
    setResult(null); setGps(null); setAddress(""); setDescription(""); setPhoto(null); setContact("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!gps && !address.trim()) return void toast.error("Pin your location or type an address");
    if (!photo && !description.trim()) return void toast.error("Add a photo or a short description");
    if (!/^[+\d][\d\s-]{6,18}$/.test(contact.trim())) return void toast.error("Enter a valid contact number");
    if (photo && photo.size > 8 * 1024 * 1024) return void toast.error("Photo must be under 8 MB");
    setBusy(true);
    try {
      const point = gps ?? (await geocodeAddress(address.trim()));
      if (!point) return void toast.error("We couldn't find that address. Try pinning GPS.");
      const settings = await fetchNgoSettings();
      const distance = haversineKm(centerOf(settings), point);
      if (distance > settings.radius_km) return void setResult({ ok: false });

      let photo_path: string | null = null;
      if (photo) {
        const ext = photo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("rescue-photos").upload(path, photo, { contentType: photo.type });
        if (!error) photo_path = path;
      }
      const { error } = await supabase.from("rescue_alerts").insert({
        lat: point.lat, lng: point.lng, address: address.trim().slice(0, 300) || null,
        description: description.trim().slice(0, 1000) || null, photo_path, contact: contact.trim(),
      });
      if (error) {
        if (isOutOfRadiusError(error)) setResult({ ok: false });
        else toast.error("Alert failed to send. Please call the emergency line.");
        return;
      }
      setResult({ ok: true, distance });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Button asChild variant="alertOutline" size="lg" className="w-full">
        <a href={`tel:${EMERGENCY_PHONE.replace(/\s/g, "")}`}><Phone /> Emergency Call · {EMERGENCY_PHONE}</a>
      </Button>

      {result?.ok ? (
        <div className="mt-8">
          <SuccessScreen title="Rescue alert sent!" body="Our rescue team has been notified and will call you shortly. Please stay near the animal if it is safe." distance={result.distance} onReset={reset} />
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">Your alert is now visible to our NGO admin team. They will dispatch a rescue team and contact you.</p>
          </div>
        </div>
      ) : result && !result.ok ? (
        <div className="mt-8"><OutOfRadiusNotice onReset={reset} /></div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-6 rounded-2xl border bg-card p-6 shadow-soft">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold"><Siren className="text-alert" /> Urgent Rescue</h1>
            <p className="mt-1 text-sm text-muted-foreground">No login needed. Three quick steps.</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><MapPin className="size-4" /> 1. Location *</Label>
            <Button type="button" variant={gps ? "secondary" : "default"} className="w-full" onClick={pin} disabled={locating}>
              {locating ? <Loader2 className="animate-spin" /> : <Crosshair />}
              {gps ? `Pinned: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : "Pin my GPS location"}
            </Button>
            <Input placeholder="…or type the address / landmark" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Camera className="size-4" /> 2. Photo or description *</Label>
            <Input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            <Textarea placeholder="e.g. Injured dog near bus stop, bleeding leg" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact" className="flex items-center gap-1.5"><Phone className="size-4" /> 3. Your contact number *</Label>
            <Input id="contact" type="tel" inputMode="tel" placeholder="+91 …" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>

          <Button type="submit" variant="alert" size="xl" className="pulse-alert w-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Siren />} SEND URGENT RESCUE ALERT
          </Button>
        </form>
      )}
    </div>
  );
}
