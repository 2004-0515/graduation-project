# Bugfix Requirements Document

## Introduction

This document addresses four critical bugs in the order and inventory management system that must be fixed before the graduation defense. These bugs affect core e-commerce functionality including inventory management, order lifecycle, and payment processing. The issues range from data integrity problems (concurrent overselling, incorrect stock recovery) to missing critical functionality (payment processing) and optimization needs (order number generation).

The bugs are prioritized based on their impact on the graduation defense demonstration, with stock recovery errors being the highest priority as they directly affect the correctness of the business logic demonstration.

## Bug Analysis

### 1. Current Behavior (Defect)

#### 1.1 Stock Recovery on Order Cancellation (Highest Priority)

1.1.1 WHEN a user creates an order (status = PENDING_PAYMENT, paymentStatus = UNPAID) and then cancels it THEN the system incorrectly recovers stock even though the stock was never deducted

1.1.2 WHEN a user creates an order, pays for it (status = PENDING_SHIPMENT, paymentStatus = PAID), and then cancels it THEN the system correctly recovers stock

**Root Cause:** The `cancelOrder` method in `OrderService.java` (lines 196-211) unconditionally recovers stock for all cancelled orders without checking the payment status. Since stock is currently deducted at order creation (line 186-188), unpaid orders that are cancelled incorrectly increase inventory beyond the original amount.

#### 1.2 Missing Payment Functionality (High Priority)

1.2.1 WHEN a user creates an order THEN the system immediately deducts stock at order creation time (line 186-188 in `OrderService.createOrder`)

1.2.2 WHEN a user needs to pay for an order THEN the system has no `payOrder` method to process the payment and update order status

1.2.3 WHEN an unpaid order times out or is abandoned THEN the system has already deducted stock, causing inventory to be locked unnecessarily

**Root Cause:** The current implementation deducts stock at order creation instead of at payment time. There is no payment processing method, making it impossible to properly handle the order-to-payment workflow.

#### 1.3 Inventory Concurrent Overselling (Medium Priority)

1.3.1 WHEN multiple users simultaneously attempt to purchase the same product with limited stock THEN the system may allow overselling due to race conditions in the stock check and deduction logic

1.3.2 WHEN the `reduceStock` method in `ProductService.java` (lines 234-244) executes concurrently THEN the read-check-write sequence is not atomic, allowing multiple transactions to pass the stock validation before any deduction occurs

**Root Cause:** The `reduceStock` method uses a non-atomic read-modify-write pattern:
```java
if (product.getStock() < quantity) {  // Read
    throw new ValidationException("商品库存不足");
}
product.setStock(product.getStock() - quantity);  // Write
```
Without proper locking or optimistic concurrency control, concurrent transactions can interleave between the check and the update.

#### 1.4 Order Number Generation Weakness (Low Priority)

1.4.1 WHEN the system generates an order number using `generateOrderNo()` (line 318 in OrderService.java) THEN the format "ORD" + timestamp + random(0-999) has insufficient uniqueness guarantees

1.4.2 WHEN multiple orders are created in the same millisecond THEN there is a 1/1000 chance of collision due to the limited random number range

**Root Cause:** The current implementation `"ORD" + System.currentTimeMillis() + (int)(Math.random() * 1000)` only provides 3 digits of randomness, which is insufficient for high-concurrency scenarios.

### 2. Expected Behavior (Correct)

#### 2.1 Stock Recovery on Order Cancellation

2.1.1 WHEN a user cancels an order with paymentStatus = UNPAID THEN the system SHALL NOT recover stock (because stock was never deducted)

2.1.2 WHEN a user cancels an order with paymentStatus = PAID THEN the system SHALL recover stock by calling `productService.increaseStock()` for each order item

2.1.3 WHEN the `cancelOrder` method executes THEN the system SHALL check `order.getPaymentStatus() == OrderConstants.PaymentStatus.PAID` before recovering stock

#### 2.2 Payment Functionality

2.2.1 WHEN a user creates an order THEN the system SHALL NOT deduct stock at order creation time

2.2.2 WHEN a user pays for an order with status = PENDING_PAYMENT THEN the system SHALL provide a `payOrder(Long orderId, String username, Integer paymentMethod)` method that:
- Validates the order status is PENDING_PAYMENT
- Deducts stock for each order item
- Updates paymentStatus to PAID
- Updates orderStatus to PENDING_SHIPMENT
- Sets paymentTime to current timestamp
- Sets the paymentMethod

