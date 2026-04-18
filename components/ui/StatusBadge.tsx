import { cn } from "@/lib/utils";

export type StatusType = "active" | "resolved" | "escalated" | "new" | string;

export function StatusBadge({ status, className }: { status: StatusType, className?: string }) {
  const getStyles = () => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "resolved":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      case "escalated":
        return "bg-red-500/10 text-red-500 border-red-500/20 shadow-glow-primary/10";
      case "new":
        return "bg-secondary/10 text-secondary border-secondary/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const isBlinking = status === "active" || status === "escalated" || status === "new";
  const dotColor = status === "escalated" ? "bg-red-400" : status === "new" ? "bg-secondary" : "bg-green-400";

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-full border", getStyles(), className)}>
      {isBlinking && (
        <span className="relative flex h-2 w-2">
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dotColor)}></span>
          <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColor)}></span>
        </span>
      )}
      {status}
    </span>
  );
}
