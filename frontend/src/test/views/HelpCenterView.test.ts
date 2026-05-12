import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HelpCenterView from '@/views/HelpCenterView.vue'

const createWrapper = () =>
  mount(HelpCenterView, {
    global: {
      stubs: {
        Navbar: true,
        Footer: true
      }
    }
  })

describe('HelpCenterView', () => {
  it('shows help center heading and default faq list', () => {
    const wrapper = createWrapper()

    expect(wrapper.text()).toContain('帮助中心')
    expect(wrapper.text()).toContain('常见问题解答，帮助您更好地使用紫苑风鸢')
    expect(wrapper.text()).toContain('如何注册账号？')
    expect(wrapper.text()).toContain('退款多久到账？')
  })

  it('filters faqs by selected category and toggles answer visibility', async () => {
    const wrapper = createWrapper()

    await wrapper.findAll('li').find((item) => item.text() === '订单相关')?.trigger('click')

    expect(wrapper.text()).toContain('如何查看我的订单？')
    expect(wrapper.text()).toContain('订单可以取消吗？')
    expect(wrapper.text()).not.toContain('支持哪些支付方式？')

    const faqItem = wrapper.findAll('.faq-item').find((item) => item.text().includes('如何查看我的订单？'))
    expect(wrapper.text()).not.toContain('登录后，点击右上角头像进入个人中心')

    await faqItem?.trigger('click')
    expect(wrapper.text()).toContain('登录后，点击右上角头像进入个人中心')
  })
})
