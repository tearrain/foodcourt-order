import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fc-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const lang = localStorage.getItem('fc-locale') || 'en'
  config.headers['Accept-Language'] = lang
  // Session ID for guest cart
  let sessionId = localStorage.getItem('fc-session')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('fc-session', sessionId)
  }
  config.headers['X-Session-ID'] = sessionId
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || err.message
    return Promise.reject(new Error(msg))
  }
)

// Food Courts
export const getFoodCourt = (id: string) => api.get(`/food-courts/${id}`)
export const getFoodCourts = (params?: Record<string, any>) => api.get('/food-courts', { params })

// Stalls
export const getStalls = (foodCourtId: string, params?: Record<string, any>) =>
  api.get(`/food-courts/${foodCourtId}/stalls`, { params })
export const getStall = (id: string) => api.get(`/stalls/${id}`)
export const getStallDishes = (id: string, params?: Record<string, any>) =>
  api.get(`/stalls/${id}/dishes`, { params })

// Dishes
export const getDishes = (params?: Record<string, any>) => api.get('/dishes', { params })
export const getDish = (id: string) => api.get(`/dishes/${id}`)
export const getRecommendedDishes = (params?: Record<string, any>) =>
  api.get('/dishes/recommended', { params })
export const searchDishes = (params: Record<string, any>) =>
  api.get('/dishes/search', { params })

// Cart
export const getCart = () => api.get('/cart')
export const addToCart = (data: { dish_id: string; quantity: number; customizations?: any[] }) =>
  api.post('/cart/items', data)
export const updateCartItem = (id: string, data: { quantity: number }) =>
  api.patch(`/cart/items/${id}`, data)
export const removeCartItem = (id: string) => api.delete(`/cart/items/${id}`)
export const clearCart = () => api.delete('/cart')

// Orders
export const createOrder = (data: any) => api.post('/orders', data)
export const getOrders = (params?: Record<string, any>) => api.get('/orders', { params })
export const getOrder = (id: string) => api.get(`/orders/${id}`)
export const cancelOrder = (id: string, data: { reason: string }) =>
  api.post(`/orders/${id}/cancel`, data)
export const completeOrder = (id: string) => api.post(`/orders/${id}/complete`)

// Payment
export const createPayment = (data: { order_id: string; payment_method: string }) =>
  api.post('/payment/create', data)
export const getPaymentStatus = (paymentId: string) => api.get(`/payment/status/${paymentId}`)

// Search
export const globalSearch = (params: { q: string; food_court_id?: string }) =>
  api.get('/search', { params })

export default api
