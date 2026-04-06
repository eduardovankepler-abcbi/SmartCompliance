import { api } from "./api";

export function useAppActions({
  logoutSession,
  reloadData,
  resetDashboardFlow,
  resetData,
  resetDevelopmentFlow,
  resetEvaluations,
  resetOperationsFlow,
  resetRegistryForms,
  setError
}) {
  function handleLogout() {
    logoutSession();
    resetEvaluations();
    resetData();
    resetDashboardFlow();
    resetRegistryForms();
    resetDevelopmentFlow();
    resetOperationsFlow();
  }

  async function handleCompetencyCreate(payload) {
    try {
      setError("");
      await api.createCompetency(payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function handleCompetencyUpdate(competencyId, payload) {
    try {
      setError("");
      await api.updateCompetency(competencyId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  return {
    handleCompetencyCreate,
    handleCompetencyUpdate,
    handleLogout
  };
}
