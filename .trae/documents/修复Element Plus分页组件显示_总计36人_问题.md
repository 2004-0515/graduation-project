# 修复页面滚动重置问题

## 问题分析
当用户在商品分类页面点击分页控件（页码或每页条数）时，商品列表会更新，但页面滚动位置不会重置到顶部，影响用户体验。

## 问题原因
- 在 `CategoryView.vue` 中，滚动重置逻辑只在 `fetchData` 函数中实现
- `fetchData` 函数仅在页面加载和路由参数变化时调用
- 当用户点击分页控件时，只会调用 `fetchProducts` 函数，而该函数没有滚动重置逻辑

## 修复方案

### 1. 在 `fetchProducts` 函数中添加滚动重置逻辑
```javascript
// 获取商品列表
const fetchProducts = async () => {
  try {
    // 现有商品获取和分页逻辑...
    
    // 实现分页逻辑
    const startIndex = (currentPage.value - 1) * pageSize.value
    const endIndex = startIndex + pageSize.value
    products.value = sortedProducts.slice(startIndex, endIndex)
    total.value = sortedProducts.length
    
    // 添加滚动重置逻辑
    nextTick(() => {
      // 兼容各种浏览器的滚动到顶部方法
      if (window.scrollTo) {
        // 现代浏览器支持的平滑滚动
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        // 兼容旧版浏览器
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }
    })
  } catch (error) {
    // 错误处理...
  }
}
```

### 2. 检查并确保所有分页相关事件都调用了包含滚动重置的函数
- `handleSizeChange` 事件已调用 `fetchProducts` 函数
- `handleCurrentChange` 事件已调用 `fetchProducts` 函数
- `sortByChange` 事件已调用 `fetchProducts` 函数

### 3. 验证修复效果
修复后，当用户执行以下操作时，页面会自动滚动到顶部：
- 点击分页控件的页码
- 调整每页显示条数
- 切换排序方式
- 切换分类

## 修复预期效果
- 提升用户体验，确保每次内容更新后用户都能从页面顶部开始浏览
- 保持页面行为的一致性
- 兼容各种浏览器

## 实施注意事项
- 使用 `nextTick` 确保 DOM 更新完成后再执行滚动操作
- 实现浏览器兼容的滚动方式
- 保持代码的可读性和可维护性