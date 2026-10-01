import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "RegForge | Legal intelligence", description: "Regulatory and contract intelligence workspace" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
