import crypto from "crypto";
import ExcelJS from "exceljs";
import {
  evaluationLibrary,
  evaluationScaleProfiles,
  agreementScale,
  satisfactionScale
} from "../data/mockData.js";

const VALID_RELATIONSHIPS = [
  "peer",
  "manager",
  "cross-functional",
  "client-internal",
  "client-external",
  "self",
  "leader",
  "company"
];

const DEFAULT_CONFIDENTIALITY = {
  peer: "mixed",
  manager: "mixed",
  "cross-functional": "mixed",
  "client-internal": "anonymous-aggregate",
  "client-external": "anonymous-aggregate",
  self: "private-to-employee-and-manager",
  leader: "anonymous-aggregate",
  company: "manager-confidential"
};

const VALID_INPUT_TYPES = ["scale", "text", "multi-select"];
const VALID_SCALE_PROFILES = Object.keys(evaluationScaleProfiles);
const TEMPLATE_COLUMNS = [
  "relationship_type",
  "template_name",
  "description",
  "confidentiality",
  "scale_profile",
  "manager_custom_questions_limit",
  "section_key",
  "section_title",
  "section_description",
  "dimension_key",
  "dimension_title",
  "prompt_text",
  "helper_text",
  "input_type",
  "option_values",
  "sort_order",
  "is_required",
  "visibility",
  "collect_evidence_on_extreme"
];

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeBoolean(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return ["true", "1", "yes", "sim", "y"].includes(normalized);
}

function normalizeVisibility(value, relationshipType) {
  if (value) {
    return String(value).trim().toLowerCase();
  }
  if (relationshipType === "self") {
    return "private";
  }
  if (relationshipType === "leader") {
    return "confidential";
  }
  return "shared";
}

function normalizeScaleProfile(value, relationshipType) {
  const normalized = String(value || "").trim().toLowerCase();
  if (VALID_SCALE_PROFILES.includes(normalized)) {
    return normalized;
  }
  return relationshipType === "peer" ||
    relationshipType === "manager" ||
    relationshipType === "cross-functional" ||
    relationshipType === "client-internal" ||
    relationshipType === "client-external"
    ? "satisfaction"
    : "agreement";
}

function parseOptionValues(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({
      value: item
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      label: item
    }));
}

function normalizeRows(rawRows) {
  return rawRows
    .map((row, index) => {
      const normalizedRow = {};
      for (const [key, value] of Object.entries(row)) {
        normalizedRow[normalizeHeader(key)] = value;
      }
      return {
        index: index + 2,
        relationshipType:
          normalizedRow.relationship_type || normalizedRow.relationshiptype || "",
        dimensionKey: normalizedRow.dimension_key || normalizedRow.dimensionkey || "",
        dimensionTitle:
          normalizedRow.dimension_title || normalizedRow.dimensiontitle || "",
        prompt:
          normalizedRow.prompt_text ||
          normalizedRow.prompt ||
          normalizedRow.question ||
          "",
        sortOrder: normalizedRow.sort_order || normalizedRow.sortorder || "",
        isRequired:
          normalizedRow.is_required ?? normalizedRow.isrequired ?? normalizedRow.required ?? "true",
        visibility: normalizedRow.visibility || "",
        templateName:
          normalizedRow.template_name || normalizedRow.model_name || normalizedRow.templatename || "",
        description: normalizedRow.description || "",
        confidentiality: normalizedRow.confidentiality || "",
        scaleProfile:
          normalizedRow.scale_profile || normalizedRow.scaleprofile || normalizedRow.scale || "",
        managerCustomQuestionsLimit:
          normalizedRow.manager_custom_questions_limit ||
          normalizedRow.managercustomquestionslimit ||
          "",
        sectionKey: normalizedRow.section_key || normalizedRow.sectionkey || "",
        sectionTitle: normalizedRow.section_title || normalizedRow.sectiontitle || "",
        sectionDescription:
          normalizedRow.section_description || normalizedRow.sectiondescription || "",
        helperText: normalizedRow.helper_text || normalizedRow.helpertext || "",
        inputType: normalizedRow.input_type || normalizedRow.inputtype || "scale",
        optionValues: normalizedRow.option_values || normalizedRow.optionvalues || "",
        collectEvidenceOnExtreme:
          normalizedRow.collect_evidence_on_extreme ||
          normalizedRow.collectevidenceonextreme ||
          "false"
      };
    })
    .filter((row) => row.prompt || row.relationshipType || row.dimensionKey || row.dimensionTitle);
}

