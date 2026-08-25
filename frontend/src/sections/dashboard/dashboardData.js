export function buildDimensionSummary(questions) {
  return Object.values(
    (questions || []).reduce((acc, question) => {
      const averageScore =
        question.averageScore === null || question.averageScore === undefined
          ? null
          : Number(question.averageScore);
      const entry = acc[question.dimensionTitle] || {
        dimensionTitle: question.dimensionTitle || "Sem dimensão",
        scores: [],
        answeredCount: 0,
        questionCount: 0
      };
      if (averageScore !== null && Number.isFinite(averageScore)) {
        entry.scores.push({
          averageScore,
          answeredCount: Number(question.answeredCount || question.totalAnswers || 0) || 1
        });
      }
      entry.answeredCount += Number(question.answeredCount || question.totalAnswers || 0);
      entry.questionCount += 1;
      acc[question.dimensionTitle] = entry;
      return acc;
    }, {})
  )
    .map((entry) => {
      const averageScore = entry.scores.length
        ? Number(
            (
              entry.scores.reduce(
                (sum, item) => sum + Number(item.averageScore || 0) * Number(item.answeredCount || 0),
                0
              ) /
              Math.max(
                entry.scores.reduce((sum, item) => sum + Number(item.answeredCount || 0), 0),
                1
              )
            ).toFixed(2)
          )
        : null;
      return {
        dimensionTitle: entry.dimensionTitle,
        questionCount: entry.questionCount,
        answeredCount: entry.answeredCount,
        averageScore,
        averageScoreLabel: averageScore === null ? "-" : averageScore.toFixed(1),
        tone:
          averageScore === null
            ? "neutral"
            : averageScore >= 4.3
              ? "positive"
              : averageScore >= 3.7
                ? "warning"
                : "critical"
      };
    })
    .sort((left, right) => {
      const leftScore = left.averageScore === null ? -1 : left.averageScore;
      const rightScore = right.averageScore === null ? -1 : right.averageScore;
      return rightScore - leftScore || left.dimensionTitle.localeCompare(right.dimensionTitle, "pt-BR");
    });
}

function getQuestionMetricValue(question, metric) {
  if (metric === "critical") {
    return Number(question.criticalPercentage || 0);
  }
  if (metric === "responseRate") {
    return Number(question.responseRate || 0);
  }
  if (metric === "unanswered") {
    return Number(question.unansweredCount || 0);
  }
  return question.averageScore === null || question.averageScore === undefined
    ? -1
    : Number(question.averageScore);
}

