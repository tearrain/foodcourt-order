<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getAdminFoodCourts, getAdminStalls, createStall } from '@/api'

const router = useRouter()
const { t } = useI18n()

const foodCourts = ref<any[]>([])
const selectedFc = ref('')
const stalls = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const saving = ref(false)
const form = ref({ name: '', name_en: '', cuisine_type: '', description: '', zone: '', booth_number: '' })

onMounted(async () => {
  try {
    const res: any = await getAdminFoodCourts({ limit: 100 })
    foodCourts.value = res.data || []
    if (foodCourts.value.length) {
      selectedFc.value = foodCourts.value[0].id
      fetchStalls()
    }
  } catch {
    //
  } finally {
    loading.value = false
  }
})

async function fetchStalls() {
  if (!selectedFc.value) return
  loading.value = true
  try {
    const res: any = await getAdminStalls(selectedFc.value, { limit: 100 })
    stalls.value = res.data || []
  } catch {
    //
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!selectedFc.value) return
  saving.value = true
  try {
    await createStall(selectedFc.value, form.value)
    showForm.value = false
    form.value = { name: '', name_en: '', cuisine_type: '', description: '', zone: '', booth_number: '' }
    fetchStalls()
  } catch {
    //
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ t('stall.title') }}</h1>
      <button
        class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
        @click="showForm = !showForm"
      >
        {{ t('stall.create') }}
      </button>
    </div>

    <!-- Food Court Selector -->
    <div class="mb-4">
      <select
        v-model="selectedFc"
        class="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        @change="fetchStalls"
      >
        <option value="">{{ t('stall.selectFoodCourt') }}</option>
        <option v-for="fc in foodCourts" :key="fc.id" :value="fc.id">{{ fc.name }}</option>
      </select>
    </div>

    <!-- Create Form -->
    <div v-if="showForm" class="bg-white rounded-xl shadow-sm p-6 mb-6">
      <form @submit.prevent="handleCreate" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('stall.name') }} *</label>
          <input v-model="form.name" required class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('stall.name') }} (EN)</label>
          <input v-model="form.name_en" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('stall.cuisineType') }}</label>
          <input v-model="form.cuisine_type" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('stall.zone') }}</label>
          <input v-model="form.zone" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('stall.booth') }}</label>
          <input v-model="form.booth_number" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div class="md:col-span-2 flex gap-3 justify-end">
          <button type="button" class="px-4 py-2 text-sm text-gray-600" @click="showForm = false">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="saving" class="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50">
            {{ saving ? t('common.loading') : t('common.save') }}
          </button>
        </div>
      </form>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b bg-gray-50">
            <th class="px-5 py-3 font-medium">{{ t('stall.name') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('stall.cuisineType') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('stall.zone') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('stall.rating') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('common.status') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stall in stalls" :key="stall.id" class="border-b last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 font-medium">{{ stall.name }}</td>
            <td class="px-5 py-3 text-gray-500">{{ stall.cuisine_type || '-' }}</td>
            <td class="px-5 py-3">{{ stall.zone || '-' }} {{ stall.booth_number || '' }}</td>
            <td class="px-5 py-3">{{ stall.avg_rating?.toFixed(1) || '-' }}</td>
            <td class="px-5 py-3">
              <span class="px-2 py-1 rounded-full text-xs" :class="stall.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ stall.is_active ? t('common.active') : t('common.inactive') }}
              </span>
            </td>
            <td class="px-5 py-3">
              <button class="text-primary-600 hover:text-primary-800 text-xs" @click="router.push(`/stalls/${stall.id}`)">
                {{ t('common.edit') }}
              </button>
            </td>
          </tr>
          <tr v-if="!stalls.length">
            <td colspan="6" class="px-5 py-8 text-center text-gray-400">{{ t('common.noData') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
