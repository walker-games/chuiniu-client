import { Howl } from 'howler'

const sounds: Record<string, Howl> = {}

function loadSound(name: string, src: string) {
  sounds[name] = new Howl({ src: [src], preload: true })
}

export function useAudio() {
  function init() {
    loadSound('shake', '/sounds/dice-shake.mp3')
    loadSound('reveal', '/sounds/dice-reveal.mp3')
    loadSound('bid', '/sounds/bid-tap.mp3')
    loadSound('challenge', '/sounds/gong.mp3')
    loadSound('punishment', '/sounds/drum.mp3')
  }

  function play(name: string) { sounds[name]?.play() }
  function stop(name: string) { sounds[name]?.stop() }

  return { init, play, stop }
}
