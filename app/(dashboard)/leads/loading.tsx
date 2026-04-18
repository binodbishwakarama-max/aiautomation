export default function LeadsLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-10 bg-surface rounded-card border border-border w-48" />
        <div className="h-10 bg-surface rounded-card border border-border w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface rounded-card border border-border" />
        ))}
      </div>
    </div>
  );
}
