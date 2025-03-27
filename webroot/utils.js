export function fadeIn(element) {
  console.log('Fading in card...');
  element.style.display = 'block';
  element.style.opacity = '1';
  element.style.pointerEvents = 'auto';
  element.style.transform = 'translateX(0)';
  element.style.transition =
    'opacity 0.5s ease-in-out, transform 0.5s ease-out';
}

export function fadeOut(element) {
  console.log('Fading out card...');
  element.style.transition = 'opacity 0.5s ease-in-out';
  element.style.opacity = '0';
}

export function shootConfetti() {
  const confettiCount = 100;
  const confettiColors = ['#ff0', '#f0f', '#0ff', '#0f0', '#f00', '#00f'];

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.backgroundColor =
      confettiColors[Math.floor(Math.random() * confettiColors.length)];
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
    document.body.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 5000); // Added delay to allow confetti to animate
  }
}

export function createNewCard(cardContainer) {
  console.log('Creating new card...');

  const card = document.createElement('div');
  card.classList.add('card');

  const front = document.createElement('div');
  front.classList.add('front');

  const detailsWrapper = document.createElement('div');

  const profileData = document.createElement('p');
  profileData.classList.add('profile-data');
  profileData.innerText = 'Profile Details Here';

  const matchUsername = document.createElement('p');
  matchUsername.classList.add('match-username');

  const matchDetails = document.createElement('p');
  matchDetails.classList.add('match-details');
  const back = document.createElement('div');
  back.classList.add('back');
  back.innerText = 'Back of card';

  // Append elements to card
  detailsWrapper.appendChild(profileData);
  detailsWrapper.appendChild(matchUsername);
  detailsWrapper.appendChild(matchDetails);

  card.appendChild(front);
  front.appendChild(detailsWrapper);
  card.appendChild(back);

  const buttons = document.createElement('div');
  buttons.classList.add('buttons');
  //add flip button
  const flipButton = document.createElement('button');
  flipButton.id = 'flip';
  flipButton.innerText = 'Flip';
  buttons.appendChild(flipButton);
  card.appendChild(buttons);
  card.style.display = 'none';
  // Append the card to the container
  cardContainer.appendChild(card);
  return card;
}

export function createNewMatchCard(cardContainer) {
  console.log('Creating new card...');

  const card = document.createElement('div');
  card.classList.add('card');

  const detailsWrapper = document.createElement('div');

  const profileData = document.createElement('p');
  profileData.classList.add('profile-data');
  profileData.innerText = 'Your Matches!';

  const matchUsername = document.createElement('p');
  matchUsername.classList.add('match-username');

  const matchDetails = document.createElement('p');
  matchDetails.classList.add('match-details');

  // Append elements to card
  detailsWrapper.appendChild(profileData);
  detailsWrapper.appendChild(matchUsername);
  detailsWrapper.appendChild(matchDetails);
  card.appendChild(detailsWrapper);

  card.style.display = 'none';
  // Append the card to the container
  cardContainer.appendChild(card);
  return card;
}

export function removeOldCard() {
  console.log('Removing old card...');
  const card = document.querySelector('.card');
  if (card) {
    card.remove();
  }
}
