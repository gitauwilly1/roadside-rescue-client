export const playNotificationSound = () => {
  try {
    // Check if AudioContext is supported
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Resume audio context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  } catch (error) {
    console.log('Notification sound not supported:', error);
  }
};


export const playNotificationAudio = (soundFile = '/notification.mp3') => {
  try {
    const audio = new Audio(soundFile);
    audio.volume = 0.5;
    audio.play().catch((error) => {
      console.log('Audio play failed, using fallback:', error);
      playNotificationSound();
    });
  } catch (error) {
    console.log('Audio not supported:', error);
    playNotificationSound();
  }
};