function createQuestionId(relationshipType, prompt, sortOrder) {
  return `upl_${crypto
    .createHash("sha1")
    .update(`${relationshipType}:${prompt}:${sortOrder}`)
    .digest("hex")
    .slice(0, 10)}`;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseCsvBuffer(buffer) {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

async function parseWorkbookBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const rows = [];
  const headerRow = worksheet.getRow(1);
  const headers = headerRow.values
    .slice(1)
    .map((value) => String(value || "").trim());

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }
    const values = row.values.slice(1);
    const mapped = Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    );
    rows.push(mapped);
  });

  return rows;
}

export async function buildLibraryTemplateWorkbook() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("biblioteca_template");
  const referenceSheet = workbook.addWorksheet("referencias");

  sheet.addRow(TEMPLATE_COLUMNS);
  sheet.getRow(1).font = { bold: true };
  sheet.columns = TEMPLATE_COLUMNS.map((key) => ({
    header: key,
    key,
    width: 24
  }));

  sheet.addRows([
    {
      relationship_type: "self",
      template_name: "Autoavaliacao personalizada",
      description: "Modelo importado para autoavaliacao.",
      confidentiality: "private-to-employee-and-manager",
      scale_profile: "agreement",
      manager_custom_questions_limit: 0,
      section_key: "desempenho",
      section_title: "Desempenho e Entregas",
      section_description: "Bloco de desempenho individual.",
      dimension_key: "delivery",
      dimension_title: "Cumprimento de prazos",
      prompt_text: "Cumpro minhas tarefas e entregas dentro dos prazos estabelecidos.",
      helper_text: "Considere o periodo mais recente.",
      input_type: "scale",
      option_values: "",
      sort_order: 1,
      is_required: "true",
      visibility: "private",
      collect_evidence_on_extreme: "false"
    },
    {
      relationship_type: "company",
      template_name: "Pesquisa institucional personalizada",
      description: "Modelo importado para leitura institucional.",
      confidentiality: "manager-confidential",
      scale_profile: "agreement",
      manager_custom_questions_limit: 0,
      section_key: "final",
      section_title: "Consideracoes Finais",
      section_description: "Bloco para sugestoes abertas.",
      dimension_key: "final-comments",
      dimension_title: "Sugestoes gerais",
      prompt_text: "Deixe aqui sua sugestao de melhoria.",
      helper_text: "Texto livre do colaborador.",
      input_type: "text",
      option_values: "",
      sort_order: 2,
      is_required: "true",
      visibility: "shared",
      collect_evidence_on_extreme: "false"
    },
    {
      relationship_type: "company",
      template_name: "Pesquisa institucional personalizada",
      description: "Modelo importado para leitura institucional.",
      confidentiality: "manager-confidential",
      scale_profile: "agreement",
      manager_custom_questions_limit: 0,
      section_key: "satisfacao",
      section_title: "Satisfacao profissional",
      section_description: "Bloco de fatores de satisfacao.",
      dimension_key: "satisfaction",
      dimension_title: "Fatores de satisfacao",
      prompt_text: "O que mais te satisfaz profissionalmente?",
      helper_text: "Escolha quantas opcoes forem necessarias.",
      input_type: "multi-select",
      option_values:
        "Trabalho home office|Flexibilidade nos horarios|Crescimento financeiro|Desenvolvimento profissional|Ambiente de trabalho",
      sort_order: 3,
      is_required: "true",
      visibility: "shared",
      collect_evidence_on_extreme: "false"
    }
  ]);

  referenceSheet.columns = [
    { header: "campo", key: "field", width: 28 },
    { header: "valores_permitidos", key: "allowed", width: 48 },
    { header: "observacao", key: "note", width: 56 }
  ];
  referenceSheet.getRow(1).font = { bold: true };
  referenceSheet.addRows([
    {
      field: "relationship_type",
      allowed: VALID_RELATIONSHIPS.join(", "),
      note: "Define qual fluxo da avaliacao recebera as perguntas."
    },
    {
      field: "input_type",
      allowed: VALID_INPUT_TYPES.join(", "),
      note: "scale usa a escala do template; text usa texto livre; multi-select usa option_values."
    },
    {
      field: "scale_profile",
      allowed: VALID_SCALE_PROFILES.join(", "),
      note: "agreement para Concordo/Discordo; satisfaction para Muito insatisfeito/Muito satisfeito."
    },
    {
      field: "visibility",
      allowed: "shared, private, confidential",
      note: "Mantem a leitura alinhada ao tipo de avaliacao."
    },
    {
      field: "option_values",
      allowed: "valor 1|valor 2|valor 3",
      note: "Preencha apenas para input_type = multi-select."
    },
    {
      field: "collect_evidence_on_extreme",
      allowed: "true, false",
      note: "Quando true, notas extremas exigem comentario complementar."
    }
  ]);

  return workbook.xlsx.writeBuffer();
}

