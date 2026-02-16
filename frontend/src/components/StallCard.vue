<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  stall: {
    id: string
    name: string
    name_en?: string
    cuisine_type?: string
    logo_url?: string
    cover_image_url?: string
    avg_rating?: number
    total_orders?: number
    is_active?: boolean
  }
}>()

const emit = defineEmits<{ (e: 'click', id: string): void }>()
const { t, locale } = useI18n()
</script>

<template>
  <div
    class="bg-white rounded-xl overflow-hidden shadow-sm"
    @click="emit('click', stall.id)"
  >
    <!-- Cover -->
    <div class="relative h-32">
      <img
        v-if="stall.cover_image_url || stall.logo_url"
        :src="stall.cover_image_url || stall.logo_url"
        :alt="stall.name"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
        <span class="text-white text-2xl font-bold">{{ stall.name.charAt(0) }}</span>
      </div>
      <span
        v-if="stall.is_active !== false"
        class="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full"
      >
        {{ t('stall.open') }}
      </span>
    </div>
    <!-- Info -->
    <div class="p-3">
      <h3 class="font-semibold text-sm truncate">
        {{ locale === 'en' && stall.name_en ? stall.name_en : stall.name }}
      </h3>
      <p v-if="stall.cuisine_type" class="text-xs text-gray-500 mt-0.5">{{ stall.cuisine_type }}</p>
      <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
        <span v-if="stall.avg_rating" class="flex items-center gap-0.5">
          <svg class="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {{ stall.avg_rating?.toFixed(1) }}
        </span>
        <span v-if="stall.total_orders">{{ stall.total_orders }}+ {{ t('stall.orders') }}</span>
      </div>
    </div>
  </div>
</template>
