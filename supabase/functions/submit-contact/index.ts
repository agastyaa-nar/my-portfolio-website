// Single entry point for the contact form:
// validate -> rate-limit -> store (service role) -> notify Discord.
// The browser never writes to the table directly; RLS has no anon policies.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:8080")
  .split(",").map((s) => s.trim()).filter(Boolean);
const RATE_LIMIT = 3;           // messages ...
const RATE_WINDOW_MIN = 10;     // ... per IP per window

const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" },
  });

const sha256 = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))]
    .map((b) => b.toString(16).padStart(2, "0")).join("");

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ error: "Forbidden" }, 403, origin);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "Invalid request" }, 400, origin);

  // Honeypot: real users never fill this hidden field. Pretend success to bots.
  if (clean((body as Record<string, unknown>).website, 200)) return json({ status: "ok" }, 200, origin);

  const name = clean((body as Record<string, unknown>).name, 100);
  const email = clean((body as Record<string, unknown>).email, 254).toLowerCase();
  const message = clean((body as Record<string, unknown>).message, 2000);

  if (!name || !email || message.length < 5) return json({ error: "Please fill in all fields." }, 400, origin);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Please enter a valid email." }, 400, origin);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Per-IP rate limit (IP is stored only as a salted hash).
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const ipHash = await sha256(`${Deno.env.get("IP_HASH_SALT") ?? ""}:${ip}`);
  const since = new Date(Date.now() - RATE_WINDOW_MIN * 60_000).toISOString();
  const { count } = await supabase.from("contact_messages")
    .select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
  if ((count ?? 0) >= RATE_LIMIT) {
    return json({ error: "Too many messages. Please try again in a few minutes." }, 429, origin);
  }

  const { data: row, error } = await supabase.from("contact_messages")
    .insert({ name, email, message, ip_hash: ipHash }).select("id").single();
  if (error || !row) {
    console.error("insert failed", error);
    return json({ error: "Could not save your message." }, 500, origin);
  }

  // Notification is best-effort: the message is already safely stored.
  const webhook = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Portfolio Inbox",
          allowed_mentions: { parse: [] }, // block @everyone / @role injection
          embeds: [{
            title: "New portfolio message",
            color: 0x4f46e5,
            fields: [
              { name: "Name", value: name, inline: true },
              { name: "Email", value: email, inline: true },
              { name: "Message", value: message.slice(0, 1024) },
            ],
            timestamp: new Date().toISOString(),
          }],
        }),
      });
      if (res.ok) await supabase.from("contact_messages").update({ notified_at: new Date().toISOString() }).eq("id", row.id);
      else console.error("discord failed", res.status);
    } catch (e) {
      console.error("discord error", e);
    }
  }

  return json({ status: "ok" }, 200, origin);
});