export async function parseLibraryFile(file) {
  const extension = String(file.originalname || "")
    .toLowerCase()
    .split(".")
    .pop();

  if (extension === "csv") {
    return normalizeRows(parseCsvBuffer(file.buffer));
  }

  if (extension === "xlsx") {
    return normalizeRows(await parseWorkbookBuffer(file.buffer));
  }

  throw new Error("Formato invalido. Envie um arquivo CSV ou XLSX.");
}

export function validateImportedLibraryRows(rows) {
  const errors = [];
  const groupedTemplates = new Map();

  for (const row of rows) {
    const relationshipType = String(row.relationshipType || "").trim().toLowerCase();
    const sectionKey = String(row.sectionKey || "").trim();
    const sectionTitle = String(row.sectionTitle || "").trim();
    const sectionDescription = String(row.sectionDescription || "").trim();
    const dimensionKey = String(row.dimensionKey || "").trim();
    const dimensionTitle = String(row.dimensionTitle || "").trim();
    const prompt = String(row.prompt || "").trim();
    const helperText = String(row.helperText || "").trim();
    const sortOrder = Number(row.sortOrder);
    const visibility = normalizeVisibility(row.visibility, relationshipType);
    const inputType = String(row.inputType || "").trim().toLowerCase();
    const scaleProfile = normalizeScaleProfile(row.scaleProfile, relationshipType);
    const optionValues = parseOptionValues(row.optionValues);
    const collectEvidenceOnExtreme = normalizeBoolean(row.collectEvidenceOnExtreme);

    if (!VALID_RELATIONSHIPS.includes(relationshipType)) {
      errors.push(`Linha ${row.index}: relationship_type invalido.`);
      continue;
    }
    if (!sectionKey) {
      errors.push(`Linha ${row.index}: section_key obrigatorio.`);
    }
    if (!sectionTitle) {
      errors.push(`Linha ${row.index}: section_title obrigatorio.`);
    }
    if (!dimensionKey) {
      errors.push(`Linha ${row.index}: dimension_key obrigatorio.`);
    }
    if (!dimensionTitle) {
      errors.push(`Linha ${row.index}: dimension_title obrigatorio.`);
    }
    if (!prompt) {
      errors.push(`Linha ${row.index}: prompt_text obrigatorio.`);
    }
    if (!Number.isInteger(sortOrder) || sortOrder <= 0) {
      errors.push(`Linha ${row.index}: sort_order deve ser um inteiro positivo.`);
    }
    if (!VALID_INPUT_TYPES.includes(inputType)) {
      errors.push(`Linha ${row.index}: input_type invalido.`);
    }
    if (!["shared", "private", "confidential"].includes(visibility)) {
      errors.push(`Linha ${row.index}: visibility invalida.`);
    }
    if (inputType === "multi-select" && !optionValues.length) {
      errors.push(`Linha ${row.index}: option_values obrigatorio para multi-select.`);
    }

    if (errors.some((message) => message.startsWith(`Linha ${row.index}:`))) {
      continue;
    }

    const templateEntry = groupedTemplates.get(relationshipType) || {
      relationshipType,
      modelName:
        String(row.templateName || "").trim() ||
        `Biblioteca personalizada - ${relationshipType}`,
      description:
        String(row.description || "").trim() ||
        `Questionario importado para ${relationshipType}.`,
      policy: {
        strategy: "company-upload",
        managerCustomQuestionsLimit: Number(row.managerCustomQuestionsLimit) || 0,
        scale: evaluationScaleProfiles[scaleProfile] || agreementScale,
        scaleProfile,
        confidentiality:
          String(row.confidentiality || "").trim() ||
          DEFAULT_CONFIDENTIALITY[relationshipType],
        showStrengthsNote: false,
        showDevelopmentNote: false
      },
      questions: []
    };

    templateEntry.questions.push({
      id: createQuestionId(relationshipType, prompt, sortOrder),
      sectionKey,
      sectionTitle,
      sectionDescription,
      dimensionKey,
      dimensionTitle,
      prompt,
      helperText,
      sortOrder,
      isRequired: normalizeBoolean(row.isRequired),
      visibility,
      inputType,
      options: optionValues,
      scaleProfile,
      collectEvidenceOnExtreme
    });

    groupedTemplates.set(relationshipType, templateEntry);
  }

  const templates = Array.from(groupedTemplates.values()).map((template) => ({
    ...template,
    questions: template.questions.sort((left, right) => left.sortOrder - right.sortOrder)
  }));

  return {
    errors,
    templates,
    summary: {
      templates: templates.length,
      relationshipTypes: templates.length,
      questions: templates.reduce((sum, template) => sum + template.questions.length, 0)
    }
  };
}
