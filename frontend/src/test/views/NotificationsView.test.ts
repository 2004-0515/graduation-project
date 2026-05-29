import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import notificationApi from '@/api/notificationApi'
import { buildUser } from '@/test/helpers/factories'
import { useNotificationStore } from '@/stores/notificationStore'
import { useUserStore } from '@/stores/userStore'
import * as debugModule from '@/utils/debug'
import NotificationsView from '@/views/NotificationsView.vue'

const messages = {
  success: vi.spyOn(ElMessage, 'success').mockImplementation(() => '' as any),
  error: vi.spyOn(ElMessage, 'error').mockImplementation(() => '' as any),
  warning: vi.spyOn(ElMessage, 'warning').mockImplementation(() => '' as any)
}

const messageBox = {
  confirm: vi.spyOn(ElMessageBox, 'confirm')
}

const mockedNotificationApi = vi.mocked(notificationApi) as any

vi.spyOn(notificationApi, 'getNotifications')
vi.spyOn(notificationApi, 'markAsRead')
vi.spyOn(notificationApi, 'markAllAsRead')
vi.spyOn(notificationApi, 'deleteNotification')
vi.spyOn(notificationApi, 'clearAll')

const debugError = vi.spyOn(debugModule, 'debugError').mockImplementation(() => {})

let pinia: ReturnType<typeof createPinia>
let router: Router
let mockPush: any
let userStore: ReturnType<typeof useUserStore>

