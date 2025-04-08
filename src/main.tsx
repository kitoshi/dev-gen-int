import './redis.js';
import { Devvit, JSONValue, useState, useWebView } from '@devvit/public-api';
import type { DevvitMessage, WebViewMessage } from './message.js';
import { matchUpdate, resetData } from './redis.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
  realtime: true
});

Devvit.addCustomPostType({
  name: 'Frienddit',
  description: 'A Reddit friend/subreddit finder app',
  height: 'tall',
  render: (context) => {
    // Fetch username
    const [username] = useState(async () => {
      return (await context.reddit.getCurrentUsername()) ?? '';
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
      console.log('Initial User Subreddits:', subredditList);
      // Store in Redis
      await context.redis.hSet(`user_subreddits`, {
        [username]: JSON.stringify(subredditList)
      });

      return subredditList;
    });

    // Fetch all usernames from Redis using scan
    const [allUserData] = useState(async () => {
      const hScanResponse = await context.redis.hScan('user_subreddits', 0);
      console.log('Redis Data user_subreddits:', hScanResponse);
      const userDataSet = new Set<JSONValue>();
      hScanResponse.fieldValues.forEach((item) => {
        userDataSet.add(item as unknown as JSONValue);
      });

      const userDataList = [...userDataSet]; //

      return userDataList ?? []; // Return all the usernames collected
    });

    // Fetch all usernames from Redis using scan
    const [allUserMatches] = useState(async () => {
      const hScanResponse = await context.redis.hScan('user_friends', 0);
      console.log('Redis Data user_friends:', hScanResponse);
      const userDataSet = new Set<JSONValue>();
      hScanResponse.fieldValues.forEach((item) => {
        userDataSet.add(item as unknown as JSONValue);
      });

      const userMatchesList = [...userDataSet];

      return userMatchesList ?? [];
    });

    const webView = useWebView<WebViewMessage, DevvitMessage>({
      url: 'page.html',
      async onMessage(message, webView) {
        console.log('Received message:', message);
        switch (message.type) {
          case 'webViewReady':
            console.log('Sending initial data:', {
              username,
              subreddits,
              allUserData,
              allUserMatches
            });
            webView.postMessage({
              type: 'initialData',
              data: { username, subreddits, allUserData, allUserMatches }
            });
            break;
          case 'matchUpdate':
            const updatedAllUserMatches = await matchUpdate(message, context);
            // Send the updated data to refresh the UI
            webView.postMessage({
              type: 'refreshData',
              data: {
                username,
                subreddits,
                allUserData,
                allUserMatches: updatedAllUserMatches
              }
            });

            break;
          case 'resetData':
            const updatedAllFriendsMatches = await resetData(message, context);
            // Split the incoming message to extract the user and friend

            webView.postMessage({
              type: 'initialData',
              data: {
                username,
                subreddits,
                allUserData,
                allUserMatches: updatedAllFriendsMatches
              }
            });
            break;
          case 'getSnoovatar':
            const snooUser = (message.data as string)?.toString();
            console.log('Getting Snoovatar for:', snooUser);
            const snoovatar = await context.reddit.getSnoovatarUrl(snooUser);
            console.log('Snoovatar:', snoovatar);
            webView.postMessage({
              type: 'snoovatar',
              data: snoovatar ?? ''
            });
            break;
          default:
            break;
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
            Frienddit
          </text>
          <vstack alignment='start middle'>
            <hstack>
              <text size='medium'>Your Username: &nbsp;</text>
              <text size='medium' weight='bold'>
                {username ? username : 'unknown'}
              </text>
            </hstack>
            <hstack>
              <text size='medium'>Your Subreddits: &nbsp;</text>
              <text size='medium' weight='bold'>
                {subreddits
                  ? subreddits.toString().slice(0, 50) +
                    (subreddits.toString().length > 50 ? '...' : '')
                  : 'None'}
              </text>
            </hstack>
            <hstack>
              <text size='medium'>Current Users: &nbsp;</text>
              <text size='medium' weight='bold'>
                {Array.isArray(allUserData) ? allUserData.length : 'None'}
              </text>
            </hstack>
          </vstack>
          <spacer />
          <button onPress={() => webView.mount()} appearance='primary'>
            🚀 Launch App
          </button>
        </vstack>
      </vstack>
    );
  }
});

export default Devvit;
