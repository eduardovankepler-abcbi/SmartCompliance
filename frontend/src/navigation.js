export function getVisibleSections(
  sections,
  {
    roleKey,
    canViewDashboard = false,
    canViewPeople = false,
    canViewUsersAdmin = false
  } = {}
) {
  return sections.filter((section) => {
    if (roleKey === "employee") {
      return ["Compliance", "Avaliacoes", "Desenvolvimento", "Aplause"].includes(section.key);
    }

    if (roleKey === "manager") {
      return ["Dashboard", "Avaliacoes", "Desenvolvimento", "Aplause", "Pessoas"].includes(
        section.key
      );
    }

    if (roleKey === "compliance") {
      return ["Dashboard", "Compliance", "Avaliacoes"].includes(section.key);
    }

    if (section.key === "Dashboard") {
      return canViewDashboard;
    }
    if (section.key === "Pessoas") {
      return canViewPeople;
    }
    if (section.key === "Usuarios") {
      return canViewUsersAdmin;
    }
    return true;
  });
}

export function getPreferredSectionKey(roleKey, fallbackKey = "Dashboard") {
  if (roleKey === "employee") {
    return "Avaliacoes";
  }

  if (roleKey === "compliance") {
    return "Compliance";
  }

  return fallbackKey;
}

export function getFallbackSectionKey(visibleSections, preferredKey = "Dashboard") {
  if (visibleSections.some((section) => section.key === preferredKey)) {
    return preferredKey;
  }

  if (visibleSections.some((section) => section.key === "Avaliacoes")) {
    return "Avaliacoes";
  }

  return visibleSections[0]?.key || preferredKey;
}

export function getSectionStatusLabel({ activeSection, roleKey, summaryMode }) {
  if (activeSection === "Usuarios" || activeSection === "Pessoas") {
    return "Administracao do ambiente";
  }

  if (activeSection === "Compliance") {
    return roleKey === "compliance" ? "Operacao de compliance" : "Canal e tratamento";
  }

  if (activeSection === "Avaliacoes") {
    return roleKey === "employee" ? "Jornada individual" : "Ciclo e feedback";
  }

  if (activeSection === "Desenvolvimento") {
    if (roleKey === "manager") {
      return "Desenvolvimento da equipe";
    }
    if (roleKey === "admin" || roleKey === "hr") {
      return "Gestao do desenvolvimento";
    }
    return "Trilha individual";
  }

  if (activeSection === "Aplause") {
    return "Reconhecimento e cultura";
  }

  if (summaryMode === "executive") {
    return "Visao executiva";
  }

  if (summaryMode === "team") {
    return "Visao gerencial";
  }

  return "Visao pessoal";
}