const mockUserStore = {
  get userInfo() {
    return userStore.userInfo
  },
  set userInfo(value) {
    userStore.userInfo = value as any
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const mountView = () =>
  mount(NotificationsView, {
    global: {
      plugins: [pinia, router],
      directives: {
        loading: {}
      },
      stubs: {
        Navbar: true,
        Footer: true,
        ElDialog: {
          props: ['modelValue', 'title'],
          emits: ['update:modelValue'],
          template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>'
        },
        ElButton: {
          template: '<button @click="$emit(\'click\')"><slot /></button>'
        }
      }
    }
  })

describe('NotificationsView', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    userStore.token = 'token'
    mockUserStore.userInfo = buildUser({ id: 1, username: 'buyer', role: 'BUYER' })
    useNotificationStore().setCount(0)

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/notifications', component: { template: '<div />' } },
        { path: '/order/:id', component: { template: '<div />' } },
        { path: '/orders', component: { template: '<div />' } },
        { path: '/seller-orders', component: { template: '<div />' } },
        { path: '/admin/orders', component: { template: '<div />' } },
        { path: '/price-alerts', component: { template: '<div />' } },
        { path: '/product/:id', component: { template: '<div />' } },
        { path: '/coupon/:id', component: { template: '<div />' } },
        { path: '/promotions', component: { template: '<div />' } },
        { path: '/admin/files', component: { template: '<div />' } },
        { path: '/profile', component: { template: '<div />' } },
        { path: '/admin/products', component: { template: '<div />' } },
        { path: '/my-products', component: { template: '<div />' } }
      ]
    })
    await router.push('/notifications')
    await router.isReady()
    mockPush = vi.spyOn(router, 'push')

    mockedNotificationApi.getNotifications.mockResolvedValue({ code: 200, data: [] } as any)
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 } as any)
    mockedNotificationApi.markAllAsRead.mockResolvedValue({ code: 200 } as any)
    mockedNotificationApi.deleteNotification.mockResolvedValue({ code: 200 } as any)
    mockedNotificationApi.clearAll.mockResolvedValue({ code: 200 } as any)
    messageBox.confirm.mockResolvedValue('confirm' as any)
    debugError.mockImplementation(() => {})
  })

  it('routes order notifications to order detail when relatedId exists', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 2,
          type: 'order',
          title: '订单状态更新',
          message: '您的订单 ORD-88 待发货',
          relatedId: 88,
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }
      ]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '查看订单')!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/order/88')
  })

  it('routes seller shipment notifications to seller orders', async () => {
    mockUserStore.userInfo = buildUser({ id: 2, username: 'lisi', role: 'SELLER' })
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 3,
          type: 'order',
          title: '新订单待发货',
          message: '用户购买了您的商品，请尽快发货',
          relatedId: 99,
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }
      ]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '查看订单')!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/seller-orders')
  })

  it('does not route non-seller shipment-looking notifications to seller orders', async () => {
    mockUserStore.userInfo = buildUser({ id: 1, username: 'zhangsan', role: 'BUYER' })
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 31,
          type: 'order',
          title: '新订单待发货',
          message: '用户购买了您的商品，请尽快发货',
          relatedId: 99,
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }
      ]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '查看订单')!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/order/99')
  })

  it('routes admin order notifications without own-order wording to admin orders', async () => {
    mockUserStore.userInfo = buildUser({ id: 1, username: 'admin', role: 'ADMIN' })
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 4,
          type: 'order',
          title: '订单状态更新',
          message: '用户订单 ORD-99 已申请取消',
          relatedId: 99,
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }
      ]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '查看订单')!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/admin/orders')
  })

  it('routes price alerts without product id to price alerts list', async () => {
    mockUserStore.userInfo = buildUser({ id: 1, username: 'buyer', role: 'BUYER' })
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 1,
          type: 'price_alert',
          title: '价格提醒',
          message: '您关注的商品已降价至 99 元',
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }
      ]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '查看商品')!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/price-alerts')
  })

  it('routes price alerts with product id to product detail', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 21,
          type: 'promotion',
          title: '降价提醒',
          message: '您关注的商品已降价至 79 元',
          relatedId: 66,
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }
      ]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '查看商品')!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/product/66')
  })

  it('routes legacy price-change notifications to product detail instead of coupon detail', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 22,
          type: 'promotion',
          title: '关注商品价格提醒',
          message: '数据增强:您关注的「绿色街车摩托」近期价格有变化，可进入商品详情查看走势。',
          relatedId: 77,
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }
      ]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('价格提醒')
    expect(wrapper.findAll('button').some((button) => button.text() === '查看优惠券')).toBe(false)

    await wrapper.findAll('button').find((button) => button.text() === '查看商品')!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/product/77')
  })

  it('does not show an error when user cancels clearing notifications', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 5,
          type: 'system',
          title: '系统消息',
          message: '一条通知',
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }
      ]
    })
    messageBox.confirm.mockRejectedValue('cancel')

    const wrapper = mountView()

    await flushPromises()
    const clearButton = wrapper.findAll('button').find((button) => button.text() === '清空')
    await clearButton!.trigger('click')
    await flushPromises()

    expect(mockedNotificationApi.clearAll).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows an error when clearing notifications fails after confirmation', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 6,
          type: 'system',
          title: '系统消息',
          message: '另一条通知',
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }
      ]
    })
    messageBox.confirm.mockResolvedValue(true as any)
    mockedNotificationApi.clearAll.mockRejectedValue({
      response: { data: { message: '清空通知失败，请稍后重试' } }
    })

    const wrapper = mountView()

    await flushPromises()
    const clearButton = wrapper.findAll('button').find((button) => button.text() === '清空')
    await clearButton!.trigger('click')
    await flushPromises()

    expect(mockedNotificationApi.clearAll).toHaveBeenCalled()
    expect(messages.error).toHaveBeenCalledWith('清空通知失败，请稍后重试')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows an error when loading notifications fails', async () => {
    mockedNotificationApi.getNotifications.mockRejectedValue({
      response: { data: { message: '获取通知失败，请稍后刷新' } }
    })

    mountView()

    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('获取通知失败，请稍后刷新')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows backend message when loading notifications returns non-200 payload', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 500,
      message: '通知列表加载失败'
    })

    mountView()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('通知列表加载失败')
    expect(debugError).toHaveBeenCalledWith('获取通知失败:', '通知列表加载失败')
  })

  it('warns when marking notification as read fails', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 7,
          type: 'system',
          title: '系统消息',
          message: '需要查看',
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }
      ]
    })
    mockedNotificationApi.markAsRead.mockRejectedValue({
      response: { data: { message: '标记已读失败' } }
    })

    const wrapper = mountView()

    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()

    expect(messages.warning).toHaveBeenCalledWith('标记已读失败')
    expect(debugError).toHaveBeenCalled()
  })

  it('warns when marking notification as read returns non-200 payload', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 17,
          type: 'system',
          title: '系统消息',
          message: '需要查看',
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }
      ]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({
      code: 422,
      message: '当前通知无法标记已读'
    })

    const wrapper = mountView()

    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()

    expect(messages.warning).toHaveBeenCalledWith('当前通知无法标记已读')
    expect(debugError).toHaveBeenCalledWith('标记通知已读失败:', '当前通知无法标记已读')
  })

  it('refreshes notifications from backend after marking one as read successfully', async () => {
    mockedNotificationApi.getNotifications
      .mockResolvedValueOnce({
        code: 200,
        data: [{
          id: 22,
          type: 'system',
          title: '系统消息',
          message: '需要刷新已读状态',
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: [{
          id: 22,
          type: 'system',
          title: '系统消息',
          message: '需要刷新已读状态',
          read: true,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }]
      })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()

    expect(mockedNotificationApi.markAsRead).toHaveBeenCalledWith(22)
    expect(mockedNotificationApi.getNotifications).toHaveBeenCalledTimes(2)
  })

  it('keeps read-detail flow usable when refresh fails after marking one as read', async () => {
    mockedNotificationApi.getNotifications
      .mockResolvedValueOnce({
        code: 200,
        data: [{
          id: 23,
          type: 'system',
          title: '系统消息',
          message: '打开详情后刷新失败',
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()

    expect(mockedNotificationApi.markAsRead).toHaveBeenCalledWith(23)
    expect(messages.warning).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
    expect((wrapper.vm as any).detailVisible).toBe(true)
    expect(debugError).toHaveBeenCalledWith('获取通知失败:', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('标记通知已读后刷新通知列表失败:', '获取通知失败')
  })

  it('ignores stale notification responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    mockedNotificationApi.getNotifications
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchNotifications: () => Promise<void> }
    const refetchPromise = vm.fetchNotifications()
    await flushPromises()

    secondRequest.resolve({
      code: 200,
      data: [{
        id: 31,
        type: 'system',
        title: '最新通知',
        message: '新消息内容',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    await refetchPromise
    await flushPromises()

    expect(wrapper.text()).toContain('最新通知')

    firstRequest.resolve({
      code: 200,
      data: [{
        id: 30,
        type: 'system',
        title: '旧通知',
        message: '旧消息内容',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    await flushPromises()

    expect(wrapper.text()).toContain('最新通知')
    expect(wrapper.text()).not.toContain('旧通知')
  })

  it('routes promotion notifications with related coupon id to coupon detail', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [{
        id: 8,
        type: 'promotion',
        title: '限时优惠',
        message: '优惠券可领取',
        relatedId: 12,
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '查看优惠券')!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/coupon/12')
  })

  it('shows backend message when mark all read returns non-200 payload', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [{
        id: 18,
        type: 'system',
        title: '系统消息',
        message: '一条通知',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    mockedNotificationApi.markAllAsRead.mockResolvedValue({
      code: 500,
      message: '批量已读失败'
    })

    const wrapper = mountView()
    await flushPromises()

    const button = wrapper.findAll('button').find((item) => item.text() === '全部已读')
    await button!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('批量已读失败')
    expect(debugError).toHaveBeenCalledWith('全部标记已读失败:', '批量已读失败')
  })

  it('shows backend message when delete notification returns non-200 payload', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [{
        id: 19,
        type: 'system',
        title: '系统消息',
        message: '删除失败测试',
        read: true,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    mockedNotificationApi.deleteNotification.mockResolvedValue({
      code: 500,
      message: '删除通知失败，请稍后重试'
    })

    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('.delete-btn').trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('删除通知失败，请稍后重试')
    expect(debugError).toHaveBeenCalledWith('删除通知失败:', '删除通知失败，请稍后重试')
  })

  it('shows backend message when clear all returns non-200 payload', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [{
        id: 20,
        type: 'system',
        title: '系统消息',
        message: '清空失败测试',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    messageBox.confirm.mockResolvedValue(true as any)
    mockedNotificationApi.clearAll.mockResolvedValue({
      code: 500,
      message: '清空通知失败'
    })

    const wrapper = mountView()
    await flushPromises()

    const clearButton = wrapper.findAll('button').find((button) => button.text() === '清空')
    await clearButton!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('清空通知失败')
    expect(debugError).toHaveBeenCalledWith('清空通知失败:', '清空通知失败')
  })

  it('keeps mark-all-read success when refresh fails afterward', async () => {
    mockedNotificationApi.getNotifications
      .mockResolvedValueOnce({
        code: 200,
        data: [{
          id: 20,
          type: 'system',
          title: '系统消息',
          message: '刷新失败测试',
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))
    mockedNotificationApi.markAllAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    const markAllButton = wrapper.findAll('button').find((button) => button.text() === '全部已读')
    await markAllButton!.trigger('click')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('已全部标记为已读')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取通知失败:', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('全部标记已读后刷新通知列表失败:', '获取通知失败')
  })

  it('keeps delete success when refresh fails afterward', async () => {
    mockedNotificationApi.getNotifications
      .mockResolvedValueOnce({
        code: 200,
        data: [{
          id: 19,
          type: 'system',
          title: '系统消息',
          message: '删除后刷新失败',
          read: true,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))
    mockedNotificationApi.deleteNotification.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('.delete-btn').trigger('click')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('已删除')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取通知失败:', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('删除通知后刷新通知列表失败:', '获取通知失败')
  })

  it('keeps clear-all success when refresh fails afterward', async () => {
    mockedNotificationApi.getNotifications
      .mockResolvedValueOnce({
        code: 200,
        data: [{
          id: 20,
          type: 'system',
          title: '系统消息',
          message: '清空后刷新失败',
          read: false,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))
    messageBox.confirm.mockResolvedValue(true as any)
    mockedNotificationApi.clearAll.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    const clearButton = wrapper.findAll('button').find((button) => button.text() === '清空')
    await clearButton!.trigger('click')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('已清空所有通知')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取通知失败:', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('清空通知后刷新通知列表失败:', '获取通知失败')
  })

  it('does not let an in-flight notification request restore unread state after mark-as-read success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    mockedNotificationApi.getNotifications
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).notifications = [{
      id: 40,
      type: 'system',
      title: '本地已读',
      message: '旧请求不应覆盖',
      read: false,
      createdTime: '2026-05-07T10:00:00',
      timeAgo: '刚刚'
    }]

    const openPromise = (wrapper.vm as any).openDetail((wrapper.vm as any).notifications[0])
    await flushPromises()

    expect((wrapper.vm as any).notifications[0].read).toBe(true)

    secondRequest.resolve({
      code: 200,
      data: [{
        id: 40,
        type: 'system',
        title: '本地已读',
        message: '旧请求不应覆盖',
        read: true,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    await openPromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: [{
        id: 40,
        type: 'system',
        title: '本地已读',
        message: '旧请求不应覆盖',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    await flushPromises()

    expect((wrapper.vm as any).notifications[0].read).toBe(true)
  })

  it('does not let an in-flight notification request restore deleted items', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    mockedNotificationApi.getNotifications
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    mockedNotificationApi.deleteNotification.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).notifications = [{
      id: 41,
      type: 'system',
      title: '待删除通知',
      message: '旧请求不应恢复',
      read: true,
      createdTime: '2026-05-07T10:00:00',
      timeAgo: '刚刚'
    }]

    const deletePromise = (wrapper.vm as any).deleteItem((wrapper.vm as any).notifications[0])
    await flushPromises()

    expect((wrapper.vm as any).notifications).toEqual([])

    secondRequest.resolve({ code: 200, data: [] })
    await deletePromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: [{
        id: 41,
        type: 'system',
        title: '待删除通知',
        message: '旧请求不应恢复',
        read: true,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    await flushPromises()

    expect((wrapper.vm as any).notifications).toEqual([])
  })

  it('does not let an in-flight notification request restore notifications after clear-all success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    mockedNotificationApi.getNotifications
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    messageBox.confirm.mockResolvedValue(true as any)
    mockedNotificationApi.clearAll.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).notifications = [{
      id: 42,
      type: 'system',
      title: '待清空通知',
      message: '旧请求不应恢复',
      read: false,
      createdTime: '2026-05-07T10:00:00',
      timeAgo: '刚刚'
    }]

    const clearPromise = (wrapper.vm as any).clearAllNotifications()
    await flushPromises()

    expect((wrapper.vm as any).notifications).toEqual([])

    secondRequest.resolve({ code: 200, data: [] })
    await clearPromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: [{
        id: 42,
        type: 'system',
        title: '待清空通知',
        message: '旧请求不应恢复',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    await flushPromises()

    expect((wrapper.vm as any).notifications).toEqual([])
  })

  it('routes promotion notifications without related id to promotions list', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [{
        id: 15,
        type: 'promotion',
        title: '限时优惠',
        message: '快来领取优惠券',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '领取优惠券')!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/promotions')
  })

  it('falls back to order search when order notification has no related id', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [{
        id: 16,
        type: 'order',
        title: '订单状态更新',
        message: '订单 ORD-2026-001 已发货，请留意签收',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '查看订单')!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/orders?search=ORD-2026-001')
  })

  it('routes file review notifications to admin files for admin users', async () => {
    mockUserStore.userInfo = buildUser({ id: 1, username: 'admin', role: 'ADMIN' })
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [{
        id: 9,
        type: 'file_review',
        title: '头像待审核',
        message: '有新的头像待审核',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '去审核')!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/admin/files')
  })

  it('routes file review notifications to profile for non-admin users', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [{
        id: 10,
        type: 'file_review',
        title: '头像审核结果',
        message: '你的头像审核已完成',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '查看个人中心')!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/profile')
  })

  it('routes product review notifications by role', async () => {
    mockUserStore.userInfo = buildUser({ id: 1, username: 'admin', role: 'ADMIN' })
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [{
        id: 11,
        type: 'product_review',
        title: '商品待审核',
        message: '有商品等待审核',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const adminWrapper = mountView()
    await flushPromises()
    await adminWrapper.find('.notification-item').trigger('click')
    await flushPromises()
    await adminWrapper.findAll('button').find((button) => button.text() === '去审核')!.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/admin/products?tab=pending')

    vi.clearAllMocks()
    mockUserStore.userInfo = buildUser({ id: 2, username: 'lisi', role: 'SELLER' })
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [{
        id: 12,
        type: 'product_review',
        title: '商品审核结果',
        message: '你的商品审核已完成',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const sellerWrapper = mountView()
    await flushPromises()
    await sellerWrapper.find('.notification-item').trigger('click')
    await flushPromises()
    await sellerWrapper.findAll('button').find((button) => button.text() === '查看我的商品')!.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/my-products')
  })

  it('does not show seller product-review action for buyer users', async () => {
    mockUserStore.userInfo = buildUser({ id: 2, username: 'zhangsan', role: 'BUYER' })
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [{
        id: 121,
        type: 'product_review',
        title: '商品审核结果',
        message: '你的商品审核已完成',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('button').some((button) => button.text() === '查看我的商品')).toBe(false)
  })

  it('routes review notifications to product detail or my products fallback', async () => {
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [{
        id: 13,
        type: 'review',
        title: '商品评价',
        message: '有新的评价',
        relatedId: 66,
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.find('.notification-item').trigger('click')
    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '查看商品')!.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/product/66')

    vi.clearAllMocks()
    mockUserStore.userInfo = buildUser({ id: 2, username: 'lisi', role: 'SELLER' })
    mockedNotificationApi.getNotifications.mockResolvedValue({
      code: 200,
      data: [{
        id: 14,
        type: 'review',
        title: '商品评价',
        message: '有新的评价',
        read: false,
        createdTime: '2026-05-07T10:00:00',
        timeAgo: '刚刚'
      }]
    })
    mockedNotificationApi.markAsRead.mockResolvedValue({ code: 200 })

    const fallbackWrapper = mountView()
    await flushPromises()
    await fallbackWrapper.find('.notification-item').trigger('click')
    await flushPromises()
    await fallbackWrapper.findAll('button').find((button) => button.text() === '查看商品')!.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/my-products')
  })

  it('closes notification detail when refreshed list no longer contains the current notification', async () => {
    mockedNotificationApi.getNotifications
      .mockResolvedValueOnce({
        code: 200,
        data: [{
          id: 50,
          type: 'system',
          title: '当前通知',
          message: '详情已打开',
          read: true,
          createdTime: '2026-05-07T10:00:00',
          timeAgo: '刚刚'
        }]
      })
      .mockResolvedValueOnce({ code: 200, data: [] })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).currentNotification = {
      id: 50,
      type: 'system',
      title: '当前通知',
      message: '详情已打开',
      read: true,
      createdTime: '2026-05-07T10:00:00',
      timeAgo: '刚刚'
    }
    ;(wrapper.vm as any).detailVisible = true

    await (wrapper.vm as any).fetchNotifications()
    await flushPromises()

    expect((wrapper.vm as any).notifications).toEqual([])
    expect((wrapper.vm as any).detailVisible).toBe(false)
    expect((wrapper.vm as any).currentNotification).toBeNull()
  })
})
