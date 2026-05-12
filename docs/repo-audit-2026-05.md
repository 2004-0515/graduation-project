# 全仓功能审计与未完成任务合并清单

更新时间：2026-05-11

## 审计边界

- Web 默认运行：真实 MySQL
- 测试隔离环境：H2 `test` profile
- 已完成基线：订单支付链路 Phase 1 已落地，不回退
- 本文区分两类来源：
  - A. 已知未完成任务
  - B. 新发现缺口

## 审计标准

- 用户可见入口不能指向不存在的路由或伪能力
- 页面显示的设置项必须和后端持久化能力一致
- 核心任务路径应以服务端真实状态为事实源
- 面向用户的统计、报告、提醒数字需要可解释、可回溯

参考：

- Nielsen Norman Group: https://www.nngroup.com/articles/ten-usability-heuristics/
- Baymard Institute: https://baymard.com/guidelines/798-implementing-save-features

## A. 已知未完成任务

| 功能域 | 当前状态 | 是否旧任务 | 风险级别 | 推荐优先级 | 依赖关系 |
| --- | --- | --- | --- | --- | --- |
| 订单链路 Phase 2 | 订单服务、关键页面、focused tests、真实浏览器 E2E 已收口；当前剩余重点降为少量前端弱类型继续收紧和后续回归保持 | 是 | 中 | P1 | 依赖现有订单 API，前后端共享类型 |
| 订单控制器/功能测试 | 已扩展 `OrderControllerFlowTest` 覆盖用户、卖家、管理员主要控制器分支，并补了真实浏览器链路验证；当前主要剩余是持续回归与后续变更防回退 | 是 | 中 | P1 | 依赖现有后端 H2 测试环境 |
| 商品详情测试 | 已替换 placeholder，已覆盖库存为 0、数量归一化、立即购买跳转；剩余是更多边界与联调覆盖 | 是 | 中 | P1 | 依赖 `ProductDetailView` 当前交互收口 |
| 理性消费模块 | 报告随机模拟值已替换为可追溯统计，预算状态口径与前端失败态展示已继续收口；剩余是继续审计少量用户可见数字与边界交互 | 是 | 中 | P1 | 依赖订单、预算、想要清单真实数据 |

## B. 新发现缺口

| 功能域 | 当前状态 | 是否旧任务 | 风险级别 | 推荐优先级 | 依赖关系 |
| --- | --- | --- | --- | --- | --- |
| 个人中心/Profile | 手机号入口已改到安全设置，统计失败不再伪装成 0；剩余是继续核对资料编辑和设置页职责边界 | 否 | 中 | P1 | 依赖设置页安全入口 |
| 设置/Privacy | 伪能力 `showPurchases`、`personalization` 已下线；通知设置里原先无后端支撑的“评论回复”开关也已移除，剩余是继续核对设置项是否一一对应 | 否 | 中 | P1 | 依赖后端实体/接口 |
| 通知路由 | 主要消息类型跳转、缺失 `relatedId` 回退和降价提醒商品详情跳转已补 focused tests 与真实链路；剩余是少量后续回归保持 | 否 | 中 | P1 | 依赖通知动作映射 |
| 通知动作契约 | `order/promotion/file_review/product_review/review/price_alert` 已收口并补测试；剩余是后续新增消息类型时同步纳入回归 | 否 | 中 | P1 | 依赖 router 和通知数据类型 |
| 个人中心与设置职责 | 已开始拆分：Profile 保留资料与统计，安全动作统一收口到 Settings；剩余是继续核对是否还有重复入口 | 否 | 中 | P1 | 依赖页面信息架构调整 |
| 运行正确性代码债 | 多处 helper `return null`、裸 `RuntimeException`、模拟值、假成功持续收口中；`ContactView` 本轮已从本地假成功改为真实后端提交 | 否 | 高 | P1 | 依赖逐模块排查与异常体系收口 |
| 理性消费可信度 | 核心报告随机数已移除，预算/清单/成就在失败态下不再伪装成真实 0；想要清单“已购买”和报告里的“重复购买提醒”都已补可见性，剩余是继续审计少量派生数字 | 否 | 中 | P1 | 依赖真实统计口径定义 |
| 商品详情交互可靠性 | 数量校验、库存边界、立即购买、删除评价/降价提醒/想要清单失败提示、价格历史失败态可见性已补 focused 覆盖；本轮继续补齐“加入购物车失败日志”以及评价/价格历史/降价提醒/重复购买/想要清单状态读取 `non-200` 日志契约，剩余主要是更多联调边界 | 否 | 中 | P1 | 依赖测试重写和少量空值保护 |
| 促销详情页 | 已改成真实优惠专题页：当前展示真实优惠券与真实商品，不再拼 8 折价或静态活动规则；剩余问题是路由语义仍偏“活动详情”，后续可评估并入优惠券详情或专题列表 | 否 | 中 | P1 | 依赖促销域最终信息架构 |
| 降价提醒列表 | 已补真实“删除记录”接口、前端文案和 focused tests；当前剩余主要是后续联调回归保持 | 否 | 中 | P1 | 依赖 PriceAlert 前后端契约 |
| 购物车/结算一致性 | 已统一前后页过滤规则，并补齐 `CartView` / `CheckoutView` focused tests 覆盖“全部不可结算”“部分不可结算”“预算提醒”“库存不足移除”“直购下架回退”等关键分支 | 否 | 中 | P2 | 依赖 Cart/Checkout 共享规则 |
| 优惠券领取提示与流程一致性 | 首页、优惠券中心、专题页、详情页已统一为中文登录提示、成功刷新和服务端事实源；剩余是后续回归保持 | 否 | 中 | P1 | 依赖 `CouponController`、前端领取入口一致性 |
| AI 助手能力边界 | `AiRecommendView` 依赖用户自行配置 SiliconFlow API Key；页面文案已改为“问答和选购参考”，推荐区已改为按真实商品和销量顺序轮换展示，但本地 fallback 话术仍偏模板化 | 否 | 中 | P2 | 依赖 AI 能力定位与降级策略 |

## 已执行的首批收口

