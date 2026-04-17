<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { showActionSheet } from 'vant'
import { setLocale, type Locale, SUPPORTED_LOCALES } from '@/i18n'

const { t, locale } = useI18n()

const current = computed(() => locale.value as Locale)

const labelMap: Record<Locale, string> = {
  'zh-Hant': '繁體中文',
  'zh-Hans': '简体中文',
  'en': 'English',
  'th': 'ไทย',
}

function openSwitcher() {
  showActionSheet({
    title: t('langSwitcher.title'),
    actions: SUPPORTED_LOCALES.map((loc) => ({
      name: labelMap[loc],
      color: loc === current.value ? '#c49a38' : undefined,
    })),
    cancelText: t('common.cancel'),
    onSelect: (_, index) => {
      const picked = SUPPORTED_LOCALES[index]
      setLocale(picked)
    },
    closeOnClickAction: true,
  })
}
</script>

<template>
  <button class="lang-switcher" :aria-label="t('langSwitcher.title')" @click="openSwitcher">
    <span class="lang-icon">🌐</span>
  </button>
</template>

<style scoped>
.lang-switcher {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid oklch(72% 0.14 75 / 0.2);
  background: oklch(16% 0.03 55 / 0.6);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 120ms, border-color 120ms;
}
.lang-switcher:active {
  transform: scale(0.92);
  border-color: oklch(72% 0.14 75 / 0.5);
}
.lang-icon {
  font-size: 16px;
  line-height: 1;
}
</style>
