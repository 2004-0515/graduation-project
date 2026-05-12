import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Footer from '@/components/Footer.vue'

describe('Footer', () => {
  it('renders brand copy and core customer links', () => {
    const wrapper = mount(Footer, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="typeof to === \'string\' ? to : to.path"><slot /></a>'
          }
        }
      }
    })

    expect(wrapper.text()).toContain('紫苑风鸢')
    expect(wrapper.text()).toContain('让心愿随风而起，理性消费每一刻')

    const links = wrapper.findAll('a').map((link) => ({
      text: link.text(),
      href: link.attributes('href')
    }))

    expect(links).toEqual(
      expect.arrayContaining([
        { text: '全部商品', href: '/category' },
        { text: '热销排行', href: '/hot' },
        { text: '促销活动', href: '/promotions' },
        { text: '个人中心', href: '/profile' },
        { text: '我的订单', href: '/orders' },
        { text: '购物车', href: '/cart' },
        { text: '帮助中心', href: '/help' },
        { text: '联系客服', href: '/contact' },
        { text: '服务条款', href: '/terms' }
      ])
    )
  })
})
