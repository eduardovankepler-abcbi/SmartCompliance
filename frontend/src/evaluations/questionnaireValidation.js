export function validateEvaluationQuestionnaireCreateForm(form = {}) {
  if (!String(form.cycleId || "").trim()) {
    return "Selecione o ciclo do questionario individual.";
  }
  if (!String(form.revieweePersonId || "").trim()) {
    return "Selecione o colaborador que recebera o questionario.";
  }
  if (!String(form.relationshipType || "").trim()) {
    return "Selecione o tipo de questionario.";
  }
  if (!String(form.title || "").trim()) {
    return "Informe um titulo para o rascunho.";
  }
  return "";
}

export function validateEvaluationQuestionnaireQuestionForm(form = {}) {
  if (!String(form.dimensionKey || "").trim()) {
    return "Informe a chave da dimensao.";
  }
  if (!String(form.dimensionTitle || "").trim()) {
    return "Informe o titulo da dimensao.";
  }
  if (!String(form.promptText || "").trim()) {
    return "Informe o enunciado da pergunta.";
  }

  const sortOrder = Number(form.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 1) {
    return "A ordem da pergunta deve ser um inteiro maior que zero.";
  }

  if (form.inputType === "multi-select") {
    const optionCount = String(form.optionsText || "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean).length;
    if (!optionCount) {
      return "Perguntas de multipla escolha exigem ao menos uma opcao.";
    }
  }

  return "";
}
