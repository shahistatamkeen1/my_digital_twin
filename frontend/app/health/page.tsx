import { redirect } from "next/navigation";

export default function HealthHomePage() {
  redirect("/health/dashboard");
}
