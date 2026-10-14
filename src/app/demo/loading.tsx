export default function WorkspaceLoading() {
  return (
    <div className="workspace-loading" role="status" aria-label="Loading society workspace">
      <div className="skeleton skeleton-title" />
      <div className="skeleton-stat-grid">
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton skeleton-stat" key={i} />
        ))}
      </div>
      <div className="skeleton skeleton-panel" />
      <p>Loading your workspace…</p>
    </div>
  );
}
