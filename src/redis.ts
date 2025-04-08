import { Devvit, JSONValue } from '@devvit/public-api';

export async function matchUpdate(
  message: {
    data: JSONValue;
    type: 'matchUpdate';
  },
  context: Devvit.Context
) {
  console.log('Sending match update data:', message.data);

  // Split the incoming message to extract the user and friend
  const dataString = (message.data as string).toString();
  const [user, newFriend] = dataString.split(',');

  if (user && newFriend) {
    const existingFriends = await context.redis.hGet('user_friends', user);

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

  return updatedAllUserMatches;
}

export async function resetData(
  message: {
    data: JSONValue;
    type: 'resetData';
  },
  context: Devvit.Context
) {
  const resetString = (message.data as string).toString();
  console.log('Reset string:', resetString);
  const resetUser = resetString;
  const numFieldsRemoved = await context.redis.hDel('user_subreddits', [
    resetUser
  ]);
  const numRemoved = await context.redis.hDel('user_friends', [resetUser]);
  console.log(
    'Resetting data: ',

    resetUser,

    numFieldsRemoved
  );
  console.log('Resetting data user_friends: ', numRemoved);

  // Fetch the updated list of all user matches from Redis
  let hScanResponseFriends = await context.redis.hScan('user_friends', 0);
  console.log('Redis Data user_friends:', hScanResponseFriends);
  let friendMatchesSet = new Set<JSONValue>();
  hScanResponseFriends.fieldValues.forEach((item) => {
    friendMatchesSet.add(item as unknown as JSONValue);
  });

  let updatedAllFriendsMatches = [...friendMatchesSet];
  return updatedAllFriendsMatches;
}

export async function getAllUsersSubreddits(context: Devvit.Context) {
  const hScanResponse = await context.redis.hScan('user_subreddits', 0);
  console.log('Redis Data user_subreddits:', hScanResponse);
  const userDataSet = new Set<JSONValue>();
  hScanResponse.fieldValues.forEach((item) => {
    userDataSet.add(item as unknown as JSONValue);
  });

  const userDataList = [...userDataSet]; //

  return userDataList ?? []; // Return all the usernames collected
}

export async function getAllUsersMatches(context: Devvit.Context) {
  const hScanResponse = await context.redis.hScan('user_friends', 0);
  console.log('Redis Data user_friends:', hScanResponse);
  const userDataSet = new Set<JSONValue>();
  hScanResponse.fieldValues.forEach((item) => {
    userDataSet.add(item as unknown as JSONValue);
  });

  const userMatchesList = [...userDataSet];

  return userMatchesList ?? [];
}

export async function getCurrentUserSubreddits(
  context: Devvit.Context,
  username?: string
) {
  if (!username) return []; // Ensure username is available

  // Fetch user data (returns a Listing<Post | Comment>)
  const userData = context.reddit.getCommentsAndPostsByUser({
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
}
