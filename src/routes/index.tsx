import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Siren, ShieldCheck } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rise and Tails — Rescue, Adopt, Give a Second Chance" },
      { name: "description", content: "Adopt a rescued dog or cat, or send an urgent rescue alert in seconds." },
      { property: "og:title", content: "Rise and Tails — Rescue & Adoption" },
      { property: "og:description", content: "Adopt a rescued dog or cat, or send an urgent rescue alert in seconds." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div>
      <section className="bg-hope">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
              <Heart className="size-4" /> Rescue · Heal · Rehome
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-6xl">
              Every paw deserves a <span className="text-primary">safe home</span>.
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              We rescue injured and abandoned dogs and cats within 25 km of our shelter, nurse them back to health, and match them with loving families.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/adopt">Meet our pets</Link></Button>
              <Button asChild size="lg" variant="alert"><Link to="/rescue"><Siren /> Report an emergency</Link></Button>
            </div>
          </div>
          <img src={hero} width={1600} height={1008} alt="A rescued dog and cat resting together" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-soft" />
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
        {[
          { icon: Heart, title: "Adopt", text: "Browse dogs and cats ready for a forever home." },
          { icon: Siren, title: "Urgent rescue", text: "No sign-up. Pin the location, add a photo, send." },
          { icon: ShieldCheck, title: "25 km coverage", text: "Requests beyond our radius go to partner shelters." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-soft">
            <f.icon className="size-7 text-primary" />
            <h3 className="mt-3 text-xl font-semibold">{f.title}</h3>
            <p className="mt-1 text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
