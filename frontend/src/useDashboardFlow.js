import { useEffect, useMemo, useState } from "react";
import { evaluationModules, isEvaluationModuleVisible } from "./appConfig.js";
import { getEvaluationModule } from "./appLabels.js";

export function useDashboardFilters() {
  const [dashboardAreaFilter, setDashboardAreaFilter] = useState("all");
  const [dashboardCompositionFilter, setDashboardCompositionFilter] = useState("all");
  const [dashboardTimeGrouping, setDashboardTimeGrouping] = useState("semester");

  function resetDashboardFlow() {
    setDashboardAreaFilter("all");
    setDashboardCompositionFilter("all");
    setDashboardTimeGrouping("semester");
  }

  return {
    dashboardAreaFilter,
    dashboardCompositionFilter,
    dashboardTimeGrouping,
    resetDashboardFlow,
    setDashboardAreaFilter,
    setDashboardCompositionFilter,
    setDashboardTimeGrouping
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
