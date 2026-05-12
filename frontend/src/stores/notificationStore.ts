import { defineStore } from 'pinia'
import { ref } from 'vue'
import notificationApi from '@/api/notificationApi'
import { debugError } from '@/utils/debug'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)
  let latestUnreadCountRequestId = 0
  const invalidateUnreadCountRequests = () => {
    latestUnreadCountRequestId += 1
  }

  const getResponseMessage = (response: { message?: string } | null | undefined, fallback: string) =>
    response?.message || fallback

  const fetchUnreadCount = async () => {
    const requestId = ++latestUnreadCountRequestId
    try {
      const res: any = await notificationApi.getUnreadCount()
      if (requestId !== latestUnreadCountRequestId) {
        return
      }
      if (res?.code === 200) {
        unreadCount.value = res.data || 0
      } else {
        debugError('获取未读通知数失败:', getResponseMessage(res, '未读通知数返回异常'))
      }
    } catch (error) {
      if (requestId !== latestUnreadCountRequestId) {
        return
      }
      debugError('获取未读通知数失败:', error)
    }
  }

  const decreaseCount = (count: number = 1) => {
    invalidateUnreadCountRequests()
    unreadCount.value = Math.max(0, unreadCount.value - count)
  }

  const clearCount = () => {
    invalidateUnreadCountRequests()
    unreadCount.value = 0
  }

  const setCount = (count: number) => {
    invalidateUnreadCountRequests()
    unreadCount.value = count
  }

  return {
    unreadCount,
    fetchUnreadCount,
    decreaseCount,
    clearCount,
    setCount
  }
})
