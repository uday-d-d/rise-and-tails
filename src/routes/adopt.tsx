import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Dog, Cat, Loader2, Info, Syringe, Scissors, MapPin, Hash, Heart } from "lucide-react";
import { PETS, type Pet, type Species } from "@/lib/pets";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { geocodeAddress, haversineKm, isOutOfRadiusError } from "@/lib/geo";
import { centerOf, fetchNgoSettings } from "@/lib/ngo";
import { OutOfRadiusNotice, SuccessScreen } from "@/components/ResultScreens";

export const Route = createFileRoute("/adopt")({
  head: () => ({
    meta: [
      { title: "Adopt a Dog or Cat — Rise and Tails" },
      { name: "description", content: "Meet rescued dogs and cats looking for a loving forever home." },
      { property: "og:title", content: "Adopt a Dog or Cat — Rise and Tails" },
      { property: "og:description", content: "Meet rescued dogs and cats looking for a loving forever home." },
    ],
  }),
  component: AdoptPage,
});

const schema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{6,18}$/, "Enter a valid phone number"),
  address: z.string().trim().min(1, "Address is required").max(300),
  city: z.string().trim().min(1, "City is required").max(100),
  housing_type: z.string().min(1, "Choose a housing type"),
  experience: z.string().trim().min(1, "Tell us about your experience").max(1000),
});

