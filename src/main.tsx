import './redis.js';
import {
  Devvit,
  JSONValue,
  useAsync,
  useState,
  useWebView
} from '@devvit/public-api';
import type { DevvitMessage, WebViewMessage } from './message.js';
import {
  getAllUsersMatches,
  getAllUsersSubreddits,
  getCurrentUserSubreddits,
  matchUpdate,
  resetData
} from './redis.js';

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
      return await getCurrentUserSubreddits(context, username);
    });

    const { data: allUsersSubreddits, loading: allUsersSubredditsLoading } =
      useAsync(async () => {
        return await getAllUsersSubreddits(context);
      });

    const { data: allUsersMatches, loading: allUsersMatchesLoading } = useAsync(
      async () => {
        return await getAllUsersMatches(context);
      }
    );

    const webView = useWebView<WebViewMessage, DevvitMessage>({
      url: 'page.html',
      async onMessage(message, webView) {
        console.log('Received message:', message);
        switch (message.type) {
          case 'webViewReady':
            console.log('Sending initial data:', {
              username,
              subreddits,
              allUserData: allUsersSubreddits,
              allUserMatches: allUsersMatches
            });
            webView.postMessage({
              type: 'initialData',
              data: {
                username,
                subreddits,
                allUserData: allUsersSubreddits,
                allUserMatches: allUsersMatches
              }
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
                allUserData: allUsersSubreddits,
                allUserMatches: updatedAllUserMatches
              }
            });

            break;
          case 'resetData':
            const updatedAllFriendsMatches = await resetData(message, context);
            webView.postMessage({
              type: 'initialData',
              data: {
                username,
                subreddits,
                allUserData: allUsersSubreddits,
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
                {Array.isArray(allUsersSubreddits)
                  ? allUsersSubreddits.length
                  : 'None'}
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
