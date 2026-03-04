# Requirements Document: 订单业务逻辑修复

## Introduction

本需求文档旨在修复订单系统中的业务逻辑问题,包括:
1. 防止商家购买自己的商品
2. 确保订单状态与发货状态的一致性
3. 确保订单状态与支付状态的一致性

## Glossary

- **Order_System**: 订单管理系统
- **Seller**: 商品卖家(seller_id)
- **Buyer**: 商品买家(user_id)
- **Order_Status**: 订单状态(0-6)
- **Ship_Status**: 发货状态(0-1)
- **Payment_Status**: 支付状态(0-2)
- **Order_Item**: 订单项,包含商品和卖家信息

## Requirements

### Requirement 1: 防止商家购买自己的商品

**User Story:** 作为系统管理员,我希望防止商家购买自己发布的商品,以确保交易的合理性和数据的准确性。

#### Acceptance Criteria

1. WHEN 用户尝试将商品加入购物车 THEN THE Order_System SHALL 验证买家ID不等于商品的卖家ID
2. WHEN 用户尝试直接购买商品 THEN THE Order_System SHALL 验证买家ID不等于商品的卖家ID
3. IF 买家ID等于卖家ID THEN THE Order_System SHALL 返回错误提示"不能购买自己的商品"
4. WHEN 创建订单 THEN THE Order_System SHALL 验证订单中所有商品的卖家ID都不等于买家ID

### Requirement 2: 订单状态与发货状态一致性

**User Story:** 作为系统管理员,我希望订单状态与发货状态保持一致,以确保订单流程的正确性。

#### Acceptance Criteria

1. WHEN 订单状态为"待发货"(1) THEN THE Order_System SHALL 确保所有订单项的发货状态为"待发货"(0)
2. WHEN 订单状态为"待收货"(2) THEN THE Order_System SHALL 确保所有订单项的发货状态为"已发货"(1)
3. WHEN 订单状态为"已完成"(3) THEN THE Order_System SHALL 确保所有订单项的发货状态为"已发货"(1)
4. WHEN 卖家发货时 THEN THE Order_System SHALL 检查订单中该卖家的所有商品是否都已发货,如果是则更新订单状态为"待收货"(2)
5. WHEN 订单状态为"已取消"(4) THEN THE Order_System SHALL 允许任何发货状态(因为订单已取消)

### Requirement 3: 订单状态与支付状态一致性

**User Story:** 作为系统管理员,我希望订单状态与支付状态保持一致,以确保支付流程的正确性。

#### Acceptance Criteria

1. WHEN 订单状态为"待付款"(0) THEN THE Order_System SHALL 确保支付状态为"未支付"(0)
2. WHEN 订单状态为"待发货"(1)、"待收货"(2)或"已完成"(3) THEN THE Order_System SHALL 确保支付状态为"已支付"(1)
3. WHEN 用户支付订单 THEN THE Order_System SHALL 同时更新订单状态为"待发货"(1)和支付状态为"已支付"(1)
4. WHEN 订单取消且已支付 THEN THE Order_System SHALL 更新支付状态为"支付失败"(2)或保持"已支付"(1)等待退款

### Requirement 4: 数据修复

**User Story:** 作为系统管理员,我需要修复现有数据库中的不一致数据,以确保系统的正确运行。

#### Acceptance Criteria

1. THE Order_System SHALL 提供SQL脚本识别所有商家购买自己商品的订单
2. THE Order_System SHALL 提供SQL脚本修复订单状态与发货状态不一致的数据
3. THE Order_System SHALL 提供SQL脚本修复订单状态与支付状态不一致的数据
4. THE Order_System SHALL 在修复前备份受影响的数据

### Requirement 5: 前端验证

**User Story:** 作为用户,我希望在前端就能看到清晰的提示,避免无效操作。

#### Acceptance Criteria

1. WHEN 用户查看自己发布的商品详情页 THEN THE Order_System SHALL 隐藏或禁用"加入购物车"和"立即购买"按钮
2. WHEN 用户在购物车中看到自己的商品 THEN THE Order_System SHALL 显示警告提示并禁止结算
3. WHEN 用户尝试购买自己的商品 THEN THE Order_System SHALL 显示友好的错误提示

### Requirement 6: 后端验证

**User Story:** 作为系统开发者,我需要在后端添加严格的验证,防止绕过前端验证的恶意操作。

#### Acceptance Criteria

1. WHEN 后端接收到加入购物车请求 THEN THE Order_System SHALL 验证买家不是卖家
2. WHEN 后端接收到创建订单请求 THEN THE Order_System SHALL 验证所有商品的买家都不是卖家
3. WHEN 后端接收到发货请求 THEN THE Order_System SHALL 验证订单状态允许发货
4. WHEN 后端接收到支付请求 THEN THE Order_System SHALL 验证订单状态为"待付款"(0)
