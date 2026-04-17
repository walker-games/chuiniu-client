import type { MessageSchema } from '../types'

const messages: MessageSchema = {
  common: {
    confirm: '確認',
    cancel: '取消',
    back: '返回',
    loading: '載入中…',
  },
  home: {
    title: '吹牛骰子',
    subtitle: '港式骰盅 · 派對必備',
    createRoom: '開 桌',
    joinRoom: '入座',
    roomCodePlaceholder: '房間號',
    history: '查看戰績',
    errorCreate: '創建房間失敗',
    errorJoin: '加入房間失敗',
    defaultPlayerName: '玩家',
  },
  langSwitcher: {
    title: '選擇語言',
    zhHant: '繁體中文',
    zhHans: '简体中文',
    en: 'English',
    th: 'ไทย',
  },
}

export default messages
