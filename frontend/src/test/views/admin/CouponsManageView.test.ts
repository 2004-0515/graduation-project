import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { couponApi, messages, messageBox, debugError } = vi.hoisted(() => ({
  couponApi: {
    getAllCoupons: vi.fn(),
    createCoupon: vi.fn(),
    updateCoupon: vi.fn(),
    deleteCoupon: vi.fn()
  },
  messages: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  messageBox: {
    confirm: vi.fn()
  },
  debugError: vi.fn()
}))

vi.mock('element-plus', () => ({
  ElMessage: messages,
  ElMessageBox: messageBox
}))

vi.mock('@/api/couponApi', () => ({
  default: couponApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import CouponsManageView from '@/views/admin/CouponsManageView.vue'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('CouponsManageView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue(undefined)
    couponApi.getAllCoupons.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 2,
          name: '优惠券A',
          type: 1,
          discountAmount: 10,
          minAmount: 100,
          claimedCount: 0,
          totalCount: 100,
          startTime: '2026-05-07T00:00:00',
          endTime: '2026-12-31T23:59:59',
          status: 1
        }
      ]
    })
  })

  const mountView = () =>
    mount(CouponsManageView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" /></div>' },
          ElTag: true,
          ElSwitch: true,
          ElDialog: true,
          ElForm: true,
          ElFormItem: true,
          ElInput: true,
          ElRadioGroup: true,
          ElRadio: true,
          ElInputNumber: true,
          ElDatePicker: true
        }
      }
    })

  it('does not show an error when admin cancels coupon deletion', async () => {
    messageBox.confirm.mockRejectedValue('cancel')
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (row: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 2, name: '优惠券A' })
    await flushPromises()

    expect(couponApi.deleteCoupon).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows an error when coupon deletion fails', async () => {
    couponApi.deleteCoupon.mockRejectedValue({ response: { data: { message: '优惠券已被活动绑定' } } })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (row: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 2, name: '优惠券A' })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('优惠券已被活动绑定')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows backend message when saving coupon fails', async () => {
    couponApi.createCoupon.mockRejectedValue({ response: { data: { message: '有效期非法' } } })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { openDialog: () => void }).openDialog()
    ;(wrapper.vm as any).form.name = '新券'
    ;(wrapper.vm as any).dateRange = [new Date('2026-05-01T00:00:00'), new Date('2026-12-31T23:59:59')]
    await (wrapper.vm as unknown as { saveCoupon: () => Promise<void> }).saveCoupon()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('有效期非法')
    expect(debugError).toHaveBeenCalled()
  })

  it('reverts status and shows backend message when toggle fails', async () => {
    couponApi.updateCoupon.mockRejectedValue({ response: { data: { message: '状态更新失败' } } })
    const wrapper = mountView()

    await flushPromises()

    const coupon = { id: 2, status: 1 }
    await (wrapper.vm as unknown as { toggleStatus: (coupon: { id: number; status: number }) => Promise<void> }).toggleStatus(coupon)
    await flushPromises()

    expect(coupon.status).toBe(0)
    expect(messages.error).toHaveBeenCalledWith('状态更新失败')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows backend message when saving coupon returns non-200 payload', async () => {
    couponApi.createCoupon.mockResolvedValue({ code: 500, message: '优惠券名称重复' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { openDialog: () => void }).openDialog()
    ;(wrapper.vm as any).form.name = '新券'
    ;(wrapper.vm as any).dateRange = [new Date('2026-05-01T00:00:00'), new Date('2026-12-31T23:59:59')]
    await (wrapper.vm as unknown as { saveCoupon: () => Promise<void> }).saveCoupon()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('优惠券名称重复')
    expect(debugError).toHaveBeenCalledWith('保存优惠券失败', '优惠券名称重复')
  })

  it('keeps coupon create successful with local append when refresh fails afterward', async () => {
    couponApi.createCoupon.mockResolvedValue({
      code: 200,
      message: '优惠券添加成功',
      data: {
        id: 5,
        name: '新券',
        type: 1,
        discountAmount: 20,
        minAmount: 200,
        claimedCount: 0,
        totalCount: 50,
        startTime: '2026-05-01T00:00:00.000Z',
        endTime: '2026-12-31T23:59:59.000Z',
        status: 1,
        limitPerUser: 1,
        description: '新券描述'
      }
    })
    couponApi.getAllCoupons
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 2,
            name: '优惠券A',
            type: 1,
            discountAmount: 10,
            minAmount: 100,
            claimedCount: 0,
            totalCount: 100,
            startTime: '2026-05-07T00:00:00',
            endTime: '2026-12-31T23:59:59',
            status: 1
          }
        ]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))

    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { openDialog: () => void }).openDialog()
    ;(wrapper.vm as any).form.name = '新券'
    ;(wrapper.vm as any).form.type = 1
    ;(wrapper.vm as any).form.discountAmount = 20
    ;(wrapper.vm as any).form.minAmount = 200
    ;(wrapper.vm as any).form.totalCount = 50
    ;(wrapper.vm as any).form.limitPerUser = 1
    ;(wrapper.vm as any).form.description = '新券描述'
    ;(wrapper.vm as any).form.status = 1
    ;(wrapper.vm as any).dateRange = [new Date('2026-05-01T00:00:00'), new Date('2026-12-31T23:59:59')]
    await (wrapper.vm as unknown as { saveCoupon: () => Promise<void> }).saveCoupon()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('优惠券添加成功')
    expect(messages.error).not.toHaveBeenCalled()
    expect((wrapper.vm as any).coupons[0]).toEqual(expect.objectContaining({ id: 5, name: '新券', minAmount: 200 }))
    expect(debugError).toHaveBeenCalledWith('获取优惠券管理列表失败', expect.any(Error))
  })

  it('keeps coupon edit successful with local update when refresh fails afterward', async () => {
    couponApi.updateCoupon.mockResolvedValue({
      code: 200,
      message: '优惠券更新成功',
      data: {
        id: 2,
        name: '优惠券A-新版',
        type: 1,
        discountAmount: 30,
        minAmount: 300,
        claimedCount: 0,
        totalCount: 120,
        startTime: '2026-05-01T00:00:00.000Z',
        endTime: '2026-12-31T23:59:59.000Z',
        status: 0,
        limitPerUser: 2,
        description: '新版描述'
      }
    })
    couponApi.getAllCoupons
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 2,
            name: '优惠券A',
            type: 1,
            discountAmount: 10,
            minAmount: 100,
            claimedCount: 0,
            totalCount: 100,
            startTime: '2026-05-07T00:00:00',
            endTime: '2026-12-31T23:59:59',
            status: 1
          }
        ]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))

    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).isEdit = true
    ;(wrapper.vm as any).editId = 2
    ;(wrapper.vm as any).form.name = '优惠券A-新版'
    ;(wrapper.vm as any).form.type = 1
    ;(wrapper.vm as any).form.discountAmount = 30
    ;(wrapper.vm as any).form.minAmount = 300
    ;(wrapper.vm as any).form.totalCount = 120
    ;(wrapper.vm as any).form.limitPerUser = 2
    ;(wrapper.vm as any).form.description = '新版描述'
    ;(wrapper.vm as any).form.status = 0
    ;(wrapper.vm as any).dateRange = [new Date('2026-05-01T00:00:00'), new Date('2026-12-31T23:59:59')]
    await (wrapper.vm as unknown as { saveCoupon: () => Promise<void> }).saveCoupon()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('优惠券更新成功')
    expect((wrapper.vm as any).coupons[0]).toEqual(expect.objectContaining({
      id: 2,
      name: '优惠券A-新版',
      discountAmount: 30,
      minAmount: 300,
      totalCount: 120,
      status: 0
    }))
    expect(debugError).toHaveBeenCalledWith('获取优惠券管理列表失败', expect.any(Error))
  })

  it('reverts status and shows backend message when toggle returns non-200 payload', async () => {
    couponApi.updateCoupon.mockResolvedValue({ code: 500, message: '状态切换失败' })
    const wrapper = mountView()

    await flushPromises()

    const coupon = { id: 2, status: 1 }
    await (wrapper.vm as unknown as { toggleStatus: (coupon: { id: number; status: number }) => Promise<void> }).toggleStatus(coupon)
    await flushPromises()

    expect(coupon.status).toBe(0)
    expect(messages.error).toHaveBeenCalledWith('状态切换失败')
    expect(debugError).toHaveBeenCalledWith('切换优惠券状态失败', '状态切换失败')
  })

  it('refreshes coupons after toggling status successfully', async () => {
    couponApi.updateCoupon.mockResolvedValue({ code: 200 })
    couponApi.getAllCoupons
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 2,
            name: '优惠券A',
            type: 1,
            discountAmount: 10,
            minAmount: 100,
            claimedCount: 0,
            totalCount: 100,
            startTime: '2026-05-07T00:00:00',
            endTime: '2026-12-31T23:59:59',
            status: 1
          }
        ]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 2,
            name: '优惠券A',
            type: 1,
            discountAmount: 10,
            minAmount: 100,
            claimedCount: 0,
            totalCount: 100,
            startTime: '2026-05-07T00:00:00',
            endTime: '2026-12-31T23:59:59',
            status: 0
          }
        ]
      })
    const wrapper = mountView()

    await flushPromises()

    const coupon = { id: 2, status: 1 }
    await (wrapper.vm as unknown as { toggleStatus: (coupon: { id: number; status: number }) => Promise<void> }).toggleStatus(coupon)
    await flushPromises()

    expect(couponApi.getAllCoupons).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('已启用')
  })

  it('keeps coupon toggle successful when coupons refresh fails afterward', async () => {
    couponApi.updateCoupon.mockResolvedValue({ code: 200 })
    couponApi.getAllCoupons
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 2,
            name: '优惠券A',
            type: 1,
            discountAmount: 10,
            minAmount: 100,
            claimedCount: 0,
            totalCount: 100,
            startTime: '2026-05-07T00:00:00',
            endTime: '2026-12-31T23:59:59',
            status: 1
          }
        ]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))
    const wrapper = mountView()

    await flushPromises()

    const coupon = { id: 2, status: 1 }
    await (wrapper.vm as unknown as { toggleStatus: (coupon: { id: number; status: number }) => Promise<void> }).toggleStatus(coupon)
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('已启用')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取优惠券管理列表失败', expect.any(Error))
  })

  it('shows backend message when deleting coupon returns non-200 payload', async () => {
    couponApi.deleteCoupon.mockResolvedValue({ code: 500, message: '优惠券删除失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (row: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 2, name: '优惠券A' })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('优惠券删除失败')
    expect(debugError).toHaveBeenCalledWith('删除优惠券失败', '优惠券删除失败')
  })

  it('ignores stale coupon list responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    couponApi.getAllCoupons
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchCoupons: () => Promise<void> }
    const refetchPromise = vm.fetchCoupons()
    await flushPromises()

    secondRequest.resolve({
      code: 200,
      data: [
        {
          id: 3,
          name: '新优惠券',
          type: 1,
          discountAmount: 20,
          minAmount: 100,
          claimedCount: 0,
          totalCount: 100,
          startTime: '2026-05-07T00:00:00',
          endTime: '2026-12-31T23:59:59',
          status: 1
        }
      ]
    })
    await refetchPromise
    await flushPromises()

    expect((wrapper.vm as any).coupons[0].name).toBe('新优惠券')

    firstRequest.resolve({
      code: 200,
      data: [
        {
          id: 2,
          name: '旧优惠券',
          type: 1,
          discountAmount: 10,
          minAmount: 100,
          claimedCount: 0,
          totalCount: 100,
          startTime: '2026-05-07T00:00:00',
          endTime: '2026-12-31T23:59:59',
          status: 1
        }
      ]
    })
    await flushPromises()

    expect((wrapper.vm as any).coupons[0].name).toBe('新优惠券')
  })

  it('does not let an in-flight coupon request overwrite local status toggle success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    couponApi.getAllCoupons
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    couponApi.updateCoupon.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).coupons = [
      {
        id: 2,
        name: '优惠券A',
        type: 1,
        discountAmount: 10,
        minAmount: 100,
        claimedCount: 0,
        totalCount: 100,
        startTime: '2026-05-07T00:00:00',
        endTime: '2026-12-31T23:59:59',
        status: 0
      }
    ]

    const coupon = (wrapper.vm as any).coupons[0]
    coupon.status = 1
    const togglePromise = (wrapper.vm as any).toggleStatus(coupon)
    await flushPromises()

    expect((wrapper.vm as any).coupons[0].status).toBe(1)

    secondRequest.resolve({
      code: 200,
      data: [
        {
          id: 2,
          name: '优惠券A',
          type: 1,
          discountAmount: 10,
          minAmount: 100,
          claimedCount: 0,
          totalCount: 100,
          startTime: '2026-05-07T00:00:00',
          endTime: '2026-12-31T23:59:59',
          status: 1
        }
      ]
    })
    await togglePromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: [
        {
          id: 2,
          name: '优惠券A',
          type: 1,
          discountAmount: 10,
          minAmount: 100,
          claimedCount: 0,
          totalCount: 100,
          startTime: '2026-05-07T00:00:00',
          endTime: '2026-12-31T23:59:59',
          status: 0
        }
      ]
    })
    await flushPromises()

    expect((wrapper.vm as any).coupons[0].status).toBe(1)
  })

  it('does not let an in-flight coupon request overwrite local delete success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    couponApi.getAllCoupons
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    couponApi.deleteCoupon.mockResolvedValue({ code: 200, message: '删除成功' })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).coupons = [
      {
        id: 2,
        name: '优惠券A',
        type: 1,
        discountAmount: 10,
        minAmount: 100,
        claimedCount: 0,
        totalCount: 100,
        startTime: '2026-05-07T00:00:00',
        endTime: '2026-12-31T23:59:59',
        status: 1
      }
    ]

    const deletePromise = (wrapper.vm as any).handleDelete((wrapper.vm as any).coupons[0])
    await flushPromises()

    expect((wrapper.vm as any).coupons).toEqual([])

    secondRequest.resolve({ code: 200, data: [] })
    await deletePromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: [
        {
          id: 2,
          name: '优惠券A',
          type: 1,
          discountAmount: 10,
          minAmount: 100,
          claimedCount: 0,
          totalCount: 100,
          startTime: '2026-05-07T00:00:00',
          endTime: '2026-12-31T23:59:59',
          status: 1
        }
      ]
    })
    await flushPromises()

    expect((wrapper.vm as any).coupons).toEqual([])
  })

  it('does not let an in-flight coupon request overwrite local edit success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    couponApi.getAllCoupons
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    couponApi.updateCoupon.mockResolvedValue({
      code: 200,
      message: '优惠券更新成功',
      data: {
        id: 2,
        name: '优惠券A-新版',
        type: 1,
        discountAmount: 30,
        minAmount: 300,
        claimedCount: 0,
        totalCount: 120,
        startTime: '2026-05-01T00:00:00.000Z',
        endTime: '2026-12-31T23:59:59.000Z',
        status: 0,
        limitPerUser: 2,
        description: '新版描述'
      }
    })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).coupons = [
      {
        id: 2,
        name: '优惠券A',
        type: 1,
        discountAmount: 10,
        minAmount: 100,
        claimedCount: 0,
        totalCount: 100,
        startTime: '2026-05-07T00:00:00',
        endTime: '2026-12-31T23:59:59',
        status: 1
      }
    ]
    ;(wrapper.vm as any).isEdit = true
    ;(wrapper.vm as any).editId = 2
    ;(wrapper.vm as any).form.name = '优惠券A-新版'
    ;(wrapper.vm as any).form.type = 1
    ;(wrapper.vm as any).form.discountAmount = 30
    ;(wrapper.vm as any).form.minAmount = 300
    ;(wrapper.vm as any).form.totalCount = 120
    ;(wrapper.vm as any).form.limitPerUser = 2
    ;(wrapper.vm as any).form.description = '新版描述'
    ;(wrapper.vm as any).form.status = 0
    ;(wrapper.vm as any).dateRange = [new Date('2026-05-01T00:00:00'), new Date('2026-12-31T23:59:59')]

    const savePromise = (wrapper.vm as any).saveCoupon()
    await flushPromises()

    expect((wrapper.vm as any).coupons[0]).toEqual(expect.objectContaining({
      id: 2,
      name: '优惠券A-新版',
      discountAmount: 30,
      minAmount: 300,
      status: 0
    }))

    secondRequest.resolve({
      code: 200,
      data: [
        {
          id: 2,
          name: '优惠券A-新版',
          type: 1,
          discountAmount: 30,
          minAmount: 300,
          claimedCount: 0,
          totalCount: 120,
          startTime: '2026-05-01T00:00:00.000Z',
          endTime: '2026-12-31T23:59:59.000Z',
          status: 0
        }
      ]
    })
    await savePromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: [
        {
          id: 2,
          name: '优惠券A',
          type: 1,
          discountAmount: 10,
          minAmount: 100,
          claimedCount: 0,
          totalCount: 100,
          startTime: '2026-05-07T00:00:00',
          endTime: '2026-12-31T23:59:59',
          status: 1
        }
      ]
    })
    await flushPromises()

    expect((wrapper.vm as any).coupons[0]).toEqual(expect.objectContaining({
      id: 2,
      name: '优惠券A-新版',
      discountAmount: 30,
      minAmount: 300,
      status: 0
    }))
  })

  it('closes coupon dialog when refreshed list no longer contains the editing coupon', async () => {
    couponApi.getAllCoupons
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 2,
            name: '优惠券A',
            type: 1,
            discountAmount: 10,
            minAmount: 100,
            claimedCount: 0,
            totalCount: 100,
            startTime: '2026-05-07T00:00:00',
            endTime: '2026-12-31T23:59:59',
            status: 1
          }
        ]
      })
      .mockResolvedValueOnce({ code: 200, data: [] })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).openDialog({
      id: 2,
      name: '优惠券A',
      type: 1,
      discountAmount: 10,
      minAmount: 100,
      totalCount: 100,
      limitPerUser: 1,
      description: '旧描述',
      startTime: '2026-05-07T00:00:00',
      endTime: '2026-12-31T23:59:59',
      status: 1
    })

    await (wrapper.vm as any).fetchCoupons()
    await flushPromises()

    expect((wrapper.vm as any).dialogVisible).toBe(false)
    expect((wrapper.vm as any).isEdit).toBe(false)
    expect((wrapper.vm as any).editId).toBeNull()
    expect((wrapper.vm as any).form.name).toBe('')
    expect((wrapper.vm as any).dateRange).toBeNull()
  })
})
