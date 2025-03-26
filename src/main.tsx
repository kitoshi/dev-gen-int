import './createPost.js';
import { Devvit, JSONValue, useState, useWebView } from '@devvit/public-api';
import type { DevvitMessage, WebViewMessage } from './message.js';

Devvit.configure({
  redditAPI: true,
  redis: true
});

Devvit.addCustomPostType({
  name: 'Subreddit Friendr',
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
            console.log('Sending match update data:', message.data);
            //split (username, friend) and store in redit as key value pair
            const [user, friend] = (message.data as string)
              .toString()
              .split(',');
            if (message.data !== null) {
              await context.redis.hSet(`user_friends`, {
                [user]: friend
              });
              console.log(
                'User:',
                user,
                'Friend:',
                friend + '\n Set in redis user_friends'
              );
              webView.postMessage({
                type: 'initialData',
                data: { username, subreddits, allUserData, allUserMatches }
              });
              break;
            }
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
            User Subreddit Tracker
          </text>
          <spacer />
          <vstack alignment='start middle'>
            <hstack>
              <text size='medium'>Username:</text>
              <text size='medium' weight='bold'>
                {username ? username : 'unknown'}
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
