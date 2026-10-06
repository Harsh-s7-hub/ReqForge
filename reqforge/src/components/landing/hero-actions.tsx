import Link from "next/link";
import { heroCopy } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { GithubIcon } from "@/components/icons/github-icon";

type HeroActionsProps = {
  className?: string;
};



export function HeroActions({ className }: HeroActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4",
        className,
      )}
    >
      <Link
        href={heroCopy.githubCta.href}
        id="github-signin"
        className="cta-primary group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full px-8 text-sm font-semibold tracking-wide transition-all duration-300 ease-out hover:shadow-[0_0_25px_rgba(117,71,232,0.28)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7547E8] focus-visible:ring-offset-2 sm:w-auto sm:min-w-[210px] [&>*]:relative [&>*]:z-10"
        // className="cta-primary inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full px-8 text-sm font-semibold tracking-wide transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:scale-[1.02] focus-visible:-translate-y-0.5 sm:w-auto sm:min-w-[210px] [&>*]:relative [&>*]:z-10"
      >
        {/* <GithubIcon /> */}
        <GithubIcon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110" />
        <span>{heroCopy.githubCta.label}</span>
      </Link>
    </div>
  );
}
