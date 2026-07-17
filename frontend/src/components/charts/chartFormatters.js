export function formatChartNumber(value) {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat("pt-BR").format(numericValue);
}

export function formatChartPercent(value) {
  const numericValue = Number(value || 0);
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(numericValue)}%`;
}

export function formatChartCompactNumber(value) {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(numericValue);
}

export function formatChartDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function formatTooltipLabel(context, formatter = formatChartNumber) {
  const label = context?.dataset?.label ? `${context.dataset.label}: ` : "";
  const rawValue = context?.parsed?.y ?? context?.parsed ?? context?.raw ?? 0;
  return `${label}${formatter(rawValue)}`;
}

export function formatChartDetail(value, detailFormatter) {
  return detailFormatter ? detailFormatter(value) : formatChartNumber(value);
}
