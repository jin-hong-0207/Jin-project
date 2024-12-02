import os
import requests

def download_file(url, filename):
    response = requests.get(url)
    if response.status_code == 200:
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"Downloaded {filename}")
    else:
        print(f"Failed to download {filename}")

# Create sounds directory if it doesn't exist
if not os.path.exists('sounds'):
    os.makedirs('sounds')

# Sound effects from freesound.org (CC0 License)
sounds = {
    'paddle_hit': 'https://cdn.freesound.org/sounds/415/415912-4929185a-7836-4793-9c47-e6e502a4bfdb?filename=415912__michorvath__ping-pong-ball-hit.mp3',
    'wall_hit': 'https://cdn.freesound.org/sounds/4/4359-7-98047534-e943-4df0-a0a4-67b76864e1e6?filename=4359__noisecollector__pongblipf4.mp3',
    'brick_break': 'https://cdn.freesound.org/sounds/446/446115-783df607-aa61-4a7c-93bd-b366c3982e84?filename=446115__justinvoke__bricks-break.mp3',
    'game_over': 'https://cdn.freesound.org/sounds/277/277403-3615eb64-5a43-4a8a-b671-a2bc161227d7?filename=277403__landlucky__game-over-sfx.mp3',
    'game_start': 'https://cdn.freesound.org/sounds/142/142608-8b4e663c-46c4-4a5c-a613-1a7531f5c849?filename=142608__autistic-lucario__start.mp3',
    'button_click': 'https://cdn.freesound.org/sounds/522/522640-76268032-f6e2-4886-a534-7c9aa90a4800?filename=522640__colorscrimsontears__bleep-button.mp3'
}

for name, url in sounds.items():
    download_file(url, f'sounds/{name}.mp3')
