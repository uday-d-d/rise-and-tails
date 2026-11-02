import { createFileRoute } from "@tanstack/react-router";
import { Phone, MapPin, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NGO_ADDRESS, NGO_MAPS_URL, NGO_NAME, NGO_PHONE } from "@/lib/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact Us — ${NGO_NAME}` },
      { name: "description", content: `Call or visit ${NGO_NAME} animal NGO. Find our phone number and location.` },
      { property: "og:title", content: `Contact Us — ${NGO_NAME}` },
      { property: "og:description", content: `Call or visit ${NGO_NAME} animal NGO. Find our phone number and location.` },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const tel = `tel:${NGO_PHONE.replace(/\s/g, "")}`;
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-4xl font-semibold md:text-5xl">Contact Us</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Have a question, want to volunteer, or need help with an animal? Reach out to us.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-soft sm:col-span-2">
          <PawPrint className="size-6 text-primary" />
          <p className="mt-3 text-sm font-semibold text-muted-foreground">NGO Name</p>
          <p className="text-2xl font-semibold">{NGO_NAME}</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <Phone className="size-6 text-primary" />
          <p className="mt-3 text-sm font-semibold text-muted-foreground">Phone Number</p>
          <a href={tel} className="text-xl font-semibold hover:underline">{NGO_PHONE}</a>
          <Button asChild size="sm" className="mt-4"><a href={tel}><Phone /> Call now</a></Button>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <MapPin className="size-6 text-primary" />
          <p className="mt-3 text-sm font-semibold text-muted-foreground">Location</p>
          <p className="text-xl font-semibold">{NGO_ADDRESS}</p>
          <Button asChild size="sm" variant="outline" className="mt-4">
            <a href={NGO_MAPS_URL} target="_blank" rel="noreferrer"><MapPin /> Open in maps</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
