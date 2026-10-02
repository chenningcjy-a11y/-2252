/**
 * Audio synthesis & Vibration utility for the Core Workout Supervisor
 * Enhanced with organic acoustic physical modeling and dynamic prosody TTS
 */

import { COACH_VOICES, getVoicePersona, VoicePersona } from '../data/voices';

class SoundEffects {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Helper to create an organic harmonic tone with soft acoustic envelope
   */
  private createAcousticNote(
    freq: number, 
    startTime: number, 
    duration: number, 
    gainLevel = 0.3,
    type: 'wood' | 'chime' | 'soft' | 'bowl' = 'chime'
  ) {
    if (!this.ctx) return;

    // Master note gain with natural exponential decay
    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    // Fast but smooth attack (prevents mechanical clicking)
    noteGain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.008);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    noteGain.connect(this.ctx.destination);

    // Fundamental oscillator
    const osc1 = this.ctx.createOscillator();
    osc1.type = type === 'wood' ? 'sine' : 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);
    // Subtle organic pitch micro-glide
    if (type === 'wood') {
      osc1.frequency.exponentialRampToValueAtTime(freq * 0.75, startTime + duration);
    }

    // Secondary harmonic overtone for richness
    const osc2 = this.ctx.createOscillator();
    const overtoneGain = this.ctx.createGain();
    const overtoneRatio = type === 'bowl' ? 1.5 : (type === 'wood' ? 2.76 : 2.0);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * overtoneRatio, startTime);
    overtoneGain.gain.setValueAtTime(gainLevel * 0.35, startTime);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.6);

    // Warm Low-pass filter for organic softness
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'wood' ? 1400 : 3800, startTime);
    filter.Q.setValueAtTime(type === 'bowl' ? 4 : 1.5, startTime);

    osc1.connect(filter);
    osc2.connect(overtoneGain);
    overtoneGain.connect(filter);
    filter.connect(noteGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.05);
    osc2.stop(startTime + duration + 0.05);
  }

  // Play synthetic acoustic tones with natural musicality
  public playTone(type: 'rep' | 'switch' | 'rest' | 'countdown' | 'go' | 'complete' | 'tick', volume = 0.8) {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      if (type === 'tick') {
        // Organic wooden metronome tick / gentle kalimba tap
        this.createAcousticNote(680, now, 0.045, volume * 0.22, 'wood');
      } else if (type === 'rep') {
        // Nimble, lively crystal-marimba chime (F#5 / 739.99 Hz with warm octave)
        this.createAcousticNote(739.99, now, 0.22, volume * 0.45, 'chime');
      } else if (type === 'switch') {
        // Dynamic rising 3-note arpeggio (G5 -> B5 -> E6) for nimble side switch
        const arpeggio = [783.99, 987.77, 1318.51];
        arpeggio.forEach((freq, idx) => {
          this.createAcousticNote(freq, now + idx * 0.09, 0.28, volume * 0.38, 'chime');
        });
      } else if (type === 'rest') {
        // Ambient Tibetan singing bowl / lush Rhodes harmonic chord (D4 + A4 + F#5)
        const chord = [293.66, 440.0, 739.99];
        chord.forEach((freq, idx) => {
          this.createAcousticNote(freq, now + idx * 0.03, 1.1, volume * 0.28, 'bowl');
        });
      } else if (type === 'countdown') {
        // Warm resonant mallet tap
        this.createAcousticNote(659.25, now, 0.12, volume * 0.35, 'wood');
      } else if (type === 'go') {
        // High energetic dual chime chord (C6 + E6)
        this.createAcousticNote(1046.5, now, 0.35, volume * 0.45, 'chime');
        this.createAcousticNote(1318.51, now + 0.02, 0.38, volume * 0.35, 'chime');
      } else if (type === 'complete') {
        // Triumphant acoustic celebration arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
          this.createAcousticNote(freq, now + idx * 0.08, 0.65, volume * 0.35, 'chime');
        });
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  }
}

export const soundEffects = new SoundEffects();

/**
 * Trigger mobile vibration with fallback
 */
export function triggerVibration(pattern: number | number[] = 100, enabled = true, withHapticTone = true) {
  if (!enabled) return;

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration error
    }
  }

  // If haptic tone requested, play a gentle tactile acoustic cue
  if (withHapticTone) {
    soundEffects.playTone('tick', 0.25);
  }
}

