function fadeIn(element) {
  console.log('Fading in card...'); // Debugging log

  element.style.removeProperty('display'); // Remove inline `display: none`
  element.style.display = 'block'; // Ensure it's visible
  element.style.opacity = '0';
  element.style.pointerEvents = 'auto'; // Allow interaction
  element.style.transform = 'translateX(0)'; // Reset position
  element.style.transition =
    'opacity 0.5s ease-in-out, transform 0.3s ease-out';

  setTimeout(() => {
    element.style.opacity = '1';
  }, 10);
}

function shootConfetti() {
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
    }, 5000);
  }
}
