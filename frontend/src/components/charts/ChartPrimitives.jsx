import { useMemo } from "react";
import { Doughnut, Line } from "react-chartjs-2";

import { ChartContainer } from "./ChartContainer.jsx";
import { formatChartNumber, formatTooltipLabel } from "./chartFormatters.js";
import { registerDashboardCharts } from "./chartRegistry.js";
import { getCanvasSeriesTone, useChartThemeTokens, withCanvasAlpha } from "./chartTheme.js";

registerDashboardCharts();

function buildBaseOptions(tokens, overrides = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 520,
      easing: "easeOutQuart"
    },
    interaction: {
      mode: "index",
      intersect: false
    },
    layout: {
      padding: 8
    },
    color: tokens.text,
    font: {
      family: tokens.fontFamily
    },
    plugins: {
      legend: {
        display: false,
        labels: {
          color: tokens.muted,
          font: {
            family: tokens.fontFamily,
            size: 12
          },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: tokens.surface,
        borderColor: tokens.line,
        borderWidth: 1,
        bodyColor: tokens.text,
        titleColor: tokens.text,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => formatTooltipLabel(context)
        }
      }
    },
    ...overrides
  };
}

function buildScaleOptions(tokens, formatter) {
  return {
    x: {
      grid: {
        color: withCanvasAlpha(tokens.line, 0.72),
        drawBorder: false
      },
      ticks: {
        color: tokens.muted,
        font: {
          family: tokens.fontFamily,
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: withCanvasAlpha(tokens.line, 0.72),
        drawBorder: false
      },
      ticks: {
        color: tokens.muted,
        callback: formatter,
        font: {
          family: tokens.fontFamily,
          size: 11
        }
      }
    }
  };
}

function mergeScaleOptions(baseScales, overrideScales = {}) {
  return {
    ...baseScales,
    ...overrideScales,
    x: {
      ...(baseScales.x || {}),
      ...(overrideScales.x || {})
    },
    y: {
      ...(baseScales.y || {}),
      ...(overrideScales.y || {})
    }
  };
}

export function LineAreaChart({
  className = "",
  datasetLabel = "Serie",
  emptyMessage,
  errorMessage,
  isLoading,
  items = [],
  labels = [],
  options,
  seed = datasetLabel,
  title,
  valueFormatter = formatChartNumber,
  values = []
}) {
  const tokens = useChartThemeTokens();
  const safeLabels = labels.length ? labels : items.map((item) => item?.label || "");
  const safeValues = values.length ? values : items.map((item) => Number(item?.value || 0));
  const tone = getCanvasSeriesTone(seed);
  const isEmpty = !safeValues.length;
  const data = useMemo(
    () => ({
      labels: safeLabels,
      datasets: [
        {
          label: datasetLabel,
          data: safeValues,
          fill: true,
          borderColor: tone.border,
          backgroundColor: tone.fill,
          pointBackgroundColor: tone.point,
          pointBorderColor: tone.point,
          pointHoverBackgroundColor: tone.point,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.34,
          borderWidth: 2.5
        }
      ]
    }),
    [datasetLabel, safeLabels, safeValues, tone.border, tone.fill, tone.point]
  );
  const resolvedOptions = useMemo(
    () => {
      const { plugins: optionPlugins, scales: optionScales, ...optionRest } = options || {};
      const baseOptions = buildBaseOptions(tokens);
      const baseScales = buildScaleOptions(tokens, valueFormatter);
      return buildBaseOptions(tokens, {
        ...optionRest,
        scales: mergeScaleOptions(baseScales, optionScales),
        plugins: {
          ...baseOptions.plugins,
          ...optionPlugins,
          tooltip: {
            ...baseOptions.plugins.tooltip,
            ...(optionPlugins?.tooltip || {}),
            callbacks: {
              ...(optionPlugins?.tooltip?.callbacks || {}),
              label: (context) => formatTooltipLabel(context, valueFormatter)
            }
          }
        }
      });
    },
    [options, tokens, valueFormatter]
  );

  return (
    <ChartContainer
      className={className}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
      isEmpty={isEmpty}
      isLoading={isLoading}
      title={title}
    >
      <Line data={data} options={resolvedOptions} />
    </ChartContainer>
  );
}

export function DoughnutChart({
  className = "",
  emptyMessage,
  errorMessage,
  isLoading,
  items = [],
  labels = [],
  options,
  segmentColors = [],
  seed = "doughnut",
  title,
  valueFormatter = formatChartNumber,
  values = []
}) {
  const tokens = useChartThemeTokens();
  const safeLabels = labels.length ? labels : items.map((item) => item?.label || "");
  const safeValues = values.length ? values : items.map((item) => Number(item?.value || 0));
  const colors = segmentColors.length
    ? segmentColors
    : safeLabels.map((label) => getCanvasSeriesTone(`${seed}-${label}`).solid);
  const isEmpty = !safeValues.length;
  const data = useMemo(
    () => ({
      labels: safeLabels,
      datasets: [
        {
          data: safeValues,
          backgroundColor: colors,
          borderColor: tokens.surface,
          borderWidth: 2,
          hoverOffset: 4
        }
      ]
    }),
    [colors, safeLabels, safeValues, tokens.surface]
  );
  const baseOptions = buildBaseOptions(tokens);
  const resolvedOptions = useMemo(
    () => {
      const { plugins: optionPlugins, ...optionRest } = options || {};
      return buildBaseOptions(tokens, {
        cutout: "68%",
        interaction: {
          mode: "nearest",
          intersect: true
        },
        ...optionRest,
        plugins: {
          ...baseOptions.plugins,
          ...optionPlugins,
          tooltip: {
            ...baseOptions.plugins.tooltip,
            ...(optionPlugins?.tooltip || {}),
            callbacks: {
              ...(optionPlugins?.tooltip?.callbacks || {}),
              label: (context) => {
                const label = context.label ? `${context.label}: ` : "";
                return `${label}${valueFormatter(context.parsed || 0)}`;
              }
            }
          }
        }
      });
    },
    [baseOptions.plugins, options, tokens, valueFormatter]
  );

  return (
    <ChartContainer
      className={className}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
      isEmpty={isEmpty}
      isLoading={isLoading}
      title={title}
    >
      <Doughnut data={data} options={resolvedOptions} />
    </ChartContainer>
  );
}
