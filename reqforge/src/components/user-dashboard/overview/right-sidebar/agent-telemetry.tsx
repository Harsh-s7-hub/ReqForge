
import {
  Activity,
  Bot,
  CheckCircle2,
  Clock3,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export type AgentStatus = "completed" | "running" | "failed" | "queued";

export interface AgentActivity {
  id: string;
  name: string;
  task: string;
  status: AgentStatus;
  time: string;
}

interface AgentTelemetryProps {
  activities?: AgentActivity[];
  activeAgents?: number;
  totalExecutions?: number;
}

const statusConfig: Record<
  AgentStatus,
  {
    label: string;
    icon: LucideIcon;
    className: string;
  }
> = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-[#EAF8F0] text-[#238653]",
  },
  running: {
    label: "Running",
    icon: LoaderCircle,
    className: "bg-[#F0EAFF] text-[#7547E8]",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    className: "bg-[#FFF0EF] text-[#D95750]",
  },
  queued: {
    label: "Queued",
    icon: Clock3,
    className: "bg-[#FFF7E8] text-[#B7791F]",
  },
};

export function AgentTelemetry({
  activities = [],
  activeAgents = 0,
  totalExecutions = 0,
}: AgentTelemetryProps) {
  return (
    <section
      aria-label="AI agent telemetry"
      className="overflow-hidden rounded-xl border border-[#EAE8F0] bg-white shadow-[0_2px_10px_rgba(25,23,37,0.025)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EAE8F0] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0EAFF]">
            <Activity size={17} className="text-[#7547E8]" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[#191725]">
              Agent Telemetry
            </h2>
            <p className="mt-0.5 text-[11px] text-[#9692A1]">
              AI execution activity
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#F1F3F7] px-2.5 py-1 text-[10px] font-medium text-[#6F6B7D]">
          Activity feed
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 border-b border-[#EAE8F0] p-5">
        <div className="rounded-lg bg-[#F8F7FA] p-3">
          <div className="flex items-center gap-2 text-[#8A8697]">
            <Bot size={14} />
            <span className="text-[11px]">Active Agents</span>
          </div>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#191725]">
            {activeAgents}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8F7FA] p-3">
          <div className="flex items-center gap-2 text-[#8A8697]">
            <Activity size={14} />
            <span className="text-[11px]">Total Executions</span>
          </div>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#191725]">
            {totalExecutions}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-5 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#292637]">
            Recent Activity
          </h3>

          <span className="text-[10px] text-[#9692A1]">
            Latest executions
          </span>
        </div>

        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => {
              const config = statusConfig[activity.status];
              const StatusIcon = config.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F3F9]">
                    <Bot size={16} className="text-[#7547E8]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-xs font-semibold text-[#292637]">
                        {activity.name}
                      </p>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${config.className}`}
                      >
                        <StatusIcon size={10} />
                        {config.label}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-[11px] text-[#8A8697]">
                      {activity.task}
                    </p>

                    <p className="mt-1 text-[10px] text-[#AAA6B3]">
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-7 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F3F9]">
              <Bot size={19} className="text-[#9A96A6]" />
            </div>

            <p className="mt-3 text-xs font-medium text-[#555164]">
              No agent activity yet
            </p>

            <p className="mt-1 max-w-[220px] text-[10px] leading-4 text-[#9692A1]">
              Agent executions will appear here when your AI workflows start running.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#EAE8F0] bg-[#FCFBFD] px-5 py-3">
        <span className="text-[10px] text-[#9692A1]">
          Execution history
        </span>
      </div>
    </section>
  );
}
