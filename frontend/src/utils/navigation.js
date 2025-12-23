// 导航工具函数，确保页面跳转时的一致性和可靠性
import { useRouter } from 'vue-router'

/**
 * 页面跳转函数
 * @param {string} path - 目标路径
 * @param {Object} options - 跳转选项
 * @param {boolean} options.scrollToTop - 是否滚动到顶部，默认true
 * @param {Object} options.replace - 是否替换当前历史记录，默认false
 */
export const navigateTo = (path, options = {}) => {
  const router = useRouter()
  const { scrollToTop = true, replace = false } = options
  
  // 执行跳转
  if (replace) {
    router.replace(path)
  } else {
    router.push(path)
  }
  
  // 确保滚动到顶部（针对某些特殊情况的额外保障）
  if (scrollToTop) {
    // 使用setTimeout确保在DOM更新后执行
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }, 100)
  }
}

/**
 * 刷新当前页面
 * @param {boolean} scrollToTop - 是否滚动到顶部，默认true
 */
export const refreshPage = (scrollToTop = true) => {
  const router = useRouter()
  router.go(0)
  
  if (scrollToTop) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

/**
 * 回到上一页
 * @param {boolean} scrollToTop - 是否滚动到顶部，默认false
 */
export const goBack = (scrollToTop = false) => {
  const router = useRouter()
  router.back()
  
  if (scrollToTop) {
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }, 100)
  }
}