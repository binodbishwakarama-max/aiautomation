export default function ConversationsLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-12 bg-surface rounded-card border border-border w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="h-96 bg-surface rounded-card border border-border" />
        <div className="lg:col-span-2 h-96 bg-surface rounded-card border border-border" />
      </div>
    </div>
  );
}
