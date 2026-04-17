import type { MessageSchema } from '../types'

const messages: MessageSchema = {
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    back: 'Back',
    loading: 'Loading…',
  },
  home: {
    title: 'Liar\'s Dice',
    subtitle: 'HK-style · Party Essential',
    createRoom: 'New Table',
    joinRoom: 'Join',
    roomCodePlaceholder: 'Room Code',
    history: 'History',
    errorCreate: 'Failed to create room',
    errorJoin: 'Failed to join room',
    defaultPlayerName: 'Player',
  },
  langSwitcher: {
    title: 'Language',
    zhHant: '繁體中文',
    zhHans: '简体中文',
    en: 'English',
    th: 'ไทย',
  },
}

export default messages
