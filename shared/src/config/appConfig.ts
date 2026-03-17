export const appConfig = {
  analysis: {
    defaultTopNiches: 10,
    influencersPerNiche: 10
  },
  collection: {
    provider: "playwright-chromium",
    selectorsVersion: "placeholder-v1"
  },
  reporting: {
    includeTopExplanations: true
  }
} as const;
