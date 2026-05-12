import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { addressApi, messages, messageBox, debugError, mockUserStore } = vi.hoisted(() => ({
  addressApi: {
    getUserAddresses: vi.fn(),
    addAddress: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
    setDefaultAddress: vi.fn()
  },
  messages: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  messageBox: {
    confirm: vi.fn()
  },
  debugError: vi.fn(),
  mockUserStore: {
    userInfo: { id: 1, phone: '13800138000' }
  }
}))

vi.mock('element-plus', () => ({
  ElMessage: messages,
  ElMessageBox: messageBox
}))

vi.mock('@/api/addressApi', () => ({
  default: addressApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => mockUserStore
}))

import AddressView from '@/views/AddressView.vue'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('AddressView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue(undefined)
    addressApi.getUserAddresses.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 7,
          userId: 1,
          name: '张三',
          phone: '13800138000',
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          detail: '科技园',
          isDefault: true
        }
      ]
    })
  })

  const mountView = () =>
    mount(AddressView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElForm: { template: '<form><slot /></form>' },
          ElFormItem: { template: '<div><slot /></div>' },
          ElInput: true,
          ElCascader: true,
          ElCheckbox: true
        }
      }
    })

  it('does not show an error when user cancels address deletion', async () => {
    messageBox.confirm.mockRejectedValue('cancel')
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { deleteAddress: (addr: { id: number }) => Promise<void> }).deleteAddress({ id: 7 })
    await flushPromises()

    expect(addressApi.deleteAddress).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows an error when address deletion fails', async () => {
    addressApi.deleteAddress.mockRejectedValue(new Error('boom'))
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { deleteAddress: (addr: { id: number }) => Promise<void> }).deleteAddress({ id: 7 })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('boom')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows backend message when setting default address returns non-200 payload', async () => {
    addressApi.setDefaultAddress.mockResolvedValue({ code: 500, message: '设置默认地址失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { setDefault: (addr: { id: number }) => Promise<void> }).setDefault({ id: 7 })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('设置默认地址失败')
    expect(debugError).toHaveBeenCalledWith('设置默认地址失败:', '设置默认地址失败')
  })

  it('logs non-200 payload when fetching addresses', async () => {
    addressApi.getUserAddresses.mockResolvedValue({ code: 500, message: '地址列表异常' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取地址失败:', '地址列表异常')
  })

  it('logs backend message when adding address returns non-200 payload', async () => {
    addressApi.addAddress.mockResolvedValue({ code: 500, message: '地址保存失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { saveAddress: () => Promise<void> }).saveAddress()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('地址保存失败')
    expect(debugError).toHaveBeenCalledWith('保存地址失败:', '地址保存失败')
  })

  it('does not treat success flag without 200 code as a real save success', async () => {
    addressApi.addAddress.mockResolvedValue({ code: 500, success: true, message: '地址保存失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { saveAddress: () => Promise<void> }).saveAddress()
    await flushPromises()

    expect(messages.success).not.toHaveBeenCalledWith('添加成功')
    expect(messages.error).toHaveBeenCalledWith('地址保存失败')
  })

  it('logs backend message when deleting address returns non-200 payload', async () => {
    addressApi.deleteAddress.mockResolvedValue({ code: 500, message: '地址删除失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { deleteAddress: (addr: { id: number }) => Promise<void> }).deleteAddress({ id: 7 })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('地址删除失败')
    expect(debugError).toHaveBeenCalledWith('删除地址失败:', '地址删除失败')
  })

  it('does not treat success flag without 200 code as a real delete success', async () => {
    addressApi.deleteAddress.mockResolvedValue({ code: 500, success: true, message: '地址删除失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { deleteAddress: (addr: { id: number }) => Promise<void> }).deleteAddress({ id: 7 })
    await flushPromises()

    expect(messages.success).not.toHaveBeenCalledWith('删除成功')
    expect(messages.error).toHaveBeenCalledWith('地址删除失败')
  })

  it('keeps add-address success when refreshing addresses fails afterward', async () => {
    addressApi.getUserAddresses
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 7,
            userId: 1,
            name: '张三',
            phone: '13800138000',
            province: '广东省',
            city: '深圳市',
            district: '南山区',
            detail: '科技园',
            isDefault: true
          }
        ]
      })
      .mockRejectedValue(new Error('刷新失败'))
    addressApi.addAddress.mockResolvedValue({ code: 200 })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { saveAddress: () => Promise<void> }).saveAddress()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('添加成功')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取地址失败:', expect.any(Error))
  })

  it('keeps set-default success when refreshing addresses fails afterward', async () => {
    addressApi.getUserAddresses
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 7,
            userId: 1,
            name: '张三',
            phone: '13800138000',
            province: '广东省',
            city: '深圳市',
            district: '南山区',
            detail: '科技园',
            isDefault: true
          }
        ]
      })
      .mockRejectedValue(new Error('刷新失败'))
    addressApi.setDefaultAddress.mockResolvedValue({ code: 200 })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { setDefault: (addr: { id: number }) => Promise<void> }).setDefault({ id: 7 })
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('设置成功')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取地址失败:', expect.any(Error))
  })

  it('keeps delete-address success when refreshing addresses fails afterward', async () => {
    addressApi.getUserAddresses
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 7,
            userId: 1,
            name: '张三',
            phone: '13800138000',
            province: '广东省',
            city: '深圳市',
            district: '南山区',
            detail: '科技园',
            isDefault: true
          }
        ]
      })
      .mockRejectedValue(new Error('刷新失败'))
    addressApi.deleteAddress.mockResolvedValue({ code: 200 })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { deleteAddress: (addr: { id: number }) => Promise<void> }).deleteAddress({ id: 7 })
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('删除成功')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取地址失败:', expect.any(Error))
  })

  it('keeps newer address list when older request resolves later', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    addressApi.getUserAddresses
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchAddresses: () => Promise<void> }
    const secondFetch = vm.fetchAddresses()
    await flushPromises()

    second.resolve({
      code: 200,
      data: [{ id: 8, name: '李四', phone: '13900000000', detail: '新地址' }]
    })
    await secondFetch
    await flushPromises()

    expect((wrapper.vm as any).addresses).toEqual([
      { id: 8, name: '李四', phone: '13900000000', detail: '新地址' }
    ])

    first.resolve({
      code: 200,
      data: [{ id: 7, name: '张三', phone: '13800138000', detail: '旧地址' }]
    })
    await flushPromises()

    expect((wrapper.vm as any).addresses).toEqual([
      { id: 8, name: '李四', phone: '13900000000', detail: '新地址' }
    ])
  })

  it('does not let an in-flight address request overwrite set-default success', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    addressApi.getUserAddresses
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    addressApi.setDefaultAddress.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).addresses = [
      { id: 7, name: '张三', isDefault: true },
      { id: 8, name: '李四', isDefault: false }
    ]

    const setDefaultPromise = (wrapper.vm as any).setDefault({ id: 8 })
    await flushPromises()

    expect((wrapper.vm as any).addresses).toEqual([
      { id: 7, name: '张三', isDefault: false },
      { id: 8, name: '李四', isDefault: true }
    ])

    second.resolve({
      code: 200,
      data: [
        { id: 7, name: '张三', isDefault: false },
        { id: 8, name: '李四', isDefault: true }
      ]
    })
    await setDefaultPromise
    await flushPromises()

    first.resolve({
      code: 200,
      data: [
        { id: 7, name: '张三', isDefault: true },
        { id: 8, name: '李四', isDefault: false }
      ]
    })
    await flushPromises()

    expect((wrapper.vm as any).addresses).toEqual([
      { id: 7, name: '张三', isDefault: false },
      { id: 8, name: '李四', isDefault: true }
    ])
  })

  it('does not let an in-flight address request restore a deleted address', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    addressApi.getUserAddresses
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    addressApi.deleteAddress.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).addresses = [
      { id: 7, name: '张三', isDefault: true },
      { id: 8, name: '李四', isDefault: false }
    ]

    const deletePromise = (wrapper.vm as any).deleteAddress({ id: 7 })
    await flushPromises()

    expect((wrapper.vm as any).addresses).toEqual([
      { id: 8, name: '李四', isDefault: false }
    ])

    second.resolve({
      code: 200,
      data: [{ id: 8, name: '李四', isDefault: true }]
    })
    await deletePromise
    await flushPromises()

    first.resolve({
      code: 200,
      data: [
        { id: 7, name: '张三', isDefault: true },
        { id: 8, name: '李四', isDefault: false }
      ]
    })
    await flushPromises()

    expect((wrapper.vm as any).addresses).toEqual([
      { id: 8, name: '李四', isDefault: true }
    ])
  })

  it('does not let an in-flight address request overwrite add-address success', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    addressApi.getUserAddresses
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    addressApi.addAddress.mockResolvedValue({
      code: 200,
      data: {
        id: 9,
        userId: 1,
        name: '王五',
        phone: '13700000000',
        province: '浙江省',
        city: '杭州市',
        district: '西湖区',
        detail: '新地址',
        isDefault: false
      }
    })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).addressForm.name = '王五'
    ;(wrapper.vm as any).addressForm.phone = '13700000000'
    ;(wrapper.vm as any).addressForm.detail = '新地址'

    const savePromise = (wrapper.vm as any).saveAddress()
    await flushPromises()

    expect((wrapper.vm as any).addresses).toEqual([
      {
        id: 9,
        userId: 1,
        name: '王五',
        phone: '13700000000',
        province: '浙江省',
        city: '杭州市',
        district: '西湖区',
        detail: '新地址',
        isDefault: false
      }
    ])

    second.resolve({
      code: 200,
      data: [
        {
          id: 9,
          userId: 1,
          name: '王五',
          phone: '13700000000',
          province: '浙江省',
          city: '杭州市',
          district: '西湖区',
          detail: '新地址',
          isDefault: false
        }
      ]
    })
    await savePromise
    await flushPromises()

    first.resolve({
      code: 200,
      data: [{ id: 7, name: '张三', phone: '13800138000', detail: '旧地址', isDefault: true }]
    })
    await flushPromises()

    expect((wrapper.vm as any).addresses).toEqual([
      {
        id: 9,
        userId: 1,
        name: '王五',
        phone: '13700000000',
        province: '浙江省',
        city: '杭州市',
        district: '西湖区',
        detail: '新地址',
        isDefault: false
      }
    ])
  })

  it('clears previous default locally when editing an address into the default one', async () => {
    addressApi.updateAddress.mockResolvedValue({ code: 200 })
    const wrapper = mountView()

    await flushPromises()
    addressApi.getUserAddresses.mockRejectedValueOnce(new Error('刷新失败'))
    ;(wrapper.vm as any).isEdit = true
    ;(wrapper.vm as any).editId = 8
    ;(wrapper.vm as any).addresses = [
      { id: 7, name: '张三', isDefault: true, phone: '13800138000' },
      { id: 8, name: '李四', isDefault: false, phone: '13900000000' }
    ]
    Object.assign((wrapper.vm as any).addressForm, {
      name: '李四',
      phone: '13900000000',
      province: '广东省',
      city: '深圳市',
      district: '福田区',
      detail: '新默认地址',
      isDefault: true
    })

    await (wrapper.vm as any).saveAddress()
    await flushPromises()

    expect((wrapper.vm as any).addresses).toEqual([
      expect.objectContaining({ id: 7, isDefault: false }),
      expect.objectContaining({ id: 8, isDefault: true, detail: '新默认地址' })
    ])
  })

  it('closes address dialog when refreshed list no longer contains the editing address', async () => {
    addressApi.getUserAddresses
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 7,
            userId: 1,
            name: '张三',
            phone: '13800138000',
            province: '广东省',
            city: '深圳市',
            district: '南山区',
            detail: '科技园',
            isDefault: true
          }
        ]
      })
      .mockResolvedValueOnce({ code: 200, data: [] })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).openDialog({
      id: 7,
      userId: 1,
      name: '张三',
      phone: '13800138000',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      detail: '科技园',
      isDefault: true
    })

    await (wrapper.vm as any).fetchAddresses()
    await flushPromises()

    expect((wrapper.vm as any).dialogVisible).toBe(false)
    expect((wrapper.vm as any).isEdit).toBe(false)
    expect((wrapper.vm as any).editId).toBeNull()
    expect((wrapper.vm as any).addressForm.name).toBe('')
    expect((wrapper.vm as any).regionValue).toEqual([])
  })
})
