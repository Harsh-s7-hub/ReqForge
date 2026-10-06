
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { DashboardDataProvider } from "@/components/user-dashboard/dashboard-data-provider";
import { DashboardShell } from "@/components/user-dashboard/dashboard-shell";

interface DashboardLayoutProps {
  children: ReactNode;
  params: Promise<{
    "github-username": string;
  }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { "github-username": username } = await params;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("regforge_session");

  if (!sessionCookie?.value) {
    redirect("/");
  }

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

  if (response.status === 401) {
    redirect("/");
  }

  if (!response.ok) {
    throw new Error("Unable to fetch authenticated user profile.");
  }

  const data = await response.json();
  const currentUser = data.user;
  console.log("GitHub user profile:", {
  username: currentUser?.github_username,
  avatar_url: currentUser?.avatar_url,
  profile_url: currentUser?.profile_url,
});

  // Ensure the URL belongs to the authenticated user.
  if (
    currentUser.github_username.toLowerCase() !==
    username.toLowerCase()
  ) {
    // redirect(`/${encodeURIComponent(currentUser.github_username)}`);
    notFound();
  }

  console.log("Passing sidebar props:", {
  username: currentUser.github_username,
  avatarUrl: currentUser.avatar_url,
  profileUrl: currentUser.profile_url,
});

 return (
  <DashboardDataProvider>
    <DashboardShell
      username={currentUser.github_username}
      displayName={currentUser.name || currentUser.github_username}
      avatarUrl={currentUser.avatar_url}
      profileUrl={currentUser.profile_url}
    >
      {children}
    </DashboardShell>
  </DashboardDataProvider>
);
}
