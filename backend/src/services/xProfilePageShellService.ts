import { xSelectors } from "@twitter-niche-analyzer/shared";
import { xProfileShellConfig } from "../config/xProfileShellConfig.js";
import type { BrowserRuntime } from "./browserBootstrapService.js";

export type XProfileShellMarkerKey =
  | "profileHeaderShell"
  | "profileIdentityShell"
  | "profileTabsShell"
  | "mainTimelineShellContainer"
  | "tweetArticleShellVisible";

export interface XProfileShellMarkerState {
  profileHeaderShell: boolean;
  profileIdentityShell: boolean;
  profileTabsShell: boolean;
  mainTimelineShellContainer: boolean;
  tweetArticleShellVisible: boolean;
}

const markerLabels: Record<XProfileShellMarkerKey, string> = {
  profileHeaderShell: "profileHeaderShell",
  profileIdentityShell: "profileIdentityShell",
  profileTabsShell: "profileTabsShell",
  mainTimelineShellContainer: "mainTimelineShellContainer",
  tweetArticleShellVisible: "tweetArticleShellVisible"
};

const requiredMarkerKeys: XProfileShellMarkerKey[] = [
  "profileHeaderShell",
  "profileIdentityShell",
  "profileTabsShell",
  "mainTimelineShellContainer"
];

async function hasMatch(runtime: BrowserRuntime, selector: string) {
  return (await runtime.page.locator(selector).first().count()) > 0;
}

export function createEmptyXProfileShellMarkerState(): XProfileShellMarkerState {
  return {
    profileHeaderShell: false,
    profileIdentityShell: false,
    profileTabsShell: false,
    mainTimelineShellContainer: false,
    tweetArticleShellVisible: false
  };
}

export async function collectXProfileShellMarkers(runtime: BrowserRuntime) {
  const markerScanStart = Date.now();

  const [
    profileHeaderShell,
    profileIdentityShell,
    profileTabsShell,
    mainTimelineShellContainer,
    tweetArticleShellVisible
  ] = await Promise.all([
    hasMatch(runtime, xSelectors.profile.headerShell),
    hasMatch(runtime, xSelectors.profile.identityShell),
    hasMatch(runtime, xSelectors.profile.tabsShell),
    hasMatch(runtime, xSelectors.profile.timelineShellContainer),
    hasMatch(runtime, xSelectors.profile.tweetArticleShell)
  ]);

  return {
    markerState: {
      profileHeaderShell,
      profileIdentityShell,
      profileTabsShell,
      mainTimelineShellContainer,
      tweetArticleShellVisible
    },
    markerScanMs: Date.now() - markerScanStart
  };
}

export function getDetectedXProfileShellMarkers(markerState: XProfileShellMarkerState) {
  return (Object.entries(markerState) as [XProfileShellMarkerKey, boolean][])
    .filter(([, isPresent]) => isPresent)
    .map(([key]) => markerLabels[key]);
}

export function getMissingXProfileShellMarkers(markerState: XProfileShellMarkerState) {
  return (Object.entries(markerState) as [XProfileShellMarkerKey, boolean][])
    .filter(([, isPresent]) => !isPresent)
    .map(([key]) => markerLabels[key]);
}

export function hasRequiredXProfileShell(markerState: XProfileShellMarkerState) {
  return requiredMarkerKeys.every((key) => markerState[key]);
}

export async function waitForXProfileShellSignals(runtime: BrowserRuntime) {
  await Promise.allSettled([
    runtime.page.waitForSelector(xSelectors.profile.shellRoot, {
      timeout: xProfileShellConfig.markerTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.profile.identityShell, {
      timeout: xProfileShellConfig.markerTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.profile.tabsShell, {
      timeout: xProfileShellConfig.markerTimeoutMs
    })
  ]);
}
