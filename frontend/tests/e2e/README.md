# 浏览器测试与 E2E 运行说明

## 两层验证怎么用

### 1. `@浏览器` / Codex in-app browser
- 用途：真实巡检本地 `localhost/127.0.0.1` 页面，复现隐藏交互问题、坏跳转、中文提示、列表刷新、控制台报错、失败请求。
- 适合场景：
  - 新功能刚改完，需要像真实用户一样点一遍
  - Playwright 已报错，需要快速复现并截图
  - 需要核对“页面看起来对不对”和“消息是不是中文”
- 巡检标准：
  - 路由可达
  - 数据来自真实接口
  - 关键按钮可操作
  - 操作后以服务端状态刷新
  - 提示文案为中文
  - 无控制台 error
  - 无异常 4xx/5xx 请求

### 2. Playwright
- 用途：把已经巡检过的高价值链路固化成可重复回归。
- 当前不引入第二套框架，统一继续用现有 `frontend/tests/e2e`。

## 当前本地栈基线

- 前端默认地址：`http://127.0.0.1:5173`
- 后端默认地址：
  - 日常本地直连常见为 `http://127.0.0.1:8080/api`
  - 固定端口真实浏览器回归脚本使用 `http://127.0.0.1:8081/api`
- 重要约束：
  - 浏览器巡检与 Playwright E2E 的默认目标应该是你正在使用的真实 MySQL 环境
  - `application-local.properties` / `data-local.sql` 只用于临时隔离调试，不应被当成真实联调基线
- Playwright `baseURL`：
  - 默认读取 `PLAYWRIGHT_BASE_URL`
  - 未设置时使用 `http://127.0.0.1:5173`
- Playwright worker：
  - 默认 `workers=1`
  - 目的不是提速，而是避免本地真实后端在登录限流、共享测试数据和管理员副作用场景下被并发用例互相污染
- 默认账号：
  - 买家：`zhangsan / 123456`
  - 卖家：`lisi / 123456`
  - 管理员：`admin / 123456`
- 商品选择策略：
  - 优先读取环境变量指定的真实商品 ID：
    - `E2E_PRODUCT_ID`
    - `E2E_SHIPPING_PRODUCT_ID`
    - `E2E_CANCEL_PRODUCT_ID`
    - `E2E_PRICE_ALERT_PRODUCT_ID`
  - 未显式指定时，脚本会从真实接口动态挑选满足条件的商品，而不是依赖仓库里的种子 SQL 主键

## 运行命令

```powershell
cd D:\graduation project\frontend
npm run test:e2e
```

如果要强制走“固定端口 + 自动回收”的真实浏览器栈，优先使用：

```powershell
powershell -ExecutionPolicy Bypass -File D:\graduation project\scripts\run-real-browser-e2e.ps1
```

这个脚本会：
- 先清理项目残留的 `5173 / 8081`
- 用真实 MySQL 配置启动后端到 `8081`
- 用 Vite 代理固定启动前端到 `5173`
- 跑完 Playwright 后自动回收前后端进程

如果你要给 `@浏览器`、手工巡检或独立调试先单独拉起固定端口栈，可以直接用：

```powershell
powershell -ExecutionPolicy Bypass -File D:\graduation project\scripts\start-real-browser-stack.ps1
```

启动成功后默认地址固定为：

- 前端：`http://127.0.0.1:5173`
- 后端：`http://127.0.0.1:8081/api`

巡检或调试结束后，用下面的脚本回收固定端口实例，避免端口残留后一路自增：

```powershell
powershell -ExecutionPolicy Bypass -File D:\graduation project\scripts\stop-real-browser-stack.ps1
```

只跑指定脚本示例：

```powershell
powershell -ExecutionPolicy Bypass -File D:\graduation project\scripts\run-real-browser-e2e.ps1 -Specs tests/e2e/smoke.spec.ts
```

一次跑多个指定脚本时，PowerShell 下建议直接用数组写法：

```powershell
& 'D:\graduation project\scripts\run-real-browser-e2e.ps1' -Specs @(
  'tests/e2e/user-smoke.spec.ts',
  'tests/e2e/search-dropdown-flow.spec.ts',
  'tests/e2e/hot-products-browse.spec.ts'
)
```

按分组执行：

```powershell
npm run test:e2e:user
npm run test:e2e:admin
npm run test:e2e:smoke
```

有头模式：

```powershell
npm run test:e2e:headed
```

