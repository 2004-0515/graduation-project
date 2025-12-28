import { defineStore } from 'pinia'
import { ref } from 'vue'
import notificationApi from '@/api/notificationApi'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)

  const fetchUnreadCount = async () => {
    try {
      const res: any = await notificationApi.getUnreadCount()
      if (res?.code === 200) {
        unreadCount.value = res.data || 0
      }
    } catch {
      // ignore
    }
  }

  const decreaseCount = (count: number = 1) => {
    unreadCount.value = Math.max(0, unreadCount.value - count)
  }

  const clearCount = () => {
    unreadCount.value = 0
  }

  const setCount = (count: number) => {
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
