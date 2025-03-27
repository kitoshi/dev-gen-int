import {
  createNewCard,
  fadeIn,
  fadeOut,
  shootConfetti,
  removeOldCard,
  createNewMatchCard
} from './utils.js';

class App {
  username;
  subreddits;
  allUserData;
  allUserMatches;
  doneUsers = [];
  userKey;
  userSubreddits;
  constructor() {
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
      data: this.username + ',' + ''
    });
    console.log('Resetting...');
  };

  #addEventListeners = () => {
    this.card.addEventListener('pointerdown', this.#onPointerDown);
    this.card.addEventListener('pointermove', this.#onPointerMove);
    this.card.addEventListener('pointerup', this.#onPointerUp);
    this.card.addEventListener('pointerleave', this.#onPointerUp);
    document.getElementById('clearMatches')?.addEventListener('click', () => {
      localStorage.removeItem('doneUsers');
    });
    document.getElementById('flip')?.addEventListener('click', () => {
      this.#onCardClick();
    });
    document.getElementById('reset')?.addEventListener('click', () => {
      this.#onResetClick();
    });
  };
  #selectDOM = () => {
    this.usernameLabel = document.querySelector('.profile-data');
    this.matchUsername = document.querySelector('.match-username');
    this.matchDetails = document.querySelector('.match-details');
    this.cardContainer = document.querySelector('.card-container');
    this.card = document.querySelector('.card');
    this.startX = 0;
    this.currentX = 0;
    this.dragging = false;
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
          this.username.toString() + ',' + this.userKey.toString()
        );
        if (this.username && this.userKey) {
          postWebViewMessage({
            type: 'matchUpdate',
            data: this.username.toString() + ',' + this.userKey.toString()
          });
        }
        fadeOut(this.voteIndicator);
        fadeOut(this.card);
      }
    } else {
      this.card.style.transform = 'translateX(0)';
    }
  };

  #setLocalStorage = (key) => {
    this.doneUsers = JSON.parse(localStorage.getItem('doneUsers')) || [];
    this.doneUsers.push(key);
    localStorage.setItem('doneUsers', JSON.stringify(this.doneUsers));
  };

  #showMatches = () => {
    createNewMatchCard(this.cardContainer);
    this.#selectDOM();
    let matches = [];
    for (const user of this.allUserMatches) {
      if (user.field !== this.username && user.value.includes(this.username)) {
        matches.push(user.field);
      }
    }
    console.log('Matches:', matches);
    this.matchUsername.innerText = matches;
    fadeIn(this.card);
    shootConfetti();
  };

  #hideButtons = () => {
    document.querySelector('.buttons')?.remove();
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
      this.username = username;
      this.subreddits = subreddits;
      this.allUserData = allUserData;
      this.allUserMatches = allUserMatches;
      switch (message.type) {
        case 'initialData':
          console.log('Entered initialData');
          console.log('Username:', this.username);
          console.log('Subreddits:', this.subreddits);
          console.log('All User Data:', this.allUserData);
          console.log('All User Matches:', this.allUserMatches);
          console.log('Done Users:', this.doneUsers);
          fadeIn(this.card);
          localStorage.setItem('doneUsers', '[]');
          for (const user of this.allUserData) {
            this.userKey = user.field;
            this.userSubreddits = JSON.parse(user.value);
            //filter out this user
            if (this.userKey !== this.username) {
              //filter out already matched users

              console.log('Current Match User:', this.userKey);
              this.matchUsername.innerText = this.userKey.toString();
              this.matchDetails.innerText = this.userSubreddits.toString();
              this.#setLocalStorage(this.userKey);

              return;
            }

            console.log('No more users to match in InitialData');
          }
          break;
        case 'refreshData':
          removeOldCard(this.cardContainer);

          console.log('Entered refreshData');
          console.log('Username:', this.username);
          console.log('Subreddits:', this.subreddits);
          console.log('All User Data:', this.allUserData);
          console.log('All User Matches:', this.allUserMatches);
          console.log('Done Users:', this.doneUsers);
          for (const user of this.allUserData) {
            this.userKey = user.field;
            this.userSubreddits = JSON.parse(user.value);
            //done users is an array, if userKey is not in doneUsers array
            console.log('Current iteration User:', this.userKey);
            if (this.userKey == this.username) {
              continue;
            }
            if (this.doneUsers?.includes(this.userKey)) {
              continue;
            }
            //matchUser is key value is array of users
            createNewCard(this.cardContainer);
            this.#selectDOM();
            this.#addEventListeners();
            this.#setLocalStorage(this.userKey);

            this.output = document.querySelector('#messageOutput');

            this.matchUsername.innerText = this.userKey.toString();
            this.matchDetails.innerText = this.userSubreddits.toString();
            fadeIn(this.card);

            return;
          }

          console.log('No more users to match in RefreshData');
          this.#hideButtons();
          return this.#showMatches();

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
