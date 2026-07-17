export function ChartContainer({
  children,
  className = "",
  emptyMessage = "Sem dados suficientes para o grafico",
  errorMessage = "",
  isEmpty = false,
  isLoading = false,
  title = ""
}) {
  const classes = ["dashboard-chart-shell", className].filter(Boolean).join(" ");

  if (isLoading) {
    return (
      <div className={classes} aria-busy="true">
        <div className="dashboard-chart-state">Carregando grafico...</div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={classes} role="alert">
        <div className="dashboard-chart-state error">{errorMessage}</div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={classes}>
        <div className="dashboard-chart-state">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={classes} aria-label={title || undefined}>
      {children}
    </div>
  );
}
