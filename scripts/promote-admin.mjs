import { createClient } from "@supabase/supabase-js";

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.trim() : undefined;
}

if (process.argv.includes("--help")) {
  console.log("Usage: npm run auth:promote-admin -- --email coach@example.com");
  process.exit(0);
}

const email = getOption("--email")?.toLowerCase();
const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
  throw new Error("Pass a valid email with --email.");
}
if (!url || !serviceRoleKey || serviceRoleKey === "server-only-service-role-key") {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the process environment.");
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
let user;
for (let page = 1; ; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
  if (user || data.users.length < 1000) break;
}

if (!user) throw new Error("No user exists with that email. Create the account first.");

const { data: existing, error: readError } = await supabase
  .from("user_roles")
  .select("id")
  .eq("user_id", user.id)
  .eq("role", "admin")
  .maybeSingle();
if (readError) throw readError;

if (!existing) {
  const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: "admin" });
  if (error) throw error;
}

console.log("Admin role is active for the selected user.");
