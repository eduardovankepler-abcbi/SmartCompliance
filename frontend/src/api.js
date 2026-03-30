const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "smart-compliance-token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Falha ao carregar dados");
  }

  return response.json();
}

async function upload(path, file) {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Falha ao carregar dados");
  }

  return response.json();
}

async function download(path, suggestedFileName) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Falha ao baixar arquivo");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = suggestedFileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const auth = {
  getToken,
  setToken,
  login: async (email, password) => {
    const data = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    return data;
  },
  logout: () => setToken(null),
  me: () => request("/api/auth/me")
};

export const api = {
  getSummary: () => request("/api/summary"),
  getAuditTrail: (category = null, limit = 40) => {
    const params = new URLSearchParams();
    if (category) {
      params.set("category", category);
    }
    if (limit) {
      params.set("limit", String(limit));
    }
    return request(`/api/audit-trail${params.toString() ? `?${params.toString()}` : ""}`);
  },
  getPeople: () => request("/api/people"),
  createPerson: (payload) =>
    request("/api/people", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getUsers: () => request("/api/users"),
  createUser: (payload) =>
    request("/api/users", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateUser: (userId, payload) =>
    request(`/api/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  getIncidents: () => request("/api/incidents"),
  createIncident: (payload) =>
    request("/api/incidents", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateIncident: (incidentId, payload) =>
    request(`/api/incidents/${incidentId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  getEvaluationTemplate: () => request("/api/evaluations/template"),
  getEvaluationLibrary: () => request("/api/evaluations/library"),
  getEvaluationCycles: () => request("/api/evaluations/cycles"),
  createEvaluationCycle: (payload) =>
    request("/api/evaluations/cycles", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateEvaluationCycleStatus: (cycleId, status) =>
    request(`/api/evaluations/cycles/${cycleId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  getEvaluationAssignments: () => request("/api/evaluations/assignments"),
  getEvaluationAssignment: (assignmentId) =>
    request(`/api/evaluations/assignments/${assignmentId}`),
  getFeedbackRequests: () => request("/api/evaluations/feedback-requests"),
  createFeedbackRequest: (payload) =>
    request("/api/evaluations/feedback-requests", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  reviewFeedbackRequest: (requestId, status) =>
    request(`/api/evaluations/feedback-requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  getEvaluationResponses: () => request("/api/evaluations/responses"),
  downloadCustomLibraryTemplate: () =>
    download(
      "/api/evaluations/custom-libraries/template",
      "biblioteca-avaliacoes-template.xlsx"
    ),
  importCustomLibrary: (file) => upload("/api/evaluations/custom-libraries/import", file),
  publishCustomLibrary: (payload) =>
    request("/api/evaluations/custom-libraries/publish", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  submitEvaluation: (payload) =>
    request("/api/evaluations/submit", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getApplauseEntries: () => request("/api/applause"),
  createApplauseEntry: (payload) =>
    request("/api/applause", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getDevelopmentRecords: () => request("/api/development/records"),
  createDevelopmentRecord: (payload) =>
    request("/api/development/records", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getDashboardOverview: (area = null, timeGrouping = "semester") => {
    const params = new URLSearchParams();
    if (area) {
      params.set("area", area);
    }
    if (timeGrouping) {
      params.set("timeGrouping", timeGrouping);
    }
    return request(`/api/dashboards/overview${params.toString() ? `?${params.toString()}` : ""}`);
  }
};
