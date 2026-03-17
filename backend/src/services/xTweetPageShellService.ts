import { xSelectors } from "@twitter-niche-analyzer/shared";
import { xTweetShellConfig } from "../config/xTweetShellConfig.js";
import type { BrowserRuntime } from "./browserBootstrapService.js";

export type XTweetShellMarkerKey =
  | "mainTweetArticleShell"
  | "authorShellBlock"
  | "tweetContentContainerShell"
  | "actionBarShell"
  | "replyThreadRegionShellVisible";

export interface XTweetShellMarkerState {
  mainTweetArticleShell: boolean;
  authorShellBlock: boolean;
  tweetContentContainerShell: boolean;
  actionBarShell: boolean;
  replyThreadRegionShellVisible: boolean;
}

const markerLabels: Record<XTweetShellMarkerKey, string> = {
  mainTweetArticleShell: "mainTweetArticleShell",
  authorShellBlock: "authorShellBlock",
  tweetContentContainerShell: "tweetContentContainerShell",
  actionBarShell: "actionBarShell",
  replyThreadRegionShellVisible: "replyThreadRegionShellVisible"
};

const requiredMarkerKeys: XTweetShellMarkerKey[] = [
  "mainTweetArticleShell",
  "authorShellBlock",
  "tweetContentContainerShell",
  "actionBarShell"
];

export function createEmptyXTweetShellMarkerState(): XTweetShellMarkerState {
  return {
    mainTweetArticleShell: false,
    authorShellBlock: false,
    tweetContentContainerShell: false,
    actionBarShell: false,
    replyThreadRegionShellVisible: false
  };
}

export async function collectXTweetShellMarkers(runtime: BrowserRuntime) {
  const markerScanStart = Date.now();
  const mainArticleLocator = runtime.page.locator(xSelectors.post.shellArticle).first();
  const mainTweetArticleShell = (await mainArticleLocator.count()) > 0;

  let authorShellBlock = false;
  let tweetContentContainerShell = false;
  let actionBarShell = false;

  if (mainTweetArticleShell) {
    const [authorCount, contentCount, actionBarCount] = await Promise.all([
      mainArticleLocator.locator(xSelectors.post.authorShellBlock).first().count(),
      mainArticleLocator.locator(xSelectors.post.contentContainerShell).first().count(),
      mainArticleLocator.locator(xSelectors.post.actionBarShell).first().count()
    ]);

    authorShellBlock = authorCount > 0;
    tweetContentContainerShell = contentCount > 0;
    actionBarShell = actionBarCount > 0;
  }

  const replyThreadArticleCount = await runtime.page
    .locator(xSelectors.post.replyThreadArticleShell)
    .count();

  return {
    markerState: {
      mainTweetArticleShell,
      authorShellBlock,
      tweetContentContainerShell,
      actionBarShell,
      replyThreadRegionShellVisible: replyThreadArticleCount > 1
    },
    markerScanMs: Date.now() - markerScanStart
  };
}

export function getDetectedXTweetShellMarkers(markerState: XTweetShellMarkerState) {
  return (Object.entries(markerState) as [XTweetShellMarkerKey, boolean][])
    .filter(([, isPresent]) => isPresent)
    .map(([key]) => markerLabels[key]);
}

export function getMissingXTweetShellMarkers(markerState: XTweetShellMarkerState) {
  return requiredMarkerKeys.filter((key) => !markerState[key]).map(
    (key) => markerLabels[key]
  );
}

export function hasRequiredXTweetShell(markerState: XTweetShellMarkerState) {
  return requiredMarkerKeys.every((key) => markerState[key]);
}

export async function waitForXTweetShellSignals(runtime: BrowserRuntime) {
  await Promise.allSettled([
    runtime.page.waitForSelector(xSelectors.post.shellArticle, {
      timeout: xTweetShellConfig.markerTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.post.authorShellBlock, {
      timeout: xTweetShellConfig.markerTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.post.actionBarShell, {
      timeout: xTweetShellConfig.markerTimeoutMs
    })
  ]);
}
