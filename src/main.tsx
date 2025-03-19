import './createPost.js';
import { Devvit, JSONValue, useState, useWebView } from '@devvit/public-api';
import type { DevvitMessage, WebViewMessage } from './message.js';

Devvit.configure({
  redditAPI: true,
  redis: true
});

Devvit.addCustomPostType({
  name: 'User Subreddit Tracker',
  height: 'tall',
  render: (context) => {
    // Fetch username
    const [username] = useState(async () => {
      return (await context.reddit.getCurrentUsername()) ?? 'anon';
    });

    // Fetch user comments & posts, extract subreddits, and store in Redis
    const [subreddits] = useState(async () => {
      if (!username) return []; // Ensure username is available

      // Fetch user data (returns a Listing<Post | Comment>)
      const userData = await context.reddit.getCommentsAndPostsByUser({
        username
      });
      if (!userData) return [];

      // Extract subreddits
      const subredditSet = new Set<string>();

      for await (const item of userData) {
        if ('subredditName' in item) {
          subredditSet.add(item.subredditName);
        }
      }

      const subredditList = [...subredditSet]; //

      // Store in Redis
      await context.redis.hSet(`user_subreddits`, {
        [username]: JSON.stringify(subredditList)
      });

      return subredditList;
    });

    // Fetch all usernames from Redis using scan
    const [allUserData] = useState(async () => {
      const hScanResponse = await context.redis.hScan('user_subreddits', 0);

      const userDataSet = new Set<String>();
      hScanResponse.fieldValues.forEach((item) => {
        userDataSet.add(item as unknown as string);
      });

      const userDataList = [...userDataSet]; //

      return userDataList ?? []; // Return all the usernames collected
    });

    const webView = useWebView<WebViewMessage, DevvitMessage>({
      url: 'page.html',
      async onMessage(message, webView) {
        switch (message.type) {
          case 'webViewReady':
            webView.postMessage({
              type: 'initialData',
              data: { subreddits, allUserData }
            });
            break;
          default:
            throw new Error(`Unknown message type: ${message}`);
        }
      },
      onUnmount() {
        context.ui.showToast('Web view closed!');
      }
    });

    return (
      <vstack grow padding='small'>
        <vstack grow alignment='middle center'>
          <text size='xlarge' weight='bold'>
            User Subreddit Tracker
          </text>
          <spacer />
          <vstack alignment='start middle'>
            <hstack>
              <text size='medium'>Username:</text>
              <text size='medium' weight='bold'>
                {username ?? ''}
              </text>
            </hstack>
            <hstack>
              <text size='medium'>Subreddits:</text>
              <text size='medium' weight='bold'>
                {subreddits ? subreddits.toString() : 'None'}
              </text>
            </hstack>
            <hstack>
              <text size='medium'>All Users:</text>
              <text size='medium' weight='bold'>
                {allUserData ? allUserData.toString() : 'None'}
              </text>
            </hstack>
          </vstack>
          <spacer />
          <button onPress={() => webView.mount()}>Launch App</button>
        </vstack>
      </vstack>
    );
  }
});

export default Devvit;
