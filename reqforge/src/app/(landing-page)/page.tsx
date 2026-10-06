
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BackgroundEffects } from "@/components/landing/background-effects";
import { HeroBackground } from "@/components/landing/hero-background";
import { HeroSection } from "@/components/landing/hero-section";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("regforge_session");

  if (sessionCookie?.value) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured.");
      }

      const response = await fetch(`${apiUrl}/api/users/me`, {
        method: "GET",
        headers: {
          Cookie: `regforge_session=${sessionCookie.value}`,
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        const username = data.user?.github_username;

        if (username) {
          redirect(`/${encodeURIComponent(username)}`);
        }
      }
    } catch (error) {
      // Next.js redirect throws internally; preserve its redirect response.
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest.startsWith("NEXT_REDIRECT")
      ) {
        throw error;
      }

      console.error("Session verification failed:", error);
    }
  }

  return (
    <main className="landing-background relative isolate h-screen overflow-hidden">
      <HeroBackground />
      <BackgroundEffects />
      <HeroSection />
    </main>
  );
}