export function buildQuestionRanking(questions = [], { metric = "critical", limit = 5 } = {}) {
  const direction = metric === "averageScore" ? -1 : 1;
  return [...questions]
    .filter((question) => !question.protected && Number(question.answeredCount || question.totalAnswers || 0) > 0)
    .sort((left, right) => {
      const leftValue = getQuestionMetricValue(left, metric);
      const rightValue = getQuestionMetricValue(right, metric);
      return (
        (rightValue - leftValue) * direction ||
        String(left.dimensionTitle || "").localeCompare(String(right.dimensionTitle || ""), "pt-BR") ||
        String(left.questionPrompt || "").localeCompare(String(right.questionPrompt || ""), "pt-BR")
      );
    })
    .slice(0, Number(limit) || 5);
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  const safeValue = /^[=+\-@\t\r]/.test(stringValue) ? `'${stringValue}` : stringValue;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

export function buildEvaluationQuestionsCsv({ relationshipLabel = "", questions = [] } = {}) {
  const rows = [
    [
      "Modalidade",
      "Dimensao",
      "Pergunta",
      "Tipo",
      "Respondidas",
      "Nao respondidas",
      "Taxa de resposta",
      "Media",
      "Favoraveis",
      "Neutras",
      "Criticas",
      "Opcao principal",
      "Protegida"
    ],
    ...questions.map((question) => [
      relationshipLabel,
      question.dimensionTitle || "",
      question.questionPrompt || "",
      question.answerType || "",
      question.answeredCount || question.totalAnswers || 0,
      question.unansweredCount || 0,
      `${question.responseRate || 0}%`,
      question.averageScoreLabel || "",
      `${question.favorablePercentage || 0}%`,
      `${question.neutralPercentage || 0}%`,
      `${question.criticalPercentage || 0}%`,
      question.leadingOption?.label || "",
      question.protected ? "Sim" : "Nao"
    ])
  ];

  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}

export function buildExecutiveHighlights({
  dashboard,
  dashboardAreaFilter,
  dashboardTimeGroupingLabel,
  selectedDashboardCompositionMeta
}) {
  const areaLabel = dashboardAreaFilter === "all" ? "Todas as areas e setores" : dashboardAreaFilter;
  const compositionLabel = selectedDashboardCompositionMeta?.label || "Todos os elementos do ciclo";
  const latestPeriod = dashboard?.cycleTimeline?.[0];
  const previousPeriod = dashboard?.cycleTimeline?.[1];
  const pendingAssignments = dashboard?.assignmentStatus?.find((item) => item.status === "pending");
  const lowestArea = [...(dashboard?.satisfactionByArea || [])].sort(
    (left, right) => Number(left.score) - Number(right.score)
  )[0];

  const highlights = [
    {
      title: "Recorte em foco",
      value: compositionLabel,
      detail: `${areaLabel} · Consolidado por ${dashboardTimeGroupingLabel.toLowerCase()}`
    }
  ];

  if (latestPeriod && previousPeriod) {
    const delta = Number(
      (latestPeriod.adherencePercentage - previousPeriod.adherencePercentage).toFixed(1)
    );

    highlights.push({
      title: "Evolucao temporal",
      value: `${delta > 0 ? "+" : ""}${delta} p.p.`,
      detail: `${latestPeriod.label} vs ${previousPeriod.label} em adesao ao ciclo`
    });
  } else if (latestPeriod) {
    highlights.push({
      title: "Periodo mais recente",
      value: `${latestPeriod.adherencePercentage}%`,
      detail: `${latestPeriod.label} · ${latestPeriod.totalAssignments} assignments distribuidos`
    });
  }

  if (pendingAssignments) {
    highlights.push({
      title: "Ponto de atencao",
      value: `${pendingAssignments.percentage}%`,
      detail: `${pendingAssignments.total} assignments pendentes no recorte atual`
    });
  }

  if (lowestArea) {
    highlights.push({
      title: "Area com menor satisfacao",
      value: lowestArea.area,
      detail: `${lowestArea.score} de media com ${lowestArea.peopleCount} pessoas no recorte`
    });
  }

  return highlights;
}

export function buildExecutiveComparisons({ dashboard, dashboardTimeGroupingLabel }) {
  const latestPeriod = dashboard?.cycleTimeline?.[0];
  const previousPeriod = dashboard?.cycleTimeline?.[1];
  const satisfactionByArea = dashboard?.satisfactionByArea || [];
  const pendingAssignments = dashboard?.assignmentStatus?.find((item) => item.status === "pending");
  const submittedAssignments = dashboard?.assignmentStatus?.find((item) => item.status === "submitted");

  const comparisons = [];

  if (latestPeriod && previousPeriod) {
    const adherenceDelta = Number(
      (latestPeriod.adherencePercentage - previousPeriod.adherencePercentage).toFixed(1)
    );
    const volumeDelta = latestPeriod.totalAssignments - previousPeriod.totalAssignments;

    comparisons.push({
      title: "Adesao vs periodo anterior",
      value: `${adherenceDelta > 0 ? "+" : ""}${adherenceDelta} p.p.`,
      detail: `${latestPeriod.label} comparado a ${previousPeriod.label} em conclusao de assignments`,
      tone: adherenceDelta > 0 ? "positive" : adherenceDelta < 0 ? "warning" : "neutral"
    });

    comparisons.push({
      title: `Carga por ${dashboardTimeGroupingLabel.toLowerCase()}`,
      value: `${volumeDelta > 0 ? "+" : ""}${volumeDelta}`,
      detail: `${latestPeriod.totalAssignments} distribuidos em ${latestPeriod.label}`,
      tone: volumeDelta > 0 ? "neutral" : volumeDelta < 0 ? "positive" : "neutral"
    });
  }

  if (satisfactionByArea.length) {
    const orderedAreas = [...satisfactionByArea].sort(
      (left, right) => Number(left.score) - Number(right.score)
    );
    const criticalArea = orderedAreas[0];
    const strongestArea = orderedAreas[orderedAreas.length - 1];

    comparisons.push({
      title: "Area critica",
      value: criticalArea.area,
      detail: `${criticalArea.score} de media no menor recorte de satisfacao`,
      tone: "warning"
    });

    if (strongestArea && strongestArea.area !== criticalArea.area) {
      comparisons.push({
        title: "Melhor leitura do recorte",
        value: strongestArea.area,
        detail: `${strongestArea.score} de media no melhor desempenho agregado`,
        tone: "positive"
      });
    }
  }

  if (pendingAssignments && submittedAssignments) {
    comparisons.push({
      title: "Ritmo operacional",
      value: `${submittedAssignments.total}/${pendingAssignments.total + submittedAssignments.total}`,
      detail: `${pendingAssignments.total} pendentes ainda exigem acompanhamento`,
      tone: pendingAssignments.total > submittedAssignments.total ? "warning" : "neutral"
    });
  }

  return comparisons.slice(0, 4);
}

export function buildDashboardPriorityActions({
  dashboard,
  summary,
  dashboardAreaFilter,
  dashboardTimeGroupingLabel,
  laggingEvaluationSummary,
  pendingAssignmentsItem,
  satisfactionByAreaItems,
  developmentByTypeItems,
  getRelationshipLabel
}) {
  const priorities = [];
  const areaLabel = dashboardAreaFilter === "all" ? "todas as areas" : dashboardAreaFilter;
  const pendingAssignments =
    dashboard?.scopeSummary?.pendingAssignments ??
    summary?.pendingAssignments ??
    pendingAssignmentsItem?.total ??
    0;
  const openIncidents = summary?.openIncidents ?? 0;
  const peopleCount = dashboard?.scopeSummary?.peopleCount ?? summary?.peopleCount ?? 0;
  const developmentRecords = dashboard?.scopeSummary?.developmentRecords ?? 0;
  const lowestArea = [...(satisfactionByAreaItems || [])].sort(
    (left, right) => Number(left.score || 0) - Number(right.score || 0)
  )[0];
  const topDevelopment = [...(developmentByTypeItems || [])].sort(
    (left, right) => Number(right.total || 0) - Number(left.total || 0)
  )[0];

  if (pendingAssignments > 0) {
    priorities.push({
      label: "Ciclo",
      title: `${pendingAssignments} assignments pendentes`,
      detail: `Pendencias ainda abertas no recorte de ${areaLabel}.`,
      action: "Acione a operacao de avaliacoes antes de ampliar analises.",
      tone: "warning"
    });
  }

  if (openIncidents > 0) {
    priorities.push({
      label: "Compliance",
      title: `${openIncidents} incidentes em aberto`,
      detail: "Risco operacional que pode demandar acompanhamento fora do ciclo.",
      action: "Revise a fila de tratamento e responsaveis.",
      tone: "critical"
    });
  }

  if (laggingEvaluationSummary) {
    priorities.push({
      label: "Avaliacao",
      title: `Gargalo em ${getRelationshipLabel(laggingEvaluationSummary.relationshipType)}`,
      detail: `${laggingEvaluationSummary.adherencePercentage}% de adesao em ${dashboardTimeGroupingLabel.toLowerCase()}.`,
      action: "Priorize comunicacao e acompanhamento neste submodulo.",
      tone: "warning"
    });
  }

  if (lowestArea) {
    priorities.push({
      label: "Satisfacao",
      title: `${lowestArea.area} pede leitura de contexto`,
      detail: `${lowestArea.score} de media agregada com ${lowestArea.peopleCount} pessoa(s).`,
      action: "Use a analitica para separar sinal consistente de amostra pequena.",
      tone: Number(lowestArea.score || 0) < 4 ? "critical" : "neutral"
    });
  }

  if (peopleCount && developmentRecords < peopleCount) {
    priorities.push({
      label: "Desenvolvimento",
      title: "Cobertura de desenvolvimento incompleta",
      detail: `${developmentRecords}/${peopleCount} pessoas com historico registrado no recorte.`,
      action: topDevelopment
        ? `Trilha mais frequente: ${topDevelopment.type}.`
        : "Estimule registros de PDI e marcos recentes.",
      tone: "neutral"
    });
  }

  if (!priorities.length) {
    priorities.push({
      label: "Operacao",
      title: "Sem urgencia dominante",
      detail: "O recorte atual nao apresenta gargalo claro nos indicadores principais.",
      action: "Use a leitura analitica apenas para refinamento e acompanhamento.",
      tone: "positive"
    });
  }

  return priorities.slice(0, 4);
}

export function buildDashboardStoryCards({
  dashboard,
  summary,
  dashboardAreaFilter,
  dashboardTimeGroupingLabel
}) {
  const pendingAssignments =
    dashboard?.scopeSummary?.pendingAssignments ?? summary?.pendingAssignments ?? 0;
  const activeCycles = summary?.activeEvaluationCycles ?? 0;
  const openIncidents = summary?.openIncidents ?? 0;
  const peopleCount = dashboard?.scopeSummary?.peopleCount ?? summary?.peopleCount ?? 0;
  const topDevelopment = [...(dashboard?.developmentByType || [])].sort(
    (left, right) => Number(right.total || 0) - Number(left.total || 0)
  )[0];
  const topStatus = [...(dashboard?.assignmentStatus || [])].sort(
    (left, right) => Number(right.total || 0) - Number(left.total || 0)
  )[0];
  const bestArea = [...(dashboard?.satisfactionByArea || [])].sort(
    (left, right) => Number(right.score || 0) - Number(left.score || 0)
  )[0];

  return [
    {
      title: "Governanca",
      value: `${activeCycles} ciclos ativos`,
      detail: `Leitura consolidada por ${dashboardTimeGroupingLabel.toLowerCase()} para ${dashboardAreaFilter === "all" ? "toda a operacao" : dashboardAreaFilter}.`,
      highlightLabel: "Pessoas no recorte",
      highlightValue: peopleCount,
      tone: "neutral",
      icon: "GV"
    },
    {
      title: "Avaliacoes",
      value: `${pendingAssignments} pendentes`,
      detail: topStatus
        ? `${topStatus.total} assignments em ${topStatus.status}.`
        : "Sem distribuicao de assignments no recorte atual.",
      highlightLabel: "Status dominante",
      highlightValue: topStatus ? topStatus.status : "-",
      tone: "positive",
      icon: "AV"
    },
    {
      title: "Desenvolvimento",
      value: topDevelopment ? `${topDevelopment.total} registros` : "Sem registros",
      detail: topDevelopment
        ? `Trilha mais frequente: ${topDevelopment.type}.`
        : "Nao ha movimentacao de desenvolvimento no recorte.",
      highlightLabel: "Trilha principal",
      highlightValue: topDevelopment ? topDevelopment.type : "-",
      tone: "neutral",
      icon: "DV"
    },
    {
      title: "Risco",
      value: `${openIncidents} incidentes`,
      detail: bestArea
        ? `Melhor satisfacao atual em ${bestArea.area}.`
        : "Sem leitura de satisfacao por area neste recorte.",
      highlightLabel: "Melhor area",
      highlightValue: bestArea ? `${bestArea.area} · ${bestArea.score}` : "-",
      tone: openIncidents > 0 ? "warning" : "positive",
      icon: "RK"
    }
  ];
}

export function getFilteredSatisfactionItems(items, mode) {
  const safeItems = [...(items || [])];
  if (mode === "top") {
    return safeItems
      .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
      .slice(0, 4);
  }
  if (mode === "critical") {
    return safeItems
      .sort((left, right) => Number(left.score || 0) - Number(right.score || 0))
      .slice(0, 4);
  }
  return safeItems;
}

export function getSatisfactionQuestionAreaOptions(items) {
  const areas = new Set();
  (items || []).forEach((question) => {
    (question.areas || []).forEach((area) => {
      if (area.area) {
        areas.add(area.area);
      }
    });
  });

  return ["all", ...[...areas].sort((left, right) => left.localeCompare(right, "pt-BR"))];
}

export function getSatisfactionQuestionAreaView(question, areaFilter) {
  if (areaFilter === "all") {
    return {
      ...question,
      latestScoreLabel: question.latestScoreLabel || question.averageScoreLabel || "-",
      periods: question.periods || [],
      trendDelta: question.trendDelta ?? null
    };
  }

  const area = (question.areas || []).find((item) => item.area === areaFilter);
  if (!area) {
    return {
      ...question,
      totalAnswers: 0,
      averageScore: 0,
      averageScoreLabel: "-",
      latestScoreLabel: "-",
      periods: [],
      trendDelta: null
    };
  }

  const latestPeriod = area.periods?.[area.periods.length - 1] || null;
  const previousPeriod = area.periods?.[area.periods.length - 2] || null;

  return {
    ...question,
    totalAnswers: area.totalAnswers,
    averageScore: area.averageScore,
    averageScoreLabel: area.averageScoreLabel,
    latestScoreLabel: latestPeriod?.averageScoreLabel || area.averageScoreLabel,
    periods: area.periods || [],
    trendDelta:
      latestPeriod && previousPeriod
        ? Number((latestPeriod.averageScore - previousPeriod.averageScore).toFixed(1))
        : null
  };
}

export function formatSatisfactionScore(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(1) : "-";
}

export function getFilteredDevelopmentItems(items, mode) {
  const safeItems = [...(items || [])];
  if (mode === "top") {
    return safeItems
      .sort((left, right) => Number(right.total || 0) - Number(left.total || 0))
      .slice(0, 4);
  }
  if (mode === "alpha") {
    return safeItems.sort((left, right) =>
      String(left.type || "").localeCompare(String(right.type || ""))
    );
  }
  return safeItems;
}
