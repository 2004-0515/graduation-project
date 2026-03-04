# 需求文档 - 管理员仪表盘数据可视化增强

## 简介

本功能旨在增强管理员仪表盘的数据可视化能力，提供更丰富的数据分析维度和更灵活的时间范围筛选，帮助管理员更直观地了解系统运营状况。

## 术语表

- **Dashboard**: 管理员仪表盘，展示系统核心数据和图表的页面
- **Time_Range**: 时间范围，用于筛选数据的时间区间（7天/30天/全部）
- **Sales_Trend**: 销售趋势，展示一段时间内销售额和订单数的变化
- **Order_Distribution**: 订单分布，展示不同状态订单的数量占比
- **Category_Sales**: 分类销量，展示各商品分类的销售情况
- **Hot_Products**: 热销商品，展示销量最高的商品列表
- **User_Growth**: 用户增长，展示用户注册数量的时间趋势
- **Revenue_Analysis**: 收入分析，展示收入构成和变化趋势

## 需求

### 需求 1: 时间范围筛选

**用户故事**: 作为管理员，我想选择不同的时间范围查看数据，以便分析不同时期的运营情况。

#### 验收标准

1. WHEN 管理员访问仪表盘页面 THEN THE Dashboard SHALL 默认显示最近7天的数据
2. WHEN 管理员点击时间范围选择器 THEN THE Dashboard SHALL 提供"7天"、"30天"、"全部"三个选项
3. WHEN 管理员选择不同时间范围 THEN THE Dashboard SHALL 重新加载并展示对应时间范围的数据
4. WHEN 时间范围改变 THEN THE Dashboard SHALL 更新所有图表和统计数据
5. THE Dashboard SHALL 在页面顶部显示当前选择的时间范围

### 需求 2: 销售趋势图增强

**用户故事**: 作为管理员，我想查看更详细的销售趋势，以便了解销售额和订单量的变化规律。

#### 验收标准

1. WHEN 显示7天数据 THEN THE Sales_Trend SHALL 按天展示销售额和订单数
2. WHEN 显示30天数据 THEN THE Sales_Trend SHALL 按天展示销售额和订单数
3. WHEN 显示全部数据 THEN THE Sales_Trend SHALL 按周或月聚合展示数据（根据数据量自动选择）
4. THE Sales_Trend SHALL 使用双Y轴分别展示销售额（柱状图）和订单数（折线图）
5. WHEN 鼠标悬停在图表上 THEN THE Sales_Trend SHALL 显示该时间点的详细数据
6. THE Sales_Trend SHALL 使用渐变色增强视觉效果

### 需求 3: 订单状态分布优化

**用户故事**: 作为管理员，我想清晰地看到各状态订单的分布情况，以便及时处理待处理订单。

#### 验收标准

1. THE Order_Distribution SHALL 使用环形饼图展示订单状态分布
2. THE Order_Distribution SHALL 显示所有非零状态的订单数量和占比
3. WHEN 鼠标悬停在饼图扇区 THEN THE Order_Distribution SHALL 高亮显示该状态的详细信息
4. THE Order_Distribution SHALL 使用不同颜色区分不同订单状态
5. THE Order_Distribution SHALL 在图例中显示各状态的名称和数量

### 需求 4: 热销商品排行

**用户故事**: 作为管理员，我想查看热销商品排行，以便了解哪些商品最受欢迎。

#### 验收标准

1. THE Hot_Products SHALL 展示销量Top10的商品
2. THE Hot_Products SHALL 显示商品名称、销量、销售额
3. THE Hot_Products SHALL 根据选择的时间范围筛选数据
4. WHEN 没有销售数据 THEN THE Hot_Products SHALL 显示"暂无数据"提示
5. THE Hot_Products SHALL 使用表格或卡片形式展示，便于阅读

### 需求 5: 用户增长趋势

**用户故事**: 作为管理员，我想查看用户增长趋势，以便了解平台用户规模的发展情况。

#### 验收标准

1. THE User_Growth SHALL 展示用户注册数量的时间趋势
2. WHEN 显示7天或30天数据 THEN THE User_Growth SHALL 按天展示新增用户数
3. WHEN 显示全部数据 THEN THE User_Growth SHALL 按周或月聚合展示
4. THE User_Growth SHALL 使用面积图展示累计用户数
5. THE User_Growth SHALL 在图表上标注关键节点（如用户数突增的日期）

