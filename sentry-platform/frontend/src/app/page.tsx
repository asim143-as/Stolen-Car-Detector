import { redirect } from "next/navigation"

// Mirrors MediSight: "/" always sends visitors to the public landing
// page. Middleware then takes over role-based routing for logged-in
// users hitting a protected area.
export default function RootPage() {
  redirect("/welcome")
}
