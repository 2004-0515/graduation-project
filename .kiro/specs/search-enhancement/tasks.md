# Implementation Plan: Search Enhancement

## Overview

本实现计划将商品搜索优化功能分解为可执行的编码任务。采用后端优先的策略，先完成数据层和API，再实现前端组件。

## Tasks

- [x] 1. 创建数据库表和实体类
  - [x] 1.1 创建搜索历史表和搜索统计表的SQL脚本
    - 创建 `tb_search_history` 表，包含 id, user_id, keyword, search_time, created_time, updated_time
    - 创建 `tb_search_stats` 表，包含 id, keyword, search_count, search_date, created_time, updated_time
    - 添加必要的索引
    - _Requirements: 5.1, 5.2_
  - [x] 1.2 创建 SearchHistory 实体类
    - 在 `backend/src/main/java/com/shopping/entity/` 下创建
    - 包含 JPA 注解和字段映射
    - _Requirements: 1.1, 5.1_
  - [x] 1.3 创建 SearchStats 实体类
    - 在 `backend/src/main/java/com/shopping/entity/` 下创建
    - 包含 JPA 注解和字段映射
    - _Requirements: 2.4, 5.1_

- [x] 2. 创建Repository层
  - [x] 2.1 创建 SearchHistoryRepository
    - 实现按用户ID查询历史（限制数量、按时间倒序）
    - 实现按用户ID和关键词查询（用于去重）
    - 实现删除单条和清空用户历史
    - _Requirements: 1.2, 1.4, 1.5, 5.4_
  - [x] 2.2 创建 SearchStatsRepository
    - 实现按日期范围统计热门关键词
    - 实现按关键词和日期查询/更新统计
    - _Requirements: 2.2, 2.4, 2.5, 5.2_

- [x] 3. 创建DTO类
  - [x] 3.1 创建搜索相关DTO
    - SearchSuggestionDto（关键词、类型、高亮）
    - HotKeywordDto（关键词、搜索次数）
    - SearchHistoryDto（ID、关键词、搜索时间）
    - SearchHistoryRequest（关键词）
    - SearchStatsRequest（关键词）
    - _Requirements: 3.3, 5.2, 5.3, 5.4_

- [x] 4. 创建Service层
  - [x] 4.1 创建 SearchService 核心方法
    - 实现 getSuggestions：从商品名和分类名中匹配建议
    - 实现 getHotKeywords：统计7天内热门词
    - 实现 getUserSearchHistory：获取用户历史（最多10条）
    - _Requirements: 1.2, 2.2, 2.5, 3.1, 3.2, 3.3_
  - [x] 4.2 实现搜索历史管理方法
    - 实现 addSearchHistory：添加历史（去重更新时间戳）
    - 实现 deleteSearchHistory：删除单条历史
    - 实现 clearSearchHistory：清空用户历史
    - _Requirements: 1.1, 1.4, 1.5, 1.6_
  - [x] 4.3 实现搜索统计方法
    - 实现 recordSearchStats：记录搜索统计
    - 实现空白关键词校验
    - _Requirements: 2.4, 5.1, 5.5_
  - [x] 4.4 编写 SearchService 属性测试
    - **Property 2: Search History Limit** - 验证历史记录最多返回10条
    - **Property 3: Search History Deduplication** - 验证去重逻辑
    - **Property 5: Hot Keywords Limit** - 验证热门词最多返回8条
    - **Property 8: Search Suggestions Limit** - 验证建议最多返回6条
    - **Property 10: Whitespace Query Rejection** - 验证空白查询被拒绝
    - **Validates: Requirements 1.2, 1.6, 2.2, 3.2, 5.5**

- [x] 5. 创建Controller层
  - [x] 5.1 创建 SearchController
    - GET /api/search/suggestions - 获取搜索建议
    - GET /api/search/hot-keywords - 获取热门搜索词
    - GET /api/search/history - 获取用户搜索历史
    - POST /api/search/history - 添加搜索历史
    - DELETE /api/search/history/{id} - 删除单条历史
    - DELETE /api/search/history - 清空搜索历史
    - POST /api/search/stats - 记录搜索统计
    - _Requirements: 5.2, 5.3, 5.4_
  - [x] 5.2 编写 SearchController 单元测试
    - 测试各端点的参数校验
    - 测试权限控制（历史记录需要登录）
    - _Requirements: 5.2, 5.3, 5.4_

- [x] 6. Checkpoint - 后端功能验证
  - 确保所有后端测试通过
  - 使用 Postman 或 curl 测试各 API 端点
  - 如有问题请询问用户

- [x] 7. 创建前端API模块
  - [x] 7.1 创建 searchApi.ts
    - 实现 getSuggestions 方法
    - 实现 getHotKeywords 方法
    - 实现 getSearchHistory 方法
    - 实现 addSearchHistory 方法
    - 实现 deleteSearchHistory 方法
    - 实现 clearSearchHistory 方法
    - 实现 recordSearch 方法
    - _Requirements: 5.2, 5.3, 5.4_
  - [x] 7.2 更新前端类型定义
    - 在 types/index.ts 中添加 SearchSuggestion、HotKeyword、SearchHistory 类型
    - _Requirements: 3.3_

- [x] 8. 创建搜索下拉面板组件
  - [x] 8.1 创建 SearchDropdown.vue 组件
    - 实现搜索历史区域（显示、删除、清空）
    - 实现热门搜索区域（标签样式）
    - 实现搜索建议区域（列表样式、高亮匹配）
    - 实现区域切换逻辑（空输入显示历史+热词，有输入显示建议）
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 8.2 实现键盘导航
    - 上下键切换选中项
    - 回车键执行搜索
    - ESC键关闭面板
    - _Requirements: 3.6, 3.7_
  - [x] 8.3 实现游客本地存储
    - 未登录时使用 localStorage 存储历史
    - 登录后可选择同步到服务器
    - _Requirements: 1.7_

- [x] 9. 集成到导航栏
  - [x] 9.1 修改 Navbar.vue 集成搜索下拉面板
    - 引入 SearchDropdown 组件
    - 实现输入防抖（300ms）
    - 实现点击外部关闭面板
    - 执行搜索时记录统计
    - _Requirements: 3.1, 4.5, 4.6, 2.4_
  - [x] 9.2 编写前端组件测试
    - 测试 SearchDropdown 组件的显示逻辑
    - 测试键盘导航功能
    - _Requirements: 3.6, 3.7, 4.3, 4.4_

- [x] 10. Final Checkpoint - 完整功能验证
  - 确保所有测试通过
  - 手动测试完整搜索流程
  - 验证游客和登录用户的不同行为
  - 如有问题请询问用户

## Notes

- 所有任务（包括测试）都必须完成
- 后端使用 jqwik 进行属性测试
- 前端使用 vitest 进行单元测试
- 数据库表需要在 Navicat 中手动执行（包含中文注释）
- 搜索建议的防抖时间为 300ms，避免频繁请求
