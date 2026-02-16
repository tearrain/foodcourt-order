import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getFoodCourt } from '@/api'

export const useAppStore = defineStore('app', () => {
  const foodCourtId = ref<string>('')
  const foodCourt = ref<any>(null)
  const loading = ref(false)
  const tableNumber = ref<string>('')

  async function initFoodCourt(id: string) {
    if (foodCourtId.value === id && foodCourt.value) return
    foodCourtId.value = id
    loading.value = true
    try {
      const res: any = await getFoodCourt(id)
      foodCourt.value = res.data
    } catch {
      // handle error
    } finally {
      loading.value = false
    }
  }

  function setTable(num: string) {
    tableNumber.value = num
  }

  return {
    foodCourtId,
    foodCourt,
    loading,
    tableNumber,
    initFoodCourt,
    setTable,
  }
})