- 个人中心手机号入口改为跳转到账户安全设置，不再显示“暂不可用”
- 个人中心不再内嵌修改密码弹窗，安全操作统一收口到设置页
- 设置页下线未落地的隐私伪能力，仅保留服务端真实支持的资料可见性
- 设置页“注销账户”文案改成与后端真实能力一致，不再伪装密码校验
- 设置页手机/邮箱绑定改为统一走 `userStore.updateUserInfo`，避免只改内存态、不走统一缓存链路
- 通知页修正降价提醒回退路由，缺少商品 ID 时跳转到 `/price-alerts`
- 通知页订单动作改为优先使用后端 `relatedId` 跳转订单详情，减少对消息文案解析的依赖
- 通知页已继续收口失败反馈：获取通知、标记已读、全部已读、删除、清空等操作现在统一优先展示后端返回的中文消息，并补了 focused tests 锁住中文提示与取消确认语义
- 通知动作契约已继续补齐 focused tests，覆盖优惠券详情跳转、文件审核（管理员/普通用户）、商品审核（管理员/普通用户）、评价消息（商品详情/回退到我的商品）等分支，当前主要消息类型都已被测试锁住真实路由
- 通知动作 focused tests 已继续补齐“促销通知无 `relatedId` 回退到 `/promotions`”和“订单通知无 `relatedId` 时回退到订单号搜索”两类剩余分支
- 通知服务中的“通知不存在/无权操作”已从裸 `RuntimeException` 收口到明确业务异常，并补了单元测试
- 购物车更新接口保留“数量 <= 0 即删除”的既有行为，但控制器返回消息已改为明确的“购物车商品已删除”
- `PriceAlertService` 的“商品不存在/目标价非法/提醒状态非法”已从 500 风格异常收口到资源未找到或校验异常
- `SecuritySettingsServiceImpl` 已与通知/隐私设置语义对齐：按用户读取不存在时明确报资源缺失，更新时可自动初始化
- `RationalConsumptionService` 的想要清单/成就入口已把“商品不存在、重复加入、越权、无效成就类型”收口到明确业务异常，并补了 focused tests
- `RationalConsumptionController` 已开始去掉手工 `catch RuntimeException -> Response.fail(...)`，让业务错误统一走全局异常处理，并补了控制器级测试
- `PriceHistoryController` 的降价提醒创建、管理员手动触发/回退已改为放行业务异常到 `GlobalExceptionHandler`，避免把 404/422 压成通用失败文案，并补了控制器测试
- `ReviewController` 的创建/删除评价已不再把服务层校验异常一律压成 400 文本，改为统一走 `ValidationException` 语义，并补了控制器测试
- `ReviewControllerTest` 已继续补齐认证语义：新增“匿名创建评价返回中文 401”“认证存在但用户记录缺失时创建评价/我的评价/删除评价返回中文 401” focused 覆盖；`ReviewControllerTest` 现共 8 个测试通过
- `SearchController` 的登录用户解析 helper 已去掉“靠广义异常 + return null”兜底的写法，改成显式基于认证状态判断，保持原接口行为不变
- `SearchControllerTest` 已继续补齐“认证存在但用户记录缺失”剩余分支：新增搜索历史、添加历史、删除历史、清空历史在该场景下统一返回中文 `401 请先登录` 的 focused 覆盖；`SearchControllerTest` 现共 21 个测试通过
- `MusicController` 已修复“无扩展名文件触发 substring 崩溃”的边界问题，并把上传 IO 异常返回收口为通用失败文案，避免把底层错误细节直接回显到前端
- `FileController` 的上传/删除 IO 失败返回已改为通用错误文案，并保留服务端日志，减少把本机路径或底层异常直接暴露给前端
- `CouponController` 已去掉匿名用户判断里的空 `catch`，并把领取优惠券的业务校验失败接到 `GlobalExceptionHandler`，不再把任意异常一律压成 400 文本
- `ProductController` 已去掉多处“用异常做登录分支”的旧写法，改成显式认证判断；focused tests 还顺手抓出并修复了一个真实 bug：前台商品列表在服务层返回不可变 `List` 时会因 `sort()` 直接抛 `UnsupportedOperationException`
- `ProductController` 已继续收口用户提交商品和“我的商品”入口：匿名访问不再直接信任 `SecurityUtils.getCurrentUsername()`，提交商品时无效原价/价格/库存/分类参数也不再静默忽略或误判成功，并补了 focused tests
- `FileController` 已去掉多处直接依赖 `SecurityContextHolder.getAuthentication().getName()` 的脆弱写法，改成显式认证判断；同时补了管理员审核与匿名上传视频的 focused tests，锁住 401/权限语义
- 降价提醒列表已补真实“删除记录”用户接口；前端现在把“取消监控”和“删除记录”分开，避免 UI 文案和后端语义错位
- 购物车与结算页已统一“不可结算商品”规则：自己的商品、下架商品、库存不足商品不会再被静默带入结算主链路
- `CartView` / `CheckoutView` 已继续补 focused tests，锁住“全部不可结算阻断”“部分不可结算仍可继续”“预算超额提醒”“库存不足商品自动移出结算”“直购商品下架回退购物车”等关键分支
- `PromotionDetailView` 已从伪活动页降级为真实优惠专题页：只展示当前优惠券与真实商品，不再拼装活动价、不再回退静态假商品，并补了 focused test
- `PromotionDetailView` 已继续收口弱契约：专题主优惠券、优惠券列表、商品列表在 `non-200` 时不再静默无痕，领取优惠券和加入购物车失败也会优先展示后端中文消息并记录调试日志；本轮继续补齐专题领券 `non-200` 失败日志契约，`PromotionDetailView.test.ts` 现共 7 个测试通过
- 优惠券专题链路与理性消费页本轮组合回归已再次实跑通过：`HomeView` / `CouponDetailView` / `PromotionsView` / `PromotionDetailView` / `RationalConsumptionView` 共 25 个测试通过
- 设置页已移除无后端持久化支持的“评论回复”通知开关，避免用户以为该开关可生效
- `AiRecommendView` 已从“个性化推荐”话术收口到真实能力边界，并把推荐区从随机打散改成基于当前商品库的稳定轮换展示
- `AiRecommendView` 的 API Key 设置已去掉“空值也提示保存成功”的假成功反馈，未填写密钥时会明确提示 AI 仍不可用
- `ContactView` 已从本地假成功改为真实提交链路：新增匿名可用的 `POST /contact-messages` 后端落库接口，前端改为按服务端返回显示中文提示、失败记录 `debugError`、成功后再清空表单；本轮继续补齐后台 `ContactMessagesView`，管理员现可查看留言、标记已处理、删除记录，并补了 `ContactMessageControllerTest`、`ContactView.test.ts`、`ContactMessagesView.test.ts`
- `ContactMessagesView` 的成功链路也已继续收口到服务端事实源：标记已处理、删除留言成功后不再只改本地行状态/过滤本地数组，改为重新拉取留言列表，减少后台筛选态和服务端真实状态漂移；`ContactMessagesView.test.ts` 已扩到 6 条并通过
- 联系留言链路已补上真实浏览器闭环：新增 `contact-message-management.spec.ts`，实跑验证“匿名用户提交留言 -> 管理员后台查看 -> 标记已处理 -> 删除留言 -> 列表真实刷新”，留言模块不再只停留在 focused mock 覆盖
- 通知未读数、通知清空和游客搜索历史已补错误收口：未读数获取不再静默吞错，清空通知会区分“用户取消”和“真实失败”，损坏的本地搜索历史会自动清理并记录日志
- 卖家发货、降价提醒删除/取消、购物车删除/清空已补确认框错误收口：用户取消操作不会误报失败，真实接口异常会记录日志并给出明确提示
- 我的商品、收货地址删除动作也已补同类错误收口：确认框取消不再误报，删除失败会给出明确提示，并新增 focused tests 锁住行为
- 后台订单管理、分类管理、优惠券管理的删除/审核确认动作也已补同类收口：管理员取消确认时不再误报失败，真实接口异常会记录日志并给出明确提示
- 后台 `CategoriesView`、`CouponsManageView` 已继续收口固定失败文案：分类列表读取、分类保存/删除，以及优惠券保存/删除/状态切换失败时都会优先展示后端中文消息并记录调试日志，不再只给固定“保存失败/删除失败/操作失败”；本轮继续补齐 `CouponsManageView` 在业务 `non-200` 返回下的新增/状态切换/删除失败分支，`CategoriesView.test.ts` 现共 6 条通过，`CouponsManageView.test.ts` 现共 7 条通过
- `CouponsManageView` 的成功链路也已继续统一到服务端事实源：优惠券保存、状态切换成功后会重新拉取列表，不再只依赖本地开关状态；`CouponsManageView.test.ts` 已扩到 8 条并通过
- 后端 `SearchController`、`CouponController`、`PriceHistoryController` 的“当前用户可选解析”已从 `null` 返回值收口到 `Optional`，并补了“认证存在但用户记录缺失”分支测试，保持原接口语义不变
- 后端 `FileController`、`ProductController` 的认证 helper 也已收口到 `Optional`，并借测试暴露并修复了一个真实问题：`ProductController.createProduct` 之前默认认证用户一定能解析到用户记录，缺失时会走到空指针，现在改为明确返回 401
- 后台用户管理、商品管理、价格管理三页已完成危险操作错误收口：确认框取消不再误报失败，真实接口异常会记录日志并给出明确提示；商品批量上下架会区分全部成功、部分成功和全部失败，并新增对应前端 focused tests
- 后台 `OrdersManageView` 也已继续并入同一套可靠性契约：订单列表加载、管理员取消订单、审核取消申请、删除订单在业务 `non-200` 或请求异常时都会优先展示后端中文消息并记录调试日志，确认取消则静默返回；`OrdersManageView.test.ts` 已扩到 7 条并通过
- 后台 `ProductsView` 已继续补齐剩余 thrown-error / `non-200` 弱契约：商品图片上传、广告视频上传、保存商品、全部上下架、单个上下架切换、审核通过/拒绝、删除商品，以及商品分类/待审核数量/待审核列表读取失败都会优先展示后端中文消息并记录调试日志，不再退回固定“上传失败/保存失败/操作失败”；`ProductsView.test.ts` 现共 13 条通过
- `ProductsView` 的若干成功分支也已继续收口：全部上下架、单个上下架切换、审核通过/拒绝、删除商品成功后会等待列表和待审核计数刷新完成，再结束当前交互，减少后台表格状态与服务端真实状态漂移；`ProductsView.test.ts` 已扩到 14 条并通过
- 管理后台这轮 focused 回归已继续扩到分类/优惠券/音乐/理性消费：`UsersView` / `ProductsView` / `PriceManageView` / `CategoriesView` / `CouponsManageView` / `MusicManageView` / `RationalManageView` 共 50 个测试通过；其中 `UsersView.test.ts` 现共 7 条、`PriceManageView.test.ts` 现共 11 条
- 后端 `CartService.updateCartItem` 已从 `null` 返回值收口到 `Optional<CartDto>`，`CartController` 同步补了“数量归零时返回删除消息”的 focused test，接口对前端的消息语义保持不变
- 后端 `MusicController` 的文件扩展名 helper 已从 `null` 返回值收口到 `Optional<String>`，继续保持“无扩展名/非法扩展名返回 400”的原有行为
- 后端 `AuthService.changePassword` 已去掉裸 `RuntimeException`，数据库未更新任何密码记录时改为明确 `BusinessException(500, ...)`；同时补了 focused test 锁住该异常语义
- 后端 `AuthService` 已继续补 focused 覆盖，锁住“注册后初始化设置失败不回滚主流程”“密码修改后记录安全时间失败不影响成功”“登录失败统一返回认证异常”三类降级契约
- 后端 `ReviewController` 已去掉“把服务异常压成控制器内 500 文案”的旧 `try/catch`，创建/删除评价现在统一交给 `GlobalExceptionHandler`，并补了校验异常与意外异常分支测试
- 后端 `ReviewService` 已补 focused test，锁住“卖家评价通知发送失败不影响评价创建”的降级语义，避免副作用失败拖垮主流程
- 后端 `NotificationSettingsServiceImpl`、`PrivacySettingsServiceImpl` 的“设置不存在”已从裸 `RuntimeException` 收口到 `ResourceNotFoundException`，并补了“不存在抛 404 语义 + 缺记录自动初始化更新”的 focused tests
- 后端 `PriceHistoryController` 已把多处“请先登录/无权限”的默认 500 误码收口到明确 `401/403`，并让取消提醒、删除提醒记录、管理员删除/记录动作中的业务异常继续走全局异常处理
- 后端 `CouponController.claimCoupon` 已去掉控制器内手工 500 包装，改为统一交给 `GlobalExceptionHandler`；同时补了领取成功、校验失败、意外异常三类 focused tests
- `CouponControllerTest` 已继续补齐剩余高频控制器分支：新增“我的优惠券在用户记录缺失时返回中文 401”“订单可用优惠券在用户记录缺失时返回中文 401”“优惠券详情不存在返回 404” focused 覆盖；本机 Maven 单测现共 9 个测试通过
- 优惠券领取链路已继续收口：`POST /coupons/{id}/claim` 现在放行到控制器统一返回中文“请先登录”，避免匿名请求先被 Spring Security 裸拦成英文 `Forbidden`
- 前端请求层默认 HTTP fallback 文案已统一改为中文，避免 401/403/404/500 和网络异常直接向用户暴露英文提示
- `CouponDetailView`、`PromotionsView` 已继续补齐优惠券领取页日志契约：优惠券详情加载、优惠券领取在业务 `non-200` 失败时也会统一记录 `debugError`，不再只有中文提示没有定位信息；对应 focused tests 现共 10 个通过
- 前端 `fileApi.getImageUrl()` 已去掉硬编码 `http://localhost:8080/api`，改为同源 `/uploads` 路径，避免当前页面联到新后端时图片仍偷偷请求旧端口；同时补了 portability test
- 前端 `MyProductsView`、`ProductDetailView`、后台 `ProductsView` 中残留的媒体 URL 硬编码 `http://localhost:8080/api` 也已清理，视频资源统一改为同源相对路径，避免换端口或换运行入口后图片/视频仍串到旧后端
- 后台 `UsersView` 默认头像已去掉外链 Dicebear 依赖，改为本地 SVG 占位，避免离线或受限网络下管理页头像区域破图
- 个人中心 `ProfileView` 已继续收口：头像上传、资料保存、订单/提醒/卖家统计加载改为统一记录调试日志；本轮继续补齐头像上传业务 `non-200` 失败日志契约，资料保存失败时也会优先展示后端中文业务消息，并补了 focused tests
- 个人中心资料编辑职责已继续收紧：`ProfileView` 现在只维护昵称和简介，邮箱/手机号统一收口到账户设置，避免同一数据在 Profile 和 Settings 两处同时可改导致状态漂移
- 个人中心订单统计已从“默认第一页”改成显式大页请求，避免用户订单较多时统计被低估；同时补了 focused test 锁住 `getOrders(1, 1000)` 的调用语义
- 个人中心统计继续收口为“失败不伪装成 0”：订单/购物车/降价提醒/卖家待处理数任一加载失败时会显示“部分统计暂未同步”，避免用户把临时加载失败误判为真实空数据
- `ProfileView` 新增 focused tests，继续锁住“统计接口非 200 也视为未同步”的契约，避免把接口异常误读成真实空数据
- `ProfileView` 已继续补齐日志契约：保存资料失败、头像上传业务失败、订单统计/降价提醒/卖家待处理数的 `non-200` 分支现在都会统一记录调试日志；本轮继续把“头像上传成功后刷新当前用户失败”收口为副作用降级，不再把成功误报成失败，`ProfileView.test.ts` 现共 9 个测试通过
- 全局样式已去掉 Google Fonts 运行时 `@import`，默认字体改走系统字体栈，减少首屏对外网字体源的隐性依赖
- 首页、分类页、热销页、登录页、注册页残留的 `Unsplash` 装饰背景已全部替换为内嵌 SVG / 纯 CSS 背景，运行时不再依赖外部图片站点
- 默认种子数据里的 `picsum.photos` 已从 `data.sql`、`data-local.sql`、`data-test.sql` 清理，统一改为前端本地 `frontend/public/seed` 占位资源，避免真实页面、local 调试和 H2 测试再被外部图片站点牵着走
- 示例音乐数据里的 `soundhelix` 外链也已从 `schema.sql` 移除，改为内嵌静音 `data:` 音频占位，至少不会在初始化数据库后偷偷访问外部音频站点
- `fileApi.getImageUrl()` 已补 `data:` URL 兼容，确保这类内嵌资源不会被错误拼接成同源相对路径；同时补了 focused test
- 设置页 `SettingsView` 已修复“加载服务器通知/隐私设置时又被 watch 立即反向保存”的初始化污染问题；通知设置、隐私设置现在会在首轮数据回填完成后才允许自动保存，并补了 focused test 锁住“不在初始化阶段回写”
- 后端 `SwaggerConfig` 已去掉硬编码 `http://localhost:8080` 的 OpenAPI server 地址，改为同源 `/`，避免 API 文档在不同端口或代理环境下继续指向旧开发端口
- 后端 CORS 已收口为单一配置源：移除重复的 `CorsConfig` 通配放行 Bean，`SecurityConfig` 统一改为读取 `spring.web.cors.allowed-origins`，避免 `localhost/127.0.0.1` 和 `*` 双重策略并存
- 后端 `JwtAuthenticationFilter` 和 `JwtUtil` 已继续收口认证失败语义：坏 token/失效 token 统一返回中文 `401`，响应明确声明 UTF-8，JWT 校验也已从广义 `catch` 收窄到解析相关异常，并补了 focused tests
- 首页、优惠券中心、优惠专题、优惠券详情四个领取入口已统一为“未登录先中文提示并引导登录，领取成功后回拉服务端真实状态”
- 订单详情页、支付页、卖家发货页已继续收口用户提示：订单详情和卖家发货失败时优先展示后端返回的中文业务消息，不再退回模糊固定提示；支付页破图占位中的英文文案也已清理
- `OrdersView` 已继续收口列表页弱契约：订单列表加载 `non-200` 不再只显示固定“加载失败”，本轮又补齐取消订单、申请取消、确认收货、提交评价在业务 `non-200` 失败下的日志契约，不再只覆盖抛错分支；订单前端组合回归 `OrdersView` / `OrderDetailView` / `PaymentView` / `SellerOrdersView` 现共 30 个测试通过
- 后端 `RationalConsumptionController` 已统一登录判断，不再混用 `SecurityUtils` 抛出的“用户未认证”和手写 `Response.fail("请先登录")`；预算、清单、成就、管理员统计等入口的未登录/越权返回已收口到明确 `401/403`
- 后端 `RationalConsumptionService` 已去掉近期活动/近期成就里的广义 `catch` 回退，改成显式“用户缺失 -> 未知用户”分支，并补了 contract tests 锁住该降级语义
- 后端 `NotificationController` 已补 focused tests，锁住“未登录获取通知返回 401”“越权标记通知返回 422”“清空通知成功”等核心契约
- 订单页和支付页继续收口共享类型，减少 `any`
- 后端 `OrderService` 的地址 JSON 解析已从广义 `catch` 收窄到明确 JSON 解析异常；地址字段损坏时继续回退为空地址 DTO，并补了 focused test 锁住该行为
- 理性消费报告去掉随机模拟值，改为基于真实订单/优惠券/清单数据计算
- 后端新增 `RationalConsumptionBudgetStatusTest`，锁住预算状态对 `payAmount` 为空订单回退 `totalAmount` 的口径，以及临近预算/超预算标记的真实计算
- 前端 `RationalConsumptionView` 已继续收口为“失败不伪装成 0”：预算、清单、成就在接口失败或非 200 时会显示“暂未同步”而不是假数字，并补了 focused tests
- `RationalConsumptionView` 已补想要清单“已购买”统计展示，`goToBuy` 标记购买后会回拉清单/统计/成就，避免购买回填只存在后端不反映到前端契约
- `RationalConsumptionView` 已继续补上报告里的“重复购买提醒”展示，避免后端已计算的真实指标继续停留在不可见状态
- `RationalConsumptionView` 已继续收口预算/清单操作失败语义：保存预算、移除想要清单现在会优先展示后端中文消息并记录调试日志；本轮继续补齐消费报告、想要清单、清单统计、成就列表在业务 `non-200` 失败下的日志契约，标记“已购买”若返回 `non-200` 也会记录失败而不是静默吞掉，同时保持跳转商品主流程。该页 focused tests 现共 11 个通过
- `RationalConsumptionView` 的预算保存、想要清单移除成功分支也已继续收口：现在会等待预算状态 / 清单统计 / 成就数据刷新完成，再结束当前交互，减少“提示成功但数字仍短暂停留旧值”的状态漂移；`RationalConsumptionView.test.ts` 基线复跑继续通过
- 商品详情视图测试已替换 placeholder 断言
- `ProductDetailView` 已继续收口交互错误处理：删除评价、降价提醒、想要清单现在会区分“用户取消”和“真实失败”；本轮继续补齐这些动作在业务 `non-200` 失败下的日志契约，失败时优先展示后端中文业务消息并记录 `debugError`，同时补齐“加入购物车失败日志”以及评价/价格历史/降价提醒/重复购买/想要清单状态读取 `non-200` 日志契约；`ProductDetailView.test.ts` 现共 17 个测试通过
- `ProductDetailView` 的价格历史与价格统计也已继续收口为“失败不伪装成空数据”：接口失败或非 `200` 时会显示“暂未同步”提示，而不是和真实“暂无历史”混在一起；同时补了 focused tests
- `ProductDetailView` 的成功链路也已继续向服务端事实源收口：删除评价成功后会等待评价列表刷新完成，加入想要清单成功后不再本地直接置 `isInWishlist = true`，改为重新读取服务端清单状态；`ProductDetailView.test.ts` 已扩到 18 个测试并通过
- `ProductDetailView` 本轮又补了评价图片脏数据容错：评价图片字段在 JSON 损坏时会记录 `debugError('解析评价图片失败', ...)` 并回退逗号分割，在“可解析但结构不是数组”时继续走兼容回退，不让商品详情因为历史脏数据直接炸掉；`ProductDetailView.test.ts` 现共 22 条并通过
- `PriceAlertsView` 已继续收口：获取列表、更新目标价、取消监控/删除记录都统一为中文错误提示和真实刷新语义；本轮又补齐业务 `non-200` 失败日志契约，不再只有提示没有定位信息，`PriceAlertsView.test.ts` 已扩到 8 条并通过
- 通知页已补 focused test 锁住“降价提醒通知带商品 ID 时跳商品详情、缺商品 ID 时回提醒列表”的分支，价格提醒通知动作契约现在更完整
- 新增真实浏览器 E2E `price-alert-notification.spec.ts`，已在当前联调栈 `127.0.0.1:5173 -> 8080` 上实跑通过，覆盖“商品详情创建降价提醒 -> 后台触发提醒 -> 通知页出现消息 -> 点击通知跳回商品详情”
- 本轮复扫 `backend/src/main` 与 `frontend/src` 后，未再发现业务主链路里的显式 `return null;`；当前残留的环境硬编码主要收敛到开发代理和 CORS 默认值中的 `localhost/127.0.0.1`
- 后端 `RationalConsumptionController` 的想要清单新增/移除/标记购买接口已补统一登录判断，匿名访问不再把 `null username` 传入服务层，而是明确返回中文 `401`
- 后端 `PriceAlertService` 已补关键业务语义：不存在的提醒不再静默成功；监控中提醒不能直接删记录；已有提醒更新目标价时也会继续校验“必须低于当前价格”
- 后端 `PriceAlertService` 已修复真实通知丢失风险：降价提醒在通知发送失败或商品记录缺失时不再错误标记为 `notified=true`，保留未通知状态以便后续重试，并补了 focused tests
- 后端 `FileController` 已继续收口当前用户解析和删除文件语义：上传入口统一用同一套当前用户判断，删除文件从广义 `catch` 拆成明确 `404` 与物理删除失败处理，并补了 focused tests
- 后端 `PriceHistoryController` 已继续去掉一批广义 `catch -> 模糊失败文案`：价格历史、价格统计、用户提醒列表等入口改为直接走统一异常体系；时间范围参数也已补明确 `422` 校验与 focused tests
- 后端 `PriceHistoryController` 已进一步收口创建提醒、取消提醒、删除提醒记录、管理员记录价格/触发提醒等入口：控制器不再手工吞并通用异常，`productId/price/targetPrice` 缺失或格式错误会明确返回 `422`，并已补 focused tests 锁住参数校验语义
- 订单主链路 E2E 已在本机 `5176 -> 8083` 组合上实跑通过，覆盖“登录 -> 商品详情 -> 立即购买 -> 提交订单 -> 支付 -> 订单列表校验”；同时修正了冒烟脚本默认账号与登录等待策略，避免因假账号和脆弱 URL 假设导致误报
- 订单 Phase 2 的角色链路 E2E 已继续在当前真实联调栈 `127.0.0.1:5173 -> 8080` 上实跑通过，新增覆盖“买家支付 -> 卖家发货 -> 买家确认收货”与“买家申请取消 -> 管理员审核通过”；同时把脚本登录收口为缓存真实登录态，避免触发登录限流噪音
- 本轮已补一组组合回归基线：后端聚合运行 `OrderControllerFlowTest`、`OrderServiceTest`、`PriceHistoryControllerTest`、`PriceAlertServiceTest`、`FileControllerTest`、`ProductControllerTest`、`AuthServiceTest`、`ReviewServiceTest`、`RationalConsumptionServiceContractTest` 共 103 个 focused tests 全通过；前端聚合运行订单/支付/卖家发货/商品详情/降价提醒/通知/理性消费/Profile/Settings 共 58 个页面 tests 全通过
- 真实浏览器组合冒烟也已补齐：`order-phase2.spec.ts` 与 `price-alert-notification.spec.ts` 联合运行 3 条 E2E 全通过，覆盖“买家支付 -> 卖家发货 -> 买家确认收货”“买家申请取消 -> 管理员审核通过”“降价提醒创建 -> 通知跳商品详情”
- 真实 MySQL 支付 500 已定位并修复：`tb_product.version` 历史空值导致 Hibernate 乐观锁版本递增 NPE；代码已补防御初始化，数据库已回填
- 通知设置/隐私设置更新改成可自初始化，避免旧账号未生成设置记录时首次保存直接 500
- 文件审核服务不再用 `null` 表示“文件不存在”，改为明确 404 语义
- 开发环境默认值继续收口：`vite.config.ts`、`application.properties`、`application-local.properties`、`application-docker.properties` 已补清晰注释，明确 `127.0.0.1/localhost` 兜底仅限同机调试，部署和共享环境必须显式覆盖代理/CORS 目标
- 首页、优惠券中心、优惠券详情、结算页以及 `userStore` / `adminStore` 中一批裸 `console.error` 已改为开发态 `debugError(...)`，避免生产环境继续输出运行时噪音；相关前端回归 `HomeView`、`PromotionsView`、`CouponDetailView`、`CheckoutView`、`ProfileView`、`SettingsView` 共 19 个测试已通过
- `HomeView` 的首页快捷领券也已补齐 `non-200` 失败日志契约：业务失败时会在展示后端中文消息前统一记录 `debugError`，不再只有提示没有定位信息；`HomeView.test.ts` 已扩到 4 条并通过
- `CheckoutView` 已继续补齐“结算商品加载失败”日志契约：直购商品不存在/下架/库存不足/自购拦截等异常分支现在会统一记录 `debugError` 后再给出中文提示并回退购物车；本轮又补齐订单创建 `non-200` 失败日志契约，不再只弹消息不留定位信息；`CheckoutView.test.ts` 现共 6 条通过
- 购物车、分类、热销榜、我的商品、后台用户/商品/价格/分类/优惠券管理页，以及 `SearchDropdown` 中残留的裸 `console.error` 也已继续收口到开发态 `debugError(...)`；对应回归 `CartView`、`MyProductsView`、`UsersView`、`ProductsView`、`PriceManageView`、`CouponsManageView`、`CategoriesView`、`SearchDropdown` 共 36 个测试已通过
- 后台 `FileReviewView` 的文件列表加载失败日志也已同步收口，避免管理端继续直接向生产控制台输出原始异常；本轮继续补齐“审核通过/拒绝/删除记录 `non-200` 失败”也要记录 `debugError`
- 后台通知管理、文件审核、理性消费管理，以及 `adminStore` 里的待处理数量获取已继续收口业务 `non-200` 分支：列表/计数读取失败会记录调试日志，广播通知、文件审核、成就授予/撤销失败会优先消费后端中文消息，确认取消不会误报失败；本轮继续补齐 `NotificationsManageView` 与 `FileReviewView` 的业务失败日志契约
- `FileReviewView` 已继续补齐业务失败分支测试：审核通过、审核拒绝、删除记录在 `non-200 payload` 下都会明确展示后端中文消息，不再只依赖抛错分支；`FileReviewView.test.ts` 现共 6 个测试通过
- 本轮 `ProfileView` / `NotificationsManageView` / `FileReviewView` 组合回归已实跑通过，共 16 个测试通过
- 管理后台危险操作小基线已再次复跑通过：`OrdersManageView.test.ts`、`UsersView.test.ts`、`ProductsView.test.ts`、`PriceManageView.test.ts` 共 20 个测试通过；其中 `UsersView` 本轮继续补齐“禁用/启用用户”“重置优惠券”在业务 `non-200` 失败下的日志契约，`UsersView.test.ts` 现共 5 个测试通过
- 本轮管理后台小基线继续复跑通过：`ProductsView.test.ts`、`OrdersManageView.test.ts`、`PriceManageView.test.ts` 共 19 个测试通过
- `UsersView` 的成功链路也已继续统一到服务端事实源：禁用/启用用户成功后不再只改当前行状态，改为等待用户列表重新拉取完成，再结束交互；对应 `UsersView.test.ts` 已补到 7 条并通过
- `PriceManageView` 的成功链路也已继续统一到服务端事实源：新增价格记录、删除价格历史、删除提醒记录成功后现在都会等待价格历史或提醒列表重新拉取完成，避免后台筛选态和统计数继续依赖本地推进
- `CategoriesView`、`MusicManageView` 的成功链路也已继续统一到服务端事实源：分类保存、音乐保存/状态切换/删除成功后都会等待列表重新拉取完成，不再只是在弹成功提示后异步漂着刷新；对应 `CategoriesView.test.ts` 现共 7 条、`MusicManageView.test.ts` 现共 7 条并通过
- `FileReviewView`、`RationalManageView`、`ProductsView` 也已继续补齐相同契约：文件审核通过/拒绝/删除、理性消费成就授予/撤销、后台商品保存成功后会等待列表或统计刷新完成，再结束当前交互；对应 focused tests 已新增“成功后刷新”分支并通过
- `SearchDropdown` 的登录用户搜索历史也已继续统一到服务端事实源：保存、删除、清空搜索历史成功后不再只改本地数组，改为重新拉取服务端历史；`SearchDropdown.test.ts` 已扩到 20 条并通过
- `OrdersManageView` 的取消申请审核成功链路也已继续统一到完整刷新契约：同意/拒绝取消申请后会同时等待订单列表与侧边栏待处理数刷新完成，不再一边刷新列表、一边让计数异步漂着更新；`OrdersManageView.test.ts` 基线复跑继续通过
- `CategoryView` 已补请求竞态保护：快速切换分类、排序、分页或搜索时，旧商品列表响应不会再覆盖较新的筛选结果；`CategoryView.test.ts` 已新增过期响应保护用例并通过
- `SearchDropdown` 也已补搜索建议竞态保护：连续输入时只接受最新关键词对应的建议结果，过期响应不会再把下拉建议回写成旧内容；`SearchDropdown.test.ts` 现共 21 条并通过
- `SearchDropdown` 已继续补齐剩余共享入口的请求竞态保护：登录用户搜索历史、热门搜索词现在也只接受最新一次响应，过期历史/热搜结果不会再把较新的下拉状态覆盖回旧内容；`SearchDropdown.test.ts` 已新增两条过期响应用例并复跑通过，当前共享组件组合回归 `SearchDropdown` + `Navbar` + `MusicPlayer` 共 33 个测试通过
- `CheckoutView` 的可用优惠券列表也已补请求竞态保护：结算金额连续变化时，只接受最新金额对应的优惠券结果，过期响应不会再覆盖当前结算态；`CheckoutView.test.ts` 现共 8 条并通过
- `Navbar` 已继续补齐退出登录可靠性与登录态轮询契约：退出登录失败会记录日志并给出中文“退出登录失败”，登录态切换时也会统一启动/停止未读通知轮询，避免轮询残留或登录后不补启；`Navbar.test.ts` 现共 6 条并通过
- 首页/优惠券中心/优惠专题的优惠券列表也已继续统一到请求竞态保护：`HomeView`、`PromotionsView`、`PromotionDetailView` 在连续刷新或领取成功后回拉状态时，只接受最新一次优惠券响应，过期结果不会再把新领取状态覆盖回旧列表；对应 `HomeView.test.ts`、`PromotionsView.test.ts`、`PromotionDetailView.test.ts` 已补过期响应用例并通过
- `OrdersView`、`PriceAlertsView`、`SellerOrdersView` 也已继续补请求竞态保护：订单列表、降价提醒列表、卖家订单项在连续刷新、筛选切换或成功操作后的回拉过程中，只接受最新一次请求结果，过期响应不会再把页面覆盖回旧状态；对应 `OrdersView.test.ts`、`PriceAlertsView.test.ts`、`SellerOrdersView.test.ts` 已各自补过期响应用例并通过
- `OrdersView` 本轮又继续收口真实长跑下的瞬时失败契约：订单列表首次加载若遇到 `429/5xx/网络异常`，页面现在会先做一次窄范围自动重试，再决定是否进入“加载失败”态；`smoke.spec.ts` 也同步按页面契约增加恢复性等待，避免支付成功后回到订单页时因瞬时接口抖动把真实已创建订单误判成缺失
- `OrderDetailView` 的订单详情也已并入同一套请求竞态保护：订单详情在初始加载以及取消订单/申请取消/确认收货后的回拉过程中，只接受最新一次详情响应，过期结果不会再把新状态覆盖回旧详情；`OrderDetailView.test.ts` 已新增过期响应用例并通过
- `CouponDetailView` 的详情刷新也已并入同一套请求竞态保护：优惠券详情在初始加载和领取成功后的回拉过程中，只接受最新一次详情响应，过期结果不会再把最新领取状态覆盖回旧值；`CouponDetailView.test.ts` 已新增过期响应用例并通过
- `NotificationsView` 的通知列表也已继续补请求竞态保护：通知列表在初始加载以及标记已读/删除/清空后的回拉过程中，只接受最新一次列表响应，过期结果不会再把已刷新列表覆盖回旧消息；`NotificationsView.test.ts` 已新增过期响应用例并通过
- `AddressView`、`MyProductsView`、`RationalConsumptionView` 也已并入同一套请求竞态保护：地址列表、我的商品列表、理性消费清单/统计在初始加载及成功操作后的回拉过程中，只接受最新一次请求结果，过期响应不会再把新状态覆盖回旧数据；对应三组 focused tests 已新增过期响应用例并通过，本轮组合回归共 25 个测试通过
- `PaymentView` 的待支付订单详情也已并入同一套请求竞态保护：支付页在初始加载以及模拟支付成功后的详情回拉过程中，只接受最新一次订单响应，过期结果不会再把新支付状态覆盖回旧订单；`PaymentView.test.ts` 已新增过期响应用例并通过，并与 `AddressView` / `MyProductsView` / `RationalConsumptionView` 组合复跑共 32 个测试通过
- `ProductDetailView` 也已并入同一套请求竞态保护：商品详情、评价、价格历史/统计、降价提醒、重复购买检测、想要清单状态在初始加载及成功操作后的回拉过程中，只接受最新一次请求结果，过期响应不会再把新状态覆盖回旧数据；`ProductDetailView.test.ts` 已新增过期响应用例并通过，并与 `AddressView` / `MyProductsView` / `RationalConsumptionView` / `PaymentView` 组合复跑共 52 个测试通过
- `ProfileView`、`SettingsView` 也已补齐个人中心链路的请求竞态保护：订单统计、降价提醒数量、卖家待处理数量，以及通知设置/隐私设置初始加载只接受最新一次响应，过期 payload 不会再把较新的个人统计或设置状态覆盖回旧值；对应 `ProfileView.test.ts`、`SettingsView.test.ts` 已新增过期响应用例并通过，并与 `AddressView` / `MyProductsView` 组合复跑共 42 个测试通过
- `CheckoutView` 也已补齐剩余初始化读取的请求竞态保护：地址列表、预算状态、结算商品加载在初始加载和金额变化后的刷新过程中，只接受最新一次结果，过期响应不会再把较新的结算状态覆盖回旧值；`CheckoutView.test.ts` 已新增过期响应用例并通过，并与 `AddressView` / `MyProductsView` / `ProfileView` / `SettingsView` / `PaymentView` / `ProductDetailView` / `RationalConsumptionView` 组合复跑共 90 个测试通过
- 后台 `NotificationsManageView`、`DashboardView` 也已补齐初始化读取的请求竞态保护：通知发送页的用户/优惠券下拉数据，以及后台首页整页统计快照只接受最新一次请求结果，过期响应不会再把较新的后台状态覆盖回旧数据；对应 focused tests 已新增过期响应用例并通过，本轮组合回归共 8 个测试通过
- 后台首页 `DashboardView` 的剩余读取契约也已继续补齐 focused coverage：商品统计 `non-200` 和整页统计请求抛错分支现在都已被测试锁住，避免后台首页在高曝光入口静默退化；`DashboardView.test.ts` 当前共 6 条通过
- 共享后台角标 `adminStore` 的剩余弱契约也已继续补齐：待审核取消申请数量在业务 `non-200` 返回时现在也有 focused test 锁住“保留旧值 + 记录 `debugError`”语义，避免后台徽标以后出现静默归零或假刷新；`adminStore.test.ts` 当前共 9 条通过
- 常驻组件 `MusicPlayer` 也已补齐音乐列表加载的请求竞态保护：首次空闲加载、展开触发加载、手动重试时只接受最新一次音乐列表响应，过期结果不会再把较新的播放列表覆盖回旧数据；`MusicPlayer.test.ts` 已新增过期响应用例并通过
- 后台 `ContactMessagesView` 的留言列表也已并入同一套请求竞态保护：留言列表在初始加载以及标记已处理/删除后的回拉过程中，只接受最新一次列表响应，过期结果不会再把新列表覆盖回旧留言；`ContactMessagesView.test.ts` 已新增过期响应用例并通过
- 后台 `CouponsManageView` 的优惠券列表也已补请求竞态保护：优惠券列表在初始加载以及保存/状态切换/删除后的回拉过程中，只接受最新一次列表响应，过期结果不会再把新券状态覆盖回旧列表；`CouponsManageView.test.ts` 已新增过期响应用例并通过
- 后台 `UsersView` 的用户列表也已补请求竞态保护：用户列表在初始加载以及启用/禁用用户后的回拉过程中，只接受最新一次列表响应，过期结果不会再把新用户状态覆盖回旧列表；`UsersView.test.ts` 已新增过期响应用例并通过
- 后台 `OrdersManageView` 的订单列表也已补请求竞态保护：订单列表在初始加载以及审核取消/删除订单后的回拉过程中，只接受最新一次列表响应，过期结果不会再把新订单状态覆盖回旧列表；`OrdersManageView.test.ts` 已新增过期响应用例并通过
- 后台 `PriceManageView` 的价格历史与提醒列表也已补请求竞态保护：快速切换商品或连续刷新提醒列表时，只接受最新一次历史/提醒响应，过期结果不会再把新状态覆盖回旧数据；`PriceManageView.test.ts` 已新增两条过期响应用例并通过
- 后台 `ProductsView` 的商品列表也已补请求竞态保护：商品管理列表在初始加载以及保存/审核/删除/上下架后的回拉过程中，只接受最新一次列表响应，过期结果不会再把新商品状态覆盖回旧列表；`ProductsView.test.ts` 已新增过期响应用例并通过
- 后台 `PriceManageView` / `ProductsView` 的徽标计数也已并入同一套请求竞态保护：激活提醒数、待审核商品数在连续刷新或操作后回拉时，只接受最新一次计数响应，过期结果不会再把较新的后台徽标覆盖回旧值；对应 focused tests 已新增过期响应用例，并与 `UsersView` / `CategoriesView` / `CouponsManageView` / `OrdersManageView` 组合复跑共 64 个测试通过
- 后台 `MusicManageView`、`RationalManageView` 也已并入同一套请求竞态保护：音乐列表、理性消费统计/趋势/想要清单活动/成就记录在连续刷新或成功操作后的回拉过程中，只接受最新一次请求结果，过期响应不会再把新状态覆盖回旧数据；对应 `MusicManageView.test.ts`、`RationalManageView.test.ts` 已新增过期响应用例并通过，本轮再带 `NotificationsManageView.test.ts`、`DashboardView.test.ts` 组合复跑共 21 个测试通过
- `ProfileView` 的个人中心统计可信度也已继续收口：侧边栏“降价提醒 / 卖家订单” badge 现在会和统计可用性绑定，统计接口回退到 unavailable 时不再继续显示旧数字；`ProfileView.test.ts` 已新增“统计可用时显示 badge”“刷新失败后隐藏 badge”覆盖并通过
- `AiRecommendView` 也已继续补齐降级日志契约：AI 对话失败会记录 `debugError` 后再回退中文兜底话术，分类/优惠券加载若走 fallback 空数据也会留下调试日志，不再出现“页面看似正常但降级完全无痕”；`AiRecommendView.test.ts` 已扩到 5 条并通过
- 用户侧 `MyProductsView`、`CategoryView` 也已继续收口弱契约：我的商品列表/分类列表在 `non-200` 时不再静默无痕，商品提交、图片/视频上传、删除商品失败会优先展示后端中文消息并记录调试日志；`MyProductsView` 本轮继续补齐业务 `non-200` 返回也要记录 `debugError` 的契约，`MyProductsView.test.ts` 现共 5 条通过；对应新增 `CategoryView.test.ts` 并扩展回归，与既有账户/订单/优惠券/结算/提醒页面组合回归现共 119 个测试通过
- `MyProductsView` 的商品提交/修改成功分支也已改为等待商品列表刷新完成，再结束弹窗与保存流程，继续统一到“服务端真实状态刷新后再稳定落回页面”的契约；`MyProductsView.test.ts` 基线复跑继续通过
- `HotProductsView`、后台 `MusicManageView`、`AiRecommendView` 也已继续补足高曝光页面契约：热销榜数据加载 `non-200` 会记录日志，热销商品加购失败优先展示后端中文消息；音乐管理的列表读取、状态切换、上传、提交、删除都已区分业务失败/真实异常/取消确认，且本轮继续补齐业务 `non-200` 返回也要记录 `debugError`；AI 页的商品数据 `non-200` 也不再静默无痕。对应新增 `HotProductsView.test.ts`、扩展 `MusicManageView.test.ts` 到 5 条，并扩展 `AiRecommendView.test.ts`
- 后台 `RationalManageView` 的成就授予/撤销也已并入同一套日志契约：业务 `non-200` 返回不再只弹中文错误，现会先记录 `debugError` 再提示；`RationalManageView.test.ts` 现共 5 条通过
- 登录页、注册页、后台首页也已补上 focused coverage：`LoginView` 锁住“成功登录跳首页”“失败提示中文错误并刷新验证码”，`RegisterView` 锁住“成功注册跳登录页”“失败提示后端中文消息”，`DashboardView` 锁住管理统计口径和 `non-200` 业务失败日志；本轮继续补齐登录/注册失败的日志契约，账号入口失败也会统一记录 `debugError`
- `SearchDropdown`、`MusicPlayer` 两个高频组件也已继续收口：搜索历史/热门词/搜索建议在 `non-success` payload 下不再静默无痕，音乐播放器的启用音乐列表 `non-200` 失败也会保留后端消息进入日志；对应新增 `MusicPlayer.test.ts` 并扩展 `SearchDropdown.test.ts`
- `SearchDropdown` 本轮也已去掉同类旧兼容成功语义：搜索历史、热门搜索、搜索建议、保存/删除/清空历史现在统一只认 `code === 200`，不再把 `success: true` 但业务 `code` 异常的 payload 误当成成功；`SearchDropdown.test.ts` 已新增对应假成功分支并通过
- `MusicPlayer` 本轮又把本地播放状态恢复收成正式降级契约：`localStorage` 中的损坏播放器状态不再反复残留并持续报错，而是记录一次 `debugError` 后自动清理坏数据、回退默认音量/循环/最小化状态；`MusicPlayer.test.ts` 已补该分支并通过
- `Navbar` 也已补 focused coverage，锁住“关键词搜索跳分类页”“空搜索回全部商品”“退出登录清空购物车/通知状态并回首页”“游客显示登录入口”四类主路径；当前共享组件组合回归 `Navbar` + `SearchDropdown` + `MusicPlayer` 共 24 个测试通过
- `Navbar` 的搜索统计副作用也已从静默 catch 收口：记录关键词失败时仅降级为开发态 `debugError`，不再完全无痕，同时保持用户搜索跳转主流程不受影响；`Navbar.test.ts` 已扩到 5 条并通过
- `HomeView` 的首页数据读取契约也已继续补齐 focused coverage：分类、热销商品、新品上架三块真实数据源在 `non-200` 业务返回时现在都有测试锁住 `debugError` 日志分支；`HomeView.test.ts` 当前共 8 条通过
- `AdminLayout` 也已补上 focused coverage，并把后台退出登录收口成完整中文契约：成功时提示并跳登录页，失败时记录 `debugError` 且明确提示“退出登录失败”，不再只有成功路径；`AdminLayout.test.ts` 新增 3 条并通过
- 首页/搜索入口这一轮组合回归已实跑通过：`HomeView.test.ts`、`SearchDropdown.test.ts`、`Navbar.test.ts` 共 26 个测试通过
- 后端 `AuthControllerTest`、`CartControllerTest` 也已继续补齐高频控制器主路径：新增“更新当前用户资料”“修改密码”“添加购物车”“清空购物车” focused coverage，本机 Maven 复跑共 10 个测试通过
- `CartControllerTest` 已继续补齐购物车控制器剩余主分支：新增“匿名获取购物车返回中文 401”“获取购物车列表”“获取购物车数量”“单项选择/全选”“单项删除/批量删除” focused coverage；该测试现共 11 个通过
- 后端本轮补了一条 `JwtAuthenticationFilterTest`，锁住“用户详情加载等非 JWT 解析异常也统一返回中文 401 登录认证失败，请重新登录”的现有契约；同时复跑 `JwtAuthenticationFilterTest`、`MusicControllerTest`、`AuthServiceTest` 共 17 个 focused tests，全通过
- `MusicController` 已继续补 focused coverage：前台启用音乐读取、管理员获取全部音乐、音乐/封面上传格式校验、增删改查与状态切换主路径都已补测试；同时修正封面上传格式提示，实际支持 `.jpeg` 时文案也同步显示 `jpg、jpeg、png、webp`
- `JwtAuthenticationFilter` 剩余那处“非 JWT 解析异常”降级分支已从广义 `catch (Exception)` 收窄到 `catch (RuntimeException)`，继续保持中文 `401 登录认证失败，请重新登录` 语义；`MusicControllerTest` 当前单独实跑共 11 个测试通过
- 后端本轮新增的认证/音乐/搜索小基线也已组合实跑通过：`JwtAuthenticationFilterTest` + `MusicControllerTest` + `SearchControllerTest` 共 35 个 focused tests 全通过
- 后端本轮小基线已继续扩到购物车控制器：`JwtAuthenticationFilterTest` + `MusicControllerTest` + `SearchControllerTest` + `CartControllerTest` 共 46 个 focused tests 全通过
- 后端控制器的副作用降级契约继续补强：新增 `ProductControllerTest` 锁住“普通卖家提交商品时，即使发给管理员的审核通知失败，商品提交仍成功”；新增 `FileControllerTest` 锁住“文件审核成功后，即使发给上传者的审核通知失败，审核结果仍成功返回”
- 上述后端 focused 回归已用本机 Maven 实跑通过：`ProductControllerTest` + `FileControllerTest` 共 16 个测试通过，日志中的通知失败告警属于预期降级路径，不影响主流程成功
- 控制器降级契约已继续扩展到更贴近真实使用的分支：`ProductControllerTest` 新增“卖家修改商品后，即使通知管理员审核失败，仍返回待审核成功”；`FileControllerTest` 新增“头像审核通过后，即使关联用户头像更新失败，审核结果仍成功返回”
- 复跑后端 focused 回归通过：`ProductControllerTest` + `FileControllerTest` 现共 18 个测试通过；测试日志中的通知失败/关联更新失败错误日志均属于预期降级路径验证
- `AddressController` 已从 8 处重复手写认证判断收口到单一当前用户 helper，保持原有中文 `401/403/404` 语义不变，减少后续同类分支漂移风险
- 新增 `AddressControllerTest`，已用本机 Maven 跑通 5 个 focused tests，锁住“匿名 401”“认证存在但用户记录缺失 401”“越权查看 403”“地址不存在 404”“创建地址绑定当前用户”五类高频分支
- `UserController` 的 `DELETE /users/me` 已补显式认证判断；匿名访问统一返回中文 `401 用户未认证或认证失效`，并新增 `UserControllerTest` 跑通“匿名 401 / 用户不存在 404 / 正常删除成功”三类 focused tests
- `CategoryControllerTest` 已补并跑通，锁住“分类不存在 404”“匿名新增分类返回需要管理员权限”“管理员新增分类成功”三类基础控制器契约
- `SecuritySettingsController`、`NotificationSettingsController`、`PrivacySettingsController` 已从直接信任 `SecurityContextHolder.getAuthentication().getName()` 收口到与 `AddressController` 同风格的当前用户 helper：匿名访问、认证存在但用户记录缺失统一返回中文 `401 用户未认证或认证失效`，更新接口继续强制把设置对象绑定到当前用户
- 已新增并跑通 `SecuritySettingsControllerTest`、`NotificationSettingsControllerTest`、`PrivacySettingsControllerTest`；与 `AddressControllerTest`、`UserControllerTest`、`CategoryControllerTest` 组合回归共 20 个 focused tests 全通过
- `NotificationController`、`OrderController` 的当前用户 helper 也已继续改为统一走 `SecurityUtils`，保持现有中文 `401 用户未认证` 语义不变，减少后续同类分支再出现手写 `SecurityContextHolder` 判断漂移
- `NotificationControllerTest` 已继续补齐未读数、类型过滤、管理员单发、管理员广播、非管理员访问管理员通知入口等 focused 覆盖；本机 Maven 复跑现共 9 个通知控制器测试全部通过
- 前端 `NotificationsView` 已继续收口业务 `code != 200` 的弱契约：获取通知、标记已读、全部已读、删除、清空不再只依赖异常分支，业务失败时也会明确展示后端中文消息；对应页面 tests 已扩展到 21 条并通过
- `NotificationsView` 已继续补齐失败日志契约：上述获取通知、标记已读、全部已读、删除、清空在 `non-200` 业务失败下也会统一记录调试日志，避免只弹中文提示却丢失定位信息；`NotificationsView.test.ts` 现共 21 个测试继续通过
- `NotificationsView` 的成功链路也已进一步统一到服务端事实源：全部已读、删除、清空成功后不再手工改本地数组和未读数，而是重新拉取通知列表并同步 `notificationStore` 计数，减少本地状态推进与服务端真实状态漂移；`NotificationsView.test.ts` 基线复跑继续通过
- `ReviewService.createReview` 中“卖家通知失败不影响评价创建”已明确记录为保留的降级语义：catch 继续存在但已补 warning 日志，不再是静默吞错；`ReviewServiceTest` 已锁住通知失败时评价仍成功保存
- `ReviewService.createReview` 的卖家通知降级 catch 已继续从广义 `Exception` 收窄到 `RuntimeException`，与 `PriceAlertService`、`ProductController`、`FileController` 的既有降级收口保持一致
- `PriceAlertService.sendPriceAlertNotification` 的降级 catch 已从广义 `Exception` 收窄到 `RuntimeException`，继续保留 `boolean` 返回值契约；`PriceAlertServiceTest` 已锁住“商品缺失返回 false”“通知失败不标记已通知”两类关键分支
- `ProductController` 中“商品修改待审核通知失败”“新商品待审核通知失败”两处降级 catch 也已从广义 `Exception` 收窄到 `RuntimeException`，继续保持“主流程成功优先、通知失败仅 warning 日志”的既有语义；现有 `ProductControllerTest` 已覆盖这两条降级路径
- `FileController` 中“审核后关联记录更新失败”“审核通知发送失败”“上传待审核文件时通知管理员失败”“管理员上传商品图后关联商品更新失败”四处降级 catch 均已从广义 `Exception` 收窄到 `RuntimeException`；并新增 focused tests 锁住“待审核图片上传通知失败仍成功”“管理员上传商品图后商品保存失败仍成功”两类剩余分支
- 后端剩余广义 `catch (Exception)` 已缩到 `AuthService` 两处，并明确记账为保留的副作用降级契约：注册后初始化设置失败、密码修改后记录安全时间失败都不会回滚主流程，继续由 `AuthServiceTest` 锁住
- 本轮已复跑一组更大的后端 focused 回归基线：`ReviewServiceTest`、`PriceAlertServiceTest`、`AuthServiceTest`、`ProductControllerTest`、`FileControllerTest`、`NotificationControllerTest`、`OrderControllerFlowTest`、`AddressControllerTest`、`UserControllerTest`、`CategoryControllerTest`、`SecuritySettingsControllerTest`、`NotificationSettingsControllerTest`、`PrivacySettingsControllerTest` 共 95 个测试全部通过
- 前端 `userStore.updateUserInfo` 已补完整回滚：资料/手机/邮箱更新在接口返回非成功 payload 或直接抛错时，会恢复 `userInfo` 和本地 `USER_INFO` 缓存，不再留下假成功状态
- `userStore` 本轮也已统一成功语义：登录、注册、获取当前用户、更新资料、修改密码不再直接依赖 `response.success`，而是与其余页面/store 一样统一只认 `code === 200`；`userStore.test.ts` 已新增“假 success flag 不得冒充成功”的认证分支并通过
- `userStore` 本轮也已统一成功语义：登录、注册、获取当前用户、更新资料、修改密码不再直接依赖 `response.success`，而是与其余页面/store 一样统一只认 `code === 200`；`userStore.test.ts` 已新增“假 success flag 不得冒充成功”的认证分支并通过
- `userStore.fetchCurrentUser()` 也已继续补请求竞态保护：启动初始化、头像更新后的回拉、资料页/设置页并发刷新当前用户信息时，只接受最新一次用户资料响应，过期成功/失败结果都不会再把较新的账户状态覆盖回旧资料或残留错误；`userStore.test.ts` 已新增两条过期响应用例，并与 `Navbar.test.ts`、`ProfileView.test.ts`、`SettingsView.test.ts` 组合复跑共 47 个测试通过
- `userStore` 的登录、注册、获取当前用户、更新资料、修改密码失败链路也已统一补齐 `debugError`，避免账户状态异常继续只留 `error` 文本、不留调试定位信息；`userStore.test.ts` 现共 10 条通过
- `SettingsView` 已继续按 `NotificationsView` 模式收口：通知设置、隐私设置保存现在会显式检查 `res.code === 200`，业务失败时展示后端中文消息；初始加载若返回非 `200` 则保留默认值并记录调试日志，不在首屏静默污染状态
- 设置页真实浏览器链路已从“只验证导航和退出登录”扩到“真实持久化”闭环：新增 `settings-persistence.spec.ts`，在真实 MySQL 栈上验证隐私可见性与订单通知开关可成功保存、刷新后仍与服务端状态一致，并在用例结束后自动恢复原值，避免污染真实测试账号；实跑过程中还顺手抓出并修复了后端设置服务的真实缺口：`PrivacySettingsServiceImpl` / `NotificationSettingsServiceImpl` 更新时不再直接拿请求体覆盖整行记录，避免把 `created_at` 等持久化字段写成 `null` 导致 MySQL 真实保存失败；同类更新风险也已顺手从 `SecuritySettingsServiceImpl` 去掉，并补了 3 组 focused service tests 锁住“保留既有创建时间”的契约
- 个人资料链路的真实浏览器持久化闭环也已补上：新增 `profile-persistence.spec.ts`，在真实 MySQL 栈上验证昵称与个人简介可成功保存、刷新后仍与服务端状态一致，并在用例结束后自动恢复原值；这条链路也顺手确认了 `userStore.updateUserInfo` 在真实页面下能承接资料页保存，而不是只停留在 focused store tests
- 收货地址链路的真实浏览器闭环也已补上：新增 `address-management.spec.ts`，在真实 MySQL 栈上验证“新增地址 -> 编辑地址 -> 设为默认 -> 删除地址 -> 列表刷新”，并在用例结束后自动恢复原默认地址、清理测试地址；地址页不再只有 focused tests，没有真实页面主链路验证
- `AddressView` 本轮也已去掉同类旧兼容成功语义：地址列表读取、新增/编辑、设默认、删除现在统一只认 `code === 200` 为真实成功，不再把 `success: true` 但业务 `code` 异常的 payload 误当成成功；`AddressView.test.ts` 已新增对应假成功分支并通过
- 降价提醒列表的真实浏览器闭环也已补上：新增 `price-alerts-operations.spec.ts`，在真实 MySQL 栈上验证“修改目标价 -> 取消监控 -> 删除提醒记录 -> 列表刷新”，并在用例结束后自动清理测试提醒；用户侧降价提醒页不再只有 focused tests 和通知跳转覆盖
- `SettingsView` 的密码修改失败语义也已并入同一套契约：业务 `non-200` 与请求异常都会优先展示后端中文消息并记录调试日志，不再单独走未记录的裸错误分支；本轮继续补齐“手机/邮箱绑定失败”“账户注销 `non-200` 失败”的日志契约，`SettingsView.test.ts` 现共 13 条通过
- `SettingsView` 的注销账户成功链路也已继续收口到统一 `async/await`：后端删除成功后会等待 `userStore.logout()` 完成本地登录态清理再跳首页，避免出现“提示已注销但本地状态仍在收尾”的竞态；`SettingsView.test.ts` 已扩到 16 条通过
- `SettingsView` 的系统主题监听也已补齐清理契约：页面挂载时注册 `matchMedia('(prefers-color-scheme: dark)')` 监听，卸载时会显式 `removeEventListener`，避免个人中心反复进出后残留重复监听；`SettingsView.test.ts` 已新增 focused 覆盖并与 `ProductDetailView.test.ts`、`OrdersManageView.test.ts` 组合复跑共 49 个测试通过
- `SettingsView` 的外观恢复也已继续补缓存校验：损坏或越界的 `fontSize/theme` 本地值不再被页面状态直接接收，而是记录调试日志、清理坏缓存并回退到 `medium/light` 默认值；当前 `SettingsView.test.ts` 已扩到 19 条，并与 `SearchDropdown.test.ts`、`OrdersManageView.test.ts`、`ProductDetailView.test.ts` 组合复跑共 76 个测试通过
- `SettingsView` 的外观恢复本轮又补了一层读取失败兜底：即使浏览器环境里 `localStorage.getItem('fontSize'/'theme')` 直接抛错，页面也会继续回退 `medium/light` 默认外观并记录日志，不再把设置页挂在初始化读取上；`SettingsView.test.ts` 现已扩到 20 条，并与 `SearchDropdown.test.ts` 组合复跑共 46 个测试通过
- `SettingsView` 的外观设置写入侧也已补齐同类兜底：用户切换字号/主题时，即使 `localStorage.setItem('fontSize'/'theme')` 直接抛错，页面仍会先应用当前外观，再记录 `debugError`，不让设置页交互被浏览器存储异常打断；`SettingsView.test.ts` 现已扩到 21 条，并与 `SearchDropdown.test.ts`、`OrdersManageView.test.ts`、`ProductDetailView.test.ts` 组合复跑共 78 个测试通过
- `SearchDropdown`、`MusicPlayer` 两个高频共享组件的本地写入侧也已补齐兜底：游客搜索历史保存/删除/清空时若本地存储不可写，当前下拉交互仍继续，只额外记录 `debugError`；音乐播放器保存播放状态或拖拽位置时若 `localStorage.setItem` 抛错，也不会打断当前播放/拖拽结果。对应 `SearchDropdown.test.ts` 已扩到 29 条、`MusicPlayer.test.ts` 已扩到 9 条，并与 `SettingsView.test.ts`、`OrdersManageView.test.ts`、`ProductDetailView.test.ts` 组合复跑共 90 个测试通过
- `userStore` 的浏览器存储依赖也已继续降级：读取 token / 本地用户缓存、登录后写 token / 用户信息、退出登录删缓存、资料乐观更新回滚缓存时，即使浏览器 `localStorage` 读写/删除直接抛错，账户主链路也会继续推进，只记录 `debugError`，不再把登录态刷新、登录/登出或资料更新一起拖死；`userStore.test.ts` 已扩到 21 条，并与 `SettingsView.test.ts`、`SearchDropdown.test.ts`、`MusicPlayer.test.ts`、`OrdersManageView.test.ts`、`ProductDetailView.test.ts` 组合复跑共 111 个测试通过
- `CheckoutView` 的结算快照写入侧也已补齐同类兜底：直购商品或购物车商品生成结算清单后，如果 `sessionStorage.setItem('checkout_order_items')` 抛错，当前结算商品仍保留在页面，不再因为快照保存失败把主流程打回购物车；订单创建成功后即使 `sessionStorage.removeItem(...)` 抛错，也会继续清购物车并跳支付页，只额外记录 `debugError`。`CheckoutView.test.ts` 现共 12 条，并与 `userStore.test.ts`、`SettingsView.test.ts`、`SearchDropdown.test.ts`、`MusicPlayer.test.ts`、`OrdersManageView.test.ts`、`ProductDetailView.test.ts` 组合复跑共 123 个测试通过
- 基础工具层的浏览器存储依赖也已继续降级：`utils/axios.ts` 在读取 token 或 401 清理登录缓存时，即使 `localStorage` 读写/删除直接抛错，也只记录 `debugError`，不再把请求拦截链路本身打断；`utils/aiChat.ts` 读取或保存 `ai_api_key` 失败时也会继续回退为空串 / 静默保存失败，不会把 AI 配置调用方直接拖崩。新增 `axios.test.ts`、`aiChat.test.ts` 后，与 `userStore.test.ts`、`SettingsView.test.ts`、`CheckoutView.test.ts`、`SearchDropdown.test.ts`、`MusicPlayer.test.ts`、`OrdersManageView.test.ts`、`ProductDetailView.test.ts` 组合复跑共 127 个测试通过
- 后台 `ProductsView` 的广告设置本地缓存也已补齐写入侧契约：商品审核通过时，即使保存 `admin_ad_settings` 到 `localStorage` 直接抛错，也不会把“审核通过”主链路误升级成失败，当前审核请求仍会继续提交并刷新列表，只额外记录 `debugError`；`ProductsView.test.ts` 已扩到 18 条，并与 `aiChat.test.ts`、`axios.test.ts`、`userStore.test.ts`、`SettingsView.test.ts`、`CheckoutView.test.ts`、`SearchDropdown.test.ts`、`MusicPlayer.test.ts`、`OrdersManageView.test.ts`、`ProductDetailView.test.ts` 组合复跑共 145 个测试通过
- `MusicPlayer`、`SettingsView` 两处剩余清理侧也已并到同一套降级契约：播放器恢复坏状态/坏位置时，即使 `removeItem('musicPlayerState'/'musicPlayerPosition')` 抛错，也只额外记录 `debugError`，不影响默认状态/默认位置回退；设置页清理非法 `fontSize/theme` 缓存时，即使 `removeItem(...)` 抛错，也继续回退 `medium/light` 默认外观并保持当前交互可用。`MusicPlayer.test.ts` 已扩到 11 条，`SettingsView.test.ts` 已扩到 22 条；当前共享存储组合基线已复跑到 148 个测试通过
- `MusicPlayer` 本轮继续补齐读取侧浏览器存储降级：即使 `localStorage.getItem('musicPlayerState'/'musicPlayerPosition')` 直接抛错，播放器也会只记录 `debugError`，继续回退到默认播放状态和默认浮层位置，不再因为读取缓存失败把挂载或空闲加载一起打断；`MusicPlayer.test.ts` 现共 13 条通过
- `CheckoutView` 本轮继续补齐结算快照读取侧降级：即使 `sessionStorage.getItem('checkout_order_items')` 直接抛错，结算页也只记录 `debugError`，继续保持“当前没有可结算商品”的可用空态，不再因为读取快照失败把初始化主流程打断；`CheckoutView.test.ts` 现共 14 条通过
- `App.vue` 根壳层也已补齐同类读取降级：初始化字体大小和主题、以及系统主题变化时再次读取 `theme`，即使 `localStorage.getItem('fontSize'/'theme')` 直接抛错，也只记录 `debugError`，不再把应用根组件挂载打断；新增 `App.test.ts` 后已锁住“读取异常仍可挂载 + 卸载时移除系统主题监听”两类契约
- `SearchDropdown` 的游客本地历史读取也已补齐同类降级：即使 `localStorage.getItem('search_history_local')` 直接抛错，或本地历史 JSON 损坏后连 `removeItem(...)` 都再次抛错，下拉面板也继续保持可渲染，仅通过 `debugError` 记录“读取失败 / 解析失败 / 清理失败”；`SearchDropdown.test.ts` 已扩到 31 条通过
- `Navbar` 的登录后共享刷新也已从隐含成功改为显式降级：导航栏在挂载后或登录态切换为已登录时，即使刷新购物车状态或未读通知数的任一 Promise 真正 reject，也只记录 `debugError`，不再把全站壳层挂在未处理异常上；`Navbar.test.ts` 已扩到 9 条通过
- `CouponDetailView`、`PromotionDetailView` 也已补齐“详情页组件复用”契约：当路由参数 `id` 变化、从一个优惠券详情或专题详情直接切到另一个详情时，页面现在会显式清空旧详情并重新拉取当前 `id` 对应的服务端真实数据，不再依赖组件重新挂载才能刷新；`CouponDetailView.test.ts` 已扩到 9 条、`PromotionDetailView.test.ts` 已扩到 11 条
- `NotificationsView`、`PriceAlertsView` 的“成功后刷新”语义也已继续锁住：全部已读、删除、清空通知，以及更新目标价、取消监控/删除提醒记录成功后，即使后续刷新列表失败，页面也继续保留成功提示，不把已成功的主动作回滚成失败，只通过既有 `获取通知失败` / `获取降价提醒失败` 日志暴露刷新异常。`NotificationsView.test.ts` 现共 26 条、`PriceAlertsView.test.ts` 现共 11 条；当前共享/高频 focused 组合基线已复跑到 185 个测试通过
- `OrdersView`、`OrderDetailView` 的“成功后刷新”语义也已并入同一套契约：取消订单、申请取消、确认收货、提交评价成功后，即使后续重新拉取订单列表/订单详情失败，页面也继续保留已成功的中文提示，不把主动作误升级成失败；刷新异常只通过既有 `获取订单列表失败` 或新增 `...后刷新订单详情失败` 日志暴露。对应 `OrdersView.test.ts` 现共 15 条、`OrderDetailView.test.ts` 现共 11 条；扩容后的共享/高频 focused 组合基线已复跑到 211 个测试通过
- `SellerOrdersView`、`MyProductsView` 也已并入同一批“主动作成功优先”契约：卖家发货、卖家提交/删除商品成功后，即使后续刷新订单列表、待发货计数或我的商品列表失败，页面也继续保留成功提示，不把已成功的动作改判为失败；刷新异常只通过既有 `获取卖家订单项失败` / `获取我的商品列表失败` 日志暴露。对应 `SellerOrdersView.test.ts` 现共 10 条、`MyProductsView.test.ts` 现共 10 条；扩容后的共享/高频 focused 组合基线已复跑到 231 个测试通过
- `AddressView` 也已并入同一套成功优先契约：新增地址、修改地址、设置默认地址、删除地址成功后，即使后续刷新地址列表失败，页面也继续保留成功提示，不把已成功的主动作回滚成失败；刷新异常只通过既有 `获取地址失败` 日志暴露。`AddressView.test.ts` 已扩到 12 条；扩容后的共享/高频 focused 组合基线已复跑到 243 个测试通过
- `CouponDetailView` 也已收口到同一规则：领取优惠券成功后，即使后续刷新详情失败，页面也继续保留“领取成功”的中文提示，不再紧跟一条错误提示把成功语义冲掉；刷新异常只通过既有 `获取优惠券详情失败` 日志暴露。`CouponDetailView.test.ts` 已扩到 8 条；扩容后的共享/高频 focused 组合基线已复跑到 251 个测试通过
- 后台 `ContactMessagesView`、`FileReviewView` 也已并入同一套成功优先契约：留言标记已处理、删除留言、文件审核通过/拒绝、删除文件记录成功后，即使后续刷新列表失败，页面也继续保留成功提示，不把主动作误升级成失败；刷新异常只通过既有 `获取留言列表失败` / `获取文件审核列表失败` 日志暴露。`ContactMessagesView.test.ts` 现共 9 条、`FileReviewView.test.ts` 现共 10 条；扩容后的共享/高频 focused 组合基线已复跑到 270 个测试通过
- 后台 `OrdersManageView`、`PriceManageView` 也已并入同一套成功优先契约：管理员取消订单、审核取消申请、删除订单、记录价格、删除价格记录、手动触发/回退/删除降价提醒成功后，即使后续刷新列表或计数失败，页面也继续保留成功提示，不把主动作误升级成失败；刷新异常只通过既有 `获取订单列表失败`、`获取价格历史失败`、`获取降价提醒列表失败`、`获取激活降价提醒数量失败` 日志暴露。`OrdersManageView.test.ts` 现共 12 条、`PriceManageView.test.ts` 现共 17 条；扩容后的共享/高频 focused 组合基线已复跑到 290 个测试通过
- 后台 `ProductsView`、`RationalManageView`、`RationalConsumptionView` 这轮也已显式补齐同类保护：商品保存/全部上下架/删除/审核通过或拒绝、成就授予或撤销、预算保存、想要清单移除/标记已购买成功后，即使后续列表、徽标、统计或成就刷新出现异常，页面也继续保留刚完成的成功语义，不再把主动作误升级成失败；刷新异常继续只通过既有 `获取商品管理列表失败`、`获取待审核商品数量失败`、`获取成就记录失败`、`获取预算状态失败`、`获取成就失败` 等日志暴露。`ProductsView.test.ts` 现共 19 条、`RationalManageView.test.ts` 现共 8 条、`RationalConsumptionView.test.ts` 现共 14 条；本轮扩容后的共享/高频 focused 组合基线已复跑到 23 个文件、313 个测试通过
- 用户侧 `HomeView`、`PromotionsView`、`PromotionDetailView` 的优惠券领取成功链路也已统一到同一规则：首页快捷领取、优惠券中心领取、优惠专题领取成功后，即使后续优惠券列表、我的优惠券或专题主优惠券刷新异常，页面也继续保留“领取成功”的中文提示，不再让后续刷新问题反向污染主动作语义；刷新异常继续只通过既有 `获取首页优惠券失败`、`获取我的优惠券失败`、`获取优惠专题主优惠券失败` 等日志暴露。`HomeView.test.ts` 现共 9 条、`PromotionsView.test.ts` 现共 6 条、`PromotionDetailView.test.ts` 现共 10 条；本轮扩容后的共享/高频 focused 组合基线已复跑到 26 个文件、338 个测试通过
- 后台 `UsersView`、`CouponsManageView`、`CategoriesView`、`MusicManageView` 也已从隐含契约升级为显式成功保护：用户启用/禁用、优惠券保存/切换/删除、分类保存/删除、音乐新增/编辑、状态切换、删除成功后，即使后续列表刷新异常，页面也继续保留已完成的成功语义，不再把主动作误升级成失败；刷新异常继续只通过既有 `获取用户列表失败`、`获取优惠券管理列表失败`、`获取分类管理列表失败`、`加载音乐列表失败` 等日志暴露。`UsersView.test.ts` 现共 9 条、`CouponsManageView.test.ts` 现共 10 条、`CategoriesView.test.ts` 现共 9 条、`MusicManageView.test.ts` 现共 9 条；本轮扩容后的共享/高频 focused 组合基线已复跑到 30 个文件、375 个测试通过
- `ProductDetailView` 这轮也已把剩余成功路径显式化：删除评价、设置降价提醒、取消降价提醒、加入想要清单成功后，即使后续评价列表、降价提醒状态或想要清单状态刷新异常，页面也继续保留成功提示，不再依赖 `fetchReviews` / `fetchPriceAlert` / `checkWishlistStatus` 当前“只记日志不抛错”的隐含前提；刷新异常继续只通过既有 `获取评价失败`、`获取降价提醒失败`、`检查想要清单状态失败` 日志暴露。`ProductDetailView.test.ts` 已扩到 24 条；当前共享/高频 focused 组合基线已复跑到 30 个文件、377 个测试通过
- `SettingsView` 的账户注销链路也已继续收口：后端 `/users/me` 删除成功后，即使后续 `userStore.logout()` 本地清理失败，页面也继续保留“账户已注销”的成功语义并跳转首页，不再把已完成的主动作回滚成“注销失败”；本地清理异常仅记录 `账户注销成功后清理本地登录态失败` 调试日志。`SettingsView.test.ts` 已扩到 23 条；当前共享/高频 focused 组合基线已复跑到 30 个文件、378 个测试通过
- `CheckoutView` 的订单创建链路也已继续收口：后端订单创建成功后，即使后续购物车批量清理失败，页面也继续保留“订单创建成功”的主动作语义并跳转支付页，不再把已成功的下单误回滚成“订单创建失败”；后置清理异常仅记录 `订单创建成功后清理购物车失败` 调试日志。`CheckoutView.test.ts` 已扩到 13 条；当前共享/高频 focused 组合基线已复跑到 30 个文件、379 个测试通过
- 当前共享/高频 focused 组合基线已继续实跑通过：`App.test.ts`、`aiChat.test.ts`、`axios.test.ts`、`userStore.test.ts`、`SettingsView.test.ts`、`CheckoutView.test.ts`、`CartView.test.ts`、`AiRecommendView.test.ts`、`SearchDropdown.test.ts`、`MusicPlayer.test.ts`、`NotificationsView.test.ts`、`PriceAlertsView.test.ts`、`AddressView.test.ts`、`CouponDetailView.test.ts`、`OrdersView.test.ts`、`OrderDetailView.test.ts`、`SellerOrdersView.test.ts`、`MyProductsView.test.ts`、后台订单/商品/留言/文件/价格/理性消费/用户/优惠券/分类/音乐管理，以及 `ProductDetailView.test.ts`、`HomeView.test.ts`、`PromotionsView.test.ts`、`PromotionDetailView.test.ts` 共 33 个文件、399 个测试通过
- 当前共享/高频 focused 组合基线已继续扩到 `Navbar.test.ts` 并实跑通过：`App.test.ts`、`Navbar.test.ts`、`aiChat.test.ts`、`axios.test.ts`、`userStore.test.ts`、`SettingsView.test.ts`、`CheckoutView.test.ts`、`CartView.test.ts`、`AiRecommendView.test.ts`、`SearchDropdown.test.ts`、`MusicPlayer.test.ts`、`NotificationsView.test.ts`、`PriceAlertsView.test.ts`、`AddressView.test.ts`、`CouponDetailView.test.ts`、`OrdersView.test.ts`、`OrderDetailView.test.ts`、`SellerOrdersView.test.ts`、`MyProductsView.test.ts`、后台订单/商品/留言/文件/价格/理性消费/用户/优惠券/分类/音乐管理，以及 `ProductDetailView.test.ts`、`HomeView.test.ts`、`PromotionsView.test.ts`、`PromotionDetailView.test.ts` 共 34 个文件、408 个测试通过
- 当前共享/高频 focused 组合基线已继续实跑通过：`App.test.ts`、`Navbar.test.ts`、`aiChat.test.ts`、`axios.test.ts`、`userStore.test.ts`、`SettingsView.test.ts`、`CheckoutView.test.ts`、`CartView.test.ts`、`AiRecommendView.test.ts`、`SearchDropdown.test.ts`、`MusicPlayer.test.ts`、`NotificationsView.test.ts`、`PriceAlertsView.test.ts`、`AddressView.test.ts`、`CouponDetailView.test.ts`、`OrdersView.test.ts`、`OrderDetailView.test.ts`、`SellerOrdersView.test.ts`、`MyProductsView.test.ts`、`CategoryView.test.ts`、后台订单/商品/留言/文件/价格/理性消费/用户/优惠券/分类/音乐管理，以及 `ProductDetailView.test.ts`、`HomeView.test.ts`、`PromotionsView.test.ts`、`PromotionDetailView.test.ts` 共 35 个文件、417 个测试通过
- `CartView` 的初始加载也已补齐降级保护：购物车首页在 `cartStore.fetchCart()` 直接抛错时，不再让页面挂载阶段被异常打断，而是记录 `加载购物车失败` 调试日志并继续保留页面可用状态；`CartView.test.ts` 已扩到 7 条。当前共享/高频 focused 组合基线已扩到 31 个文件、386 个测试通过
- `AiRecommendView` 的页面初始化也已补齐同类降级：商品主数据请求直接抛错时，不再让 AI 页整段 `Promise.all` 初始化短路，而是像分类/优惠券旁路数据一样记录 `获取 AI 商品数据失败` 日志并回退为空商品集，页面主体和 AI 辅助能力继续保持可用；`AiRecommendView.test.ts` 已扩到 6 条。当前共享/高频 focused 组合基线已扩到 32 个文件、392 个测试通过
- `notificationStore.fetchUnreadCount` 已补齐业务失败分支：接口返回非 `200` 时不再静默吞掉，而是保留当前未读数并记录调试日志，同时新增 focused store tests 锁住“成功更新 / 非 200 保持旧值 / 抛错保持旧值”三类契约
- `notificationStore.fetchUnreadCount` 也已继续补请求竞态保护：顶部未读数在轮询、页面操作后刷新或多处并发触发时，只接受最新一次计数响应，过期结果不会再把较新的未读数覆盖回旧值；`notificationStore.test.ts` 已新增过期响应用例，并与 `adminStore.test.ts` 组合复跑共 12 个测试通过
- `adminStore` 的三类后台待处理计数也已补请求竞态保护：待审核文件数、待审核商品数、待审核取消申请数在多个后台页面并发刷新时，只接受最新一次计数响应，过期结果不会再把较新的全局徽标覆盖回旧值；`adminStore.test.ts` 已新增三条过期响应用例，并与 `notificationStore.test.ts` 组合复跑共 12 个测试通过
- `cartStore` 已补齐业务 `non-200` 契约：获取购物车、加入购物车、更新数量、单项选择、全选、删除、批量删除、清空购物车在后端返回非成功 payload 时都会转入正式失败路径，不再误留成功状态或继续弹成功提示；`cartStore.test.ts` 现共 26 条通过
- `cartStore` 本轮也已去掉旧兼容成功语义：获取购物车、加购、更新、选择、删除、批量删除、清空现在统一只认 `code === 200`，不再把 `success: true` 但业务 `code` 异常的 payload 误当成成功；`cartStore.test.ts` 已新增对应假成功分支并通过
- `cartStore.fetchCart()` 也已继续补请求竞态保护：导航栏、个人中心、购物车页、结算页并发刷新购物车时，只接受最新一次列表响应，过期成功/失败结果都不会再把较新的购物车状态覆盖回旧数据或清空；`cartStore.test.ts` 已新增两条过期响应用例，并与 `Navbar.test.ts`、`CartView.test.ts`、`CheckoutView.test.ts` 组合复跑共 50 个测试通过
- `adminStore` 的待审核文件/商品/取消申请计数也已补 focused store 基线，锁住“成功更新”“业务失败保留旧值并记录日志”“刷新时并发触发三个计数请求”三类契约；`adminStore.test.ts` 现共 5 条通过
- `AddressView` 已继续收口地址链路弱契约：地址列表返回非 `200` 时不再静默吞掉，改为保留当前列表并记录日志；本轮继续补齐“新增/编辑地址”“设为默认”“删除地址”的业务失败日志契约，不再只给固定失败文案；`AddressView.test.ts` 现共 6 个测试通过
- `AddressView` 的新增/编辑成功分支也已改为等待地址列表刷新完成，再结束保存流程，继续统一到“服务端真实状态刷新后再稳定落回页面”的契约；当前 `AddressView.test.ts` 基线复跑继续通过
- `SettingsView` 的注销账户动作也已继续收口：用户取消确认时不再误报失败，真实失败会优先展示后端中文消息并记录调试日志；对应页面 tests 已扩展
- `AuthService` 中“注册后初始化设置失败”“修改密码后记录安全时间失败”两处 `catch (Exception)` 已明确归类为保留的副作用降级契约，本轮不改业务语义，只继续依赖 `AuthServiceTest` 锁住行为
- 本轮前端账户/通知/提醒 focused 回归已再次扩到 `AddressView` 与 `notificationStore`：`userStore.test.ts`、`notificationStore.test.ts`、`AddressView.test.ts`、`PriceAlertsView.test.ts`、`SettingsView.test.ts`、`ProfileView.test.ts`、`NotificationsView.test.ts` 现共 57 个测试通过；其中 `ProfileView.test.ts` + `AddressView.test.ts` 本轮复跑共 14 个测试通过
- store 层当前组合回归也已补成独立基线：`adminStore.test.ts` + `userStore.test.ts` + `notificationStore.test.ts` + `cartStore.test.ts` 共 44 个测试通过
- 本轮继续补的一组用户侧/状态层组合回归也已通过：`ProductDetailView.test.ts` + `RationalConsumptionView.test.ts` + `adminStore.test.ts` + `userStore.test.ts` + `notificationStore.test.ts` + `cartStore.test.ts` 共 72 个测试通过
- 订单侧 `SellerOrdersView`、`OrderDetailView`、`PaymentView` 已继续补齐“提示可见 + 调试可追”的弱契约：卖家订单列表加载、卖家发货、订单详情初始化、订单取消、申请取消、确认收货、支付页加载待支付订单、模拟支付返回 `non-200` 或直接抛错时，都会优先展示后端中文消息并统一记录 `debugError`，不再只有提示没有定位信息
- 订单页 focused 覆盖已继续扩到日志契约：`PaymentView.test.ts` 新增“订单详情加载抛错也记录日志”，`OrderDetailView.test.ts` 新增“初始化失败回退上一页并记录日志”“确认收货 `non-200` 记录日志”，`SellerOrdersView.test.ts` 新增“卖家订单列表/发货 `non-200` 记录日志”，`OrdersView.test.ts` 也继续补齐“取消订单/申请取消/确认收货/提交评价 `non-200` 记录日志”；当前四页组合回归共 30 个测试通过
- `PaymentView` 的支付成功分支也已继续从“直接信任 `payOrder` 返回对象”收口到“支付成功后重新拉取订单详情”：页面现在以服务端真实订单状态驱动支付成功页，避免支付接口返回简化数据时前端停留在本地拼装状态；`PaymentView.test.ts` 已改为锁住“支付成功后再次请求订单详情”的契约
- `NotificationsView` 的单条已读动作也已继续统一到服务端事实源：点击通知详情并标记已读成功后，不再只改本地 `read` 和未读数，改为重新拉取通知列表并从新列表中打开详情；`NotificationsView.test.ts` 已扩到 22 条并通过
- `HomeView`、`CouponDetailView`、`PromotionsView` 已继续收口优惠券链路的异常分支：首页快捷领取、优惠券详情领取、优惠券中心领取在抛错时都会优先展示后端中文消息并记录调试日志；本轮继续补齐优惠券详情和优惠券中心在业务 `non-200` 失败下的日志契约，首页分类/优惠券/商品列表与优惠券中心的列表加载也不再静默无痕
- 上述优惠券/首页链路 focused 回归已继续扩到业务失败日志分支：`HomeView.test.ts`、`CouponDetailView.test.ts`、`PromotionsView.test.ts`、`PromotionDetailView.test.ts` 共 20 个测试通过；再与 `PriceAlertsView.test.ts` 组合复跑后，优惠券/提醒链路共 28 个测试通过
- `CheckoutView`、`CartView` 已继续收口结算链路弱契约：地址/优惠券/预算状态的 `non-200` 返回不再静默无痕，购物车删除/数量更新、订单提交失败会优先展示后端中文消息并记录调试日志；本轮继续把“清空已选”从逐条删除改成批量删除，避免重复成功提示与多次请求噪音
- `PromotionDetailView` 已继续去掉加购链路的重复成功提示，避免 `cartStore.addToCart` 已提示成功后页面再额外弹一次“已加入购物车”
- `SettingsView` 的退出登录动作已从旧 promise 链收口到统一 `async/await` 语义：取消确认时静默返回，确认后等待 `userStore.logout()` 完成再提示并跳转，并补了 focused tests
- 上述结算链路 focused 回归已补齐：`CheckoutView.test.ts`、`CartView.test.ts`、`ProductDetailView.test.ts` 现共 20 个测试通过；本轮 `LoginView.test.ts` + `RegisterView.test.ts` + `CheckoutView.test.ts` 组合回归共 10 个测试通过
- 浏览器测试接入已正式落地到仓内 Playwright 体系，并补了一份 [`frontend/tests/e2e/README.md`](/D:/graduation%20project/frontend/tests/e2e/README.md) 作为本地巡检基线说明：明确区分 `@浏览器` 实时巡检与 Playwright 回归职责，固定当前本地栈地址、默认账号、商品数据、分组命令和 selector 约定
- 本轮已新增共享 E2E helper：`frontend/tests/e2e/helpers/session.ts` 统一登录、会话缓存、浮层规避、失败请求/控制台监听，并将 Playwright 默认 worker 收口到 `1`，避免真实后端登录限流和共享数据把本地回归互相打穿
- 浏览器测试基线已继续纠偏：不再把仓库里的 `data.sql` / `data-local.sql` 种子账号误当成真实联调基线；E2E 默认重新回到真实 MySQL 常用账号 `zhangsan / lisi / admin`，商品也不再默认依赖固定主键，而是优先使用环境变量指定的真实商品 ID，未指定时再从真实接口动态挑选可用商品
- 本轮已新增并实跑通过 5 个浏览器脚本：
  - `account-settings.spec.ts`
  - `admin-smoke.spec.ts`
  - `user-smoke.spec.ts`
  - `coupon-flow.spec.ts`（未登录中文提示 + 登录引导、登录后真实领取与服务端刷新）
  - 真实本地栈结果：`5 passed`