2.2.3 WHEN the `payOrder` method successfully completes THEN the system SHALL return the updated OrderDto

2.2.4 WHEN a user attempts to pay for an order that is not in PENDING_PAYMENT status THEN the system SHALL throw a ValidationException with message "订单状态不允许支付"

#### 2.3 Inventory Concurrent Overselling Prevention

2.3.1 WHEN multiple users simultaneously attempt to purchase a product THEN the system SHALL use one of the following concurrency control mechanisms:
- **Option A (Recommended):** Database optimistic locking with @Version field on Product entity
- **Option B:** Database pessimistic locking with @Lock(LockModeType.PESSIMISTIC_WRITE)
- **Option C:** Redis distributed lock with try-lock pattern

2.3.2 WHEN using optimistic locking (Option A) THEN the system SHALL:
- Add a `@Version private Long version;` field to the Product entity
- Use a custom repository method with atomic UPDATE query: `UPDATE Product p SET p.stock = p.stock - :quantity WHERE p.id = :id AND p.stock >= :quantity`
- Handle OptimisticLockException by retrying or returning an error

2.3.3 WHEN the stock deduction fails due to insufficient inventory or concurrency conflict THEN the system SHALL throw a ValidationException with an appropriate error message

#### 2.4 Order Number Generation

2.4.1 WHEN the system generates an order number THEN the system SHALL use the format: "ORD" + timestamp + 4-digit random number (0000-9999) + 3-digit thread ID (000-999)

2.4.2 WHEN the `generateOrderNo()` method executes THEN the system SHALL use `String.format("ORD%d%04d%03d", timestamp, random, threadId)` where:
- timestamp = System.currentTimeMillis()
- random = (int)(Math.random() * 10000)
- threadId = Thread.currentThread().getId() % 1000

### 3. Unchanged Behavior (Regression Prevention)

#### 3.1 Order Creation Flow

3.1.1 WHEN a user creates an order with valid items and address THEN the system SHALL CONTINUE TO validate product availability, stock levels, and address ownership

3.1.2 WHEN a user creates an order THEN the system SHALL CONTINUE TO create Order and OrderItem entities with correct pricing and product information

3.1.3 WHEN a user creates an order THEN the system SHALL CONTINUE TO set orderStatus to PENDING_PAYMENT and paymentStatus to UNPAID

#### 3.2 Order Cancellation Flow

3.2.1 WHEN a user attempts to cancel an order that is not in a cancellable state THEN the system SHALL CONTINUE TO throw ValidationException with message "订单无法取消"

3.2.2 WHEN a user cancels an order THEN the system SHALL CONTINUE TO update orderStatus to CANCELLED

3.2.3 WHEN a user attempts to cancel another user's order THEN the system SHALL CONTINUE TO throw ValidationException with message "无权操作此订单"

#### 3.3 Order Confirmation and Completion

3.3.1 WHEN a user confirms receipt of an order with status = PENDING_RECEIPT THEN the system SHALL CONTINUE TO update orderStatus to COMPLETED and set endTime

3.3.2 WHEN a user attempts to confirm an order not in PENDING_RECEIPT status THEN the system SHALL CONTINUE TO throw ValidationException

#### 3.4 Stock Management for Other Operations

3.4.1 WHEN an administrator manually adjusts product stock THEN the system SHALL CONTINUE TO use `updateProductStock()` method without interference from order-related stock operations

3.4.2 WHEN a product's stock is increased via `increaseStock()` for non-order-related reasons THEN the system SHALL CONTINUE TO function correctly

#### 3.5 Order Status Transitions

3.5.1 WHEN an administrator ships an order with status = PENDING_SHIPMENT THEN the system SHALL CONTINUE TO update orderStatus to SHIPPED and set shippingTime

3.5.2 WHEN order status transitions occur THEN the system SHALL CONTINUE TO enforce valid state transitions as defined in OrderConstants

#### 3.6 Transaction Boundaries

3.6.1 WHEN any order operation fails THEN the system SHALL CONTINUE TO rollback all changes within the @Transactional boundary

3.6.2 WHEN concurrent order operations occur THEN the system SHALL CONTINUE TO maintain data consistency through transaction isolation
