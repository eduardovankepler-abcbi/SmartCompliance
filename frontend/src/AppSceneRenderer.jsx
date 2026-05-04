import { EvaluationsSection } from "./evaluations/EvaluationsSection";
import { DashboardSection } from "./sections/DashboardSection.jsx";
import { PeopleSection, UsersSection } from "./sections/RegistrySections.jsx";
import {
  ApplauseSection,
  ComplianceSection,
  DevelopmentSection
} from "./sections/OperationsSections.jsx";

const EmptyComponent = () => null;

export function AppSceneRenderer({
  activeSection,
  applauseProps,
  complianceProps,
  dashboardProps,
  developmentProps,
  evaluationsProps,
  loading,
  peopleProps,
  usersProps
}) {
  const SafeDashboardSection = DashboardSection || EmptyComponent;
  const SafeComplianceSection = ComplianceSection || EmptyComponent;
  const SafeEvaluationsSection = EvaluationsSection || EmptyComponent;
  const SafeDevelopmentSection = DevelopmentSection || EmptyComponent;
  const SafeApplauseSection = ApplauseSection || EmptyComponent;
  const SafePeopleSection = PeopleSection || EmptyComponent;
  const SafeUsersSection = UsersSection || EmptyComponent;

  if (loading) {
    return null;
  }

  switch (activeSection) {
    case "Dashboard":
      return <SafeDashboardSection {...dashboardProps} />;
    case "Compliance":
      return <SafeComplianceSection {...complianceProps} />;
    case "Avaliacoes":
      return <SafeEvaluationsSection {...evaluationsProps} />;
    case "Desenvolvimento":
      return <SafeDevelopmentSection {...developmentProps} />;
    case "Aplause":
      return <SafeApplauseSection {...applauseProps} />;
    case "Pessoas":
      return <SafePeopleSection {...peopleProps} />;
    case "Usuarios":
      return <SafeUsersSection {...usersProps} />;
    default:
      return null;
  }
}