- 为了支撑浏览器巡检，本轮已为高价值页面补稳定 `data-testid` 锚点：
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
  - `admin/CouponsManageView`
  - `admin/ContactMessagesView`
- 浏览器实跑也抓到了一个真实后端缺口并已修复：`NotificationSettings` / `PrivacySettings` / `SecuritySettings` 返回实体时会把懒加载 `user` 一起序列化，导致设置页真实请求返回中文 `500 服务器内部错误`；现已在三个实体上为 `user` 增加 `@JsonIgnore`，并复跑 `SecuritySettingsControllerTest`、`NotificationSettingsControllerTest`、`PrivacySettingsControllerTest` 共 9 个 focused tests 全通过
- 旧浏览器脚本的 3 个历史回归点也已全部收口：
  - `smoke.spec.ts`：已改为复用共享会话 helper，并把支付成功断言切到稳定的页面锚点
  - `order-phase2.spec.ts`：已去掉重复登录逻辑，买家/卖家/管理员链路统一走共享会话与当前真实默认账号
  - `price-alert-notification.spec.ts`：已改为等待真实价格文本出现后再解析，并统一到共享会话与当前真实商品 ID
- 上述旧 E2E 已在默认本地栈 `127.0.0.1:5173 -> 8080` 上再次实跑通过：`smoke.spec.ts` + `order-phase2.spec.ts` + `price-alert-notification.spec.ts` 共 `4 passed`
- 浏览器基线此后又继续扩展到真实 MySQL 的固定端口方案：新增 [`scripts/run-real-browser-e2e.ps1`](/D:/graduation%20project/scripts/run-real-browser-e2e.ps1) 统一负责清理残留进程、固定启动 `5173 -> 8081`、执行 Playwright，并在完成后自动回收端口，避免后台实例残留导致端口一路自增
- 固定端口浏览器基线本轮又进一步拆成可复用的手工巡检入口：`run-real-browser-e2e.ps1` 现已支持 `-SkipPlaywright -KeepRunning`，并新增 [`scripts/start-real-browser-stack.ps1`](/D:/graduation%20project/scripts/start-real-browser-stack.ps1) / [`scripts/stop-real-browser-stack.ps1`](/D:/graduation%20project/scripts/stop-real-browser-stack.ps1)，方便在不跑 Playwright 时单独拉起或回收 `127.0.0.1:5173 -> 8081` 的真实浏览器巡检栈
- 这套固定端口真实回归已经再次实跑验证：
  - `smoke.spec.ts`：`1 passed`
  - `order-phase2.spec.ts` + `price-alert-notification.spec.ts`：`3 passed`
  - `notification-routing.spec.ts`：`2 passed`
  - `admin-price-alert-management.spec.ts`：`1 passed`
