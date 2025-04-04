import './createPost.js';
import { Devvit, JSONValue, useState, useWebView } from '@devvit/public-api';
import type { DevvitMessage, WebViewMessage } from './message.js';

Devvit.configure({
  redditAPI: true,
  redis: true
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
            console.log('Sending match update data:', message.data);

            // Split the incoming message to extract the user and friend
            const dataString = (message.data as string).toString();
            const [user, newFriend] = dataString.split(',');

            if (user && newFriend) {
              const existingFriends = await context.redis.hGet(
                'user_friends',
                user
              );

              // Always treat Redis data as JSON
              let friendsArray = [];
              if (existingFriends) {
                try {
                  friendsArray = JSON.parse(existingFriends);
                  if (!Array.isArray(friendsArray)) {
                    throw new Error('Parsed value is not an array');
                  }
                } catch (error) {
                  console.error('Error parsing existing friends list:', error);
                  friendsArray = [];
                }
              }

              // Append new friend if not already present
              if (!friendsArray.includes(newFriend)) {
                friendsArray.push(newFriend);
              }

              // Store as JSON string
              await context.redis.hSet('user_friends', {
                [user]: JSON.stringify(friendsArray)
              });

              console.log(
                'User:',
                user,
                'Updated Friends List:',
                friendsArray,
                '\nUpdated in Redis user_friends'
              );
            }

            // Fetch the updated list of all user matches from Redis
            let hScanResponse = await context.redis.hScan('user_friends', 0);
            console.log('Redis Data user_friends:', hScanResponse);
            let userMatchesSet = new Set<JSONValue>();
            hScanResponse.fieldValues.forEach((item) => {
              userMatchesSet.add(item as unknown as JSONValue);
            });

            let updatedAllUserMatches = [...userMatchesSet];

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
            // Split the incoming message to extract the user and friend
            const resetString = (message.data as string).toString();
            console.log('Reset string:', resetString);
            const resetUser = resetString;
            const numFieldsRemoved = await context.redis.hDel(
              'user_subreddits',
              [resetUser]
            );
            const numRemoved = await context.redis.hDel('user_friends', [
              resetUser
            ]);
            console.log(
              'Resetting data: ',

              resetUser,

              numFieldsRemoved
            );
            console.log('Resetting data user_friends: ', numRemoved);

            // Fetch the updated list of all user matches from Redis
            let hScanResponseFriends = await context.redis.hScan(
              'user_friends',
              0
            );
            console.log('Redis Data user_friends:', hScanResponseFriends);
            let friendMatchesSet = new Set<JSONValue>();
            hScanResponseFriends.fieldValues.forEach((item) => {
              friendMatchesSet.add(item as unknown as JSONValue);
            });

            let updatedAllFriendsMatches = [...friendMatchesSet];

            // Send the updated data to refresh the UI
            webView.postMessage({
              type: 'refreshData',
              data: {
                username,
                subreddits,
                allUserData,
                allUserMatches: updatedAllFriendsMatches
              }
            });

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
                {subreddits ? subreddits.toString() : 'None'}
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
