export const playTechBlip = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Tech UI 'blip' sound (futuristic sine sweep)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // Start high
    oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.15); // Drop rapidly
    
    // Envelope for sharp attack and quick release
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.02); // Quick fade in
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15); // Fade out
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playSuccessChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    
    // Play a rising arpeggio (C, E, G, C)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const duration = 0.1; // per note
    
    notes.forEach((freq, i) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'triangle';
      oscillator.frequency.value = freq;
      
      const startTime = audioCtx.currentTime + i * duration;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};