- 新增的真实浏览器覆盖已不再只停留在用户侧：
  - `notification-routing.spec.ts` 锁住了促销/文件审核/卖家订单/管理员商品审核四类通知的实际跳转
  - `admin-price-alert-management.spec.ts` 锁住了后台价格管理里“手动触发 -> 回退触发 -> 删除提醒”三步危险操作及其真实刷新
- 浏览器层下一步不再返工基建，也不再修这 3 条旧脚本；后续重点转到更广的真实页面巡检和新增高价值 E2E 覆盖，例如通知路由、后台操作主链路与账户设置剩余场景
- 同时也确认了一条需要长期坚持的环境约束：浏览器测试“跑通”本身不足以说明覆盖了真实业务数据，后续所有 E2E 验证都必须先对齐当前正在使用的后端实例和真实 MySQL 数据，再谈回归结果
- 本轮又通过真实后台订单管理 E2E 抓到并修复了一个真实契约错位：后台 `OrdersManageView` 原先调用的是普通用户 `DELETE /orders/{id}`，管理员无法删除他人订单；现已新增管理员删除入口 `DELETE /orders/{id}/admin`，普通用户删除语义保持不变，并补了 `OrderControllerFlowTest`、`OrderServiceTest` 和 `admin-orders-management.spec.ts`
- 修复后已用固定端口真实浏览器脚本再次实跑：`admin-orders-management.spec.ts` `1 passed`，管理员现在可以在后台完成“搜索订单 -> 同意取消 -> 删除订单 -> 列表真实刷新”整条链路
- 后台商品管理的真实浏览器覆盖也已继续补到可执行主链路：新增 `admin-product-review-management.spec.ts`，实跑验证“卖家提交待审核商品 -> 管理员待审核页通过审核 -> 商品从待审核列表消失 -> 管理员在全部商品列表删除该商品”，避免后台商品审核继续只有 focused test、没有真实页面闭环
- 后台优惠券管理也已补上真实浏览器主链路：新增 `admin-coupons-management.spec.ts`，实跑验证“管理员创建后的真实优惠券行可见 -> 状态切换成功并刷新 -> 删除成功并从列表消失”，后台优惠券页不再只有打开页面的 smoke 覆盖
- 后台文件审核也已补上真实浏览器主链路：新增 `admin-file-review-management.spec.ts`，实跑验证“用户上传待审核头像 -> 管理员文件审核页通过审核 -> 审核记录删除成功”，文件审核页不再只停留在 focused mock 覆盖
- 后台留言管理的真实浏览器主链路也已补齐：`contact-message-management.spec.ts` 已在固定端口真实 MySQL 栈 `127.0.0.1:5173 -> 8081` 上单独实跑通过，删除确认框交互也已收口到稳定写法，避免 Element Plus 浮层在真实浏览器里造成误报
- 管理后台真实浏览器分组回归已再次全量实跑：`order-phase2.spec.ts`、`admin-smoke.spec.ts`、`price-alert-notification.spec.ts`、`notification-routing.spec.ts`、`admin-price-alert-management.spec.ts`、`admin-orders-management.spec.ts`、`admin-product-review-management.spec.ts`、`admin-coupons-management.spec.ts`、`admin-file-review-management.spec.ts`、`contact-message-management.spec.ts` 共 `12 passed`，固定端口栈保持 `127.0.0.1:5173 -> 8081`
- 用户侧真实浏览器分组也已在同一固定端口真实 MySQL 栈上复跑通过：`smoke.spec.ts`、`user-smoke.spec.ts`、`coupon-flow.spec.ts`、`account-settings.spec.ts` 共 `5 passed`，说明首页、登录、商品、优惠券、资料与设置主入口当前在 `127.0.0.1:5173 -> 8081` 下可稳定执行
- 后台消息管理也已补上真实浏览器闭环：新增 `admin-notifications-management.spec.ts`，实跑验证“管理员在消息管理页向指定用户发送通知 -> 普通用户通知页收到真实消息 -> 打开通知详情核对标题和正文”，后台通知页不再只停留在 focused mock 覆盖
- 理性消费页也已从“可打开”提升到“真实动作可执行”：新增 `rational-consumption-flow.spec.ts`，实跑验证“设置预算成功后页面刷新预算展示”和“想要清单真实删除后列表刷新”，不再只依赖 focused mock 覆盖
- 后台理性消费管理也已补成真实闭环：新增 `admin-rational-management.spec.ts`，实跑验证“管理员手动授予成就 -> 最近成就列表出现 -> 撤销成就 -> 列表刷新”，理性消费后台不再只有 focused test 和静态打开冒烟
- 后台分类管理也已补成真实闭环：新增 `admin-categories-management.spec.ts`，实跑验证“管理员新增分类 -> 列表出现真实新分类 -> 删除分类 -> 列表刷新”，分类管理不再只有 focused mock 覆盖
- 用户通知页也已补成真实操作闭环：新增 `notifications-operations.spec.ts`，实跑验证“全部已读 -> 单条删除 -> 清空全部”三类高频动作，通知页不再只覆盖跳转详情，不再遗漏列表级状态管理
- 后台用户管理的搜索/筛选契约也已收口：后端 `GET /users` 现在真正支持 `keyword/status`，前端现有搜索框和状态筛选不再只是摆设；同时新增 `admin-users-management.spec.ts`，实跑验证“搜索用户 -> 禁用 -> 列表刷新 -> 启用恢复”
- 用户侧固定端口真实浏览器分组已继续扩到卖家自助商品链路：新增 `my-products-management.spec.ts`，实跑验证“卖家在我的商品页发布商品 -> 新商品进入待审核 -> 待审核商品编辑按钮禁用 -> 卖家删除测试商品 -> 列表真实刷新”，并带自动清理，避免这条链路继续只有 focused tests 没有真实页面闭环
- `MyProductsView` 本轮又继续收紧旧兼容成功语义：发布商品、编辑商品、删除商品现在统一只认 `code === 200` 为真实成功，不再把 `success: true` 但业务 `code` 异常的 payload 误当成成功；`MyProductsView.test.ts` 已新增“假 success flag 不得冒充成功”分支并通过
- 用户侧商品浏览链路也已补上匿名真实页面闭环：新增 `category-browse.spec.ts`，实跑验证“分类页搜索 -> 价格筛选 -> 排序 -> 进入商品详情 -> 清除搜索返回总览”；这条 E2E 还顺手抓出了一个真实后端权限缺口并已修复：匿名商品详情页请求 `GET /price/history/{productId}`、`GET /price/stats/{productId}` 之前会被 `SecurityConfig` 提前拦成 `403`，现在已放行匿名只读访问，并补了 `PriceHistoryControllerTest` 回归
- 首页搜索真实链路也已补上浏览器闭环：`search-dropdown-flow.spec.ts` 现已实跑覆盖“空输入时热搜可见 -> 搜索建议下拉 -> 进入分类结果页 -> 游客本地搜索历史回显 -> 登录后服务端搜索历史回显”；这条 E2E 顺手抓出了一个真实前后端契约错位并已修复：前端真实请求走 `/search/*`，但后端 `SearchController` 之前错误挂在 `/api/search/*`，导致真实环境里搜索建议/热搜/搜索历史都落到静态资源处理；现已统一收口到 `/search`，并补了 `SearchControllerTest`、`SearchServiceTest` 回归
- 搜索建议与分类搜索的匹配口径也已继续统一：后端 `SearchService.getSuggestions` 现在不再只按商品名/分类名命中，商品描述命中的关键词也会返回真实商品名建议，避免首页下拉先提示“未找到相关内容”而分类页实际又能搜到商品；`SearchServiceTest` 已新增描述命中分支，`search-dropdown-flow.spec.ts` 也已实跑锁住“描述词 -> 商品名建议 -> 分类页写入商品名搜索”的真实链路
- 本轮又再次用固定端口真实 MySQL 栈 `127.0.0.1:5173 -> 8081` 单独实跑 `search-dropdown-flow.spec.ts`，`2 passed`；并同步确认当前真实库中确有 `得力计算器`、`蒙牛纯牛奶`、`三体全集典藏版` 等上架商品，所以这条搜索 E2E 不是依赖种子 SQL 或写死商品名，而是动态读取真实 `/api/products` 与 `/api/search/suggestions` 进行校验
- 本轮又补跑了一组直接覆盖用户高曝光入口的固定端口真实浏览器回归：`user-smoke.spec.ts`、`search-dropdown-flow.spec.ts`、`hot-products-browse.spec.ts` 共 `4 passed`，说明首页、搜索下拉、热销榜和商品详情入口当前在真实 MySQL 栈 `127.0.0.1:5173 -> 8081` 下仍保持可用
- 同一轮也补跑了后台广覆盖冒烟 `admin-smoke.spec.ts`，固定端口真实 MySQL 栈下 `1 passed`，说明后台首页、导航与关键入口当前没有被这波 focused 收口打穿
- 后台广覆盖冒烟本轮也已顺手扩容：`admin-smoke.spec.ts` 现在除了首页、商品、订单、价格、文件、优惠券、留言外，还会再扫 `分类 / 用户 / 通知 / 理性消费` 四个后台页面；扩容后已在固定端口真实 MySQL 栈上复跑 `1 passed`
- `MusicManageView` 也已补上稳定根节点 `data-testid="admin-music-view"`，后台广覆盖冒烟现在顺手把音乐管理一并纳入；扩容后的 `admin-smoke.spec.ts` 已再次在固定端口真实 MySQL 栈上复跑 `1 passed`
- 之前没有专门覆盖的静态用户路由也已补上真实浏览器基线：新增 `help-and-terms.spec.ts`，并在固定端口真实 MySQL 栈 `127.0.0.1:5173 -> 8081` 上实跑 `1 passed`，锁住“帮助中心可进入、FAQ 分类与展开可用、服务条款关键章节可见”这类低波动但直接面向用户的页面可达性
- 上述静态用户路由也已继续补上 focused 页面测试：新增 `HelpCenterView.test.ts` 与 `TermsView.test.ts`，锁住帮助中心默认 FAQ、分类筛选、问答展开，以及服务条款标题/日期/关键章节文案；当前共 `3 passed`
- 与这些静态路由直接关联的跨页入口 `Footer` 也已补上组件级基线：新增 `Footer.test.ts`，锁住品牌文案以及“全部商品 / 热销排行 / 促销活动 / 个人中心 / 我的订单 / 购物车 / 帮助中心 / 联系客服 / 服务条款”九个核心链接目标，避免底部导航无声漂移
- `Footer` 的关键用户入口也已补上真实浏览器基线：新增 `footer-navigation.spec.ts`，并在固定端口真实 MySQL 栈上实跑 `1 passed`，锁住首页底部 “帮助中心 / 联系客服 / 服务条款” 三条跳转及其真实页面标题文案；这条用例还顺手暴露并修正了一次测试假设与页面真实文案不一致的问题
- 静态路由与后台可达性的小型真实浏览器组合基线也已跑通：`help-and-terms.spec.ts`、`footer-navigation.spec.ts`、`admin-smoke.spec.ts` 共 `3 passed`，说明这批新增/扩容的路由覆盖在同一固定端口真实 MySQL 栈下可以一起稳定执行
- 公开入口的真实浏览器基线也已补上：新增 `public-routes-smoke.spec.ts`，当前会验证 `login / register / contact / help / terms` 五个公开页面的真实可达性；落地这条用例时还顺手给 `RegisterView` 的表单补了稳定锚点 `data-testid="register-form"`，避免注册页只能靠脆弱文案定位
- 公开入口这组真实浏览器基线也已组合复跑通过：`public-routes-smoke.spec.ts`、`footer-navigation.spec.ts`、`help-and-terms.spec.ts` 共 `3 passed`，说明公开页面本身、页脚跨页导航和静态说明页当前可以在同一固定端口真实 MySQL 栈下稳定执行
- 前端路由守卫也已补上 focused 契约测试：新增 `router-guards.test.ts`，锁住“未登录访问受保护页面跳登录并携带 redirect”“token 存在但 `fetchCurrentUser` 失败时回登录”“非管理员访问后台回首页”“管理员可进入后台”四类高价值分支，避免后续改 store 或守卫时无声改坏登录流转
- `userStore.initUser()` 的启动恢复契约也已补上 focused coverage：当前已锁住“先恢复本地缓存再回拉服务端当前用户”“服务端回拉失败时清空失效 token 与本地用户缓存”“损坏的本地 `USER_INFO` JSON 会先清理再继续恢复”三类高价值分支，避免应用启动时留下半登录或脏缓存状态
- 同一块语义现在也已补上真实浏览器回归：新增 `route-guard-smoke.spec.ts`，并在固定端口真实 MySQL 栈上实跑 `1 passed`，锁住“匿名访问订单页跳登录并保留 redirect”“普通用户访问后台被打回首页”“管理员可进入后台”三类真实流转；这条用例还顺手暴露并校正了 `redirect` 查询参数在真实 URL 中未做 `%2F` 编码的测试假设
- 公开入口、页脚导航与路由守卫这三类基础流转也已组合复跑通过：`public-routes-smoke.spec.ts`、`footer-navigation.spec.ts`、`route-guard-smoke.spec.ts` 共 `3 passed`，说明未登录入口、跨页公共导航和受保护路由跳转当前在同一固定端口真实 MySQL 栈下没有互相打架
- `Navbar.test.ts` 本轮也继续补了共享导航的状态刷新契约：已登录挂载时会主动回拉购物车与未读通知，游客挂载则不会误打认证请求，避免全站顶部公共状态悄悄漂移
- `MusicPlayer` 本轮也补了共享缓存容错：损坏或结构错误的 `musicPlayerPosition` 不再在挂载时直接 `JSON.parse` 崩掉整页，而是记录日志、清理坏缓存并回退到默认位置；对应 `MusicPlayer.test.ts` 已补 focused 覆盖
- `CheckoutView` 本轮也补了主链路缓存容错：损坏的 `checkout_order_items` 不再被静默吞掉，而是记录日志、清理坏的 `sessionStorage` 并回退到空列表，避免结算页卡在脏缓存上
- `OrdersManageView` 也已补上订单收货地址脏数据容错：后台订单详情里的字符串地址若不是合法 JSON，不再静默吞掉解析异常，而是记录 `debugError` 后回退展示原始文本，避免管理页只剩空白收货信息；对应 `OrdersManageView.test.ts` 已新增 focused 覆盖并与 `ProductDetailView.test.ts` 组合复跑共 31 个测试通过
- `PaymentView`、`OrderDetailView`、`ProductDetailView` 本轮已继续补齐“详情页组件复用”契约：当同一路由组件仅切换 `route.params.id`、从一个支付页/订单详情/商品详情直接切到另一个详情时，页面现在会显式清空旧局部状态并重新拉取当前 `id` 对应的服务端真实数据，不再依赖组件重新挂载才能刷新
- 其中 `ProductDetailView` 还顺手补齐了复用场景下的页面级状态清理：数量、标签页、价格图、降价提醒弹窗、想要清单弹窗、广告视频倒计时、重复购买提示、想要清单状态等旧商品残留值都会在切换商品时先回到默认态，再等待新商品真实数据落位；同时未登录时的降价提醒/重复购买/想要清单状态也会主动清空，不再残留上一商品的用户态
- 上述三页 focused 回归已单独实跑通过：`PaymentView.test.ts`、`OrderDetailView.test.ts`、`ProductDetailView.test.ts` 共 `45 passed`
- `PriceAlertsView`、`NotificationsView` 本轮也已继续把“成功后刷新”语义显式化：修改目标价格、取消监控/删除记录、标记已读、全部已读、删除通知、清空通知成功后，后续列表刷新即使失败，也不会再额外弹错误提示把已成功的主动作污染成失败；刷新异常现在只通过既有 `获取降价提醒失败` / `获取通知失败` 和新增 `...后刷新...失败` 调试日志暴露
- `ProfileView` 这轮顺手复查后暂未发现同类残留点：头像上传成功后刷新用户失败仍保留成功提示、资料保存本身也没有再挂二次刷新副作用；当前 focused 覆盖维持通过
- `notificationStore` 本轮也已补齐共享状态层的“本地显式状态优先”契约：`clearCount()` / `setCount()` / `decreaseCount()` 现在都会作废更早发出的未读数请求，避免用户退出登录、通知页清零或本地已同步新计数后，旧的 `/unread-count` 响应又把未读徽标覆盖回脏值；对应 `notificationStore.test.ts` 已新增 in-flight 请求失效用例并通过
- `cartStore` 本轮也已补齐同类共享状态竞态：当 `fetchCart()` 仍在进行中，而用户随后完成加购、更新数量、勾选/全选、删除、批量删除或清空购物车时，这些更晚发生的本地购物车事实现在都会作废更早的列表请求，避免旧的购物车查询结果在动作成功后又把本地最新购物车状态覆盖回去；对应 `cartStore.test.ts` 已新增“进行中的列表请求不能覆盖后续加购结果 / 清空结果”用例并通过
- `userStore` 本轮也已补齐登录态共享状态竞态：`logout()` 和 `updateUserInfo()` 现在都会作废更早发出的 `fetchCurrentUser()` 请求，避免用户已经退出登录或已经完成资料更新后，旧的“获取当前用户”响应又把 `userInfo` / 本地缓存覆盖回旧会话或旧资料；对应 `userStore.test.ts` 已新增“进行中的当前用户请求不能在退出登录后恢复会话 / 不能覆盖后续资料更新”用例并通过
- `adminStore` 及后台审核高频页本轮也已补齐同类“本地新计数优先”契约：文件审核、商品审核、取消申请审核成功后，现在会先本地递减后台侧边栏待处理徽标，再静默刷新服务端真实计数；同时更早发出的 pending count 请求已会被本地 `set/decrease` 作废，避免管理员刚处理完一条审核，旧的 count 响应又把徽标弹回旧值。`FileReviewView` 删除待审核文件时也已补上徽标同步，不再只刷新列表不刷新待审核数
- `SearchDropdown` 本轮也已补齐登录态搜索历史的“本地新列表优先”契约：保存关键词、删除单条、清空历史成功后，现在都会先本地收敛当前历史列表并作废更早发出的历史请求，再静默回拉服务端历史，避免用户刚删掉/清空/新增历史后，旧的 `getSearchHistory()` 响应又把过期历史临时写回下拉面板
- `ProductDetailView` 本轮也已补齐详情页状态型共享竞态：创建降价提醒、取消降价提醒、加入想要清单成功后，现在都会先本地写入最终状态并作废更早发出的 `getUserProductAlert()` / `checkInWishlist()` 请求，再静默回拉服务端真实状态，避免旧状态请求把刚创建/取消的提醒或刚加入的想要清单状态覆盖回去
- `AddressView` 本轮已补齐地址列表的“本地新列表优先”契约：新增、修改、设为默认、删除成功后，现在都会先本地更新地址列表并作废更早发出的地址请求，再静默回拉服务端真实地址，避免旧地址列表响应把刚更新/删除/新增的地址反写回来
- `NotificationsView` 本轮也已补齐通知列表与未读数的同类竞态：单条已读、全部已读、删除通知、清空通知成功后，现在都会先本地更新通知列表与未读计数并作废更早发出的通知请求，再静默回拉服务端真实列表，避免旧通知列表响应把已读状态、删除结果或清空结果覆盖回去
- `PriceAlertsView` 本轮已补齐降价提醒列表的本地优先收口：更新目标价格、取消监控、删除触发记录成功后，现在都会先本地更新提醒列表并作废更早发出的提醒请求，再静默回拉服务端真实列表，避免旧提醒列表响应把刚更新/取消/删除的结果覆盖回去
- `PromotionsView` 本轮也已补齐领取优惠券后的本地优先收口：领取成功后会先本地更新可领优惠券列表中的 `claimed/remaining`，同时补上“我的优惠券”本地项并作废更早发出的可领券/我的券请求，再静默回拉服务端真实列表，避免旧列表响应把领取成功状态覆盖回去
- `PromotionDetailView` 与 `CouponDetailView` 本轮已补齐详情页领取成功后的本地优先收口：领取成功后现在都会先本地更新 `claimed/remaining`（详情页还会同步 `userClaimedCount`），并作废更早发出的详情/列表请求，再静默回拉服务端真实状态，避免旧详情或旧列表请求把刚领取成功的状态覆盖回去
- `frontend/tests/e2e/user-smoke.spec.ts` 本轮已扩到更多认证用户路由的浅层就绪覆盖：新增了 `promotions`、`price-alerts`、`cart`、`orders`、`address` 的 route-health 检查，并按真实页面结构修正了就绪锚点；其中购物车页已兼容“有商品”与“空购物车”两种稳定就绪态
- `OrdersView`、`OrderDetailView`、`SellerOrdersView` 本轮已补齐订单态动作后的本地优先收口：取消订单、申请取消、确认收货、提交评价、卖家发货成功后，现在都会先本地更新订单状态或订单项状态、作废更早发出的订单请求，再静默回拉服务端真实数据，避免旧订单请求把刚完成的状态覆盖回去
- `admin/UsersView`、`admin/CouponsManageView`、`MyProductsView` 本轮已补齐后台/卖家列表页的本地优先收口：用户启用/禁用、优惠券状态切换、优惠券删除、我的商品删除成功后，现在都会先本地更新列表并作废更早发出的列表请求，再静默回拉服务端真实数据，避免旧列表请求把刚删除或刚切换的状态覆盖回去
- `admin/ProductsView`、`admin/PriceManageView`、`admin/FileReviewView` 本轮已补齐后台重列表页的本地优先收口：商品上下架/审核/删除、降价提醒触发/回退/删除、价格历史删除、文件审核通过/拒绝/删除成功后，现在都会先本地更新列表与计数并作废更早发出的列表请求，再静默回拉服务端真实数据，避免旧请求把刚完成的后台动作覆盖回去
- `admin/ContactMessagesView`、`admin/MusicManageView` 本轮已补齐后台低频列表页的本地优先收口：留言标记已处理/删除、音乐状态切换/删除成功后，现在都会先本地更新列表并作废更早发出的列表请求，再静默回拉服务端真实数据，避免旧请求把刚处理或刚删除的记录恢复出来
- `admin/CategoriesView`、`admin/OrdersManageView` 本轮已补齐后台分类/订单列表页的本地优先收口：分类新增/编辑/删除、后台订单取消/同意取消/删除成功后，现在都会先本地更新列表并作废更早发出的列表请求，再静默回拉服务端真实数据，避免旧请求把刚完成的后台动作覆盖回去
- `admin/RationalManageView`、`RationalConsumptionView` 本轮已补齐理性消费后台/前台动作页的本地优先收口：撤销成就、预算保存、想要清单移除、想要清单标记已购买成功后，现在都会先本地更新对应列表/预算面板并作废更早发出的请求，再静默回拉服务端真实数据，避免旧请求把刚完成的理性消费动作覆盖回去
- 当前共享/高频 focused 组合基线已继续扩到 `PaymentView.test.ts` 并再次实跑通过：`App.test.ts`、`Navbar.test.ts`、`aiChat.test.ts`、`axios.test.ts`、`userStore.test.ts`、`SettingsView.test.ts`、`CheckoutView.test.ts`、`CartView.test.ts`、`AiRecommendView.test.ts`、`SearchDropdown.test.ts`、`MusicPlayer.test.ts`、`NotificationsView.test.ts`、`PriceAlertsView.test.ts`、`AddressView.test.ts`、`CouponDetailView.test.ts`、`OrdersView.test.ts`、`OrderDetailView.test.ts`、`SellerOrdersView.test.ts`、`MyProductsView.test.ts`、`CategoryView.test.ts`、后台订单/商品/留言/文件/价格/理性消费/用户/优惠券/分类/音乐管理，以及 `ProductDetailView.test.ts`、`HomeView.test.ts`、`PromotionsView.test.ts`、`PromotionDetailView.test.ts`、`PaymentView.test.ts` 共 `36` 个文件、`427` 个测试通过
- 当前共享/高频 focused 组合基线已继续扩到 `ProfileView.test.ts` 并再次实跑通过：在上述基线之上加入 `ProfileView.test.ts` 后，共 `37` 个文件、`440` 个测试通过
- 当前共享/高频 focused 组合基线已继续扩到 `notificationStore.test.ts` 并再次实跑通过：在上述基线之上加入 `notificationStore.test.ts` 后，共 `38` 个文件、`446` 个测试通过
- 当前共享/高频 focused 组合基线已继续扩到 `cartStore.test.ts` 并再次实跑通过：在上述基线之上加入 `cartStore.test.ts` 后，共 `39` 个文件、`480` 个测试通过
- 当前共享/高频 focused 组合基线已继续扩到 `adminStore.test.ts` 并再次实跑通过；同时 `userStore.test.ts` 当前已扩到 `23` 个用例：在上述基线之上加入 `adminStore.test.ts` 后，共 `40` 个文件、`491` 个测试通过
- 在补齐管理员徽标本地递减与 store 级请求失效后，当前共享/高频 focused 组合基线再次实跑通过：仍为 `40` 个文件，但总测试数已扩到 `494` 个并全部通过
- 在补齐 `SearchDropdown` 登录态历史本地优先收口后，当前共享/高频 focused 组合基线再次实跑通过：仍为 `40` 个文件，但总测试数已扩到 `497` 个并全部通过
- 在补齐 `ProductDetailView` 的降价提醒 / 想要清单本地优先收口后，当前共享/高频 focused 组合基线再次实跑通过：仍为 `40` 个文件，但总测试数已扩到 `500` 个并全部通过
- 在继续补齐 `AddressView` 与 `NotificationsView` 的本地优先收口后，当前共享/高频 focused 组合基线再次实跑通过：仍为 `40` 个文件，但总测试数已扩到 `506` 个并全部通过
- 在继续补齐 `PriceAlertsView` 与 `PromotionsView` 的列表型本地优先收口后，当前共享/高频 focused 组合基线再次实跑通过：仍为 `40` 个文件，但总测试数已扩到 `511` 个并全部通过
- 在继续补齐 `PromotionDetailView`、`CouponDetailView` 并扩充用户端 smoke 后，当前共享/高频 focused 组合基线再次实跑通过：仍为 `40` 个文件，但总测试数已扩到 `513` 个并全部通过
- 在继续补齐三类订单页本地优先收口后，当前共享/高频 focused 组合基线再次实跑通过：仍为 `40` 个文件，但总测试数已扩到 `518` 个并全部通过
- 在继续补齐 `UsersView`、`CouponsManageView`、`MyProductsView` 的后台/卖家列表收口后，当前共享/高频 focused 组合基线再次实跑通过：仍为 `40` 个文件，但总测试数已扩到 `522` 个并全部通过
- 在继续补齐 `ProductsView`、`PriceManageView`、`FileReviewView` 的后台重列表收口后，当前共享/高频 focused 组合基线再次实跑通过：仍为 `40` 个文件，但总测试数已扩到 `528` 个并全部通过
- 在继续补齐 `ContactMessagesView`、`MusicManageView` 的后台低频列表收口后，当前共享/高频 focused 组合基线再次实跑通过：仍为 `40` 个文件，但总测试数已扩到 `532` 个并全部通过
- 在继续补齐 `CategoriesView`、`OrdersManageView` 的后台分类/订单收口后，当前共享/高频 focused 组合基线再次实跑通过：仍为 `40` 个文件，但总测试数已扩到 `537` 个并全部通过
- 在继续补齐 `RationalManageView`、`RationalConsumptionView` 的理性消费动作收口后，当前共享/高频 focused 组合基线再次实跑通过：仍为 `40` 个文件，但总测试数已扩到 `541` 个并全部通过
- `ProductDetailView` 这轮继续补齐了最后一段明显的评价状态弱契约：删除评价成功后，现在会先本地移除该评价、按剩余评价重新计算 `total / avgRating / goodRate / ratingCounts`，再作废更早发出的评价请求并静默回拉服务端真实列表，避免旧的 `getAllProductReviews()` / `getProductReviewStats()` 结果把刚删除成功的评价和统计覆盖回旧值；`ProductDetailView.test.ts` 已扩到 `30` 条并通过
- `admin/MusicManageView` 这轮也补齐了剩余的音乐表单成功链路：编辑音乐、添加音乐成功后，现在会优先按 `updateMusic/addMusic` 返回的 `Music` 数据本地 upsert 列表、作废更早发出的音乐列表请求，再静默回拉服务端真实列表，避免旧的 `getAllMusic()` 结果把刚编辑或新增成功的音乐覆盖回旧内容；`MusicManageView.test.ts` 已扩到 `14` 条并通过
- `admin/CouponsManageView` 这轮也补齐了优惠券表单成功链路：新增优惠券、编辑优惠券成功后，现在会优先按 `createCoupon/updateCoupon` 返回的优惠券数据本地 upsert 列表、作废更早发出的优惠券列表请求，再静默回拉服务端真实列表，避免旧的 `getAllCoupons()` 结果把刚新增或编辑成功的优惠券覆盖回旧值；`CouponsManageView.test.ts` 已扩到 `15` 条并通过
- `admin/ProductsView` 这轮也补齐了后台商品表单成功链路：新增商品、编辑商品成功后，现在会优先按 `createProduct/updateProduct` 返回的商品数据本地 upsert 列表、必要时同步 `total`，并作废更早发出的商品列表请求，再静默回拉服务端真实列表，避免旧的 `getProducts()` 结果把刚保存成功的商品覆盖回旧内容；`ProductsView.test.ts` 已扩到 `25` 条并通过
- `admin/RationalManageView` 这轮把“授予成就”也补齐到和“撤销成就”一致的本地优先契约：授予成功后，现在会先本地追加最近成就记录、同步递增 `totalAchievementsGranted / achievementDistribution`，再作废更早发出的统计与成就记录请求并静默回拉服务端真实状态，避免旧的 `getAdminStats()` / `getRecentAchievements()` 结果把刚授予成功的成就覆盖掉；`RationalManageView.test.ts` 已扩到 `10` 条并通过
- `admin/PriceManageView` 这轮把“手动记录价格”成功链路也补齐了本地优先收口：记录价格成功后，现在会先本地插入新的价格历史记录、重算 `currentPrice / lowestPrice / highestPrice / avgPrice / recordCount`，同步更新当前商品价格，并作废更早发出的价格历史请求，再静默回拉服务端真实状态，避免旧的 `getPriceHistory()` / `getPriceStats()` 结果把刚记录成功的新价格覆盖掉；`PriceManageView.test.ts` 已扩到 `20` 条并通过
- `MyProductsView` 这轮也补齐了卖家商品提交成功链路：卖家提交商品、编辑商品成功后，现在会先本地 upsert “我的商品”列表、默认把审核状态收敛到待审核，并作废更早发出的 `/products/my` 请求，再静默回拉服务端真实列表，避免旧的商品列表请求把刚提交或刚编辑成功的商品覆盖回旧内容；`MyProductsView.test.ts` 已扩到 `13` 条并通过
- `AddressView` 这轮补了一个真实的本地一致性 bug：编辑地址成功且把当前地址设为默认地址时，现在会先本地把其他地址的 `isDefault` 一并清掉，再更新当前地址并静默回拉服务端真实列表，避免刷新前短暂出现两个默认地址；`AddressView.test.ts` 已扩到 `16` 条并通过
- `CheckoutView` 这轮继续补了结算态一致性：除了地址列表刷新为空时会把 `selectedAddress` 清成 `null` 以外，现在可用优惠券列表刷新后也会校验当前 `selectedCoupon` 是否仍然存在；如果券已失效就立即清空选中和折扣，如果同一张券的折扣额度发生变化则同步更新 `couponDiscount`，避免页面保留失效券 id 或旧折扣参与下单金额计算；`CheckoutView.test.ts` 已扩到 `17` 条并通过
- `admin/FileReviewView` 与 `admin/ProductsView` 这轮补了审核弹窗状态收口：文件拒绝弹窗取消/成功后，现在会清掉 `currentFile / rejectRemark`；商品审核通过/拒绝弹窗成功后，现在会同步清掉 `approveProduct`、`rejectProductId / rejectRemark`，避免弹窗已经关闭后后台内存状态仍挂着旧审核对象或旧备注；`FileReviewView.test.ts` 扩到 `13` 条、`ProductsView.test.ts` 扩到 `26` 条并通过
- `admin/UsersView`、`admin/NotificationsManageView`、`admin/PriceManageView`、`OrdersView`、`PriceAlertsView` 这轮继续补了一组主从状态收口：用户详情弹窗在列表刷新后找不到当前用户时会自动关闭；通知发送表单在用户/优惠券列表刷新后会收敛失效的 `selectedUsers / relatedId`；价格管理页在商品列表刷新后若已选商品失效，会同步清空 `selectedProductId / priceHistory / priceStats` 并关闭记录弹窗；订单评价弹窗现在会在提交成功或订单列表刷新导致当前评价对象失效时清掉 `currentReviewOrder / currentReviewItem` 与表单内容；降价提醒编辑弹窗则会在保存成功或提醒列表刷新后对象失效时清掉 `editingAlert / newTargetPrice`，并在提醒仍存在时跟随最新列表对象更新；对应测试分别扩到 `UsersView.test.ts 11`、`NotificationsManageView.test.ts 6`、`PriceManageView.test.ts 21`、`OrdersView.test.ts 18`、`PriceAlertsView.test.ts 16` 并通过
- 当前前端 Vitest 全量回归也已再次实跑通过：共 `52` 个文件、`607` 个测试全部通过，说明这轮商品详情、后台音乐、后台优惠券、后台商品管理、后台理性消费成就、后台价格管理、卖家商品页、地址页、结算页、后台审核弹窗、用户详情、通知发送、订单评价与降价提醒编辑收口没有破坏现有共享状态、订单页、后台页和存储降级基线
- 本轮真实浏览器用户入口也已再次通过固定端口脚本复跑：`scripts/run-real-browser-e2e.ps1 -Specs tests/e2e/user-smoke.spec.ts` 在 `127.0.0.1:5173 -> 8081` 下实跑 `1 passed`，且脚本退出后 `tmp-browser-stack.json` 已清理、`5173/8081` 无残留监听，说明当前冒烟脚本的端口回收契约正常
- 本轮真实浏览器后台入口也已再次通过固定端口脚本复跑：`scripts/run-real-browser-e2e.ps1 -Specs tests/e2e/admin-smoke.spec.ts` 在 `127.0.0.1:5173 -> 8081` 下实跑 `1 passed`，且脚本退出后同样无残留端口监听，说明后台主入口在这轮音乐管理、优惠券和商品管理收口后仍保持稳定
- 与这轮详情页收口直接相关的真实浏览器链路也已在固定端口真实栈 `127.0.0.1:5173 -> 8081` 上再次实跑通过：`product-detail-cart.spec.ts`、`orders-management.spec.ts`、`order-detail-management.spec.ts`、`payment-management.spec.ts` 共 `4 passed`
- 本轮浏览器链路回归也已补跑通过：`smoke.spec.ts`、`user-smoke.spec.ts`、`admin-smoke.spec.ts` 共 `3 passed`；另补跑了 `address-management.spec.ts`、`cart-management.spec.ts`、`orders-management.spec.ts`、`price-alerts-operations.spec.ts`、`coupon-flow.spec.ts` 共 `6 passed`
- 本轮订单链路回归也已补跑通过：`orders-management.spec.ts`、`order-detail-management.spec.ts`、`seller-orders-management.spec.ts` 共 `3 passed`
- 本轮后台/卖家列表链路回归也已补跑通过：`admin-users-management.spec.ts`、`admin-coupons-management.spec.ts`、`my-products-management.spec.ts` 共 `3 passed`
- 本轮卖家商品链路也已再次在固定端口真实栈 `127.0.0.1:5173 -> 8081` 上复跑通过：`my-products-management.spec.ts` 实跑 `1 passed`，且脚本退出后 `tmp-browser-stack.json` 已清理、`5173/8081` 无残留监听，说明卖家商品提交/删除主路径在这轮本地收口后仍保持稳定
- 本轮后台重列表链路回归也已补跑通过：`admin-product-review-management.spec.ts`、`admin-price-alert-management.spec.ts`、`admin-file-review-management.spec.ts` 共 `3 passed`
- 本轮后台低频页链路回归也已补跑通过：`contact-message-management.spec.ts`、`admin-smoke.spec.ts` 共 `2 passed`
- 本轮后台分类/订单链路回归也已补跑通过：`admin-categories-management.spec.ts`、`admin-orders-management.spec.ts` 共 `2 passed`
- 本轮理性消费链路回归也已补跑通过：`admin-rational-management.spec.ts`、`rational-consumption-flow.spec.ts` 共 `3 passed`
- 最近这一轮扩出来的真实浏览器入口基线也已组合复跑通过：`public-routes-smoke.spec.ts`、`footer-navigation.spec.ts`、`help-and-terms.spec.ts`、`user-smoke.spec.ts`、`admin-smoke.spec.ts` 共 `5 passed`，说明公开入口、静态说明页、页脚导航、用户主入口和后台主入口当前可以在同一固定端口真实 MySQL 栈下稳定共存
- 账户资料与设置这组高风险真实持久化链路也已再次在固定端口真实 MySQL 栈上复跑通过：`account-settings.spec.ts`、`profile-persistence.spec.ts`、`settings-persistence.spec.ts` 共 `3 passed`，说明资料编辑、隐私设置、通知设置与刷新保持一致的主路径当前未被后续收口改坏
- 热销榜匿名浏览链路也已补上真实页面闭环：新增 `hot-products-browse.spec.ts`，实跑验证“进入热销榜 -> 榜单真实数据可见 -> 榜单卡片进入商品详情”，避免热销榜继续只有 focused tests、没有真实浏览器闭环
- 卖家发货页也已从订单 Phase 2 大链路里拆出独立真实页面闭环：新增 `seller-orders-management.spec.ts`，实跑验证“卖家页看到待发货订单 -> 发货成功 -> 切到已发货筛选仍能看到该订单”，避免卖家发货页只依赖复合订单脚本而缺少页面级回归
- 购物车页也已从下单链路里拆出独立真实页面闭环：新增 `cart-management.spec.ts`，实跑验证“真实商品加入购物车 -> 购物车页可见服务端返回的购物车项 -> 数量加一 -> 删除商品 -> 回到空购物车态”，并在前后都自动清理购物车，避免真实账号被测试残留数据持续污染
- 订单列表页也已补成独立真实页面闭环：新增 `orders-management.spec.ts`，实跑验证“搜索待支付订单 -> 进入支付页 -> 返回订单页取消订单 -> 列表状态刷新为已取消”，避免订单页继续只被支付主链路和订单 Phase 2 复合脚本间接覆盖
- 订单详情页也已补成独立真实页面闭环：新增 `order-detail-management.spec.ts`，实跑验证“卖家发货后买家直接进入订单详情 -> 显示待收货 -> 确认收货 -> 详情状态刷新为已完成”，避免订单详情继续只被列表页和订单 Phase 2 复合脚本间接覆盖
- 商品详情页的“加入购物车”入口也已补成独立真实 UI 闭环：新增 `product-detail-cart.spec.ts`，实跑验证“从商品详情页直接加购 -> 中文成功提示 -> 进入购物车页看到服务端真实购物车项”，避免购物车链路继续只靠 API 预置数据证明
- 商品详情页的“加入想要清单”入口也已补成独立真实 UI 闭环：新增 `product-detail-wishlist.spec.ts`，实跑验证“从商品详情页直接加入想要清单 -> 中文成功提示 -> 理性消费页看到服务端真实想要清单项”，避免理性消费链路继续只靠 API 预置数据证明
- 支付页也已补成独立真实页面闭环：新增 `payment-management.spec.ts`，实跑验证“直接进入支付页 -> 切换支付方式 -> 模拟支付成功 -> 返回订单列表看到待发货”，避免支付页继续只被下单主链路和订单复合脚本间接覆盖
- 商品详情页的“降价提醒”入口也已补成独立真实 UI 闭环：新增 `product-detail-price-alert.spec.ts`，实跑验证“从商品详情页直接设置提醒 -> 中文成功提示 -> 降价提醒页看到服务端真实提醒记录”，避免提醒链路继续只靠 API 预置数据或通知链路间接证明
- 共享 E2E 会话 helper 也已继续收口为“缓存前先验活”：复用买家/卖家/管理员 token 前会先用受保护接口探测有效性，失效则自动重新登录，避免长时间真实回归里后段用例拿到过期 token 后被路由守卫送回登录页
- 共享浏览器 watcher 也已继续去噪：`/uploads/*` 的高压回归 429、Navbar 的购物车/未读数公共探测 401/403，以及它们对应的重复 console 噪音不再误杀真实功能用例；阻断性请求仍继续按失败处理
- 共享浏览器 watcher 本轮又补齐一条首页启动期噪音白名单：热销商品接口 `/api/products?pageNo=0&pageSize=8&page=0&size=8&sort=sales` 的偶发 `429` 现在与首页分类/优惠券/最新商品同样按“已知启动期抖动”处理，避免在用户主链路已真实走通时被非阻断性首页预加载请求误杀整组回归
- 后台固定端口真实浏览器分组也已继续扩到 `16 passed`：在原有后台订单、商品、用户、分类、优惠券、文件、留言、通知、理性消费、价格提醒等链路之上重新全量实跑通过；本轮还顺手修正了 `admin-price-alert-management.spec.ts` 的旧脆弱断言，避免用纯数字 `alertId` 命中错误行导致误报
- 用户侧固定端口真实浏览器分组也已继续扩到 `26 passed`：在原有首页、商品、优惠券、资料、设置、地址、通知、降价提醒、理性消费、卖家商品、分类、搜索、热销榜、卖家发货、支付页、商品详情加购、商品详情想要清单、商品详情降价提醒、购物车页、订单列表页和订单详情页独立闭环基础上，又新增 `profile-quick-actions.spec.ts`，锁住个人中心到待支付/待发货/待收货、购物车、降价提醒五条真实快捷入口，固定端口栈保持 `127.0.0.1:5173 -> 8081`
- 本轮前端状态收口继续横向扩到后台编辑弹窗：`admin/CategoriesView`、`admin/CouponsManageView`、`admin/MusicManageView` 在取消或保存成功后现在都会清掉 `isEdit / editId` 并重置表单；当列表刷新后正在编辑的对象已不存在时，弹窗会自动关闭；若对象仍存在，则会把表单同步到最新列表对象，避免继续拿旧快照编辑
- 同一轮也补齐了另一批主从状态收口：`admin/UsersView` 用户详情在列表刷新后对象失效会自动关闭；`admin/NotificationsManageView` 会收敛失效的 `selectedUsers / relatedId`；`admin/PriceManageView` 已选商品失效时会清空 `selectedProductId / priceHistory / priceStats` 并关闭记录弹窗；`OrdersView` 评价弹窗会在提交成功或对象失效时清掉 `currentReviewOrder / currentReviewItem` 与表单；`PriceAlertsView` 编辑提醒弹窗会在保存成功或对象失效时清掉 `editingAlert / newTargetPrice`，并在对象仍存在时跟随最新列表同步
- 对应 Vitest 覆盖已同步扩到：`CategoriesView.test.ts 12`、`CouponsManageView.test.ts 16`、`MusicManageView.test.ts 15`、`UsersView.test.ts 11`、`NotificationsManageView.test.ts 6`、`PriceManageView.test.ts 21`、`OrdersView.test.ts 18`、`PriceAlertsView.test.ts 16`
- 用户高频页本轮也继续补了两处收口：`NotificationsView` 的通知详情弹窗现在会在当前通知被删除、清空或刷新后失效时自动关闭并清掉 `currentNotification`，同时各个详情跳转会先拿稳定快照再关弹窗，避免先清空引用后把路由错误降级到默认页；`SettingsView` 的手机/邮箱绑定弹窗在取消或保存成功后会清掉 `phoneForm.phone / emailForm.email`，避免再次打开时残留上一次输入
- `AddressView`、`MyProductsView`、`ProfileView` 这一批也继续做了用户侧收口：地址弹窗与“我的商品”弹窗在取消或保存成功后现在都会清掉 `isEdit / editId` 并重置表单；当列表刷新后正在编辑的对象已不存在时，弹窗会自动关闭，仍存在时则把表单同步到最新列表对象；个人资料保存成功后则会立即把 store 与 `profileForm` 同步到本地最新值，避免成功提示后表单还停在旧快照
- `SellerOrdersView` 本轮又补了一个真实筛选一致性 bug：在“待发货”筛选下，卖家发货成功后现在会先按当前筛选条件本地收口订单项，再静默回拉服务端真实列表；即使后续刷新失败，也不会把刚发完的订单继续留在待发货列表里造成 UI 与筛选条件冲突；`SellerOrdersView.test.ts` 已扩到 `12` 条并通过
- 用户侧最后一批高风险页也已收口完成：`PaymentView` 在支付成功后若详情回拉失败，不再额外弹错误并把支付态拉回未支付；`PromotionDetailView` 路由切换到新专题时会先清空旧优惠券/商品列表，避免新专题加载失败时继续显示上一专题残留；`CheckoutView` 的可用优惠券刷新若业务失败/异常，现在会主动清空旧优惠券列表与已选优惠券，避免继续拿过期券结算；`RationalConsumptionView` 的“去购买”动作成功后会先本地移出已购买的想要清单项并更新统计，避免在刷新前继续把已购买商品显示成“可购买”
- 低风险展示页 `HomeView`、`PromotionsView`、`CategoryView`、`HotProductsView`、`AiRecommendView`、`ContactView`、`HelpCenterView`、`TermsView` 也已顺手复查，本轮未再发现同类“主动作成功后旧对象/旧列表残留”的状态收口点，因此未做额外代码改动
- 对应 Vitest 覆盖已同步扩到：`CategoriesView.test.ts 12`、`CouponsManageView.test.ts 16`、`MusicManageView.test.ts 15`、`UsersView.test.ts 11`、`NotificationsManageView.test.ts 6`、`NotificationsView.test.ts 31`、`SettingsView.test.ts 24`、`AddressView.test.ts 17`、`CheckoutView.test.ts 18`、`MyProductsView.test.ts 14`、`ProfileView.test.ts 13`、`PromotionDetailView.test.ts 13`、`PaymentView.test.ts 9`、`RationalConsumptionView.test.ts 18`、`SellerOrdersView.test.ts 12`、`PriceManageView.test.ts 21`、`OrdersView.test.ts 18`、`PriceAlertsView.test.ts 16`
- 当前前端 Vitest 全量也已再次实跑通过：共 `52` 个文件、`620` 个测试全部通过，说明这轮后台分类/优惠券/音乐编辑弹窗、用户详情、通知发送、通知详情、设置页绑定弹窗、地址弹窗、结算页优惠券刷新、我的商品弹窗、个人资料本地同步、优惠专题路由清场、支付成功后详情回拉降级、理性消费想要清单购买收口、卖家发货筛选收口、价格管理、订单评价与降价提醒编辑收口没有破坏现有共享状态、订单页、后台页和存储降级基线
- 与本轮用户侧状态收口直接相关的真实浏览器链路也已再次在固定端口真实栈 `127.0.0.1:5173 -> 8081` 上复跑通过：`coupon-flow.spec.ts`、`payment-management.spec.ts`、`rational-consumption-flow.spec.ts`、`seller-orders-management.spec.ts` 共 `6 passed`，覆盖优惠专题/优惠券详情、支付方式切换与支付成功跳转、理性消费预算与想要清单移除、卖家发货筛选与真实状态刷新
- 紧邻上下游真实链路也已顺手复跑通过：`cart-management.spec.ts`、`orders-management.spec.ts`、`order-detail-management.spec.ts`、`product-detail-cart.spec.ts`、`product-detail-wishlist.spec.ts` 共 `5 passed`，说明这轮结算页优惠券刷新、支付页成功降级、想要清单购买本地收口没有把购物车、订单列表/详情、商品详情加购和商品详情想要清单链路打坏
- 后台与通知侧跨页面真实链路也已继续复跑通过：`admin-coupons-management.spec.ts`、`admin-notifications-management.spec.ts`、`notification-routing.spec.ts`、`price-alert-notification.spec.ts`、`admin-price-alert-management.spec.ts` 共 `6 passed`，说明这轮优惠券、通知详情跳转、商品详情降价提醒与后台价格管理之间的真实状态流转保持正常
- 固定端口真实浏览器栈的文件上传目录也已顺手收口：`scripts/run-real-browser-e2e.ps1` 现在会通过 `SPRING_APPLICATION_JSON` 把浏览器联调后端的 `file.upload-dir` 固定到可写的 `backend/uploads`，避免当前执行环境下项目根 `uploads` 目录不可写导致头像/文件上传链路误报
- 同一个固定端口真实浏览器栈脚本也已顺手把 E2E 专用后端限流门槛提到足够高的临时联调值（仍然只作用于 `run-real-browser-e2e.ps1` 启动的浏览器联调栈，不改应用默认配置），避免 46 条全量 Playwright 在真实后端下因为 `/auth/me`、用户列表、想要清单等接口撞到 `429` 而把页面功能回归误判成业务失败
- 基于上述收口，之前受环境阻塞的 `admin-file-review-management.spec.ts` 已单独复跑通过；后台主入口与高风险管理页分组也已按原组合再次实跑通过：`admin-smoke.spec.ts`、`admin-orders-management.spec.ts`、`admin-product-review-management.spec.ts`、`admin-categories-management.spec.ts`、`admin-users-management.spec.ts`、`admin-rational-management.spec.ts`、`contact-message-management.spec.ts`、`admin-file-review-management.spec.ts` 共 `8 passed`
- 若干容易在全量真实回归里放大重载/鉴权/瞬时提示噪音的 E2E 也已一起收口到更稳定的真实用户语义：`admin-smoke.spec.ts`、`admin-users-management.spec.ts`、`profile-quick-actions.spec.ts` 改为单次登录后优先走 SPA 内部导航；`product-detail-wishlist.spec.ts` 改为校验真实 POST 成功与列表落库而非瞬时 toast；`order-phase2.spec.ts` 和 `route-guard-smoke.spec.ts` 补上仅针对真实浏览器抖动的窄恢复逻辑
- 在上述脚本和用例稳定性收口后，固定端口真实栈 `127.0.0.1:5173 -> 8081` 下的全量 Playwright 已完整复跑通过：`46 passed (3.2m)`

## 下一批建议顺序

1. 继续清理高风险代码债：
   剩余裸异常、假成功，以及其它未纳入本轮的异常语义不一致点
2. 处理个人中心/Profile 与 Settings 剩余契约：
   继续梳理资料编辑、统计可信度和职责边界，避免重复入口或统计口径漂移
3. 保持订单 Phase 2 回归：
   把已通过的 focused tests 和真实联调/E2E 纳入后续变更回归基线
4. 决定伪能力去留：
   `PromotionDetailView`、AI 推荐策略与 fallback 话术需要在“补真实后端”与“显式降级展示”之间做收口
5. 继续扫订单/个人中心剩余弱契约：
   优先复查 `ProfileView` 和其它高频页里是否还存在“主流程已成功，但后续刷新/副作用失败把 UI 拖成失败”的残留点
