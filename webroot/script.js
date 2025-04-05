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
    this.matchUsername = document.querySelector('.match-username');
    this.matchDetails = document.querySelector('.match-details');
    this.cardContainer = document.querySelector('.card-container');
    this.cardFront = document.querySelector('.front');
    this.cardBack = document.querySelector('.back');
    this.output = document.querySelector('#messageOutput');
    this.snooImage = document.querySelector('.snoo');
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

  #addEventListeners = () => {
    this.card.addEventListener('pointerdown', this.#onPointerDown);
    this.card.addEventListener('pointermove', this.#onPointerMove);
    this.card.addEventListener('pointerup', this.#onPointerUp);
    this.card.addEventListener('pointerleave', this.#onPointerUp);
    this.card.addEventListener('touchstart', this.#onPointerDown);
    this.card.addEventListener('touchmove', this.#onPointerMove);
    this.card.addEventListener('touchend', this.#onPointerUp);
    document.getElementById('clearMatches')?.addEventListener('click', () => {
      localStorage.removeItem('doneUsers');
      this.doneUsers = '[]';
      console.log(localStorage.getItem('doneUsers')); // Check if it was removed
      this.#selectDOM();
      fadeOut(this.voteIndicator);
      fadeOut(this.card);
      removeOldCard(this.card);
      postWebViewMessage({
        type: 'resetData',
        data: this.username
      });
    });
    document.getElementById('flip')?.addEventListener('click', () => {
      this.#onCardClick();
    });
  };
  #selectDOM = () => {
    this.usernameLabel = document.querySelector('.profile-data');
    this.matchUsername = document.querySelector('.match-username');
    this.matchDetails = document.querySelector('.match-details');
    this.cardContainer = document.querySelector('.card-container');
    this.snooImage = document.querySelector('.snoo');
    this.card = document.querySelector('.card');
    this.cardFront = document.querySelector('.front');
    this.cardBack = document.querySelector('.back');
    this.startX = 0;
    this.currentX = 0;
    this.dragging = false;
  };
  #onPointerDown = (event) => {
    this.startX = event.clientX || event.touches[0].clientX;
    this.dragging = true;
    this.card.style.transition = 'none';
    this.voteIndicator.innerText = '';
    this.voteIndicator.style.opacity = '0';
  };

  #onPointerMove = (event) => {
    if (!this.dragging) return;
    this.currentX = (event.clientX || event.touches[0].clientX) - this.startX;
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
    fadeOut(this.voteIndicator);
    if (Math.abs(this.currentX) > 100) {
      if (this.currentX > 0) {
        console.log(
          'Posting Upvote Data:',
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
        return;
      }
      console.log('Posting Downvote Data:', this.username.toString());
      if (this.username) {
        postWebViewMessage({
          type: 'matchUpdate',
          data: this.username.toString()
        });
      }
      fadeOut(this.voteIndicator);
      fadeOut(this.card);
      return;
    } else {
      this.card.style.transform = 'translateX(0)';
    }
  };

  #setLocalStorage = (key) => {
    this.doneUsers = JSON.parse(localStorage.getItem('doneUsers')) || [];
    this.doneUsers?.push(key);
    localStorage.setItem('doneUsers', JSON.stringify(this.doneUsers));
  };

  #showMatches = () => {
    createNewMatchCard(this.cardContainer);
    this.#selectDOM();
    this.#addEventListeners();
    this.#getSnooImage(this.username);
    let matches = [];
    let thisUserMatches = [];
    // Clear any previous match details
    this.matchUsername.innerHTML = '';
    for (const user of this.allUserMatches) {
      if (user.field === this.username) {
        // Check if the user is the current user
        thisUserMatches = user.value;
        matches.push(user.value);
      }
    }
    for (const user of this.allUserMatches) {
      if (
        user.field !== this.username &&
        user.value.includes(this.username) &&
        thisUserMatches.includes(user.field)
      ) {
        // Create a hyperlink for each match
        const matchLink = document.createElement('a');
        matchLink.href = `https://www.reddit.com/user/${user.field}`;
        matchLink.innerText = `${user.field}`; // Display the user's name as text

        // Optionally, add a break or space between each match
        const lineBreak = document.createElement('br');

        // Append the match link and line break to the match list
        this.matchUsername.appendChild(matchLink);
        this.matchUsername.appendChild(lineBreak);
      }
    }

    console.log('Matches:', matches);
    fadeIn(this.card);
    shootConfetti();
  };

  #getSnooImage = (username) => {
    console.log('Getting Snoovatar for:', username);
    postWebViewMessage({
      type: 'getSnoovatar',
      data: username
    });
  };

  #hideButtons = () => {
    document.querySelector('.buttons')?.remove();
  };

  #onMessage = (ev) => {
    if (ev.data.type !== 'devvit-message') return;
    const { message } = ev.data.data;
    console.log('Message type:', message?.type);
    this.#selectDOM();
    if (this.output) {
      this.output.replaceChildren(JSON.stringify(message, undefined, 2));
    }
    console.log(message.type?.toString());
    if (this.card == undefined) {
      console.log('Card is undefined');
      this.card = createNewCard(this.cardContainer);
      this.#addEventListeners();
    }
    if (message.type === 'snoovatar') {
      console.log('Snoovatar received:', message.data);
      this.card.style.backgroundImage = `url(${message.data})`; // Set background
    }
    if (message.type === 'initialData' || message.type === 'refreshData') {
      const { username, subreddits, allUserData, allUserMatches } =
        message.data;
      this.username = username;
      this.subreddits = subreddits;
      this.allUserData = allUserData;
      this.allUserMatches = allUserMatches;
      this.doneUsers = JSON.parse(
        localStorage.getItem('doneUsers') !== null
          ? localStorage.getItem('doneUsers')
          : '[]'
      );
      this.#selectDOM();
      switch (message.type) {
        case 'initialData':
          console.log('Entered initialData');
          console.log('Username:', this.username);
          console.log('Subreddits:', this.subreddits);
          console.log('All User Data:', this.allUserData);
          console.log('All User Matches:', this.allUserMatches);
          console.log('Done Users:', this.doneUsers);
          for (const user of this.allUserData) {
            this.userKey = user.field;
            this.userSubreddits = JSON.parse(user.value);
            //filter out this user
            if (this.userKey !== this.username) {
              if (this.doneUsers?.includes(this.userKey)) {
                continue;
              }
              console.log('Current Match User:', this.userKey);
              this.#getSnooImage(this.userKey);
              this.matchUsername.innerText = this.userKey.toString();
              this.matchDetails.innerText =
                this.userSubreddits.toString().length > 100
                  ? this.userSubreddits.toString().slice(0, 100) + '...'
                  : this.userSubreddits.toString();
              this.#setLocalStorage(this.userKey);
              fadeIn(this.card);
              return;
            }
          }
          console.log('No more users to match in InitialData');
          removeOldCard(this.cardContainer);
          this.#showMatches();
          this.#selectDOM();
          this.#addEventListeners();
          return;
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
            this.#getSnooImage(this.userKey);
            this.matchUsername.innerText = this.userKey.toString();
            this.matchDetails.innerText =
              this.userSubreddits.toString().length > 200
                ? this.userSubreddits.toString().slice(0, 200) + '...'
                : this.userSubreddits.toString();
            fadeIn(this.card);
            return;
          }
          console.log('No more users to match in RefreshData');
          fadeOut(this.card);
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
