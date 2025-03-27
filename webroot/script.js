import {
  createNewCard,
  fadeIn,
  fadeOut,
  shootConfetti,
  removeOldCard
} from './utils.js';

class App {
  constructor() {
    this.doneUsers = JSON.parse(localStorage.getItem('doneUsers')) || [];

    this.card = document.querySelector('.card');
    this.usernameLabel = document.querySelector('.profile-data');
    this.matchUsername = document.querySelector('.match-username');
    this.matchDetails = document.querySelector('.match-details');
    this.cardContainer = document.querySelector('.card-container');
    this.cardFront = document.querySelector('.front');
    this.cardBack = document.querySelector('.back');
    this.output = document.querySelector('#messageOutput');
    this.startX = 0;
    this.currentX = 0;
    this.dragging = false;

    // Create vote indicators
    this.voteIndicator = document.createElement('div');
    this.voteIndicator.classList.add('vote-indicator');
    this.card.parentElement.appendChild(this.voteIndicator);

    // Style vote indicator
    Object.assign(this.voteIndicator.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '2rem',
      fontWeight: 'bold',
      opacity: '0',
      transition: 'opacity 0.2s ease-out',
      pointerEvents: 'none'
    });

    // Drag event listeners
    this.#addEventListeners();
    addEventListener('message', this.#onMessage);
    addEventListener('load', () => {
      postWebViewMessage({ type: 'webViewReady' });
    });
  }
  #onCardClick = () => {
    console.log('Card clicked! Flipping...');
    if (this.card.querySelector('.back').style.display === 'block') {
      this.card.querySelector('.back').style.display = 'none'; // Hide the back
      this.card.querySelector('.front').style.display = 'block'; // Show the front
      return;
    }
    this.card.querySelector('.front').style.display = 'none'; // Hide the front
    this.card.querySelector('.back').style.display = 'block'; // Show the back
  };
  #onResetClick = () => {
    postWebViewMessage({
      type: 'resetData',
      data: this.usernameLabel.innerText + ',' + ''
    });
    console.log('Resetting...');
  };

  #addEventListeners = () => {
    this.card.addEventListener('pointerdown', this.#onPointerDown);
    this.card.addEventListener('pointermove', this.#onPointerMove);
    this.card.addEventListener('pointerup', this.#onPointerUp);
    this.card.addEventListener('pointerleave', this.#onPointerUp);
    document.getElementById('clearMatches').addEventListener('click', () => {
      localStorage.removeItem('doneUsers');
    });
    document.getElementById('flip').addEventListener('click', () => {
      this.#onCardClick();
    });
    document.getElementById('reset').addEventListener('click', () => {
      this.#onResetClick();
    });
  };
  #selectDOM = () => {
    this.usernameLabel = document.querySelector('.profile-data');
    this.matchUsername = document.querySelector('.match-username');
    this.matchDetails = document.querySelector('.match-details');
    this.cardContainer = document.querySelector('.card-container');
    this.card = document.querySelector('.card');
  };
  #onPointerDown = (event) => {
    this.startX = event.clientX;
    this.dragging = true;
    this.card.style.transition = 'none';
    this.voteIndicator.innerText = '';
    this.voteIndicator.style.opacity = '0';
  };

  #onPointerMove = (event) => {
    if (!this.dragging) return;
    this.currentX = event.clientX - this.startX;
    this.card.style.transform = `translateX(${this.currentX}px)`;

    if (this.currentX > 50) {
      this.voteIndicator.innerText = 'UPVOTE';
      this.voteIndicator.style.color = 'orange';
      this.voteIndicator.style.opacity = '1';
    } else if (this.currentX < -50) {
      this.voteIndicator.innerText = 'DOWNVOTE';
      this.voteIndicator.style.color = 'purple';
      this.voteIndicator.style.opacity = '1';
    } else {
      this.voteIndicator.style.opacity = '0';
    }
  };

  #onPointerUp = () => {
    if (!this.dragging) return;
    this.dragging = false;
    this.card.style.transition = 'transform 0.3s ease-out';
    this.voteIndicator.style.transition = 'opacity 0.5s ease-out';

    if (Math.abs(this.currentX) > 100) {
      if (this.currentX > 0) {
        console.log(
          'Posting Data:',
          this.usernameLabel.innerText + ',' + this.matchUsername.innerText
        );
        if (this.matchUsername.innerText && this.usernameLabel.innerText) {
          postWebViewMessage({
            type: 'matchUpdate',
            data:
              this.usernameLabel.innerText + ',' + this.matchUsername.innerText
          });
        }
        fadeOut(this.voteIndicator);
        fadeOut(this.card);
        shootConfetti(); // 🎉 Trigger confetti on match
      }
    } else {
      this.card.style.transform = 'translateX(0)';
    }
  };

  #onMessage = (ev) => {
    if (ev.data.type !== 'devvit-message') return;
    const { message } = ev.data.data;
    if (this.output) {
      this.output.replaceChildren(JSON.stringify(message, undefined, 2));
    }
    console.log(message.type.toString());
    if (message.type === 'initialData' || message.type === 'refreshData') {
      const { username, subreddits, allUserData, allUserMatches } =
        message.data;
      this.usernameLabel.innerText = username.toString();

      switch (message.type) {
        case 'initialData':
          console.log('Username:', username);
          console.log('Subreddits:', subreddits);
          console.log('All User Data:', allUserData);
          console.log('All User Matches:', allUserMatches);
          fadeIn(this.card);
          for (const user of allUserData) {
            const userKey = user.field;
            const userSubreddits = JSON.parse(user.value);
            //filter out this user
            if (userKey !== username) {
              //filter out already matched users
              for (const matchUser of allUserMatches) {
                if (!matchUser.value.includes(userKey)) {
                  this.matchUsername.innerText = userKey.toString();
                  this.matchDetails.innerText = userSubreddits.toString();
                  return;
                }
                console.log('No more users to match');
              }
            }
          }
          break;
        case 'refreshData':
          console.log('entered refreshData');
          console.log('Username:', username);
          console.log('Subreddits:', subreddits);
          console.log('All User Data:', allUserData);
          console.log('All User Matches:', allUserMatches);

          for (const user of allUserData) {
            const userKey = user.field;
            const userSubreddits = JSON.parse(user.value);
            if (!this.doneUsers.includes(userKey)) {
              if (userKey !== username) {
                //matchUser is key value is array of users
                for (const matchUser of allUserMatches) {
                  for (const matchUserKey of matchUser.value) {
                    if (matchUserKey == localStorage)
                      removeOldCard(this.cardContainer);
                    createNewCard(this.cardContainer);
                    this.#selectDOM();
                    this.#addEventListeners();
                    if (matchUserKey === username) {
                      this.doneUsers.push(matchUserKey);
                      localStorage.setItem(
                        'doneUsers',
                        JSON.stringify(this.doneUsers)
                      );
                      console.log('Matched user:', userKey);

                      this.output = document.querySelector('#messageOutput');

                      this.matchUsername.innerText = userKey.toString();
                      this.matchDetails.innerText = userSubreddits.toString();

                      console.log('fade in');
                      fadeIn(this.card);

                      return;
                    } else {
                      console.log('No more users to match');
                      this.matchUsername.innerText = userKey.toString();
                      this.matchDetails.innerText = userSubreddits.toString();
                      fadeIn(this.card);

                      return;
                    }
                  }
                }
              }
            }
            console.log('No more users to match');
          }
        default:
          break;
      }
    }
  };
}

function postWebViewMessage(msg) {
  parent.postMessage(msg, '*');
}

new App();
