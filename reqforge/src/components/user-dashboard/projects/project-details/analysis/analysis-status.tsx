"use client";

interface AnalysisStatusProps {
  analysisId: number | null;
  status?: string | null;
}

export function AnalysisStatus({
  analysisId,
  status,
}: AnalysisStatusProps) {
  if (!analysisId) {
    return (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#9A96A6]" />
        <span className="text-xs font-medium text-[#6F6B7D]">
          Not analyzed
        </span>
      </div>
    );
  }

  const normalizedStatus = (
    status ?? "completed"
  ).toLowerCase();

  const isCompleted =
    normalizedStatus === "completed";

  const isFailed =
    normalizedStatus === "failed";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${
          isCompleted
            ? "bg-[#16CFEA]"
            : isFailed
              ? "bg-[#E05252]"
              : "bg-[#7547E8]"
        }`}
      />

      <span className="text-xs font-medium text-[#6F6B7D]">
        {normalizedStatus.charAt(0).toUpperCase() +
          normalizedStatus.slice(1)}
      </span>
    </div>
  );
}