export const xSelectors = {
  navigation: {
    appShell: 'main[role="main"]',
    primaryColumn: 'div[data-testid="primaryColumn"]',
    profileHeader: 'div[data-testid="UserName"]',
    tweetArticle: 'article[data-testid="tweet"]',
    loginLink: 'a[href*="/i/flow/login"]',
    sideNav: 'nav[aria-label="Primary"]',
    progressBar: '[role="progressbar"]',
    errorDetail: '[data-testid="error-detail"]'
  },
  auth: {
    usernameInput: 'input[autocomplete="username"]',
    passwordInput: 'input[name="password"]',
    nextButton: 'button[role="button"]'
  },
  search: {
    globalInput: 'input[data-testid="SearchBox_Search_Input"]',
    latestTab: 'a[href*="f=live"]',
    peopleTab: 'a[href*="f=user"]'
  },
  profile: {
    shellRoot: 'div[data-testid="primaryColumn"]',
    headerShell:
      '[data-testid="UserProfileHeader_Items"], [data-testid^="UserAvatar-Container-"]',
    identityShell: 'div[data-testid="UserName"]',
    tabsShell: 'div[role="tablist"]',
    timelineShellContainer: 'div[data-testid="primaryColumn"] section[role="region"]',
    tweetArticleShell: 'article[data-testid="tweet"]',
    accountHeader: 'div[data-testid="primaryColumn"]',
    followerLink: 'a[href$="/verified_followers"]',
    postItem: 'article[data-testid="tweet"]'
  },
  post: {
    likeButton: 'button[data-testid="like"]',
    replyButton: 'button[data-testid="reply"]',
    repostButton: 'button[data-testid="retweet"]',
    viewLink: 'a[href$="/analytics"]'
  }
} as const;
