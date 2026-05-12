import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TermsView from '@/views/TermsView.vue'

describe('TermsView', () => {
  it('shows terms heading, updated date, and key sections', () => {
    const wrapper = mount(TermsView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    expect(wrapper.text()).toContain('服务条款')
    expect(wrapper.text()).toContain('最后更新：2025年1月1日')
    expect(wrapper.text()).toContain('1. 服务协议的确认')
    expect(wrapper.text()).toContain('4. 订单与支付')
    expect(wrapper.text()).toContain('10. 条款修改')
  })
})
