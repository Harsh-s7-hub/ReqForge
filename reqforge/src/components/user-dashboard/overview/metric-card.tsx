
import type { ComponentType } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  iconColor: string;
  iconBackground: string;
  badge?: string;
  badgeColor?: string;
}

export function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  iconColor,
  iconBackground,
  badge,
  badgeColor = "bg-[#F1EFF8] text-[#6F6B7D]",
}: MetricCardProps) {
  return (
    <section className="min-w-0 rounded-xl border border-[#EAE8F0] bg-white p-5 shadow-[0_2px_12px_rgba(35,25,65,0.04)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(35,25,65,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBackground}`}
          >
            <Icon
              className={`h-[18px] w-[18px] ${iconColor}`}
            />
          </div>

          <h3 className="text-xs font-semibold uppercase leading-5 tracking-wide text-[#6F6B7D]">
            {title}
          </h3>
        </div>

        {badge && (
          <span
            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${badgeColor}`}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <span className="text-[30px] font-bold leading-none tracking-tight tabular-nums text-[#191725]">
          {value}
        </span>

        <span className="max-w-[65%] text-right font-mono text-[10px] leading-4 text-[#9A96A6]">
          {detail}
        </span>
      </div>
    </section>
  );
}
