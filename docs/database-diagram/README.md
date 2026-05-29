# 电商系统数据库关系映射图

本图按论文示例图样式绘制：白底黑线、表名居中加粗并加下划线、字段采用 `字段名: 数据库类型` 格式，不显示 `PK`、`AI`、`NN` 等缩写。

本版采用 A3 横向分区布局，包含论文核心业务表以及价格历史、降价提醒、消费预算相关表：

- `tb_user`、`addresses`、`tb_consumption_budget`
- `tb_category`、`tb_product`、`tb_cart`、`tb_wishlist`
- `tb_price_history`、`tb_price_alert`
- `tb_order`、`tb_order_item`、`tb_review`
- `tb_coupon`、`tb_user_coupon`

图中绘制核心业务 1:N 关系，连线端点采用 ERD 常见样式：1 端为双竖线，N 端为圆圈加三叉脚，并通过分区和外围走线减少交叉，适合直接作为论文数据库关系映射图使用。
