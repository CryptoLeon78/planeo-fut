import { createClient } from "@supabase/supabase-js";

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.trim() : undefined;
}

function fail(message) {
  throw new Error(message);
}

const action = process.argv[2];
if (process.argv.includes("--help") || !action) {
  console.log("Usage: npm run auth:manage-user -- <create|reset> --email coach@example.com [--name 'Coach name']");
  console.log("Set PLANEOFUT_TEMP_PASSWORD in the current PowerShell session before running.");
  process.exit(action ? 0 : 1);
}

if (!["create", "reset"].includes(action)) fail("Action must be create or reset.");
const email = option("--email")?.toLowerCase();
const fullName = option("--name");
const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.PLANEOFUT_TEMP_PASSWORD;

if (!email || !/^\S+@\S+\.\S+$/.test(email)) fail("Pass a valid email with --email.");
if (!password || password.length < 12) fail("Set PLANEOFUT_TEMP_PASSWORD to at least 12 characters in the current process.");
if (!url || !serviceRoleKey || serviceRoleKey === "server-only-service-role-key") {
  fail("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the process environment.");
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function findUserByEmail() {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (match || data.users.length < 1000) return match;
  }
}

if (action === "create") {
  if (await findUserByEmail()) fail("A user already exists with that email. Use reset instead.");
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || email.split("@")[0] },
  });
  if (error) throw error;
  console.log("User created and email marked as confirmed. Share the temporary password through a trusted channel.");
} else {
  const user = await findUserByEmail();
  if (!user) fail("No user exists with that email. Use create instead.");
  const { error } = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (error) throw error;
  console.log("Password updated. Review active sessions in Supabase before sharing the temporary password.");
}
