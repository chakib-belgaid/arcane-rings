# Project Circles Game Audio

Date: 2026-06-04

## Scope

This pass covers the showable browser build: one looping background music bed and action sounds for menu selection, overlay navigation, ring interaction, hints, reference/coupling panels, blocked feedback, and completion.

## Audio Direction

Project Circles should sound like a restrained mystical restoration tool. The palette is soft metallic clicks, glass harmonics, low air, and warm resolved chords. Audio supports focus and feedback; it should not compete with the circular image puzzle.

Music direction:

- `circles_01_moonlit_garden_menu_loop.wav` is the menu background loop.
- `circles_02_emerald_rotation_gameplay_loop.wav` is the active puzzle background loop.
- `circles_03_circle_solved_success_stinger.wav` is the solved-state stinger.
- Music stays quiet enough that ring commits and hint sounds remain readable.

Mix targets:

- Music: low priority bed, about 44 percent element volume after asset normalization.
- Ring and UI actions: medium priority, short tails, no harsh transients.
- Completion: highest non-critical cue, longer chord, still below clipping.

## Event List

| Event | Asset | Trigger | Accessibility note |
| --- | --- | --- | --- |
| Menu background loop | `circles_01_moonlit_garden_menu_loop.wav` | Menu screen after first user interaction when Music is enabled | Never conveys gameplay state alone |
| Gameplay background loop | `circles_02_emerald_rotation_gameplay_loop.wav` | Puzzle screen after first user interaction when Music is enabled | Never conveys gameplay state alone |
| UI select | `sfx_ui_select_01.wav` | Menu, level, settings, retry, primary actions | Visual button state already exists |
| UI back | `sfx_ui_back_01.wav` | Modal close, Escape, menu return, undo | Visual navigation state already exists |
| Ring select | `sfx_puzzle_ring_select_01.wav` | Pointer selects a ring | Selected ring glow is the primary cue |
| Clockwork ring rotation | `sfx_puzzle_tick_01.wav` | Nonzero committed ring rotation, repeated per committed tick up to the sequence cap | Ring movement and move count are visual |
| Hint reveal | `sfx_puzzle_hint_01.wav` | Hint request | Hint modal/text and highlighted ring remain primary |
| Reference open | `sfx_puzzle_reference_01.wav` | Reference panel open | Fullscreen reference image is primary |
| Coupling open | `sfx_puzzle_coupling_open_01.wav` | Coupling panel open | Coupling table is primary |
| Blocked/soft fail | `sfx_puzzle_blocked_01.wav` | Reserved for disabled or invalid action feedback | Must pair with visible disabled state |
| Completion | `circles_03_circle_solved_success_stinger.wav` | Puzzle solved and win dialog opens | Win dialog and score summary are primary |

Audio event count: 11.
Estimated active asset count: 11 WAV files.

## Technical Implementation

The implementation uses native `HTMLAudioElement` playback so the game does not take on a new runtime dependency. Assets live under `public/assets/audio/` and are referenced by stable public URLs.

Rules:

- Audio is primed only from user gestures to respect browser autoplay policy.
- SFX and music follow existing `soundEffects` and `music` settings.
- Playback failures are ignored safely because audio is optional.
- Short SFX get a small cooldown and pitch variance to reduce repetition.
- Ring rotation uses a short clockwork ratchet sequence so multi-tick drags sound like gear teeth turning.
- User-supplied music pack assets are used for menu, gameplay, and solved-state background audio; generated SFX remain replaceable placeholders.

## Open Follow Ups

- Add separate Music and SFX volume sliders when settings become persistent UI beyond booleans.
- Replace WAV placeholders with mastered OGG/MP3 variants if bundle size becomes important.
- Add captions only if future audio carries story, dialogue, or critical directionality.
