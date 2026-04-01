export function validateEvaluationAnswerForm({ template, answerForm }) {
  const questions = template?.questions || [];

  for (const question of questions) {
    if (!question?.isRequired) {
      continue;
    }

    const answerValue = answerForm?.[question.id] || {};

    if (question.inputType === "text") {
      if (!String(answerValue.textValue || "").trim()) {
        return {
          ok: false,
          message: `Responda a pergunta obrigatoria: ${question.dimensionTitle || question.prompt}.`
        };
      }
      continue;
    }

    if (question.inputType === "multi-select") {
      if (!Array.isArray(answerValue.selectedOptions) || answerValue.selectedOptions.length === 0) {
        return {
          ok: false,
          message: `Selecione pelo menos uma opcao em: ${question.dimensionTitle || question.prompt}.`
        };
      }
      continue;
    }

    const score = Number(answerValue.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return {
        ok: false,
        message: `Escolha uma nota valida em: ${question.dimensionTitle || question.prompt}.`
      };
    }

    if (
      question.collectEvidenceOnExtreme &&
      (score === 1 || score === 5) &&
      !String(answerValue.evidenceNote || "").trim()
    ) {
      return {
        ok: false,
        message: `Notas extremas exigem evidencia em: ${question.dimensionTitle || question.prompt}.`
      };
    }
  }

  return { ok: true, message: "" };
}

