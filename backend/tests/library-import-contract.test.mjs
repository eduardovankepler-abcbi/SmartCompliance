import assert from "node:assert/strict";
import XlsxPopulate from "xlsx-populate";
import {
  buildLibraryTemplateWorkbook,
  parseLibraryFile,
  validateImportedLibraryRows
} from "../src/services/libraryImport.js";

export async function runLibraryImportContractRegression() {
  const templateBuffer = Buffer.from(await buildLibraryTemplateWorkbook());
  assert.ok(templateBuffer.length > 0, "Template XLSX deve ser gerado");
  const workbook = await XlsxPopulate.fromDataAsync(templateBuffer);
  assert.deepEqual(workbook.sheets().map((sheet) => sheet.name()), ["biblioteca_template", "referencias"]);
  assert.equal(workbook.sheet("biblioteca_template").cell("A1").value(), "relationship_type");
  assert.equal(workbook.sheet("referencias").cell("A1").value(), "campo");

  const templateRows = await parseLibraryFile({
    originalname: "biblioteca-avaliacoes-template.xlsx",
    buffer: templateBuffer
  });
  assert.equal(templateRows.length, 3, "Template deve conter as tres perguntas de exemplo");
  assert.equal(templateRows[0].relationshipType, "self");
  assert.equal(templateRows[1].inputType, "text");
  assert.equal(templateRows[2].inputType, "multi-select");
  assert.match(templateRows[2].optionValues, /Flexibilidade nos horarios/);

  const templateValidation = validateImportedLibraryRows(templateRows);
  assert.deepEqual(templateValidation.errors, [], "Template gerado deve ser reimportavel");
  assert.equal(templateValidation.summary.templates, 2);
  assert.equal(templateValidation.summary.questions, 3);

  const csv = [
    "relationship_type,template_name,section_key,section_title,dimension_key,dimension_title,prompt_text,sort_order,is_required,visibility,input_type,option_values",
    "company,Biblioteca QA,clima,Clima,engagement,Engajamento,Como voce avalia o ambiente de trabalho?,1,true,shared,multi-select,Colaboracao|Autonomia"
  ].join("\n");
  const csvRows = await parseLibraryFile({
    originalname: "biblioteca.csv",
    buffer: Buffer.from(csv)
  });
  const csvValidation = validateImportedLibraryRows(csvRows);
  assert.deepEqual(csvValidation.errors, [], "CSV valido deve manter o contrato de importacao");
  assert.deepEqual(csvValidation.templates[0].questions[0].options[1], { value: "autonomia", label: "Autonomia" });

  const invalid = validateImportedLibraryRows([
    { ...csvRows[0], index: 2, inputType: "multi-select", optionValues: "" }
  ]);
  assert.ok(
    invalid.errors.includes("Linha 2: option_values obrigatorio para multi-select."),
    "Importacao invalida deve manter a regra de opcoes obrigatorias"
  );
}