import { chromium } from "playwright";
import fs from "node:fs";

const baseUrl = process.env.HOMOLOGATION_FRONTEND_BASE_URL || "https://smart-compliance-angular.vercel.app";
const password = process.env.HOMOLOGATION_PASSWORD || "demo123";

const defaultChromeCandidates = [
  process.env.CHROME_EXECUTABLE_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].filter(Boolean);

const chromeExecutablePath = defaultChromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chromeExecutablePath) {
  console.error(JSON.stringify({
    status: "failed",
    message: "Chrome/Edge local nao encontrado. Defina CHROME_EXECUTABLE_PATH ou instale os browsers do Playwright.",
    checkedPaths: defaultChromeCandidates
  }, null, 2));
  process.exit(1);
}

const flows = [
  { role: "admin", email: process.env.HOMOLOGATION_ADMIN_EMAIL || "admin@demo.local", name: "Dashboard executivo", path: "/app/dashboard", expected: /Gestao Executiva|Gestão Executiva/i },
  { role: "admin", email: process.env.HOMOLOGATION_ADMIN_EMAIL || "admin@demo.local", name: "Auditoria", path: "/app/audit", expected: /Auditoria/i },
  { role: "admin", email: process.env.HOMOLOGATION_ADMIN_EMAIL || "admin@demo.local", name: "Usuarios", path: "/app/users", expected: /Usuarios|Usuários/i },
  { role: "admin", email: process.env.HOMOLOGATION_ADMIN_EMAIL || "admin@demo.local", name: "Competencias", path: "/app/people/competencies", expected: /Competencias|Competências/i },
  { role: "manager", email: process.env.HOMOLOGATION_MANAGER_EMAIL || "gestor@demo.local", name: "Pessoas", path: "/app/people", expected: /Pessoas|Diretorio|Diretório/i },
  { role: "manager", email: process.env.HOMOLOGATION_MANAGER_EMAIL || "gestor@demo.local", name: "Areas", path: "/app/people/areas", expected: /Areas|Áreas/i },
  { role: "manager", email: process.env.HOMOLOGATION_MANAGER_EMAIL || "gestor@demo.local", name: "Desenvolvimento", path: "/app/development", expected: /Desenvolvimento|PDI/i },
  { role: "employee", email: process.env.HOMOLOGATION_EMPLOYEE_EMAIL || "colaborador1@demo.local", name: "Compliance", path: "/app/compliance", expected: /Compliance/i },
  { role: "employee", email: process.env.HOMOLOGATION_EMPLOYEE_EMAIL || "colaborador1@demo.local", name: "Feedback", path: "/app/evaluations/self/insights/feedback", expected: /Feedback|Evolucao|Evolução/i },
  { role: "employee", email: process.env.HOMOLOGATION_EMPLOYEE_EMAIL || "colaborador1@demo.local", name: "Aplausos", path: "/app/applause", expected: /Aplausos|Reconhecimento/i },
  { role: "compliance", email: process.env.HOMOLOGATION_COMPLIANCE_EMAIL || "compliance@demo.local", name: "Fila compliance", path: "/app/compliance", expected: /Compliance|Denuncia|Denúncia|Relato|Fila/i }
];

async function login(page, email) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await Promise.all([
    page.waitForURL(/\/app\//, { timeout: 60000 }),
    page.getByRole("button", { name: "Acessar", exact: true }).click()
  ]);
}

function visibleTechnicalTokens(text) {
  const matches = text.match(/(^|[^\p{L}\p{N}_])(undefined|null|NaN|\[object Object\])([^\p{L}\p{N}_]|$)/gu) || [];
  return [...new Set(matches.map((item) => item.trim()))];
}

const browser = await chromium.launch({ executablePath: chromeExecutablePath, headless: true });
const sessions = new Map();
const results = [];
try {
  for (const flow of flows) {
    if (!sessions.has(flow.email)) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage();
      await login(page, flow.email);
      sessions.set(flow.email, { context, page });
    }

    const { page } = sessions.get(flow.email);
    const events = [];
    const consoleHandler = (message) => {
      if (["error", "warning"].includes(message.type()) || message.text().includes("development mode")) {
        events.push(`console:${message.type()}:${message.text()}`);
      }
    };
    const responseHandler = (response) => {
      if (response.status() >= 400 && response.url().includes("/api/")) {
        events.push(`http:${response.status()}:${response.url()}`);
      }
    };
    page.on("console", consoleHandler);
    page.on("response", responseHandler);

    let status = "passed";
    let error = "";
    let issues = [];
    try {
      await page.goto(`${baseUrl}${flow.path}`, { waitUntil: "networkidle", timeout: 60000 });
      const text = await page.locator("body").innerText({ timeout: 20000 });
      issues = visibleTechnicalTokens(text);
      if (!flow.expected.test(text)) throw new Error("texto esperado ausente");
      if (events.length) throw new Error(events.join("; "));
      if (issues.length) throw new Error(`tokens tecnicos visiveis: ${issues.join(", ")}`);
    } catch (caught) {
      status = "failed";
      error = caught.message;
    } finally {
      page.off("console", consoleHandler);
      page.off("response", responseHandler);
    }

    results.push({ flow: flow.name, role: flow.role, status, events, issues, error });
  }
} finally {
  for (const { context } of sessions.values()) await context.close();
  await browser.close();
}

const status = results.some((result) => result.status !== "passed") ? "failed" : "passed";
console.log(JSON.stringify({ status, baseUrl, checkedAt: new Date().toISOString(), chromeExecutablePath, results }, null, 2));
if (status !== "passed") process.exit(1);
