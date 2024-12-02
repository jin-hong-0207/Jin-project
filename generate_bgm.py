import numpy as np
from scipy.io import wavfile

def generate_retro_wave(freq, duration, wave_type='square', sample_rate=22050):
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    if wave_type == 'square':
        wave = np.sign(np.sin(2 * np.pi * freq * t))
    elif wave_type == 'triangle':
        wave = 2 * np.abs(2 * (t * freq - np.floor(0.5 + t * freq))) - 1
    elif wave_type == 'saw':
        wave = 2 * (t * freq - np.floor(0.5 + t * freq))
    else:
        wave = np.sin(2 * np.pi * freq * t)
    
    return wave

def generate_arpeggio(base_freq, duration=0.2, pattern=[0, 4, 7, 12]):
    waves = []
    subduration = duration / len(pattern)
    
    for semitones in pattern:
        freq = base_freq * (2 ** (semitones/12))
        wave = generate_retro_wave(freq, subduration, 'square')
        waves.append(wave)
    
    return np.concatenate(waves)

def generate_bgm(duration=30.0, tempo=120):
    sample_rate = 22050
    total_samples = int(sample_rate * duration)
    beat_samples = int(sample_rate * 60 / tempo)
    
    # Base frequencies for our melody
    base_freqs = [440, 392, 349, 440]  # A4, G4, F4, A4
    
    # Generate melody pattern
    melody = []
    for freq in base_freqs:
        # Create an arpeggio for each base frequency
        pattern = generate_arpeggio(freq, 60/tempo)
        melody.extend([pattern] * 4)  # Repeat each arpeggio 4 times
    
    # Repeat the entire melody pattern to fill the duration
    full_melody = np.tile(np.concatenate(melody), int(np.ceil(total_samples / len(np.concatenate(melody)))))
    
    # Generate bassline
    bass_freq = 110  # A2
    bass_pattern = generate_retro_wave(bass_freq, 60/tempo * 4, 'square')
    full_bass = np.tile(bass_pattern, int(np.ceil(total_samples / len(bass_pattern))))
    
    # Mix melody and bass
    wave = 0.6 * full_melody[:total_samples] + 0.4 * full_bass[:total_samples]
    
    # Add bit crushing for retro feel
    bits = 4
    max_val = 2**(bits-1) - 1
    wave = np.round(wave * max_val) / max_val
    
    # Normalize and convert to 16-bit PCM
    wave = np.int16(wave * 32767)
    
    # Save as WAV file
    wavfile.write('sounds/background.wav', sample_rate, wave)
    print("Generated background.wav")

if __name__ == "__main__":
    generate_bgm()
