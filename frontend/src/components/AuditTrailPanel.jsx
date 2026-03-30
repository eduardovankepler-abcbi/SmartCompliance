export function AuditTrailPanel({
  entries,
  emptyMessage,
  formatDate,
  subtitle,
  title
}) {
  return (
    <div className="card card-span compact-card">
      <div className="card-header">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      <div className="stack-list compact-stack audit-trail-stack">
        {entries.length ? (
          entries.map((entry) => (
            <article className="list-card compact-list-card audit-trail-item" key={entry.id}>
              <div className="row">
                <strong>{entry.summary}</strong>
                <span className="badge">{formatDate(entry.createdAt)}</span>
              </div>
              <p className="muted">
                {entry.actorName} · {entry.actorRoleKey}
              </p>
              <p className="muted">{entry.detail}</p>
            </article>
          ))
        ) : (
          <div className="list-card compact-list-card">
            <strong>Sem eventos recentes</strong>
            <p className="muted">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
