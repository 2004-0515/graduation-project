import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { contactApi, messages, debugError } = vi.hoisted(() => ({
  contactApi: {
    submitMessage: vi.fn()
  },
  messages: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  debugError: vi.fn()
}))

vi.mock('element-plus', () => ({
  ElMessage: messages
}))

vi.mock('@/api/contactApi', () => ({
  default: contactApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import ContactView from '@/views/ContactView.vue'

const createWrapper = () =>
  mount(ContactView, {
    global: {
      stubs: {
        Navbar: true,
        Footer: true,
        ElForm: { template: '<form><slot /></form>' },
        ElFormItem: { template: '<div><slot /></div>' },
        ElInput: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
        },
        ElSelect: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>'
        },
        ElOption: {
          props: ['label', 'value'],
          template: '<option :value="value">{{ label }}</option>'
        }
      }
    }
  })

describe('ContactView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    contactApi.submitMessage.mockResolvedValue({ code: 200, message: '留言提交成功，我们会尽快回复您' })
  })

  it('warns and does not submit when required fields are missing', async () => {
    const wrapper = createWrapper()

    await wrapper.get('button.submit-btn').trigger('click')

    expect(messages.warning).toHaveBeenCalledWith('请填写完整信息')
    expect(contactApi.submitMessage).not.toHaveBeenCalled()
  })

  it('warns when type is missing', async () => {
    const wrapper = createWrapper()
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('张三')
    await inputs[1].setValue('13800138000')
    await inputs[2].setValue('订单没有发货')
    await wrapper.get('button.submit-btn').trigger('click')

    expect(messages.warning).toHaveBeenCalledWith('请选择问题类型')
    expect(contactApi.submitMessage).not.toHaveBeenCalled()
  })

  it('submits real request and clears form on success', async () => {
    const wrapper = createWrapper()
    const inputs = wrapper.findAll('input')
    const select = wrapper.get('select')

    await inputs[0].setValue('张三')
    await inputs[1].setValue('buyer@example.com')
    await select.setValue('order')
    await inputs[2].setValue('订单物流未更新')
    await wrapper.get('button.submit-btn').trigger('click')
    await flushPromises()

    expect(contactApi.submitMessage).toHaveBeenCalledWith({
      name: '张三',
      contact: 'buyer@example.com',
      type: 'order',
      content: '订单物流未更新'
    })
    expect(messages.success).toHaveBeenCalledWith('留言提交成功，我们会尽快回复您')
    expect((wrapper.vm as any).form.name).toBe('')
    expect((wrapper.vm as any).form.content).toBe('')
  })

  it('shows backend message when submit returns non-200 payload', async () => {
    contactApi.submitMessage.mockResolvedValue({ code: 500, message: '留言保存失败' })
    const wrapper = createWrapper()
    const inputs = wrapper.findAll('input')
    const select = wrapper.get('select')

    await inputs[0].setValue('张三')
    await inputs[1].setValue('buyer@example.com')
    await select.setValue('order')
    await inputs[2].setValue('订单物流未更新')
    await wrapper.get('button.submit-btn').trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('留言保存失败')
    expect(debugError).toHaveBeenCalledWith('提交留言失败:', '留言保存失败')
    expect((wrapper.vm as any).form.name).toBe('张三')
  })

  it('shows thrown message when submit request fails', async () => {
    contactApi.submitMessage.mockRejectedValue({ response: { data: { message: '服务暂时不可用' } } })
    const wrapper = createWrapper()
    const inputs = wrapper.findAll('input')
    const select = wrapper.get('select')

    await inputs[0].setValue('张三')
    await inputs[1].setValue('buyer@example.com')
    await select.setValue('order')
    await inputs[2].setValue('订单物流未更新')
    await wrapper.get('button.submit-btn').trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('服务暂时不可用')
    expect(debugError).toHaveBeenCalledWith('提交留言失败:', expect.any(Object))
  })
})
