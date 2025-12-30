import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/utils/axios'

export const useAdminStore = defineStore('admin', () => {
  const pendingFileCount = ref(0)
  const pendingProductCount = ref(0)
  const pendingOrderCount = ref(0)

  const fetchPendingFileCount = async () => {
    try {
      const res: any = await axios.get('/files/pending/count')
      if (res?.code === 200) {
        pendingFileCount.value = res.data || 0
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchPendingProductCount = async () => {
    try {
      const res: any = await axios.get('/products/pending/count')
      if (res?.code === 200) {
        pendingProductCount.value = res.data || 0
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchPendingOrderCount = async () => {
    try {
      const res: any = await axios.get('/orders/pending/count')
      if (res?.code === 200) {
        pendingOrderCount.value = res.data || 0
      }
    } catch (e) {
      console.error(e)
    }
  }

  const refreshAllCounts = () => {
    fetchPendingFileCount()
    fetchPendingProductCount()
    fetchPendingOrderCount()
  }

  return {
    pendingFileCount,
    pendingProductCount,
    pendingOrderCount,
    fetchPendingFileCount,
    fetchPendingProductCount,
    fetchPendingOrderCount,
    refreshAllCounts
  }
})
