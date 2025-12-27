/**
 * 生成随机验证码
 * @param {number} length - 验证码长度
 * @returns {string} 随机生成的验证码
 */
export const generateRandomCode = (length = 6) => {
  // 验证码字符集，包含数字和大小写字母，排除易混淆字符
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    // 随机选择字符集中的字符
    const randomIndex = Math.floor(Math.random() * charset.length)
    result += charset[randomIndex]
  }
  
  return result
}

/**
 * 验证验证码是否匹配（不区分大小写）
 * @param {string} inputCode - 用户输入的验证码
 * @param {string} correctCode - 正确的验证码
 * @returns {boolean} 是否匹配
 */
export const validateCaptcha = (inputCode, correctCode) => {
  if (!inputCode || !correctCode) {
    return false
  }
  
  return inputCode.toLowerCase() === correctCode.toLowerCase()
}