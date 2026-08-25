import { useState } from "react";
import { DoughnutChart, LineAreaChart, formatChartNumber, formatChartPercent } from "./charts/index.js";
import { getSeriesTone } from "./charts/chartTheme.js";

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
  const completedValue = Number(item.value || 0);
  const totalValue = Number(item.total || 0);
  const remainingValue = Math.max(totalValue - completedValue, 0);
  const chartValues = totalValue > 0 ? [completedValue, remainingValue] : [0, 1];

  return (
    <div className="mini-card donut-card">
      <div className="donut-visual">
        <DoughnutChart
          className="donut-chart-canvas"
          labels={[item.label, "Restante"]}
          options={{
            cutout: "66%",
            layout: {
              padding: 0
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label ? `${context.label}: ` : "";
                    const value = totalValue > 0 ? context.parsed : 0;
                    return `${label}${formatChartNumber(value)}`;
                  }
                }
              }
            }
          }}
          segmentColors={[tone.solid, "rgba(127, 138, 155, 0.18)"]}
          seed={item.key}
          values={chartValues}
        />
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

  if (!sortedItems.length) {
    return (
      <div className="list-card">
        <strong>Sem dados suficientes para o funil</strong>
      </div>
    );
  }

  if (sortedItems.length === 1) {
    const item = sortedItems[0];
    const tone = getSeriesTone(item.type);
    return (
      <div className="mini-card funnel-card funnel-card-single">
        <div className="funnel-card-single-head">
          <div>
            <p className="mini-label">{item.type}</p>
            <strong>{item.total}</strong>
          </div>
          <span className="badge">{item.percentage}% do recorte</span>
        </div>
        <div className="funnel-track funnel-track-single">
          <div
            className="funnel-fill"
            style={{
              width: `${Math.max(item.percentage, 18)}%`,
              background: tone.gradient,
              boxShadow: `0 12px 24px ${tone.soft}`
            }}
          />
        </div>
      </div>
    );
  }

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
  const safeOptions = (question?.options || []).filter(Boolean);
  const hasScore = question?.averageScore !== null && question?.averageScore !== undefined;
  const chartValues = safeOptions.map((option) => Math.max(Number(option.percentage || 0), 0));
  const chartTotal = chartValues.reduce((total, value) => total + value, 0);
  const chartLabels = chartTotal > 0 ? safeOptions.map((option) => option.label) : ["Sem respostas"];
  const chartSegmentColors =
    chartTotal > 0
      ? safeOptions.map((option) => getSeriesTone(`${question.questionId}-${option.value}`).solid)
      : ["rgba(127, 138, 155, 0.14)"];
  const visualValues = chartTotal > 0 ? chartValues : [1];
  const responseTooltipOptions = {
    cutout: "62%",
    layout: {
      padding: 0
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const option = chartTotal > 0 ? safeOptions[context.dataIndex] : null;
            const label = context.label ? `${context.label}: ` : "";
            const percentage = option ? Number(option.percentage || 0) : 0;
            const total = option ? Number(option.total || 0) : 0;
            return `${label}${formatChartPercent(percentage)} (${formatChartNumber(total)} resp.)`;
          }
        }
      }
    }
  };

  return (
    <>
      <div className="mini-card response-chart-card">
        <div className="row response-chart-header">
          <div>
            <strong>{question.dimensionTitle}</strong>
            <p className="muted response-chart-microcopy">
              {question.responseRate ?? 0}% preenchida
              {hasScore ? ` · media ${question.averageScoreLabel}/5` : ""}
            </p>
          </div>
          <div className="response-chart-actions">
            <span className="response-chart-total">{question.totalAnswers} resp.</span>
            {safeOptions.length ? (
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
            ) : null}
          </div>
        </div>
        <p className="muted response-chart-prompt">{question.questionPrompt}</p>
        {question.protected ? (
          <div className="dashboard-empty-relationship-state">
            <strong>Detalhe protegido</strong>
            <p className="muted">A pergunta entra nos totais, mas o detalhamento foi ocultado por privacidade.</p>
          </div>
        ) : safeOptions.length ? (
          <div className="response-pie-layout">
            <div className="response-pie-visual">
              <DoughnutChart
                className="response-pie-chart-canvas"
                labels={chartLabels}
                options={responseTooltipOptions}
                segmentColors={chartSegmentColors}
                seed={question.questionKey || question.questionId}
                values={visualValues}
              />
              <div className="response-pie-hole">
                <strong>{question.totalAnswers}</strong>
                <span>resp.</span>
              </div>
            </div>
            <div className="response-pie-legend">
              {safeOptions.map((option) => {
                const tone = getSeriesTone(`${question.questionKey || question.questionId}-${option.value}`);
                return (
                  <div className="response-pie-legend-item" key={`${question.questionKey || question.questionId}-${option.value}`}>
                    <div className="response-pie-legend-meta">
                      <span className="response-pie-legend-dot" style={{ background: tone.solid }} />
                      <span className="response-pie-legend-label">{option.label}</span>
                    </div>
                    <strong>{option.percentage}%</strong>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="dashboard-empty-relationship-state">
            <strong>{question.answerType === "text" ? "Resposta textual contabilizada" : "Sem distribuicao"}</strong>
            <p className="muted">
              {question.answerType === "text"
                ? "O dashboard mostra somente volume de respostas textuais, sem abrir comentarios individuais."
                : "A pergunta foi respondida, mas nao possui opcoes agregaveis para grafico."}
            </p>
          </div>
        )}
      </div>

      {isOpen && safeOptions.length ? (
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
            <div className="response-pie-modal-layout">
              <div className="response-pie-visual response-pie-visual-large">
                <DoughnutChart
                  className="response-pie-chart-canvas response-pie-chart-canvas-large"
                  labels={chartLabels}
                  options={responseTooltipOptions}
                  segmentColors={chartSegmentColors}
                  seed={`modal-${question.questionId}`}
                  values={visualValues}
                />
                <div className="response-pie-hole response-pie-hole-large">
                  <strong>{question.totalAnswers}</strong>
                  <span>respostas</span>
                </div>
              </div>
              <div className="response-pie-legend response-pie-legend-large">
                {safeOptions.map((option) => {
                  const tone = getSeriesTone(`${question.questionId}-${option.value}`);
                  return (
                    <div
                      className="response-pie-legend-item response-pie-legend-item-large"
                      key={`modal-${question.questionId}-${option.value}`}
                    >
                      <div className="response-pie-legend-meta">
                        <span className="response-pie-legend-dot" style={{ background: tone.solid }} />
                        <span className="response-pie-legend-label">{option.label}</span>
                      </div>
                      <div className="response-pie-legend-values">
                        <strong>{option.percentage}%</strong>
                        <span className="muted">{option.total} respostas</span>
                      </div>
                    </div>
                  );
                })}
              </div>
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
  const points = safeItems.map((item, index) => {
    return { raw: Number(item?.[valueKey] || 0), label: item?.[labelKey] || `P${index + 1}` };
  });
  const latest = points[points.length - 1];
  const previous = points.length > 1 ? points[points.length - 2] : null;
  const delta = previous ? Number((latest.raw - previous.raw).toFixed(1)) : null;
  const tone = getSeriesTone(`${valueKey}-${labelKey}`);

  if (safeItems.length === 1) {
    const item = safeItems[0];
    return (
      <div className="mini-card trend-card trend-card-single">
        <div className="trend-card-single-head">
          <div>
            <p className="mini-label">{item?.[labelKey]}</p>
            <strong>{formatter(latest.raw)}</strong>
          </div>
          <span className="trend-single-dot" style={{ background: tone.gradient }} aria-hidden="true" />
        </div>
        <div className="trend-card-single-summary">
          <span>{item?.[labelKey]}</span>
          <strong>
            {detailFormatter ? detailFormatter(item) : formatter(Number(item?.[valueKey] || 0))}
          </strong>
        </div>
      </div>
    );
  }

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
      <LineAreaChart
        className="trend-chart"
        datasetLabel={latest.label}
        labels={points.map((point) => point.label)}
        options={{
          scales: {
            x: {
              display: false
            },
            y: {
              display: false,
              min: minValue,
              max: maxValue
            }
          }
        }}
        seed={`${valueKey}-${labelKey}`}
        valueFormatter={formatter}
        values={points.map((point) => point.raw)}
      />
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
