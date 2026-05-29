# 论文图示导出

本目录包含 5 张活动图和 5 张时序图，对应当前仓库的真实实现。

- 时序图中“用户、卖家、管理员”等人的参与者使用中文名称，不加冒号和下划线。
- 时序图中系统类生命线只使用英文类名，采用 UML 对象生命线写法：前置冒号并加下划线，例如 `<u>:OrderController</u>`。
- 时序图消息已使用自动序号，便于放入论文后说明交互顺序。
- 时序图保留标准激活条，用于明确前端、控制器、服务和仓储层的处理区间。
- 图片为黑白论文风格，`plantuml/` 下保留可编辑 `.puml` 源，根目录 `svg/` 与 `png/` 为最新导出结果。

| 文件名 | 类型 | 可编辑源 | PNG 导出 |
| --- | --- | --- | --- |
| 01-activity-order-create | 活动图 | [svg/01-activity-order-create.svg](./svg/01-activity-order-create.svg) | [png/01-activity-order-create.png](./png/01-activity-order-create.png) |
| 02-activity-wishlist-management | 活动图 | [svg/02-activity-wishlist-management.svg](./svg/02-activity-wishlist-management.svg) | [png/02-activity-wishlist-management.png](./png/02-activity-wishlist-management.png) |
| 03-activity-product-audit | 活动图 | [svg/03-activity-product-audit.svg](./svg/03-activity-product-audit.svg) | [png/03-activity-product-audit.png](./png/03-activity-product-audit.png) |
| 04-activity-monthly-budget-setting | 活动图 | [svg/04-activity-monthly-budget-setting.svg](./svg/04-activity-monthly-budget-setting.svg) | [png/04-activity-monthly-budget-setting.png](./png/04-activity-monthly-budget-setting.png) |
| 05-activity-order-cancel | 活动图 | [svg/05-activity-order-cancel.svg](./svg/05-activity-order-cancel.svg) | [png/05-activity-order-cancel.png](./png/05-activity-order-cancel.png) |
| 06-sequence-order-create | 时序图 | [svg/06-sequence-order-create.svg](./svg/06-sequence-order-create.svg) | [png/06-sequence-order-create.png](./png/06-sequence-order-create.png) |
| 07-sequence-wishlist-management | 时序图 | [svg/07-sequence-wishlist-management.svg](./svg/07-sequence-wishlist-management.svg) | [png/07-sequence-wishlist-management.png](./png/07-sequence-wishlist-management.png) |
| 08-sequence-product-audit | 时序图 | [svg/08-sequence-product-audit.svg](./svg/08-sequence-product-audit.svg) | [png/08-sequence-product-audit.png](./png/08-sequence-product-audit.png) |
| 09-sequence-monthly-budget-setting | 时序图 | [svg/09-sequence-monthly-budget-setting.svg](./svg/09-sequence-monthly-budget-setting.svg) | [png/09-sequence-monthly-budget-setting.png](./png/09-sequence-monthly-budget-setting.png) |
| 10-sequence-order-cancel | 时序图 | [svg/10-sequence-order-cancel.svg](./svg/10-sequence-order-cancel.svg) | [png/10-sequence-order-cancel.png](./png/10-sequence-order-cancel.png) |
