import { useCallback, useEffect, useMemo, useState } from "react";
import { buildAppHash, parseAppHash } from "./appRoute";
import {
  getFallbackSectionKey,
  getPreferredSectionKey,
  getSectionStatusLabel,
  getVisibleSections
} from "./navigation";

export function useAppShellFlow({
  canViewDashboard,
  canViewEvaluationInsights,
  canViewEvaluationOperations,
  canViewPeople,
  canViewUsersAdmin,
  navigationGroups,
  roleKey,
  sections,
  summaryMode,
  activeEvaluationModule,
  activeEvaluationWorkspace,
  setActiveEvaluationModule,
  setActiveEvaluationWorkspace
}) {
  const [theme, setTheme] = useState("dark");
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === "undefined") {
      return "Dashboard";
    }

    return parseAppHash(window.location.hash, {
      fallbackSectionKey: "Dashboard",
      canViewEvaluationInsights: false
    }).sectionKey;
  });

  const visibleSections = useMemo(
    () =>
      getVisibleSections(sections, {
        roleKey,
        canViewDashboard,
        canViewPeople,
        canViewUsersAdmin
      }),
    [canViewDashboard, canViewPeople, canViewUsersAdmin, roleKey, sections]
  );

  const preferredSectionKey = useMemo(
    () => getPreferredSectionKey(roleKey, canViewDashboard ? "Dashboard" : "Avaliacoes"),
    [canViewDashboard, roleKey]
  );

  const groupedSections = useMemo(
    () =>
      navigationGroups
        .map((group) => ({
          ...group,
          sections: visibleSections.filter((section) => section.group === group.key)
        }))
        .filter((group) => group.sections.length > 0),
    [navigationGroups, visibleSections]
  );

  const fallbackSectionKey = useMemo(
    () => getFallbackSectionKey(visibleSections, preferredSectionKey),
    [preferredSectionKey, visibleSections]
  );

  const shellStatusLabel = useMemo(
    () =>
      getSectionStatusLabel({
        activeSection: visibleSections.some((section) => section.key === activeSection)
          ? activeSection
          : fallbackSectionKey,
        roleKey,
        summaryMode
      }),
    [activeSection, fallbackSectionKey, roleKey, summaryMode, visibleSections]
  );

  const resolvedActiveSection = useMemo(
    () =>
      visibleSections.some((section) => section.key === activeSection)
        ? activeSection
        : fallbackSectionKey,
    [activeSection, fallbackSectionKey, visibleSections]
  );

  const navigateToSection = useCallback(
    (nextSectionKey) => {
      const normalizedSectionKey = visibleSections.some((section) => section.key === nextSectionKey)
        ? nextSectionKey
        : fallbackSectionKey;
      setActiveSection(normalizedSectionKey);
    },
    [fallbackSectionKey, visibleSections]
  );

  useEffect(() => {
    if (resolvedActiveSection !== activeSection) {
      setActiveSection(fallbackSectionKey);
    }
  }, [activeSection, fallbackSectionKey, resolvedActiveSection]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const applyHashRoute = () => {
      const nextRoute = parseAppHash(window.location.hash, {
        fallbackSectionKey,
        canViewEvaluationInsights,
        canViewEvaluationOperations
      });

      if (nextRoute.sectionKey) {
        setActiveSection((current) => {
          const nextSectionKey = visibleSections.some(
            (section) => section.key === nextRoute.sectionKey
          )
            ? nextRoute.sectionKey
            : fallbackSectionKey;
          return nextSectionKey !== current ? nextSectionKey : current;
        });
      }

      if (nextRoute.sectionKey === "Avaliacoes" && nextRoute.evaluationModuleKey) {
        setActiveEvaluationModule((current) =>
          nextRoute.evaluationModuleKey !== current ? nextRoute.evaluationModuleKey : current
        );
      }

      if (nextRoute.sectionKey === "Avaliacoes" && nextRoute.evaluationWorkspace) {
        setActiveEvaluationWorkspace((current) =>
          nextRoute.evaluationWorkspace !== current ? nextRoute.evaluationWorkspace : current
        );
      }
    };

    window.addEventListener("hashchange", applyHashRoute);
    applyHashRoute();

    return () => window.removeEventListener("hashchange", applyHashRoute);
  }, [
    canViewEvaluationInsights,
    canViewEvaluationOperations,
    fallbackSectionKey,
    setActiveEvaluationModule,
    setActiveEvaluationWorkspace,
    visibleSections
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextHash = buildAppHash({
      sectionKey: resolvedActiveSection,
      evaluationModuleKey: activeEvaluationModule,
      evaluationWorkspace: activeEvaluationWorkspace,
      canViewEvaluationInsights,
      canViewEvaluationOperations
    });

    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
  }, [
    activeEvaluationModule,
    activeEvaluationWorkspace,
    canViewEvaluationInsights,
    canViewEvaluationOperations,
    resolvedActiveSection
  ]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return {
    activeSection: resolvedActiveSection,
    groupedSections,
    setActiveSection: navigateToSection,
    shellStatusLabel,
    theme,
    toggleTheme
  };
}
