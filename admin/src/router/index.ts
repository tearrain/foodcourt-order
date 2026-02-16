import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/views/AdminLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/Dashboard.vue') },
        { path: 'food-courts', name: 'food-courts', component: () => import('@/views/FoodCourts.vue') },
        { path: 'food-courts/:id', name: 'food-court-detail', component: () => import('@/views/FoodCourtDetail.vue') },
        { path: 'stalls', name: 'stalls', component: () => import('@/views/Stalls.vue') },
        { path: 'stalls/:id', name: 'stall-detail', component: () => import('@/views/StallDetail.vue') },
        { path: 'dishes', name: 'dishes', component: () => import('@/views/Dishes.vue') },
        { path: 'orders', name: 'orders', component: () => import('@/views/Orders.vue') },
        { path: 'orders/:id', name: 'order-detail', component: () => import('@/views/OrderDetail.vue') },
        { path: 'settlements', name: 'settlements', component: () => import('@/views/Settlements.vue') },
        { path: 'settings', name: 'settings', component: () => import('@/views/Settings.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('fc-admin-token')
  if (!to.meta?.public && !token) {
    return { name: 'login' }
  }
})

export default router
