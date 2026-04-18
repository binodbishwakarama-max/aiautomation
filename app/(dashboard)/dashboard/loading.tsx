export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-28 bg-surface rounded-card border border-border" />
        <div className="h-28 bg-surface rounded-card border border-border" />
        <div className="h-28 bg-surface rounded-card border border-border" />
      </div>
      <div className="h-64 bg-surface rounded-card border border-border" />
      <div className="h-48 bg-surface rounded-card border border-border" />
    </div>
  );
}
