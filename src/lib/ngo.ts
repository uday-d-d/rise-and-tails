import { supabase } from "@/integrations/supabase/client";
import type { LatLng } from "./geo";

export type NgoSettings = { name: string; lat: number; lng: number; radius_km: number };

export async function fetchNgoSettings(): Promise<NgoSettings> {
  const { data, error } = await supabase.from("ngo_settings").select("name,lat,lng,radius_km").eq("id", 1).single();
  if (error || !data) return { name: "Rise and Tails", lat: 19.076, lng: 72.8777, radius_km: 25 };
  return data;
}

export const centerOf = (s: NgoSettings): LatLng => ({ lat: s.lat, lng: s.lng });
