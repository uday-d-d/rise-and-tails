import { CheckCircle2, MapPinOff } from "lucide-react";
import { OUT_OF_RADIUS_MESSAGE } from "@/lib/geo";
import { Button } from "@/components/ui/button";

export function SuccessScreen({ title, body, distance, onReset }: { title: string; body: string; distance?: number | null; onReset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-soft">
      <CheckCircle2 className="mx-auto size-14 text-success" />
      <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-muted-foreground">{body}</p>
      {distance != null && <p className="mt-3 text-sm text-secondary-foreground">About {distance.toFixed(1)} km from our shelter.</p>}
      <Button className="mt-6" variant="outline" onClick={onReset}>Done</Button>
    </div>
  );
}

export function OutOfRadiusNotice({ onReset }: { onReset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-alert/40 bg-alert-soft p-8 text-center">
      <MapPinOff className="mx-auto size-12 text-alert" />
      <p className="mt-4 text-lg font-semibold text-accent-foreground">{OUT_OF_RADIUS_MESSAGE}</p>
      <p className="mt-2 text-sm text-muted-foreground">Thank you for caring. Our partner shelters near you will follow up.</p>
      <Button className="mt-6" variant="outline" onClick={onReset}>Back</Button>
    </div>
  );
}
