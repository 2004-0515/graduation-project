/**
 * 日志工具类
 */
export const logUtils = {
  /**
   * 打印购物车相关日志
   * @param {string} message - 日志消息
   * @param {any} data - 日志数据
   */
  cartLog(message, data = null) {
    console.log(`[购物车日志] ${message}`, data ? data : '')
  },
  
  /**
   * 打印用户相关日志
   * @param {string} message - 日志消息
   * @param {any} data - 日志数据
   */
  userLog(message, data = null) {
    console.log(`[用户日志] ${message}`, data ? data : '')
  }
}