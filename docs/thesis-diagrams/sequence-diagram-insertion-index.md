# 论文时序图插入索引

本索引只对应论文第 4 章的 5 张时序图。活动图由用户自行处理，本文件不再描述活动图。

可直接插入 Word 的中文命名 PNG 已另存到：`docs/thesis-diagrams/word-ready-sequence/`

| 论文图号 | 论文标题 | 推荐插入 PNG | 可编辑 PlantUML 源 |
| --- | --- | --- | --- |
| 图4.7 | 创建订单时序图 | `docs/thesis-diagrams/png/06-sequence-order-create.png` | `docs/thesis-diagrams/plantuml/06-sequence-order-create.puml` |
| 图4.8 | 心愿单管理时序图 | `docs/thesis-diagrams/png/07-sequence-wishlist-management.png` | `docs/thesis-diagrams/plantuml/07-sequence-wishlist-management.puml` |
| 图4.9 | 商品审核时序图 | `docs/thesis-diagrams/png/08-sequence-product-audit.png` | `docs/thesis-diagrams/plantuml/08-sequence-product-audit.puml` |
| 图4.10 | 月度预算设置时序图 | `docs/thesis-diagrams/png/09-sequence-monthly-budget-setting.png` | `docs/thesis-diagrams/plantuml/09-sequence-monthly-budget-setting.puml` |
| 图4.11 | 订单取消时序图 | `docs/thesis-diagrams/png/10-sequence-order-cancel.png` | `docs/thesis-diagrams/plantuml/10-sequence-order-cancel.puml` |

## 插入注意

- `图4.7 创建订单时序图` 只表示创建待支付订单，不包含支付订单流程；库存扣减和销量增加属于支付成功后的逻辑。
- `图4.8 心愿单管理时序图` 按真实实现体现重复购买检测、冷静期记录、读取时刷新 READY 状态、移除或标记已购买。
- `图4.9 商品审核时序图` 按真实实现体现卖家提交、管理员查询待审核列表、审核通过或拒绝以及通知。
- `图4.10 月度预算设置时序图` 按真实实现体现当月预算不存在时的默认建档、预算金额前端校验和保存后刷新预算状态。
- `图4.11 订单取消时序图` 按真实实现体现未支付订单直接取消、已支付待发货订单先申请取消再由管理员审核。
