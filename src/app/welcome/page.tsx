// ── wave-x7b ── Welcome back screen (twin of Dopps Class welcome.html).
import type { Metadata } from "next";
import { Welcome } from "./welcome";

export const metadata: Metadata = { title: "Welcome Back", description: "Check in for today, see the class briefing and survey, and pick up your next task." };

export default function WelcomePage() {
  return <Welcome />;
}
