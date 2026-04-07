import { useState } from "react";

function MetricGlyph({ label }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  if (label.includes("Pessoas")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" {...common} />
        <path d="M16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" {...common} />
        <path d="M4.5 18.5a4.5 4.5 0 0 1 9 0" {...common} />
        <path d="M14 18.5a3.8 3.8 0 0 1 5-3.5" {...common} />
      </svg>
    );
  }

  if (label.includes("Incidentes")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4 20 18H4L12 4Z" {...common} />
        <path d="M12 9v4" {...common} />
        <path d="M12 16h.01" {...common} />
      </svg>
    );
  }

  if (label.includes("Ciclos")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 7v5l3 2" {...common} />
        <path d="M21 12a9 9 0 1 1-2.64-6.36" {...common} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 6h10a2 2 0 0 1 2 2v9.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 17.5V8a2 2 0 0 1 2-2Z" {...common} />
      <path d="M9 10h6M9 14h6" {...common} />
    </svg>
  );
}

function getSeriesTone(seed) {
  const palette = [
    {
      solid: "#4d88ff",
      soft: "rgba(77, 136, 255, 0.22)",
      gradient: "linear-gradient(180deg, rgba(109, 160, 255, 0.34), #4d88ff)"
    },
    {
      solid: "#70a2ff",
      soft: "rgba(112, 162, 255, 0.22)",
      gradient: "linear-gradient(180deg, rgba(145, 183, 255, 0.32), #70a2ff)"
    },
    {
      solid: "#34b8d8",
      soft: "rgba(52, 184, 216, 0.2)",
      gradient: "linear-gradient(180deg, rgba(90, 208, 235, 0.3), #34b8d8)"
    },
    {
      solid: "#6a75f6",
      soft: "rgba(106, 117, 246, 0.22)",
      gradient: "linear-gradient(180deg, rgba(128, 138, 248, 0.3), #6a75f6)"
    },
    {
      solid: "#3ec5a1",
      soft: "rgba(62, 197, 161, 0.22)",
      gradient: "linear-gradient(180deg, rgba(97, 215, 182, 0.3), #3ec5a1)"
    },
    {
      solid: "#ff8f4d",
      soft: "rgba(255, 143, 77, 0.2)",
      gradient: "linear-gradient(180deg, rgba(255, 170, 119, 0.3), #ff8f4d)"
    }
  ];

  const normalized = String(seed || "default");
  const hash = normalized.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

export function MetricCard({ label, value }) {
  return (
    <div className="mini-card stat-card">
      <div className="stat-card-head">
        <span className="stat-icon">
          <MetricGlyph label={label} />
        </span>
        <p className="mini-label">{label}</p>
      </div>
      <strong>{value ?? "-"}</strong>
    </div>
  );
}

export function DashboardDonut({ item }) {
  const tone = getSeriesTone(item.key);

  return (
    <div className="mini-card donut-card">
      <div
        className="donut-visual"
        style={{
          background: `conic-gradient(${tone.solid} 0deg ${item.percentage * 3.6}deg, rgba(127, 138, 155, 0.18) ${item.percentage * 3.6}deg 360deg)`
        }}
      >
        <div className="donut-hole">
          <strong>{item.percentage}%</strong>
        </div>
      </div>
      <p className="mini-label">{item.label}</p>
      <strong>
        {item.value} / {item.total}
      </strong>
      <p className="muted">{item.detail}</p>
    </div>
  );
}

export function BarMetricRow({ label, value, detail, percentage, toneKey = label }) {
  const tone = getSeriesTone(toneKey);

  return (
    <div className="bar-row">
      <div className="row">
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${percentage}%`, background: tone.solid }} />
      </div>
      <p className="muted">{detail}</p>
    </div>
  );
}

export function ColumnMetricCard({
  label,
  value,
  percentage,
  description = "",
  toneKey = label,
  variant = "column"
}) {
  const tone = getSeriesTone(toneKey);

  if (variant === "funnel") {
    return (
      <div className="mini-card funnel-card">
        <div className="funnel-track">
          <div
            className="funnel-fill"
            style={{
              width: `${Math.max(percentage, 32)}%`,
              background: tone.gradient,
              boxShadow: `0 12px 24px ${tone.soft}`
            }}
          />
        </div>
        <strong>{value}</strong>
        <p className="mini-label">{label}</p>
        <p className="muted">{description || `${percentage}% do recorte`}</p>
      </div>
    );
  }

  return (
    <div className="mini-card column-card">
      <div className="column-track">
        <div
          className="column-fill"
          style={{
            height: `${Math.max(percentage, 6)}%`,
            background: tone.gradient,
            boxShadow: `0 12px 20px ${tone.soft}`
          }}
        />
      </div>
      <strong>{value}</strong>
      <p className="mini-label">{label}</p>
      <p className="muted">{description || `${percentage}% do recorte`}</p>
    </div>
  );
}

export function FunnelSeriesChart({ items }) {
  const sortedItems = [...items].sort((left, right) => right.total - left.total);
  const maxValue = Math.max(...sortedItems.map((item) => item.total), 1);

  return (
    <div className="funnel-series">
      {sortedItems.map((item) => {
        const tone = getSeriesTone(item.type);
        const width = Math.max((item.total / maxValue) * 100, 18);

        return (
          <div className="funnel-series-row" key={item.type}>
            <div className="funnel-series-label">
              <strong>{item.type}</strong>
              <span className="muted">{item.percentage}% do recorte</span>
            </div>
            <div className="funnel-series-bar-wrap">
              <div
                className="funnel-series-bar"
                style={{
                  width: `${width}%`,
                  background: tone.gradient,
                  boxShadow: `0 12px 24px ${tone.soft}`
                }}
              >
                <span>{item.total}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ResponseDistributionChartCard({ question }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="mini-card response-chart-card">
        <div className="row response-chart-header">
          <strong>{question.dimensionTitle}</strong>
          <div className="response-chart-actions">
            <span className="response-chart-total">{question.totalAnswers} resp.</span>
            <button
              type="button"
              className="button-reset response-expand-button"
              onClick={() => setIsOpen(true)}
              aria-label={`Expandir grafico de ${question.dimensionTitle}`}
              title="Expandir grafico"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5M9 4 4 9M15 4l5 5M20 15l-5 5M4 15l5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <p className="muted response-chart-prompt">{question.questionPrompt}</p>
        <div className="response-column-grid">
          {question.options.map((option) => {
            const tone = getSeriesTone(`${question.questionId}-${option.value}`);
            return (
              <div className="response-column-item" key={`${question.questionId}-${option.value}`}>
                <div className="response-column-track">
                  <div
                    className="response-column-fill"
                    style={{
                      height: `${Math.max(option.percentage, 6)}%`,
                      background: tone.gradient,
                      boxShadow: `0 10px 18px ${tone.soft}`
                    }}
                  />
                </div>
                <strong className="response-column-value">{option.percentage}%</strong>
                <span className="response-column-label">{option.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {isOpen ? (
        <div className="modal-overlay" role="presentation" onClick={() => setIsOpen(false)}>
          <div
            className="modal-card response-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={`Grafico ampliado de ${question.dimensionTitle}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-header">
              <div>
                <h3>{question.dimensionTitle}</h3>
                <span>{question.totalAnswers} respostas consideradas</span>
              </div>
              <button
                type="button"
                className="button-reset response-close-button"
                onClick={() => setIsOpen(false)}
              >
                Fechar
              </button>
            </div>
            <p className="muted response-modal-prompt">{question.questionPrompt}</p>
            <div className="response-column-grid response-column-grid-large">
              {question.options.map((option) => {
                const tone = getSeriesTone(`${question.questionId}-${option.value}`);
                return (
                  <div
                    className="response-column-item response-column-item-large"
                    key={`modal-${question.questionId}-${option.value}`}
                  >
                    <div className="response-column-track response-column-track-large">
                      <div
                        className="response-column-fill"
                        style={{
                          height: `${Math.max(option.percentage, 6)}%`,
                          background: tone.gradient,
                          boxShadow: `0 10px 18px ${tone.soft}`
                        }}
                      />
                    </div>
                    <strong className="response-column-value response-column-value-large">
                      {option.percentage}%
                    </strong>
                    <span className="response-column-label response-column-label-large">
                      {option.label}
                    </span>
                    <span className="muted response-column-count">{option.total} respostas</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function TrendAreaChartCard({
  items = [],
  valueKey = "total",
  labelKey = "label",
  formatter = (value) => String(value ?? 0),
  detailFormatter = null
}) {
  const safeItems = (items || []).filter(Boolean);
  if (!safeItems.length) {
    return (
      <div className="list-card">
        <strong>Sem dados suficientes para o grafico</strong>
      </div>
    );
  }

  const values = safeItems.map((item) => Number(item?.[valueKey] || 0));
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);
  const width = 320;
  const height = 160;
  const points = safeItems.map((item, index) => {
    const x =
      safeItems.length === 1 ? width / 2 : (index / (safeItems.length - 1)) * (width - 16) + 8;
    const y = height - ((Number(item?.[valueKey] || 0) - minValue) / range) * (height - 28) - 12;
    return { x, y, raw: Number(item?.[valueKey] || 0), label: item?.[labelKey] || `P${index + 1}` };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const latest = points[points.length - 1];
  const previous = points.length > 1 ? points[points.length - 2] : null;
  const delta = previous ? Number((latest.raw - previous.raw).toFixed(1)) : null;
  const tone = getSeriesTone(`${valueKey}-${labelKey}`);

  return (
    <div className="mini-card trend-card">
      <div className="row">
        <div>
          <p className="mini-label">{latest.label}</p>
          <strong>{formatter(latest.raw)}</strong>
        </div>
        {delta !== null ? (
          <span className={delta >= 0 ? "badge trend-badge positive" : "badge trend-badge warning"}>
            {delta > 0 ? "+" : ""}
            {formatter(delta)}
          </span>
        ) : null}
      </div>
      <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`trend-fill-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tone.solid} stopOpacity="0.34" />
            <stop offset="100%" stopColor={tone.solid} stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#trend-fill-${valueKey})`} />
        <path d={linePath} fill="none" stroke={tone.solid} strokeWidth="3" strokeLinecap="round" />
        {points.map((point) => (
          <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="3.5" fill={tone.solid} />
        ))}
      </svg>
      <div className="trend-footer">
        {safeItems.map((item) => (
          <div className="trend-footer-item" key={`${item?.[labelKey]}-${item?.[valueKey]}`}>
            <span>{item?.[labelKey]}</span>
            <strong>
              {detailFormatter
                ? detailFormatter(item)
                : formatter(Number(item?.[valueKey] || 0))}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatmapMatrixCard({
  items = [],
  getLabel = (item) => item?.label || "-",
  getValue = (item) => Number(item?.value || 0),
  getDetail = () => "",
  toneSeed = "heatmap"
}) {
  const safeItems = (items || []).filter(Boolean);
  if (!safeItems.length) {
    return (
      <div className="list-card">
        <strong>Sem dados suficientes para o mapa</strong>
      </div>
    );
  }

  const maxValue = Math.max(...safeItems.map((item) => getValue(item)), 1);

  return (
    <div className="heatmap-grid">
      {safeItems.map((item) => {
        const value = getValue(item);
        const tone = getSeriesTone(`${toneSeed}-${getLabel(item)}`);
        const intensity = Math.max(value / maxValue, 0.12);
        return (
          <article
            className="heatmap-tile"
            key={`${getLabel(item)}-${value}`}
            style={{
              background: `linear-gradient(145deg, ${tone.soft}, rgba(255,255,255,0.02))`,
              borderColor: `rgba(255,255,255,${0.06 + intensity * 0.12})`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.02), 0 10px 18px ${tone.soft}`
            }}
          >
            <p className="mini-label">{getLabel(item)}</p>
            <strong>{value}</strong>
            <p className="muted">{getDetail(item)}</p>
          </article>
        );
      })}
    </div>
  );
}