### 需求 6: 分类销量分析优化

**用户故事**: 作为管理员，我想查看各分类的销售情况，以便调整商品结构。

#### 验收标准

1. THE Category_Sales SHALL 展示所有分类的销量排名
2. THE Category_Sales SHALL 根据选择的时间范围计算销量
3. THE Category_Sales SHALL 使用横向柱状图展示Top5分类
4. WHEN 鼠标悬停在柱状图 THEN THE Category_Sales SHALL 显示该分类的详细销量和销售额
5. THE Category_Sales SHALL 使用渐变色柱状图增强视觉效果

### 需求 7: 收入分析

**用户故事**: 作为管理员，我想查看收入的详细分析，以便了解收入来源和构成。

#### 验收标准

1. THE Revenue_Analysis SHALL 展示总收入、已完成订单收入、待收入（待付款订单）
2. THE Revenue_Analysis SHALL 根据选择的时间范围计算收入
3. THE Revenue_Analysis SHALL 显示收入同比增长率（如果有历史数据）
4. THE Revenue_Analysis SHALL 使用卡片形式展示关键收入指标
5. THE Revenue_Analysis SHALL 使用不同颜色区分不同类型的收入

### 需求 8: 数据加载状态

**用户故事**: 作为管理员，我想在数据加载时看到加载提示，以便知道系统正在处理。

#### 验收标准

1. WHEN 页面首次加载 THEN THE Dashboard SHALL 显示加载动画
2. WHEN 切换时间范围 THEN THE Dashboard SHALL 显示加载状态
3. WHEN 数据加载失败 THEN THE Dashboard SHALL 显示错误提示和重试按钮
4. WHEN 数据加载成功 THEN THE Dashboard SHALL 隐藏加载状态并展示数据
5. THE Dashboard SHALL 在3秒内完成数据加载（正常网络条件下）

### 需求 9: 响应式布局

**用户故事**: 作为管理员，我想在不同设备上都能正常查看仪表盘，以便随时了解系统状况。

#### 验收标准

1. WHEN 屏幕宽度小于1200px THEN THE Dashboard SHALL 调整图表布局为单列
2. WHEN 屏幕宽度小于768px THEN THE Dashboard SHALL 调整统计卡片为单列
3. THE Dashboard SHALL 在移动设备上保持图表可读性
4. THE Dashboard SHALL 在窗口大小改变时自动调整图表尺寸
5. THE Dashboard SHALL 在所有主流浏览器上正常显示

### 需求 10: 数据导出（可选）

**用户故事**: 作为管理员，我想导出仪表盘数据，以便进行离线分析或报告。

#### 验收标准

1. THE Dashboard SHALL 提供"导出数据"按钮
2. WHEN 点击导出按钮 THEN THE Dashboard SHALL 生成包含当前数据的Excel文件
3. THE Dashboard SHALL 导出当前时间范围内的所有统计数据
4. THE Dashboard SHALL 在导出文件中包含图表截图（可选）
5. THE Dashboard SHALL 在导出完成后提示用户下载

## 非功能需求

### 性能要求

1. 页面首次加载时间不超过3秒
2. 切换时间范围时响应时间不超过1秒
3. 图表渲染流畅，无明显卡顿
4. 支持同时展示多个图表而不影响性能

### 兼容性要求

1. 支持Chrome、Firefox、Safari、Edge最新版本
2. 支持1920x1080及以上分辨率
3. 支持平板和移动设备访问

### 可维护性要求

1. 图表配置应模块化，便于后续扩展
2. 数据获取逻辑应与展示逻辑分离
3. 使用TypeScript确保类型安全

## 技术约束

1. 前端使用Vue 3 + TypeScript + ECharts
2. 后端使用Spring Boot提供数据API
3. 遵循项目现有的代码规范和架构
4. 使用项目现有的UI风格和色彩方案

## 优先级

- P0（必须实现）: 需求1、2、3、6、8、9
- P1（建议实现）: 需求4、5、7
- P2（可选实现）: 需求10

## 验收标准

1. 所有P0需求的验收标准全部通过
2. 至少实现2个P1需求
3. 图表展示美观，数据准确
4. 无明显性能问题
5. 通过手动测试验证所有功能
