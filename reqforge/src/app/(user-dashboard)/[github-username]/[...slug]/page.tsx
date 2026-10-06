import { notFound } from "next/navigation";

interface CatchAllPageProps {
  params: Promise<{
    "github-username": string;
    slug: string[];
  }>;
}

export default async function CatchAllPage({
  params,
}: CatchAllPageProps) {
  const { slug } = await params;

  console.log("Unknown dashboard route:", slug);

  notFound();
}