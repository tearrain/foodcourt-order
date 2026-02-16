<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAdminFoodCourts, getAdminStalls, getAdminDishes, createDish, deleteDish } from '@/api'

const { t } = useI18n()

const foodCourts = ref<any[]>([])
const stalls = ref<any[]>([])
const selectedFc = ref('')
const selectedStall = ref('')
const dishes = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const saving = ref(false)
const form = ref({
  name: '', name_en: '', description: '', price: 0, original_price: 0,
  image_url: '', is_recommended: false, is_spicy: false, is_vegetarian: false,
  has_inventory: false, total_stock: 0,
})

onMounted(async () => {
  try {
    const res: any = await getAdminFoodCourts({ limit: 100 })
    foodCourts.value = res.data || []
    if (foodCourts.value.length) {
      selectedFc.value = foodCourts.value[0].id
      await fetchStalls()
    }
  } catch {
    //
  } finally {
    loading.value = false
  }
})

async function fetchStalls() {
  if (!selectedFc.value) return
  const res: any = await getAdminStalls(selectedFc.value, { limit: 100 })
  stalls.value = res.data || []
  if (stalls.value.length) {
    selectedStall.value = stalls.value[0].id
    fetchDishes()
  } else {
    selectedStall.value = ''
    dishes.value = []
  }
}

async function fetchDishes() {
  if (!selectedStall.value) return
  loading.value = true
  try {
    const res: any = await getAdminDishes(selectedStall.value, { limit: 100 })
    dishes.value = res.data || []
  } catch {
    //
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!selectedStall.value) return
  saving.value = true
  try {
    await createDish(selectedStall.value, { ...form.value, price: Number(form.value.price) })
    showForm.value = false
    form.value = { name: '', name_en: '', description: '', price: 0, original_price: 0, image_url: '', is_recommended: false, is_spicy: false, is_vegetarian: false, has_inventory: false, total_stock: 0 }
    fetchDishes()
  } catch {
    //
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Delete?')) return
  try {
    await deleteDish(id)
    fetchDishes()
  } catch {
    //
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ t('dish.title') }}</h1>
      <button
        class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
        @click="showForm = !showForm"
      >
        {{ t('dish.create') }}
      </button>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-4">
      <select v-model="selectedFc" class="px-3 py-2 border rounded-lg text-sm" @change="fetchStalls">
        <option v-for="fc in foodCourts" :key="fc.id" :value="fc.id">{{ fc.name }}</option>
      </select>
      <select v-model="selectedStall" class="px-3 py-2 border rounded-lg text-sm" @change="fetchDishes">
        <option value="">{{ t('dish.selectStall') }}</option>
        <option v-for="s in stalls" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </div>

    <!-- Create Form -->
    <div v-if="showForm" class="bg-white rounded-xl shadow-sm p-6 mb-6">
      <form @submit.prevent="handleCreate" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('dish.name') }} *</label>
          <input v-model="form.name" required class="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('dish.nameEn') }}</label>
          <input v-model="form.name_en" class="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('dish.price') }} *</label>
          <input v-model="form.price" type="number" step="0.01" required class="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('dish.originalPrice') }}</label>
          <input v-model="form.original_price" type="number" step="0.01" class="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('dish.image') }}</label>
          <input v-model="form.image_url" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://..." />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('dish.description') }}</label>
          <textarea v-model="form.description" class="w-full px-3 py-2 border rounded-lg text-sm" rows="2"></textarea>
        </div>
        <div class="md:col-span-2 flex flex-wrap gap-4">
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="form.is_recommended" class="rounded" />
            {{ t('dish.recommended') }}
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="form.is_spicy" class="rounded" />
            {{ t('dish.spicy') }}
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="form.is_vegetarian" class="rounded" />
            {{ t('dish.vegetarian') }}
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="form.has_inventory" class="rounded" />
            {{ t('dish.stock') }}
          </label>
        </div>
        <div v-if="form.has_inventory">
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('dish.stock') }}</label>
          <input v-model="form.total_stock" type="number" class="w-full px-3 py-2 border rounded-lg text-sm" />
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
            <th class="px-5 py-3 font-medium">{{ t('dish.image') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('dish.name') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('dish.price') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('dish.totalSold') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('common.status') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dish in dishes" :key="dish.id" class="border-b last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3">
              <img v-if="dish.image_url" :src="dish.image_url" class="w-10 h-10 rounded-lg object-cover" />
              <div v-else class="w-10 h-10 rounded-lg bg-gray-100"></div>
            </td>
            <td class="px-5 py-3">
              <div class="font-medium">{{ dish.name }}</div>
              <div v-if="dish.name_en" class="text-xs text-gray-400">{{ dish.name_en }}</div>
            </td>
            <td class="px-5 py-3 font-medium">{{ t('common.currency') }}{{ dish.price?.toFixed(2) }}</td>
            <td class="px-5 py-3">{{ dish.total_sold || 0 }}</td>
            <td class="px-5 py-3">
              <span v-if="dish.is_sold_out" class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{{ t('dish.soldOut') }}</span>
              <span v-else-if="dish.is_available" class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{{ t('dish.available') }}</span>
              <span v-else class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{{ t('common.inactive') }}</span>
            </td>
            <td class="px-5 py-3">
              <button class="text-red-500 hover:text-red-700 text-xs" @click="handleDelete(dish.id)">
                {{ t('common.delete') }}
              </button>
            </td>
          </tr>
          <tr v-if="!dishes.length">
            <td colspan="6" class="px-5 py-8 text-center text-gray-400">{{ t('common.noData') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
