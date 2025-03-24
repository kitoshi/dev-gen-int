class App {
  constructor() {
    this.card = document.querySelector('.card');
    this.usernameLabel = document.querySelector('.profile-data');
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
    this.card.addEventListener('pointerdown', this.#onPointerDown);
    this.card.addEventListener('pointermove', this.#onPointerMove);
    this.card.addEventListener('pointerup', this.#onPointerUp);
    this.card.addEventListener('pointerleave', this.#onPointerUp);

    addEventListener('message', this.#onMessage);
    addEventListener('load', () => {
      postWebViewMessage({ type: 'webViewReady' });
    });
  }

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
      this.voteIndicator.innerText = 'LIKE';
      this.voteIndicator.style.color = 'orange';
      this.voteIndicator.style.opacity = '1';
    } else if (this.currentX < -50) {
      this.voteIndicator.innerText = 'DISLIKE';
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
      this.card.style.transition =
        'transform 0.3s ease-out, opacity 0.5s ease-out';
      this.card.style.opacity = '0';
      setTimeout(() => {
        this.card.style.display = 'none'; // Hide after fade-out
      }, 500);
    } else {
      this.card.style.transform = 'translateX(0)';
    }

    setTimeout(() => {
      this.voteIndicator.style.opacity = '0';
    }, 500);
  };

  #onMessage = (ev) => {
    if (ev.data.type !== 'devvit-message') return;
    const { message } = ev.data.data;
    if (this.output) {
      this.output.replaceChildren(JSON.stringify(message, undefined, 2));
    }
    console.log(message.toString());

    if (message.type === 'initialData') {
      const { username, subreddits, allUserData } = message.data;
      this.usernameLabel.innerText = username.toString();
    }
  };
}

function postWebViewMessage(msg) {
  parent.postMessage(msg, '*');
}

new App();