如果前端不是 `5173`：

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:5174'
npm run test:e2e:smoke
```

## 当前脚本分组

### 用户端
- `smoke.spec.ts`
  - 登录
  - 商品详情
  - 下单
  - 支付
  - 订单列表
- `user-smoke.spec.ts`
  - 首页
  - 商品详情
  - 通知页
  - 资料页
  - 设置页
  - 理性消费页
- `coupon-flow.spec.ts`
  - 首页、优惠券中心、优惠专题、优惠券详情四入口
  - 未登录中文提示与登录引导
  - 已登录领取后服务端状态刷新
- `account-settings.spec.ts`
  - 资料页
  - 设置导航
  - 退出登录
- `settings-persistence.spec.ts`
  - 设置页隐私可见性真实保存
  - 订单通知开关真实保存
  - 刷新后仍保持服务端持久化状态
  - 用例结束后自动恢复原值，避免污染真实账号
- `profile-persistence.spec.ts`
  - 个人资料页昵称真实保存
  - 个人简介真实保存
  - 刷新后仍保持服务端持久化状态
  - 用例结束后自动恢复原值，避免污染真实账号
- `profile-quick-actions.spec.ts`
  - 个人中心快捷入口直达待支付、待发货、待收货订单页
  - 个人中心快捷入口直达购物车、降价提醒页
  - 每一步都校验真实路由和目标页面根节点
- `address-management.spec.ts`
  - 收货地址真实新增
  - 真实编辑
  - 设为默认
  - 删除后列表真实刷新
  - 用例结束后自动恢复原默认地址并清理测试地址
- `price-alerts-operations.spec.ts`
  - 降价提醒列表真实修改目标价
  - 真实取消监控
  - 真实删除提醒记录
  - 用例结束后自动清理测试提醒
- `my-products-management.spec.ts`
  - 卖家在“我的商品”页真实发布商品
  - 新商品进入待审核状态
  - 待审核商品编辑按钮保持禁用
  - 卖家删除测试商品后列表真实刷新
  - 用例结束后自动清理测试商品
- `category-browse.spec.ts`
  - 匿名用户在分类页按真实商品搜索
  - 价格区间筛选与排序真实生效
  - 从分类页进入商品详情
  - 清除搜索后返回分类总览
- `search-dropdown-flow.spec.ts`
  - 首页搜索框真实打开下拉
  - 热门搜索在空输入时可见
  - 搜索建议可点击进入分类结果页
  - 商品描述命中的关键词也能返回真实商品名建议
  - 游客本地搜索历史会回显并可再次触发搜索
  - 登录后服务端搜索历史会真实写入并回显
  - 该脚本会先调用真实 `/api/products` 与 `/api/search/suggestions`，动态挑选当前 MySQL 里可命中的商品与关键词，不依赖仓库中的写死商品名或测试 SQL
- `hot-products-browse.spec.ts`
  - 匿名用户可进入热销榜
  - 榜单真实数据可见
  - 榜单卡片可进入商品详情
- `help-and-terms.spec.ts`
  - 帮助中心路由可达
  - FAQ 分类切换与展开交互可用
  - 服务条款路由可达
  - 静态说明页关键章节可见
- `public-routes-smoke.spec.ts`
  - 登录页可达
  - 注册页可达
  - 联系页可达
  - 帮助中心与服务条款页可达
  - 用于锁住公开页面的最小真实浏览器基线
- `route-guard-smoke.spec.ts`
  - 匿名访问受保护页面会跳登录页并保留 redirect
  - 普通用户访问后台会被重定向回首页
  - 管理员可以正常进入后台
  - 用于锁住真实浏览器里的路由守卫流转语义
- `footer-navigation.spec.ts`
  - 首页底部“帮助中心 / 联系客服 / 服务条款”三条关键入口可跳转到真实页面
  - 用于锁住跨页底部导航和实际页面标题文案的一致性
- `seller-orders-management.spec.ts`
  - 卖家发货页可看到真实待发货订单
  - 发货成功后列表状态真实刷新
  - 已发货筛选可定位刚发出的订单
- `cart-management.spec.ts`
  - 真实商品加入购物车后，购物车页可看到服务端返回的购物车项
  - 数量加一后页面按真实接口结果刷新
  - 删除商品后回到空购物车态
  - 用例结束后自动清理购物车，避免污染真实账号
- `orders-management.spec.ts`
  - 用户订单页可按真实订单号搜索待支付订单
  - 立即支付按钮会正确进入支付页
  - 取消订单后列表状态真实刷新为已取消
- `order-detail-management.spec.ts`
  - 买家可直接进入真实订单详情页
  - 卖家发货后，详情页会显示待收货状态
  - 买家确认收货后，详情页状态真实刷新为已完成
- `product-detail-cart.spec.ts`
  - 用户可从商品详情页直接点击“加入购物车”
  - 成功提示保持中文
  - 跳到购物车页后可看到服务端真实返回的购物车项
- `product-detail-wishlist.spec.ts`
  - 用户可从商品详情页直接加入想要清单
  - 成功提示保持中文
  - 理性消费页的想要清单会按服务端真实状态出现该商品
- `payment-management.spec.ts`
  - 用户可直接在支付页切换支付方式
  - 模拟支付成功后会显示正确的支付方式和成功态
  - 返回订单列表后可看到服务端真实状态已变为待发货
- `product-detail-price-alert.spec.ts`
  - 用户可从商品详情页直接设置降价提醒
  - 成功提示保持中文
  - 降价提醒页会按服务端真实状态出现该提醒记录
- `rational-consumption-flow.spec.ts`
  - 理性消费页设置预算
  - 想要清单真实删除
  - 动作后按服务端状态刷新
- `notifications-operations.spec.ts`
  - 通知页全部已读
  - 单条删除
  - 清空全部
  - 动作后按服务端状态刷新

### 角色链路 / 后台
- `order-phase2.spec.ts`
  - 买家支付后卖家发货
  - 买家申请取消后管理员审核
- `price-alert-notification.spec.ts`
  - 降价提醒
  - 通知跳转到商品详情
- `notification-routing.spec.ts`
  - 促销通知 -> 优惠券详情
  - 文件审核通知 -> 个人中心
  - 卖家订单通知 -> 卖家发货页
  - 管理员商品审核通知 -> 后台商品待审核页
- `admin-price-alert-management.spec.ts`
  - 后台价格管理中的降价提醒
  - 手动触发
  - 回退触发
  - 删除提醒
  - 每一步都校验列表真实刷新
- `admin-orders-management.spec.ts`
  - 买家提交取消申请
  - 管理员审核取消
  - 管理员删除已取消订单
  - 校验后台订单列表真实刷新与行消失
- `admin-product-review-management.spec.ts`
  - 卖家提交待审核商品
  - 管理员在待审核列表通过审核
  - 审核通过后商品从待审核列表消失
  - 管理员在全部商品列表删除该商品并校验真实刷新
- `admin-coupons-management.spec.ts`
  - 管理员优惠券列表定位真实数据行
  - 切换优惠券启用状态
  - 删除优惠券并校验列表真实刷新
- `admin-file-review-management.spec.ts`
  - 用户上传待审核头像文件
  - 管理员在文件审核页通过审核
  - 审核状态切换后删除审核记录
- `contact-message-management.spec.ts`
  - 用户在联系页提交真实留言
  - 管理员在留言管理页标记已处理
  - 管理员删除留言并校验列表真实刷新
- `admin-notifications-management.spec.ts`
  - 管理员在消息管理页向指定用户发送通知
  - 普通用户在通知页收到真实消息
  - 打开通知详情并校验标题、正文一致
- `admin-rational-management.spec.ts`
  - 管理员在理性消费后台手动授予成就
  - 最近成就列表出现真实记录
  - 撤销成就后列表真实刷新
- `admin-categories-management.spec.ts`
  - 管理员新增分类
  - 列表出现真实新分类
  - 删除分类后列表真实刷新
- `admin-users-management.spec.ts`
  - 管理员搜索用户
  - 禁用用户后列表刷新
  - 再启用恢复，避免真实测试账号留在禁用态
- `admin-smoke.spec.ts`
  - 仪表盘
  - 商品管理
  - 订单管理
  - 价格管理
  - 文件审核
  - 优惠券管理
  - 留言管理

## 可观测性约定

- 新增高频 E2E 锚点统一使用 `data-testid`
- 当前已经补到这些页面：
  - `HomeView`
  - `PromotionsView`
  - `PromotionDetailView`
  - `CouponDetailView`
  - `NotificationsView`
  - `ProfileView`
  - `SettingsView`
  - `admin/ProductsView`
  - `admin/OrdersManageView`
  - `admin/PriceManageView`
  - `admin/FileReviewView`
  - `CartView`
  - `OrdersView`
  - `OrderDetailView`

## 下一步

- 当前先复用本地运行栈和现有账号/商品
- 后续再补独立 E2E 栈：
  - 固定端口
  - 固定测试账号
  - 固定商品与订单前置数据
  - 固定运行命令
