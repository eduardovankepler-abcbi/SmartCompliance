import { useEffect, useMemo, useState } from "react";
import { evaluationModules, isEvaluationModuleVisible } from "./appConfig.js";
import { getEvaluationModule } from "./appLabels.js";

export function useDashboardFilters() {
  const [dashboardAreaFilter, setDashboardAreaFilter] = useState("all");
  const [dashboardCompositionFilter, setDashboardCompositionFilter] = useState("all");
  const [dashboardTimeGrouping, setDashboardTimeGrouping] = useState("semester");
  const [dashboardViewMode, setDashboardViewMode] = useState("executive");
  const [dashboardAnalyticalTheme, setDashboardAnalyticalTheme] = useState("evaluations");
  const [satisfactionView, setSatisfactionView] = useState("all");
  const [satisfactionQuestionAreaFilter, setSatisfactionQuestionAreaFilter] = useState("all");
  const [developmentView, setDevelopmentView] = useState("all");
  const [dimensionFilters, setDimensionFilters] = useState({});

  function resetDashboardFlow() {
    setDashboardAreaFilter("all");
    setDashboardCompositionFilter("all");
    setDashboardTimeGrouping("semester");
    setDashboardViewMode("executive");
    setDashboardAnalyticalTheme("evaluations");
    setSatisfactionView("all");
    setSatisfactionQuestionAreaFilter("all");
    setDevelopmentView("all");
    setDimensionFilters({});
  }

  return {
    dashboardAnalyticalTheme,
    dashboardAreaFilter,
    dashboardCompositionFilter,
    dashboardTimeGrouping,
    dashboardViewMode,
    developmentView,
    dimensionFilters,
    resetDashboardFlow,
    satisfactionQuestionAreaFilter,
    satisfactionView,
    setDashboardAnalyticalTheme,
    setDashboardAreaFilter,
    setDashboardCompositionFilter,
    setDashboardTimeGrouping,
    setDashboardViewMode,
    setDevelopmentView,
    setDimensionFilters,
    setSatisfactionQuestionAreaFilter,
    setSatisfactionView
  };
}

export function useDashboardInsights({
  canFilterDashboardByArea,
  dashboard,
  dashboardAreaFilter,
  dashboardCompositionFilter,
  dashboardTimeGrouping,
  setDashboardAreaFilter
}) {

  const dashboardCompositionOptions = useMemo(
    () => [
      { value: "all", label: "Todos os elementos do ciclo" },
      ...evaluationModules
        .filter((module) => module.relationshipType && isEvaluationModuleVisible(module))
        .map((module) => ({
          value: module.relationshipType,
          label: module.label
        }))
    ],
    []
  );

  const dashboardTimeGroupingOptions = useMemo(
    () => [
      { value: "cycle", label: "Ciclo" },
      { value: "semester", label: "Semestre" },
      { value: "quarter", label: "Trimestre" },
      { value: "year", label: "Ano" }
    ],
    []
  );

  const filteredDashboardEvaluationMix = useMemo(() => {
    if (!dashboard?.evaluationMix) {
      return [];
    }

    if (dashboardCompositionFilter === "all") {
      return dashboard.evaluationMix;
    }

    return dashboard.evaluationMix.filter((item) => item.type === dashboardCompositionFilter);
  }, [dashboard, dashboardCompositionFilter]);

  const filteredDashboardEvaluationResultsSummary = useMemo(() => {
    if (!dashboard?.evaluationResultsSummary) {
      return [];
    }

    if (dashboardCompositionFilter === "all") {
      return dashboard.evaluationResultsSummary;
    }

    return dashboard.evaluationResultsSummary.filter(
      (item) => item.relationshipType === dashboardCompositionFilter
    );
  }, [dashboard, dashboardCompositionFilter]);

  const filteredDashboardResponseDistributions = useMemo(() => {
    if (!dashboard?.responseDistributions) {
      return [];
    }

    if (dashboardCompositionFilter === "all") {
      return dashboard.responseDistributions;
    }

    return dashboard.responseDistributions.filter(
      (group) => group.relationshipType === dashboardCompositionFilter
    );
  }, [dashboard, dashboardCompositionFilter]);

  const selectedDashboardCompositionMeta = useMemo(
    () =>
      dashboardCompositionFilter === "all"
        ? null
        : getEvaluationModule(dashboardCompositionFilter),
    [dashboardCompositionFilter]
  );

  const dashboardTimeGroupingLabel = useMemo(
    () =>
      dashboardTimeGroupingOptions.find((item) => item.value === dashboardTimeGrouping)?.label ||
      dashboardTimeGrouping,
    [dashboardTimeGrouping, dashboardTimeGroupingOptions]
  );

  useEffect(() => {
    if (!canFilterDashboardByArea && dashboardAreaFilter !== "all") {
      setDashboardAreaFilter("all");
      return;
    }

    if (
      canFilterDashboardByArea &&
      dashboardAreaFilter !== "all" &&
      dashboard?.areaOptions?.length &&
      !dashboard.areaOptions.includes(dashboardAreaFilter)
    ) {
      setDashboardAreaFilter("all");
    }
  }, [canFilterDashboardByArea, dashboard, dashboardAreaFilter, setDashboardAreaFilter]);

  return {
    dashboardCompositionOptions,
    dashboardTimeGroupingLabel,
    dashboardTimeGroupingOptions,
    filteredDashboardEvaluationMix,
    filteredDashboardEvaluationResultsSummary,
    filteredDashboardResponseDistributions,
    selectedDashboardCompositionMeta
  };
}
