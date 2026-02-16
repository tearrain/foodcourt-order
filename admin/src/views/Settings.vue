<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'

const { t, locale } = useI18n()

function changeLang(lang: string) {
  setLocale(lang)
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t('nav.settings') }}</h1>

    <div class="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
      <!-- Language -->
      <div class="mb-6">
        <h3 class="font-medium mb-3">Language / 语言</h3>
        <div class="flex gap-3">
          <button
            class="px-4 py-2 rounded-lg text-sm transition-colors"
            :class="locale === 'en' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            @click="changeLang('en')"
          >
            English
          </button>
          <button
            class="px-4 py-2 rounded-lg text-sm transition-colors"
            :class="locale === 'zh-CN' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            @click="changeLang('zh-CN')"
          >
            中文
          </button>
        </div>
      </div>

      <!-- Platform Info -->
      <div>
        <h3 class="font-medium mb-3">Platform</h3>
        <div class="text-sm text-gray-500 space-y-2">
          <p>FoodCourt Order System v0.1.0</p>
          <p>Backend: Cloudflare Workers</p>
          <p>Database: Cloudflare D1</p>
        </div>
      </div>
    </div>
  </div>
</template>
