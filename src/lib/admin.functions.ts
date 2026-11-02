import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type AdoptionRow = Database["public"]["Tables"]["adoption_requests"]["Row"];
export type AlertRow = Database["public"]["Tables"]["rescue_alerts"]["Row"];
export type SettingsRow = Database["public"]["Tables"]["ngo_settings"]["Row"];

// NOTE: server-only modules are imported *inside* the handlers so they never reach the browser bundle.
const auth = () => import("@/lib/admin-auth.server");
const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;

export const adminLogin = createServerFn({ method: "POST" })
  .validator(z.object({ username: z.string().max(100), password: z.string().max(200) }))
  .handler(async ({ data }) => {
    const a = await auth();
    if (!a.credentialsAreValid(data.username, data.password)) {
      return { ok: false as const, message: "Wrong username or password." };
    }
    await a.startAdminSession();
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  (await auth()).endAdminSession();
  return { ok: true as const };
});

export const adminCheck = createServerFn({ method: "GET" }).handler(async () => {
  return { signedIn: await (await auth()).isAdminSignedIn() };
});

export const adminLoadAll = createServerFn({ method: "GET" }).handler(async () => {
  await (await auth()).requireAdmin();
  const supabaseAdmin = await db();

  const [adoptions, alerts] = await Promise.all([
    supabaseAdmin.from("adoption_requests").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("rescue_alerts").select("*").order("created_at", { ascending: false }),
  ]);
  if (adoptions.error) throw new Error(adoptions.error.message);
  if (alerts.error) throw new Error(alerts.error.message);

  const alertRows: AlertRow[] = alerts.data ?? [];
  const paths = alertRows.map((a) => a.photo_path).filter((p): p is string => !!p);
  let photos: Record<string, string> = {};
  if (paths.length) {
    const { data: signed } = await supabaseAdmin.storage.from("rescue-photos").createSignedUrls(paths, 3600);
    photos = Object.fromEntries(
      (signed ?? []).flatMap((s) => (s.signedUrl && s.path ? [[s.path, s.signedUrl] as [string, string]] : [])),
    );
  }
  return { adoptions: (adoptions.data ?? []) as AdoptionRow[], alerts: alertRows, photos };
});

export const adminSetAdoptionStatus = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), status: z.enum(["pending", "approved", "rejected"]), admin_note: z.string().max(500).optional() }))
  .handler(async ({ data }) => {
    await (await auth()).requireAdmin();
    const update: Record<string, unknown> = { status: data.status };
    if (data.admin_note !== undefined) update.admin_note = data.admin_note;
    const { error } = await (await db()).from("adoption_requests").update(update).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminSetAlertStatus = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), status: z.enum(["pending", "dispatched", "resolved"]), admin_note: z.string().max(500).optional() }))
  .handler(async ({ data }) => {
    await (await auth()).requireAdmin();
    const update: Record<string, unknown> = { status: data.status };
    if (data.admin_note !== undefined) update.admin_note = data.admin_note;
    const { error } = await (await db()).from("rescue_alerts").update(update).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminGetSettings = createServerFn({ method: "GET" }).handler(async () => {
  await (await auth()).requireAdmin();
  const { data, error } = await (await db()).from("ngo_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return data as SettingsRow;
});

export const adminSaveSettings = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().trim().min(1).max(100),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  )
  .handler(async ({ data }) => {
    await (await auth()).requireAdmin();
    const { error } = await (await db())
      .from("ngo_settings")
      .update({ name: data.name, lat: data.lat, lng: data.lng, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ─── Track by email (public, no auth) ──────────────────────────────────
export const trackByEmail = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().trim().email().max(255) }))
  .handler(async ({ data }) => {
    const supabaseAdmin = await db();
    const { data: adoptions, error: aErr } = await supabaseAdmin
      .from("adoption_requests")
      .select("id, pet_name, pet_species, status, admin_note, created_at")
      .eq("email", data.email.toLowerCase())
      .order("created_at", { ascending: false });
    if (aErr) throw new Error(aErr.message);
    return { adoptions: adoptions ?? [] };
  });

// ─── Admin report data (aggregated stats for NGO audits) ───────────────
export const adminLoadReport = createServerFn({ method: "GET" }).handler(async () => {
  await (await auth()).requireAdmin();
  const supabaseAdmin = await db();

  const [adoptions, alerts] = await Promise.all([
    supabaseAdmin.from("adoption_requests").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("rescue_alerts").select("*").order("created_at", { ascending: false }),
  ]);
  if (adoptions.error) throw new Error(adoptions.error.message);
  if (alerts.error) throw new Error(alerts.error.message);

  const adoptionRows = (adoptions.data ?? []) as AdoptionRow[];
  const alertRows = (alerts.data ?? []) as AlertRow[];

  return { adoptions: adoptionRows, alerts: alertRows };
});
