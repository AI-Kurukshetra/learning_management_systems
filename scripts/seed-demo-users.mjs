import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envPath);

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const demoUsers = [
  {
    email: "admin@eduflow.dev",
    password: "Admin@12345",
    name: "EduFlow Admin",
    role: "admin",
  },
  {
    email: "teacher@eduflow.dev",
    password: "Teacher@12345",
    name: "Demo Teacher",
    role: "teacher",
  },
  {
    email: "student@eduflow.dev",
    password: "Student@12345",
    name: "Demo Student",
    role: "student",
  },
];

async function findAuthUserByEmail(email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message);
    }

    const users = data?.users ?? [];
    const match = users.find((user) => (user.email ?? "").toLowerCase() === email.toLowerCase());

    if (match) {
      return match;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function ensureAuthUser(user) {
  const existingUser = await findAuthUserByEmail(user.email);

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        name: user.name,
        role: user.role,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      name: user.name,
      role: user.role,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error(`Failed to create auth user for ${user.email}.`);
  }

  return data.user;
}

async function validateUsersTableSchema() {
  const { error } = await supabase
    .from("users")
    .select("id,auth_user_id,email,name,role,created_at")
    .limit(1);

  if (!error) {
    return;
  }

  if (
    error.message.includes("auth_user_id") ||
    error.message.includes("email")
  ) {
    throw new Error(
      "Your public.users table is still using the old schema. Run supabase/eduflow-schema.sql in Supabase SQL Editor first, then rerun this script.",
    );
  }

  throw new Error(error.message);
}

async function ensureProfile(authUser, user) {
  const { error } = await supabase.from("users").upsert(
    {
      auth_user_id: authUser.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    {
      onConflict: "email",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function main() {
  await validateUsersTableSchema();

  for (const user of demoUsers) {
    const authUser = await ensureAuthUser(user);
    await ensureProfile(authUser, user);
    console.log(`Ready: ${user.role} -> ${user.email}`);
  }

  console.log("\nCredentials:");
  for (const user of demoUsers) {
    console.log(`${user.role}: ${user.email} / ${user.password}`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
