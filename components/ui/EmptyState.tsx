import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  fullHeight?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  fullHeight = true,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8",
        fullHeight && "h-full min-h-[300px]",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-6 shadow-sm">
        <Icon className="w-8 h-8 text-textMuted opacity-70" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-textPrimary mb-2">{title}</h3>
      <p className="text-sm text-textMuted max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
