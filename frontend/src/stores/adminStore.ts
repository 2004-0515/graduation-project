import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/utils/axios'
import { debugError } from '@/utils/debug'

export const useAdminStore = defineStore('admin', () => {
  const pendingFileCount = ref(0)
  const pendingProductCount = ref(0)
  const pendingOrderCount = ref(0) // 待审核取消申请数量
  let latestPendingFileCountRequestId = 0
  let latestPendingProductCountRequestId = 0
  let latestPendingOrderCountRequestId = 0
  const invalidatePendingFileCountRequests = () => {
    latestPendingFileCountRequestId += 1
  }
  const invalidatePendingProductCountRequests = () => {
    latestPendingProductCountRequestId += 1
  }
  const invalidatePendingOrderCountRequests = () => {
    latestPendingOrderCountRequestId += 1
  }

  const logBusinessFailure = (label: string, res: any) => {
    debugError(`${label}:`, res?.message || `业务返回异常 code=${res?.code ?? 'unknown'}`)
  }

  const fetchPendingFileCount = async () => {
    const requestId = ++latestPendingFileCountRequestId
    try {
      const res: any = await axios.get('/files/pending/count')
      if (requestId !== latestPendingFileCountRequestId) {
        return
      }
      if (res?.code === 200) {
        pendingFileCount.value = res.data || 0
      } else {
        logBusinessFailure('获取待审核文件数量失败', res)
      }
    } catch (e) {
      if (requestId !== latestPendingFileCountRequestId) {
        return
      }
      debugError('获取待审核文件数量失败', e)
    }
  }

  const fetchPendingProductCount = async () => {
    const requestId = ++latestPendingProductCountRequestId
    try {
      const res: any = await axios.get('/products/pending/count')
      if (requestId !== latestPendingProductCountRequestId) {
        return
      }
      if (res?.code === 200) {
        pendingProductCount.value = res.data || 0
      } else {
        logBusinessFailure('获取待审核商品数量失败', res)
      }
    } catch (e) {
      if (requestId !== latestPendingProductCountRequestId) {
        return
      }
      debugError('获取待审核商品数量失败', e)
    }
  }

  // 获取待审核取消申请数量（管理员需要处理的）
  const fetchPendingOrderCount = async () => {
    const requestId = ++latestPendingOrderCountRequestId
    try {
      const res: any = await axios.get('/orders/cancel-requests/count')
      if (requestId !== latestPendingOrderCountRequestId) {
        return
      }
      if (res?.code === 200) {
        pendingOrderCount.value = res.data || 0
      } else {
        logBusinessFailure('获取待审核取消申请数量失败', res)
      }
    } catch (e) {
      if (requestId !== latestPendingOrderCountRequestId) {
        return
      }
      debugError('获取待审核取消申请数量失败', e)
    }
  }

  const refreshAllCounts = () => {
    fetchPendingFileCount()
    fetchPendingProductCount()
    fetchPendingOrderCount()
  }

  const setPendingFileCount = (count: number) => {
    invalidatePendingFileCountRequests()
    pendingFileCount.value = Math.max(0, count)
  }

  const decreasePendingFileCount = (count: number = 1) => {
    invalidatePendingFileCountRequests()
    pendingFileCount.value = Math.max(0, pendingFileCount.value - count)
  }

  const setPendingProductCount = (count: number) => {
    invalidatePendingProductCountRequests()
    pendingProductCount.value = Math.max(0, count)
  }

  const decreasePendingProductCount = (count: number = 1) => {
    invalidatePendingProductCountRequests()
    pendingProductCount.value = Math.max(0, pendingProductCount.value - count)
  }

  const setPendingOrderCount = (count: number) => {
    invalidatePendingOrderCountRequests()
    pendingOrderCount.value = Math.max(0, count)
  }

  const decreasePendingOrderCount = (count: number = 1) => {
    invalidatePendingOrderCountRequests()
    pendingOrderCount.value = Math.max(0, pendingOrderCount.value - count)
  }

  return {
    pendingFileCount,
    pendingProductCount,
    pendingOrderCount,
    fetchPendingFileCount,
    fetchPendingProductCount,
    fetchPendingOrderCount,
    refreshAllCounts,
    setPendingFileCount,
    decreasePendingFileCount,
    setPendingProductCount,
    decreasePendingProductCount,
    setPendingOrderCount,
    decreasePendingOrderCount
  }
})
