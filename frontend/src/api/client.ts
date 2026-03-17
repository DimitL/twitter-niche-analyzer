import type { AnalysisRequest, AnalysisResponse } from "@twitter-niche-analyzer/shared";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function buildUrl(path: string) {
  return `${apiBaseUrl}${path}`;
}

export async function getApiHealth() {
  const response = await fetch(buildUrl("/api/health"));

  if (!response.ok) {
    throw new Error("API health check failed.");
  }

  return response.json();
}

export async function runMockAnalysis(
  request: AnalysisRequest
): Promise<AnalysisResponse> {
  const response = await fetch(buildUrl("/api/analysis"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error("Mock analysis request failed.");
  }

  return response.json();
}
