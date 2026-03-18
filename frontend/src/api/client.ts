import type { AnalysisRequest, AnalysisResponse } from "@twitter-niche-analyzer/shared";
import type {
  NicheShortlistRequest,
  NicheShortlistResponse
} from "../types/nicheShortlist.js";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function buildUrl(path: string) {
  return `${apiBaseUrl}${path}`;
}

async function parseApiError(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message || payload.error || "API request failed.";
  } catch {
    return "API request failed.";
  }
}

export async function getApiHealth() {
  const response = await fetch(buildUrl("/api/health"));

  if (!response.ok) {
    throw new Error(await parseApiError(response));
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
    throw new Error(await parseApiError(response));
  }

  return response.json();
}

export async function runNicheShortlist(
  request: NicheShortlistRequest
): Promise<NicheShortlistResponse> {
  const response = await fetch(buildUrl("/api/browser/x-niche-shortlist-test"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
}
