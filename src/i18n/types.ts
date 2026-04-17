export type MessageSchema = {
  common: {
    confirm: string
    cancel: string
    back: string
    loading: string
  }
  home: {
    title: string
    subtitle: string
    createRoom: string
    joinRoom: string
    roomCodePlaceholder: string
    history: string
    errorCreate: string
    errorJoin: string
    defaultPlayerName: string
  }
  langSwitcher: {
    title: string
    zhHant: string
    zhHans: string
    en: string
    th: string
  }
}