/**
 * Text-to-speech voice announcer with natural neural voice matching & prosody
 */
function matchSystemVoice(persona: VoicePersona): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const targetLang = persona.preferredLang || 'zh-CN';
  const langPrefix = targetLang.toLowerCase().slice(0, 2);
  const langVoices = voices.filter(v => v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix));

  if (langVoices.length > 0) {
    // 1. First priority: Seek high-quality neural/natural voice models (Edge Natural, Siri, Google Natural)
    const hints = persona.naturalnessHint ? persona.naturalnessHint.split(',') : [];
    for (const hint of hints) {
      const matched = langVoices.find(v => v.name.toLowerCase().includes(hint.trim().toLowerCase()));
      if (matched) return matched;
    }

    // 2. Look for explicit Natural/Online/Neural tags
    const naturalVoice = langVoices.find(v => {
      const lower = v.name.toLowerCase();
      return lower.includes('natural') || lower.includes('online') || lower.includes('neural') || lower.includes('premium');
    });
    if (naturalVoice) return naturalVoice;

    // 3. Gender preference matching
    if (persona.gender === 'female') {
      const femaleVoice = langVoices.find(v => {
        const lower = v.name.toLowerCase();
        return lower.includes('female') || lower.includes('woman') || lower.includes('girl') ||
               lower.includes('tingting') || lower.includes('yaoyao') || lower.includes('xiaoxiao') ||
               lower.includes('xiaoyi') || lower.includes('sinji') || lower.includes('meijia') ||
               lower.includes('zira') || lower.includes('samantha') || lower.includes('victoria');
      });
      if (femaleVoice) return femaleVoice;
    } else if (persona.gender === 'male') {
      const maleVoice = langVoices.find(v => {
        const lower = v.name.toLowerCase();
        return lower.includes('male') || lower.includes('man') || lower.includes('guy') ||
               lower.includes('kangkang') || lower.includes('yunyang') || lower.includes('yunxi') ||
               lower.includes('yunjian') || lower.includes('david') || lower.includes('george') ||
               lower.includes('alex') || lower.includes('fred');
      });
      if (maleVoice) return maleVoice;
    }

    return langVoices[0];
  }

  // Fallback to any voice available
  return voices[0] || null;
}

/**
 * Humanize spoken text with natural phrasing & breath marks to avoid robotic delivery
 */
function humanizeSpeechText(text: string): string {
  let natural = text;
  // Convert pure numbers in counting into energetic Chinese characters with natural pacing
  if (/^\d+$/.test(text.trim())) {
    const num = parseInt(text.trim(), 10);
    const numMap = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];
    natural = numMap[num] || text;
  }
  return natural;
}

export function speakText(
  text: string, 
  options?: { 
    interrupt?: boolean; 
    voiceId?: string;
    lang?: string;
    rate?: number; 
    volume?: number; 
    enabled?: boolean;
    pitchOffset?: number;
  }
) {
  if (options?.enabled === false) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    if (options?.interrupt) {
      window.speechSynthesis.cancel();
    }

    const persona = getVoicePersona(options?.voiceId);
    const targetLang = options?.lang || persona.preferredLang || 'zh-CN';
    const processedText = targetLang.startsWith('zh') ? humanizeSpeechText(text) : text;
    const utterance = new SpeechSynthesisUtterance(processedText);
    
    // Check if a specific language is requested (like ko-KR)
    if (options?.lang && options.lang.startsWith('ko')) {
      const allVoices = window.speechSynthesis.getVoices() || [];
      const koreanVoice = allVoices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith('ko'));
      if (koreanVoice) {
        utterance.voice = koreanVoice;
      }
      utterance.lang = 'ko-KR';
    } else {
      const voice = matchSystemVoice(persona);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = targetLang;
      }
    }

    // Persona-tuned acoustic parameters with natural expressiveness
    utterance.pitch = Math.max(0.6, Math.min(1.8, persona.pitch + (options?.pitchOffset || 0)));
    utterance.rate = (options?.rate ?? 1.0) * (options?.lang?.startsWith('ko') ? 0.95 : persona.rate);
    utterance.volume = options?.volume ?? 1.0;

    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech errors
  }
}

export function previewVoicePersona(persona: VoicePersona, volume = 1.0) {
  speakText(persona.previewText, {
    interrupt: true,
    voiceId: persona.id,
    volume,
    enabled: true,
  });
}

export function cancelSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

