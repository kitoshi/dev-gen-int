# Frienddit

Frienddit is a web application that allows users to like or dislike profiles of other users based on their subreddit activity. The app provides a card-based interface where users can swipe or vote on profiles, and matches are stored for future reference.

## Features

- **Profile Cards**: View profiles of other users with their subreddit activity.
- **Voting System**: Swipe or click to upvote or downvote a profile.
- **Match Tracking**: Matches are stored and displayed once all profiles have been reviewed.
- **Card Flip**: Flip the card to view additional details or actions.
- **Reset Functionality**: Clear matches or reset user data as needed.
- **Confetti Animation**: Celebrate matches with a confetti animation.

## How It Works

1. **Initial Data**: The app fetches user data, including subreddit activity, from Redis and displays it on cards.
2. **Voting**: Users can upvote or downvote profiles by swiping or clicking buttons.
3. **Matching**: Matches are stored in Redis and displayed once all profiles are reviewed.
4. **Card Flip**: Flip the card to view additional details or actions.
5. **Reset**: Clear matches or reset user data using the provided buttons.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Devvit API with Redis for data storage
- **Animations**: Confetti and card transitions for a smooth user experience

## Usage

1. Launch the app and start reviewing profiles.
2. Use the buttons to flip cards, clear matches, or reset data.
3. Matches are displayed once all profiles are reviewed.

## Development

To contribute or modify the app, edit the files in the `webroot` and `src` directories. The app uses the Devvit API for backend functionality and Redis for data storage.

```shell
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd c:\reddit\dev-gen-int

# Start the development server
npm start
```

## License

This project is licensed under the MIT License.