function AdoptPage() {
  const [species, setSpecies] = useState<Species>("dog");
  const [pet, setPet] = useState<Pet | null>(null);
  const [infoPet, setInfoPet] = useState<Pet | null>(null);
  const list = PETS.filter((p) => p.species === species);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-semibold">Find your new best friend</h1>
      <p className="mt-2 text-muted-foreground">All our animals are vaccinated, sterilised and ready to go home.</p>
      <div className="mt-6 inline-flex rounded-full border bg-muted p-1" role="tablist">
        {(["dog", "cat"] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={species === s}
            onClick={() => setSpecies(s)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-colors ${species === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {s === "dog" ? <Dog className="size-4" /> : <Cat className="size-4" />} {s === "dog" ? "Dogs" : "Cats"}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-2xl border bg-card shadow-soft">
            <img src={p.image} alt={p.name} loading="lazy" width={816} height={816} className="aspect-square w-full object-cover" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-2xl font-semibold">{p.name}</h3>
                  <p className="text-sm font-semibold text-primary">{p.breed} · {p.age}</p>
                </div>
                <div className="flex gap-1">
                  {p.vaccinated && <Badge variant="secondary" className="text-xs gap-1"><Syringe className="size-3" />Vaccinated</Badge>}
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.nature}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="gap-1.5" onClick={() => setInfoPet(p)}>
                  <Info className="size-4" /> Info
                </Button>
                <Button className="flex-1" onClick={() => setPet(p)}>
                  <Heart className="size-4" /> Adopt Me
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <PetInfoDialog pet={infoPet} onClose={() => setInfoPet(null)} />
      <AdoptionDialog pet={pet} onClose={() => setPet(null)} />
    </div>
  );
}

/* ─── Pet Bio/Info Dialog ───────────────────────────────────────────── */
function PetInfoDialog({ pet, onClose }: { pet: Pet | null; onClose: () => void }) {
  return (
    <Dialog open={!!pet} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {pet && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">About {pet.name}</DialogTitle>
              <DialogDescription>Complete bio and rescue information</DialogDescription>
            </DialogHeader>

            <img src={pet.image} alt={pet.name} className="w-full rounded-xl aspect-square object-cover" />

            <div className="space-y-4 mt-4">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Name" value={pet.name} />
                <InfoItem label="Species" value={pet.species === "dog" ? "🐕 Dog" : "🐈 Cat"} />
                <InfoItem label="Breed" value={pet.breed} />
                <InfoItem label="Age" value={pet.age} />
                <InfoItem label="Gender" value={pet.gender === "male" ? "♂ Male" : "♀ Female"} />
                {pet.registrationNo && <InfoItem label="Registration No." value={pet.registrationNo} />}
              </div>

              {/* Nature */}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-semibold text-primary mb-1">Nature & Temperament</p>
                <p className="text-sm">{pet.nature}</p>
              </div>

              {/* Rescued From */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <MapPin className="size-4" /> Rescued From
                </p>
                <p className="mt-1 text-sm">{pet.rescuedFrom}</p>
              </div>

              {/* Health Status */}
              <div className="flex gap-3">
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${pet.vaccinated ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  <Syringe className="size-4" />
                  {pet.vaccinated ? "Vaccinated ✓" : "Not Vaccinated"}
                </div>
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${pet.sterilized ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  <Scissors className="size-4" />
                  {pet.sterilized ? "Sterilized ✓" : "Not Yet Sterilized"}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}

/* ─── Adoption Application Dialog ───────────────────────────────────── */
function AdoptionDialog({ pet, onClose }: { pet: Pet | null; onClose: () => void }) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", address: "", city: "", housing_type: "", experience: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { ok: true; distance: number } | { ok: false }>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const close = () => { setResult(null); setErrors({}); onClose(); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pet) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const point = (await geocodeAddress(`${form.address}, ${form.city}`)) ?? (await geocodeAddress(form.city));
      if (!point) { toast.error("We couldn't find that address. Please check it."); return; }
      const settings = await fetchNgoSettings();
      const distance = haversineKm(centerOf(settings), point);
      if (distance > settings.radius_km) { setResult({ ok: false }); return; }
      const { error } = await supabase.from("adoption_requests").insert({
        ...parsed.data, pet_id: pet.id, pet_name: pet.name, pet_species: pet.species, lat: point.lat, lng: point.lng,
      });
      if (error) {
        if (isOutOfRadiusError(error)) setResult({ ok: false });
        else toast.error("Something went wrong. Please try again.");
        return;
      }
      setResult({ ok: true, distance });
      setForm({ full_name: "", email: "", phone: "", address: "", city: "", housing_type: "", experience: "" });
    } finally {
      setBusy(false);
    }
  }

  const field = (k: keyof typeof form, label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label} *</Label>
      <Input id={k} type={type} value={form[k]} onChange={(e) => set(k)(e.target.value)} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <Dialog open={!!pet} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {result?.ok ? (
          <div className="text-center">
            <SuccessScreen
              title="Application received!"
              body={`Thank you! Our team will review your application for ${pet?.name} and contact you soon.`}
              distance={result.distance}
              onReset={close}
            />
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-primary">📋 Track your application</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Visit the <Link to="/track" className="font-bold text-primary underline">Track Request</Link> page and enter your email to check your application status anytime.
              </p>
            </div>
          </div>
        ) : result && !result.ok ? (
          <OutOfRadiusNotice onReset={close} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Adopt {pet?.name}</DialogTitle>
              <DialogDescription>Fill in all fields so we can find the perfect match.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              {field("full_name", "Full Name")}
              <div className="grid gap-4 sm:grid-cols-2">
                {field("email", "Email Address", "email")}
                {field("phone", "Phone Number", "tel")}
              </div>
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                {field("address", "Home Address")}
                {field("city", "City")}
              </div>
              <div className="space-y-1.5">
                <Label>Housing Type *</Label>
                <Select value={form.housing_type} onValueChange={set("housing_type")}>
                  <SelectTrigger><SelectValue placeholder="Choose one" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="House with yard">House with yard</SelectItem>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Rented">Rented</SelectItem>
                  </SelectContent>
                </Select>
                {errors["housing_type"] && <p className="text-xs text-destructive">{errors["housing_type"]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="experience">Previous Pet Ownership Experience *</Label>
                <Textarea id="experience" placeholder="Yes / No — tell us a little about it" value={form.experience} onChange={(e) => set("experience")(e.target.value)} />
                {errors["experience"] && <p className="text-xs text-destructive">{errors["experience"]}</p>}
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />} Submit Application
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
