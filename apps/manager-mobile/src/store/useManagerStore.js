import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export const useManagerStore = create()(
  subscribeWithSelector((set, get) => ({
    // Auth & Device
    token: null,
    isLoggedIn: false,
    managerPin: '',
    
    // Live Dashboard Data
    activeShift: null,
    stats: {
      total_sales: 0,
      cash_sales: 0,
      debt_sales: 0,
      digital_sales: 0,
      invoice_count: 0
    },
    latestSales: [],
    isLoading: false,

    // Actions
    setToken: (token) => set({ token, isLoggedIn: !!token }),
    setDashboardData: (data) => set({
      activeShift: data.activeShift,
      stats: data.stats || get().stats,
      latestSales: data.latestSales || [],
      isLoading: false
    }),
    setLoading: (isLoading) => set({ isLoading }),
    logout: () => set({ token: null, isLoggedIn: false })
  }))
)
