# AGENT.md

## Project Overview

This project is a **Next.js full-stack application** using:

* **Next.js (App Router)**
* **TypeScript**
* **Tailwind CSS**
* **Supabase (Database + Auth + Storage)**
* **REST APIs via Next.js route handlers**

The AI agent is responsible for helping build **UI components, APIs, and database interactions** while following the architecture and conventions defined here.

---

# Tech Stack

Frontend:

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS

Backend:

* Next.js Route Handlers (`/app/api`)
* Supabase client

Database:

* Supabase PostgreSQL

Authentication:

* Supabase Auth

Deployment:

* Vercel

---

# Project Structure

/app
/api
/users
route.ts

/dashboard
page.tsx

/components
/ui
Button.tsx
Input.tsx
Card.tsx

/lib
supabase.ts
utils.ts

/services
userService.ts

/types
index.ts

---

# General Development Rules

1. Always use **TypeScript**.
2. Prefer **server components** unless client interactivity is needed.
3. Keep business logic inside **services**, not UI components.
4. API routes must be **thin controllers**.
5. Reusable UI must go inside `/components/ui`.
6. Avoid duplicated logic.
7. Use **async/await**, never nested promises.
8. Follow consistent naming conventions.

---

# UI Development Guidelines

Use **Tailwind CSS** for styling.

### UI Principles

* Mobile-first responsive design
* Clean minimal layouts
* Accessible components
* Reusable UI components

### Example Component Pattern

```
type ButtonProps = {
  label: string
  onClick?: () => void
}

export default function Button({ label, onClick }: ButtonProps) {
  return (
    <button
      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      onClick={onClick}
    >
      {label}
    </button>
  )
}
```

---

# API Development Rules

All APIs must be placed inside:

```
/app/api/
```

Example:

```
/app/api/users/route.ts
```

Example API structure:

```
import { NextResponse } from "next/server"
import { getUsers } from "@/services/userService"

export async function GET() {
  try {
    const users = await getUsers()
    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
```

---

# Response Format Standard

All APIs must return a consistent format.

```
{
  success: boolean
  data?: any
  message?: string
  error?: string
}
```

Example success:

```
{
  "success": true,
  "data": []
}
```

Example error:

```
{
  "success": false,
  "message": "User not found"
}
```

---

# Database Rules (Supabase)

All database logic must go inside **services**.

Example:

```
/services/userService.ts
```

Example:

```
import { supabase } from "@/lib/supabase"

export async function getUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")

  if (error) throw error

  return data
}
```

---

# Supabase Client

Supabase client must be defined in:

```
/lib/supabase.ts
```

Example:

```
import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

# Environment Variables

Environment variables must be stored in:

```
.env.local
```

Example:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose service role keys to the frontend.

---

# Validation

All API inputs must be validated using:

* Zod

Example:

```
import { z } from "zod"

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2)
})
```

---

# Error Handling

Use structured error responses.

Example:

```
try {
  ...
} catch (error) {
  console.error(error)
  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  )
}
```

---

# Security Guidelines

Never:

* expose service role keys
* trust client input
* run raw SQL without validation

Always:

* validate inputs
* sanitize user data
* use Supabase row-level security when possible

---

# Naming Conventions

Components:

```
UserCard.tsx
LoginForm.tsx
```

Services:

```
userService.ts
authService.ts
```

API routes:

```
/api/users
/api/auth/login
```

Database tables:

```
users
orders
transactions
```

---

# Agent Development Instructions

When generating code:

1. Follow the project structure.
2. Reuse existing components when possible.
3. Place database logic inside services.
4. Use Tailwind for styling.
5. Use TypeScript types for all responses.
6. Maintain API response format consistency.
7. Ensure security best practices.

---

# Preferred Patterns

Use:

* Functional components
* Async/await
* Small reusable components
* Service layer for database logic

Avoid:

* Large monolithic components
* Direct DB calls in UI
* Hardcoded secrets

---

# Testing (Recommended)

Preferred stack:

* Jest
* React Testing Library

Test:

* APIs
* services
* critical UI flows

---

# Code Quality

Use:

* ESLint
* Prettier
* Strict TypeScript

---

# Final Notes

This project should prioritize:

* scalability
* maintainability
* clean architecture
* clear separation between UI, API, and data layers

Agents must follow these guidelines strictly when generating or modifying code.

---

# Documentation Workflow Rule

For every new user prompt:

1. First review whether `PRD.md` and `TASK.md` need updates.
2. Update `PRD.md` if the request changes product scope, features, modules, flows, or requirements.
3. Update `TASK.md` if the request adds, changes, or completes implementation work.
4. Only after aligning these two files should implementation continue.

This documentation update step is mandatory for all future tasks in this repository.
