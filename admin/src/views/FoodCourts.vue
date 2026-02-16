<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getAdminFoodCourts, createFoodCourt, deleteFoodCourt } from '@/api'

const router = useRouter()
const { t } = useI18n()

const foodCourts = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const form = ref({ name: '', name_en: '', address: '', city: '', country: 'Malaysia', contact_phone: '', contact_email: '', currency: 'MYR' })
const saving = ref(false)

onMounted(() => fetchList())

async function fetchList() {
  loading.value = true
  try {
    const res: any = await getAdminFoodCourts({ limit: 50 })
    foodCourts.value = res.data || []
  } catch {
    //
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  saving.value = true
  try {
    await createFoodCourt(form.value)
    showForm.value = false
    form.value = { name: '', name_en: '', address: '', city: '', country: 'Malaysia', contact_phone: '', contact_email: '', currency: 'MYR' }
    fetchList()
  } catch {
    //
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Delete this food court?')) return
  try {
    await deleteFoodCourt(id)
    fetchList()
  } catch {
    //
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ t('foodCourt.title') }}</h1>
      <button
        class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
        @click="showForm = !showForm"
      >
        {{ t('foodCourt.create') }}
      </button>
    </div>

    <!-- Create Form -->
    <div v-if="showForm" class="bg-white rounded-xl shadow-sm p-6 mb-6">
      <form @submit.prevent="handleCreate" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('foodCourt.name') }} *</label>
          <input v-model="form.name" required class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('foodCourt.country') }}</label>
          <input v-model="form.country" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('foodCourt.phone') }}</label>
          <input v-model="form.contact_phone" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('foodCourt.currency') }}</label>
          <select v-model="form.currency" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="MYR">MYR</option>
            <option value="SGD">SGD</option>
            <option value="IDR">IDR</option>
            <option value="THB">THB</option>
            <option value="CNY">CNY</option>
          </select>
        </div>
        <div class="md:col-span-2 flex gap-3 justify-end">
          <button type="button" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800" @click="showForm = false">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" :disabled="saving" class="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
            {{ saving ? t('common.loading') : t('common.save') }}
          </button>
        </div>
      </form>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto"></div>
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b bg-gray-50">
            <th class="px-5 py-3 font-medium">{{ t('foodCourt.name') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('foodCourt.city') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('foodCourt.stallCount') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('foodCourt.currency') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('common.status') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fc in foodCourts" :key="fc.id" class="border-b last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 font-medium">{{ fc.name }}</td>
            <td class="px-5 py-3 text-gray-500">{{ fc.city || '-' }}</td>
            <td class="px-5 py-3">{{ fc.stall_count || 0 }}</td>
            <td class="px-5 py-3">{{ fc.currency || 'MYR' }}</td>
            <td class="px-5 py-3">
              <span class="px-2 py-1 rounded-full text-xs" :class="fc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ fc.is_active ? t('common.active') : t('common.inactive') }}
              </span>
            </td>
            <td class="px-5 py-3">
              <div class="flex gap-2">
                <button class="text-primary-600 hover:text-primary-800 text-xs" @click="router.push(`/food-courts/${fc.id}`)">
                  {{ t('common.edit') }}
                </button>
                <button class="text-red-500 hover:text-red-700 text-xs" @click="handleDelete(fc.id)">
                  {{ t('common.delete') }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!foodCourts.length">
            <td colspan="6" class="px-5 py-8 text-center text-gray-400">{{ t('common.noData') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
