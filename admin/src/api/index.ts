import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fc-admin-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fc-admin-token')
      window.location.href = '/login'
    }
    return Promise.reject(new Error(err.response?.data?.message || err.message))
  }
)

// Auth
export const adminLogin = (data: { email: string; password: string }) =>
  api.post('/auth/login', { ...data, role: 'admin' })

// Food Courts
export const getAdminFoodCourts = (params?: any) => api.get('/admin/food-courts', { params })
export const getAdminFoodCourt = (id: string) => api.get(`/admin/food-courts/${id}`)
export const createFoodCourt = (data: any) => api.post('/admin/food-courts', data)
export const updateFoodCourt = (id: string, data: any) => api.put(`/admin/food-courts/${id}`, data)
export const deleteFoodCourt = (id: string) => api.delete(`/admin/food-courts/${id}`)

// Stalls
export const getAdminStalls = (foodCourtId: string, params?: any) =>
  api.get(`/admin/food-courts/${foodCourtId}/stalls`, { params })
export const getAdminStall = (id: string) => api.get(`/admin/stalls/${id}`)
export const createStall = (foodCourtId: string, data: any) =>
  api.post(`/admin/food-courts/${foodCourtId}/stalls`, data)
export const updateStall = (id: string, data: any) => api.put(`/admin/stalls/${id}`, data)
export const deleteStall = (id: string) => api.delete(`/admin/stalls/${id}`)

// Dishes
export const getAdminDishes = (stallId: string, params?: any) =>
  api.get(`/admin/stalls/${stallId}/dishes`, { params })
export const getAdminDish = (id: string) => api.get(`/admin/dishes/${id}`)
export const createDish = (stallId: string, data: any) =>
  api.post(`/admin/stalls/${stallId}/dishes`, data)
export const updateDish = (id: string, data: any) => api.put(`/admin/dishes/${id}`, data)
export const deleteDish = (id: string) => api.delete(`/admin/dishes/${id}`)

// Orders
export const getAdminOrders = (params?: any) => api.get('/admin/orders', { params })
export const getAdminOrder = (id: string) => api.get(`/admin/orders/${id}`)
export const confirmOrder = (id: string) => api.post(`/admin/orders/${id}/confirm`)
export const prepareOrder = (id: string) => api.post(`/admin/orders/${id}/prepare`)
export const readyOrder = (id: string) => api.post(`/admin/orders/${id}/ready`)
export const completeOrder = (id: string) => api.post(`/admin/orders/${id}/complete`)
export const cancelAdminOrder = (id: string, data?: any) => api.post(`/admin/orders/${id}/cancel`, data)

// Stats
export const getAdminStats = () => api.get('/admin/stats/overview')
export const getAdminOrderStats = (params?: any) => api.get('/admin/stats/orders', { params })

// Settlements
export const getSettlements = (params?: any) => api.get('/admin/settlements', { params })

export default api
