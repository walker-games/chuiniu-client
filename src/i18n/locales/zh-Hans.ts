import type { MessageSchema } from '../types'

const messages: MessageSchema = {
  common: {
    confirm: '确认',
    cancel: '取消',
    back: '返回',
    loading: '加载中…',
  },
  home: {
    title: '吹牛骰子',
    subtitle: '港式骰盅 · 派对必备',
    createRoom: '开 桌',
    joinRoom: '入座',
    roomCodePlaceholder: '房间号',
    history: '查看战绩',
    errorCreate: '创建房间失败',
    errorJoin: '加入房间失败',
    defaultPlayerName: '玩家',
  },
  langSwitcher: {
    title: '选择语言',
    zhHant: '繁體中文',
    zhHans: '简体中文',
    en: 'English',
    th: 'ไทย',
  },
}

export default messages
