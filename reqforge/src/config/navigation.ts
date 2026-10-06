export type NavItem = {
  label: string;
  href: string;
};

export const mainNavigation: NavItem[] = [
  { label: "Platform", href: "#platform" },
  { label: "Features", href: "#features" },
  { label: "Documentation", href: "#documentation" },
];

export const brand = {
  name: "RegForge",
  tagline: "AI-Powered DevOps",
} as const;

export const heroCopy = {
  headlineLine1: "Build Smarter Software",
  headlineAccent: "AI-Powered DevOps",
  headlinePrefix: "with",
  description:
    "Understand your codebase, generate intelligent documentation, review code, and automate software quality with AI-driven engineering workflows.",
  githubCta: {
    label: "Continue with GitHub",
    href: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/github/login`,
  },
} as const;
