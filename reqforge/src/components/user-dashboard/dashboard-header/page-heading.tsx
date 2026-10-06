interface PageHeadingProps {
  section: string;
  title: string;
  subtitle: string;
}

export function PageHeading({
  section,
  title,
  subtitle,
}: PageHeadingProps) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9691A2]">
        {section}
      </span>

      <h1 className="mt-1 truncate text-[19px] font-bold tracking-tight text-[#29213F]">
        {title}
      </h1>

      <p className="hidden text-[11px] text-[#9691A2] sm:block">
        {subtitle}
      </p>
    </div>
  );
}