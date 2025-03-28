import { JSONValue } from '@devvit/public-api';

/** Message from Devvit to the web view. */
export type DevvitMessage =
  | {
      type: 'initialData' | 'refreshData';
      data: {
        username: JSONValue;
        subreddits: JSONValue;
        allUserData: JSONValue;
        allUserMatches: JSONValue;
      };
    }
  | {
      type: 'snoovatar';
      data: JSONValue;
    };

/** Message from the web view to Devvit. */
export type WebViewMessage =
  | { type: 'webViewReady' }
  | {
      data: JSONValue;
      type: 'matchUpdate';
    }
  | {
      type: 'resetData';
      data: JSONValue;
    }
  | { type: 'getSnoovatar'; data: JSONValue };

/**
 * Web view MessageEvent listener data type.
 * The Devvit API wraps all messages from Blocks to the web view.
 */
export type DevvitSystemMessage = {
  data: { message: DevvitMessage };
  /** Reserved type for messages sent via `context.ui.webView.postMessage`. */
  type?: 'devvit-message' | string;
};
