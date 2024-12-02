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

def generate_sweep(start_freq, end_freq, duration, wave_type='square', sample_rate=22050):
    t = np.linspace(0, duration, int(sample_rate * duration))
    freq = np.linspace(start_freq, end_freq, len(t))
    phase = 2 * np.pi * np.cumsum(freq) / sample_rate
    
    if wave_type == 'square':
        wave = np.sign(np.sin(phase))
    elif wave_type == 'triangle':
        wave = 2 * np.abs(2 * (phase/(2*np.pi) - np.floor(0.5 + phase/(2*np.pi)))) - 1
    else:
        wave = np.sin(phase)
    
    return wave

def generate_arcade_hit(duration=0.1):
    # Sharp arcade hit sound
    t = np.linspace(0, duration, int(22050 * duration))
    freq1 = 880  # A5
    freq2 = 1760 # A6
    
    wave1 = generate_retro_wave(freq1, duration, 'square')
    wave2 = generate_retro_wave(freq2, duration, 'square')
    wave = 0.7 * wave1 + 0.3 * wave2
    
    envelope = np.exp(-10 * np.linspace(0, 1, len(wave)))
    return wave * envelope

def generate_bounce_sound(duration=0.08):
    # Quick bounce using square wave
    return generate_sweep(440, 880, duration, 'square')

def generate_break_sound(duration=0.15):
    # Explosive break sound
    t = np.linspace(0, duration, int(22050 * duration))
    freq1 = generate_sweep(880, 220, duration, 'square')  # Descending sweep
    freq2 = np.random.uniform(-1, 1, len(t))  # Noise
    wave = 0.7 * freq1 + 0.3 * freq2
    
    envelope = np.exp(-5 * np.linspace(0, 1, len(wave)))
    return wave * envelope

def generate_game_over_sound(duration=0.6):
    # Classic arcade game over
    waves = []
    freqs = [440, 415, 392, 370]  # Descending chromatic
    subduration = duration / len(freqs)
    
    for freq in freqs:
        wave = generate_retro_wave(freq, subduration, 'square')
        waves.append(wave)
    
    wave = np.concatenate(waves)
    envelope = np.exp(-2 * np.linspace(0, 1, len(wave)))
    return wave * envelope

def generate_start_sound(duration=0.5):
    # Energetic start sound
    waves = []
    freqs = [440, 554, 659, 880]  # A4, C#5, E5, A5
    subduration = duration / len(freqs)
    
    for freq in freqs:
        wave = generate_retro_wave(freq, subduration, 'square')
        waves.append(wave)
    
    wave = np.concatenate(waves)
    envelope = np.exp(-1 * np.linspace(0, 1, len(wave)))
    return wave * envelope

def generate_click_sound(duration=0.05):
    # Sharp click sound
    t = np.linspace(0, duration, int(22050 * duration))
    freq = 1500  # High frequency for sharp click
    
    wave = generate_retro_wave(freq, duration, 'square')
    envelope = np.exp(-20 * np.linspace(0, 1, len(wave)))
    return wave * envelope

def apply_retro_envelope(wave, attack=0.01, decay=0.1, sustain=0.5, release=0.1):
    samples = len(wave)
    attack_samples = int(attack * samples)
    decay_samples = int(decay * samples)
    release_samples = int(release * samples)
    sustain_samples = samples - attack_samples - decay_samples - release_samples
    
    envelope = np.zeros(samples)
    envelope[:attack_samples] = np.linspace(0, 1, attack_samples)
    envelope[attack_samples:attack_samples+decay_samples] = np.linspace(1, sustain, decay_samples)
    envelope[attack_samples+decay_samples:attack_samples+decay_samples+sustain_samples] = sustain
    envelope[-release_samples:] = np.linspace(sustain, 0, release_samples)
    
    return wave * envelope

def bit_crush(wave, bits=4):  
    max_val = 2**(bits-1) - 1
    wave = np.round(wave * max_val) / max_val
    return wave

def generate_sound_effect(filename, **kwargs):
    sample_rate = 22050
    
    if kwargs.get('type') == 'blip':
        wave = generate_blip_sound(kwargs.get('duration', 0.3))
    elif kwargs.get('type') == 'bounce':
        wave = generate_bounce_sound(kwargs.get('duration', 0.3))
    elif kwargs.get('type') == 'break':
        wave = generate_break_sound(kwargs.get('duration', 0.35))
    elif kwargs.get('type') == 'game_over':
        wave = generate_game_over_sound(kwargs.get('duration', 0.8))
    elif kwargs.get('type') == 'start':
        wave = generate_start_sound(kwargs.get('duration', 0.7))
    elif kwargs.get('type') == 'click':
        wave = generate_click_sound(kwargs.get('duration', 0.15))
    elif kwargs.get('type') == 'arcade_hit':
        wave = generate_arcade_hit(kwargs.get('duration', 0.1))
    
    # Apply envelope unless it's a special effect
    if not kwargs.get('type') in ['blip', 'bounce', 'break', 'game_over', 'start', 'click', 'arcade_hit']:
        wave = apply_retro_envelope(
            wave,
            kwargs.get('attack', 0.01),
            kwargs.get('decay', 0.1),
            kwargs.get('sustain', 0.5),
            kwargs.get('release', 0.1)
        )
    
    # Apply bit crushing for more retro feel
    wave = bit_crush(wave, kwargs.get('bits', 4))
    
    # Normalize and convert to 16-bit PCM
    wave = np.int16(wave * 32767)
    
    # Save the wave file
    wavfile.write(filename, sample_rate, wave)

# Create sounds directory if it doesn't exist
import os
if not os.path.exists('sounds'):
    os.makedirs('sounds')

# Generate arcade-style sound effects
effects = {
    'paddle_hit': {
        'type': 'arcade_hit',
        'duration': 0.1,
        'bits': 4
    },
    'wall_hit': {
        'type': 'bounce',
        'duration': 0.08,
        'bits': 4
    },
    'brick_break': {
        'type': 'break',
        'duration': 0.15,
        'bits': 4
    },
    'game_over': {
        'type': 'game_over',
        'duration': 0.6,
        'bits': 4
    },
    'game_start': {
        'type': 'start',
        'duration': 0.5,
        'bits': 4
    },
    'button_click': {
        'type': 'click',
        'duration': 0.05,
        'bits': 4
    }
}

for name, params in effects.items():
    if params.get('type') == 'arcade_hit':
        wave = generate_arcade_hit(params.get('duration'))
    elif params.get('type') == 'bounce':
        wave = generate_bounce_sound(params.get('duration'))
    elif params.get('type') == 'break':
        wave = generate_break_sound(params.get('duration'))
    elif params.get('type') == 'game_over':
        wave = generate_game_over_sound(params.get('duration'))
    elif params.get('type') == 'start':
        wave = generate_start_sound(params.get('duration'))
    elif params.get('type') == 'click':
        wave = generate_click_sound(params.get('duration'))
    
    # Apply bit crushing for more retro feel
    wave = bit_crush(wave, params.get('bits', 4))
    
    # Normalize and convert to 16-bit PCM
    wave = np.int16(wave * 32767)
    
    # Save the wave file
    wavfile.write(f'sounds/{name}.wav', 22050, wave)
    print(f"Generated {name}.wav")
