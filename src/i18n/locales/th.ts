import type { MessageSchema } from '../types'

const messages: MessageSchema = {
  common: {
    confirm: 'ยืนยัน',
    cancel: 'ยกเลิก',
    back: 'กลับ',
    loading: 'กำลังโหลด…',
  },
  home: {
    title: 'โกหกทอยลูกเต๋า',
    subtitle: 'สไตล์ฮ่องกง · เกมปาร์ตี้',
    createRoom: 'สร้างโต๊ะ',
    joinRoom: 'เข้าร่วม',
    roomCodePlaceholder: 'รหัสห้อง',
    history: 'ประวัติ',
    errorCreate: 'สร้างห้องไม่สำเร็จ',
    errorJoin: 'เข้าร่วมห้องไม่สำเร็จ',
    defaultPlayerName: 'ผู้เล่น',
  },
  langSwitcher: {
    title: 'ภาษา',
    zhHant: '繁體中文',
    zhHans: '简体中文',
    en: 'English',
    th: 'ไทย',
  },
}

export default messages
