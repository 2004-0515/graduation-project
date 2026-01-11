import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/utils/axios'

export const useAdminStore = defineStore('admin', () => {
  const pendingFileCount = ref(0)
  const pendingProductCount = ref(0)
  const pendingOrderCount = ref(0) // 待审核取消申请数量

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

  // 获取待审核取消申请数量（管理员需要处理的）
  const fetchPendingOrderCount = async () => {
    try {
      const res: any = await axios.get('/orders/cancel-requests/count')
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
