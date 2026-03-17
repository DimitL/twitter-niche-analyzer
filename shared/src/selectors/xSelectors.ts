export const xSelectors = {
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
