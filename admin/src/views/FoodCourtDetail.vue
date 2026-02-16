<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getAdminFoodCourt, updateFoodCourt } from '@/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const id = computed(() => route.params.id as string)

const form = ref<any>({})
const loading = ref(true)
const saving = ref(false)

onMounted(async () => {
  try {
    const res: any = await getAdminFoodCourt(id.value)
    form.value = res.data || {}
  } catch {
    //
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  saving.value = true
  try {
    await updateFoodCourt(id.value, form.value)
    router.back()
  } catch {
    //
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <button @click="router.back()" class="text-gray-500 hover:text-gray-700">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold">{{ form.name || t('common.loading') }}</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm p-6">
      <form @submit.prevent="handleSave" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('foodCourt.name') }}</label>
          <input v-model="form.name" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('foodCourt.name') }} (EN)</label>
          <input v-model="form.name_en" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('foodCourt.address') }}</label>
          <input v-model="form.address" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('foodCourt.city') }}</label>
          <input v-model="form.city" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('foodCourt.phone') }}</label>
          <input v-model="form.contact_phone" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('foodCourt.taxRate') }}</label>
          <input v-model="form.tax_rate" type="number" step="0.01" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('foodCourt.commissionRate') }}</label>
          <input v-model="form.platform_commission_rate" type="number" step="0.01" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div class="md:col-span-2 flex justify-end gap-3 pt-4">
          <button type="button" class="px-4 py-2 text-sm text-gray-600" @click="router.back()">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="saving" class="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
            {{ saving ? t('common.loading') : t('common.save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
