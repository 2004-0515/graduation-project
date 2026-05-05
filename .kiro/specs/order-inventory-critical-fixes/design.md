# Order Inventory Critical Fixes - Bugfix Design

## Overview

This design addresses four critical bugs in the order and inventory management system that must be fixed before the graduation defense. The bugs are:

1. **Stock Recovery on Order Cancellation** (Highest Priority): The system incorrectly recovers stock when cancelling unpaid orders, even though stock was never deducted for unpaid orders
2. **Missing Payment Functionality** (High Priority): No payment processing method exists, and stock is deducted at order creation instead of payment time
3. **Inventory Concurrent Overselling** (Medium Priority): Race conditions in stock deduction allow multiple concurrent transactions to oversell products
4. **Order Number Generation Weakness** (Low Priority): Insufficient uniqueness guarantees in order number generation for high-concurrency scenarios

The fix strategy follows the bug condition methodology:
- **Bug 1 & 2**: Refactor the order-payment-stock workflow to deduct stock at payment time, not order creation time
- **Bug 3**: Implement optimistic locking with atomic database updates to prevent race conditions
- **Bug 4**: Enhance order number generation with more entropy

## Glossary

- **Bug_Condition (C)**: The condition that triggers each bug
- **Property (P)**: The desired behavior when the bug condition holds
- **Preservation**: Existing order lifecycle behaviors that must remain unchanged
- **OrderService**: The service class in `backend/src/main/java/com/shopping/service/OrderService.java` that handles order operations
- **ProductService**: The service class in `backend/src/main/java/com/shopping/service/ProductService.java` that handles product and inventory operations
- **PaymentStatus**: Order payment status (UNPAID=0, PAID=1, FAILED=2) defined in OrderConstants
- **OrderStatus**: Order lifecycle status (PENDING_PAYMENT=0, PENDING_SHIPMENT=1, PENDING_RECEIPT=2, COMPLETED=3, CANCELLED=4) defined in OrderConstants
- **Optimistic Locking**: Concurrency control mechanism using version numbers to detect conflicts
- **Atomic Operation**: Database operation that executes as a single indivisible unit

## Bug Details

### Bug Condition 1: Stock Recovery on Order Cancellation

The bug manifests when a user cancels an unpaid order (paymentStatus = UNPAID). The `cancelOrder` method in `OrderService.java` (lines 196-211) unconditionally recovers stock for all cancelled orders without checking payment status.

**Formal Specification:**
```
FUNCTION isBugCondition1(order)
  INPUT: order of type Order
  OUTPUT: boolean
  
  RETURN order.orderStatus == CANCELLED
         AND order.paymentStatus == UNPAID
         AND stockWasRecovered(order)
END FUNCTION
```

**Root Cause:** Lines 208-210 in `OrderService.cancelOrder()`:
```java
// 恢复库存
for (OrderItem item : order.getItems()) {
    productService.increaseStock(item.getProduct().getId(), item.getQuantity());
}
```
This code executes for ALL cancelled orders, regardless of whether stock was actually deducted.

### Bug Condition 2: Missing Payment Functionality

The bug manifests when the order-to-payment workflow is attempted. Stock is deducted at order creation (line 186-188 in `OrderService.createOrder`), but there is no `payOrder` method to process payments and transition orders from PENDING_PAYMENT to PENDING_SHIPMENT.

**Formal Specification:**
```
FUNCTION isBugCondition2(order)
  INPUT: order of type Order
  OUTPUT: boolean
  
  RETURN order.orderStatus == PENDING_PAYMENT
         AND order.paymentStatus == UNPAID
         AND stockAlreadyDeducted(order)
         AND NOT payOrderMethodExists()
END FUNCTION
```

**Root Cause:** Lines 186-188 in `OrderService.createOrder()`:
```java
// 扣减库存
for (OrderItem item : savedOrder.getItems()) {
    productService.reduceStock(item.getProduct().getId(), item.getQuantity());
}
```
Stock is deducted immediately at order creation, and no payment processing method exists to handle the payment workflow.

### Bug Condition 3: Inventory Concurrent Overselling

The bug manifests when multiple users simultaneously attempt to purchase a product with limited stock. The `reduceStock` method in `ProductService.java` (lines 234-244) uses a non-atomic read-check-write pattern.

**Formal Specification:**
```
FUNCTION isBugCondition3(transactions)
  INPUT: transactions of type List<ConcurrentTransaction>
  OUTPUT: boolean
  
  LET product = getProduct(productId)
  LET totalRequested = SUM(transaction.quantity FOR transaction IN transactions)
  
  RETURN transactions.size() > 1
         AND allTransactionsTargetSameProduct(transactions)
         AND totalRequested > product.stock
         AND allTransactionsPassStockCheck(transactions)
END FUNCTION
```

**Root Cause:** Lines 237-242 in `ProductService.reduceStock()`:
```java
if (product.getStock() < quantity) {  // Read
    throw new ValidationException("商品库存不足");
}
product.setStock(product.getStock() - quantity);  // Write
productRepository.save(product);
```
Without proper locking, concurrent transactions can interleave between the check and the update.

### Bug Condition 4: Order Number Generation Weakness

The bug manifests when multiple orders are created in the same millisecond. The current format "ORD" + timestamp + random(0-999) has only 3 digits of randomness.

**Formal Specification:**
```
FUNCTION isBugCondition4(orders)
  INPUT: orders of type List<Order>
  OUTPUT: boolean
  
  RETURN EXISTS order1, order2 IN orders WHERE
         order1 != order2
         AND order1.orderNo == order2.orderNo
         AND order1.createdTime.millisecond == order2.createdTime.millisecond
END FUNCTION
```

**Root Cause:** Line 318 in `OrderService.generateOrderNo()`:
```java
return "ORD" + System.currentTimeMillis() + (int)(Math.random() * 1000);
```
Only 3 digits of randomness (0-999) provides insufficient collision resistance.

### Examples

**Bug 1 Example:**
- User creates order #12345 (status=PENDING_PAYMENT, paymentStatus=UNPAID)
- Product A stock: 100 → 99 (deducted at order creation)
- User cancels order #12345
- Product A stock: 99 → 100 (incorrectly recovered)
- **Expected:** Stock should remain 99 because it was never deducted for unpaid orders

**Bug 2 Example:**
- User creates order #12345 for Product A (quantity=1)
- Product A stock: 100 → 99 (deducted immediately)
- User abandons payment
- Product A stock: 99 (locked forever, no recovery mechanism)
- **Expected:** Stock should only be deducted when payment is confirmed

**Bug 3 Example:**
- Product A stock: 5
- User 1 requests quantity=3 (reads stock=5, passes check)
- User 2 requests quantity=3 (reads stock=5, passes check)
- User 1 writes stock=2
- User 2 writes stock=2
- **Expected:** One transaction should fail with "商品库存不足"

**Bug 4 Example:**
- Order 1 created at timestamp 1234567890123: "ORD1234567890123456"
- Order 2 created at timestamp 1234567890123: "ORD1234567890123456"
- **Expected:** Unique order numbers even in same millisecond

## Expected Behavior

### Correctness Properties

Property 1: Bug Condition 1 - Stock Recovery Only for Paid Orders

_For any_ order cancellation where the order's paymentStatus is PAID, the fixed cancelOrder method SHALL recover stock by calling productService.increaseStock() for each order item. _For any_ order cancellation where the order's paymentStatus is UNPAID, the fixed cancelOrder method SHALL NOT recover stock.

**Validates: Requirements 2.1.1, 2.1.2, 2.1.3**

Property 2: Bug Condition 2 - Payment Processing Workflow

_For any_ order with orderStatus = PENDING_PAYMENT and paymentStatus = UNPAID, the fixed system SHALL provide a payOrder method that atomically: (1) validates the order status, (2) deducts stock for each order item, (3) updates paymentStatus to PAID, (4) updates orderStatus to PENDING_SHIPMENT, (5) sets paymentTime and paymentMethod. _For any_ order creation, the fixed createOrder method SHALL NOT deduct stock.

**Validates: Requirements 2.2.1, 2.2.2, 2.2.3, 2.2.4**

Property 3: Bug Condition 3 - Concurrent Stock Deduction Safety

_For any_ set of concurrent stock deduction requests targeting the same product, the fixed reduceStock method SHALL use optimistic locking with an atomic UPDATE query to ensure that at most N requests succeed where N = floor(currentStock / requestedQuantity), and all other requests SHALL fail with a ValidationException.

**Validates: Requirements 2.3.1, 2.3.2, 2.3.3**

Property 4: Bug Condition 4 - Order Number Uniqueness

_For any_ set of orders created concurrently (including within the same millisecond), the fixed generateOrderNo method SHALL generate unique order numbers using the format "ORD" + timestamp + 4-digit random (0000-9999) + 3-digit thread ID (000-999), providing sufficient entropy to prevent collisions.

**Validates: Requirements 2.4.1, 2.4.2**

Property 5: Preservation - Order Creation Flow

_For any_ order creation request with valid items and address, the fixed system SHALL continue to validate product availability, stock levels, and address ownership exactly as the original system does, and SHALL continue to create Order and OrderItem entities with correct pricing and product information.

**Validates: Requirements 3.1.1, 3.1.2, 3.1.3**

Property 6: Preservation - Order Lifecycle Transitions

_For any_ order status transition (cancellation, confirmation, shipment), the fixed system SHALL continue to enforce the same state transition rules and authorization checks as the original system, preserving all existing validation logic.

**Validates: Requirements 3.2.1, 3.2.2, 3.2.3, 3.3.1, 3.3.2, 3.5.1, 3.5.2**

## Preservation Requirements

### Unchanged Behaviors

**Order Creation Flow:**
- Validation of product availability, stock levels, and address ownership must continue to work exactly as before
- Order and OrderItem entity creation with correct pricing and product information must remain unchanged
- Setting orderStatus to PENDING_PAYMENT and paymentStatus to UNPAID must remain unchanged

**Order Cancellation Flow:**
- Authorization checks (user can only cancel their own orders) must remain unchanged
- State validation (only PENDING_PAYMENT orders can be cancelled) must remain unchanged
- Order status update to CANCELLED must remain unchanged

**Order Confirmation and Completion:**
- Confirmation of orders in PENDING_RECEIPT status must continue to work
- Setting orderStatus to COMPLETED and endTime must remain unchanged
- Authorization and state validation must remain unchanged

**Order Status Transitions:**
- Administrator shipment operations must continue to work
- State transition enforcement must remain unchanged
- Transaction boundaries and rollback behavior must remain unchanged

**Scope:**
All order operations that do NOT involve stock deduction, stock recovery, or payment processing should be completely unaffected by this fix. This includes:
- Order listing and retrieval operations
- Order deletion operations
- Administrator order management operations
- Order DTO conversion and display logic

## Hypothesized Root Cause

Based on the bug analysis, the root causes are:

1. **Stock Recovery Bug**: The `cancelOrder` method lacks a payment status check before recovering stock. The code was likely written assuming stock is always deducted at order creation, without considering the payment workflow.

2. **Missing Payment Functionality**: The system was designed with an incomplete order-payment workflow. Stock deduction happens at order creation (line 186-188), but no payment processing method was implemented to handle the payment confirmation step.

3. **Concurrent Overselling**: The `reduceStock` method uses a standard read-modify-write pattern without any concurrency control mechanism. The JPA entity manager does not provide automatic protection against this race condition.

4. **Order Number Generation**: The `generateOrderNo` method uses insufficient entropy (only 3 digits of randomness). This was likely adequate for low-traffic scenarios but becomes problematic under high concurrency.

## Fix Implementation

### Changes Required

#### File: `backend/src/main/java/com/shopping/entity/Product.java`

**Change 1: Add Optimistic Locking Version Field**

Add a `@Version` field to enable JPA optimistic locking:

```java
@Version
@Column(name = "version")
private Long version;
```

This field will be automatically managed by JPA to detect concurrent modifications.

#### File: `backend/src/main/java/com/shopping/repository/ProductRepository.java`

**Change 2: Add Atomic Stock Deduction Method**

Add a custom query method for atomic stock deduction:

```java
@Modifying
@Query("UPDATE Product p SET p.stock = p.stock - :quantity WHERE p.id = :id AND p.stock >= :quantity")
int reduceStockAtomic(@Param("id") Long id, @Param("quantity") Integer quantity);
```

This ensures the stock check and deduction happen atomically in a single database operation.

#### File: `backend/src/main/java/com/shopping/service/ProductService.java`

**Change 3: Refactor reduceStock to Use Atomic Operation**

Replace the current `reduceStock` method (lines 234-244) with:

```java
@Transactional
public void reduceStock(Long productId, Integer quantity) {
    int rowsUpdated = productRepository.reduceStockAtomic(productId, quantity);
    
    if (rowsUpdated == 0) {
        // Either product doesn't exist or insufficient stock
        Product product = productRepository.findById(productId).orElseThrow(
            () -> new ResourceNotFoundException("商品", productId));
        
        if (product.getStock() < quantity) {
            throw new ValidationException("商品库存不足");
        }
        
        // If we reach here, it was a concurrent modification conflict
        throw new ValidationException("库存更新失败，请重试");
    }
}
```

This uses the atomic query and provides clear error messages for different failure scenarios.

#### File: `backend/src/main/java/com/shopping/service/OrderService.java`

**Change 4: Remove Stock Deduction from createOrder**

Remove lines 186-188 in the `createOrder` method:

```java
// DELETE THESE LINES:
// 扣减库存
for (OrderItem item : savedOrder.getItems()) {
    productService.reduceStock(item.getProduct().getId(), item.getQuantity());
}
```

Stock will now be deducted in the `payOrder` method instead.

**Change 5: Add Payment Status Check to cancelOrder**

Modify the `cancelOrder` method (lines 196-211) to check payment status before recovering stock:

```java
@Transactional
public void cancelOrder(Long orderId, String username) {
    Order order = getOrderEntityByIdAndUser(orderId, username);

    // 只能取消待支付和待发货的订单
    if (!OrderConstants.OrderStatus.canCancel(order.getOrderStatus())) {
        throw new ValidationException("订单无法取消");
    }

    order.setOrderStatus(OrderConstants.OrderStatus.CANCELLED);
    orderRepository.save(order);

    // 只有已支付的订单才需要恢复库存
    if (order.getPaymentStatus() == OrderConstants.PaymentStatus.PAID) {
        for (OrderItem item : order.getItems()) {
            productService.increaseStock(item.getProduct().getId(), item.getQuantity());
        }
    }
}
```

**Change 6: Implement payOrder Method**

Add a new `payOrder` method to handle payment processing:

```java
@Transactional
public OrderDto payOrder(Long orderId, String username, Integer paymentMethod) {
    Order order = getOrderEntityByIdAndUser(orderId, username);
    
    // 验证订单状态
    if (order.getOrderStatus() != OrderConstants.OrderStatus.PENDING_PAYMENT) {
        throw new ValidationException("订单状态不允许支付");
    }
    
    if (order.getPaymentStatus() == OrderConstants.PaymentStatus.PAID) {
        throw new ValidationException("订单已支付");
    }
    
    // 扣减库存
    for (OrderItem item : order.getItems()) {
        productService.reduceStock(item.getProduct().getId(), item.getQuantity());
    }
    
    // 更新订单状态
    order.setPaymentStatus(OrderConstants.PaymentStatus.PAID);
    order.setOrderStatus(OrderConstants.OrderStatus.PENDING_SHIPMENT);
    order.setPaymentTime(LocalDateTime.now());
    order.setPaymentMethod(paymentMethod);
    
    Order savedOrder = orderRepository.save(order);
    
    // 增加商品销量
    for (OrderItem item : savedOrder.getItems()) {
        productService.increaseSales(item.getProduct().getId(), item.getQuantity());
    }
    
    logger.info("Order paid successfully: {}", savedOrder.getOrderNo());
    return convertToDto(savedOrder);
}
```

**Change 7: Enhance Order Number Generation**

Replace the `generateOrderNo` method (line 318) with:

```java
private String generateOrderNo() {
    long timestamp = System.currentTimeMillis();
    int random = (int)(Math.random() * 10000);  // 0-9999
    long threadId = Thread.currentThread().getId() % 1000;  // 0-999
    return String.format("ORD%d%04d%03d", timestamp, random, threadId);
}
```

This provides 4 digits of randomness + 3 digits of thread ID for better uniqueness.

**Change 8: Update canCancel Logic in OrderConstants**

Modify the `canCancel` method in `OrderConstants.OrderStatus` to allow cancellation of both PENDING_PAYMENT and PENDING_SHIPMENT orders:

```java
public static boolean canCancel(int status) {
    return status == PENDING_PAYMENT || status == PENDING_SHIPMENT;
}
```

This allows users to cancel paid orders (which will trigger stock recovery).

#### File: `backend/src/main/java/com/shopping/controller/OrderController.java`

**Change 9: Add Payment Endpoint**

Add a new REST endpoint for payment processing:

```java
@PostMapping("/{id}/pay")
public Response<OrderDto> payOrder(
    @PathVariable Long id,
    @RequestParam Integer paymentMethod,
    @AuthenticationPrincipal UserDetails userDetails
) {
    OrderDto order = orderService.payOrder(id, userDetails.getUsername(), paymentMethod);
    return Response.success(order);
}
```

## Testing Strategy

### Validation Approach

The testing strategy follows a three-phase approach:
1. **Exploratory Bug Condition Checking**: Surface counterexamples on unfixed code to confirm root causes
2. **Fix Checking**: Verify the fix resolves all bug conditions
3. **Preservation Checking**: Verify existing behaviors remain unchanged

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Plan**: Write tests that simulate the bug conditions and run them on the UNFIXED code to observe failures.

**Test Cases**:

1. **Stock Recovery Bug Test** (will fail on unfixed code):
   - Create an order (status=PENDING_PAYMENT, paymentStatus=UNPAID)
   - Record initial stock level
   - Cancel the order
   - Assert stock level increased (demonstrating the bug)
   - Expected: Stock should NOT increase for unpaid orders

2. **Missing Payment Method Test** (will fail on unfixed code):
   - Create an order
   - Attempt to call `payOrder` method
   - Expected: Method does not exist (NoSuchMethodException)

3. **Concurrent Overselling Test** (will fail on unfixed code):
   - Set product stock to 5
   - Launch 3 concurrent threads, each attempting to purchase quantity=3
   - Assert that more than 1 thread succeeds (demonstrating overselling)
   - Expected: Only 1 thread should succeed, others should fail with "商品库存不足"

4. **Order Number Collision Test** (may fail on unfixed code):
   - Create 1000 orders in rapid succession
   - Check for duplicate order numbers
   - Expected: Some duplicates may occur with current 3-digit randomness

**Expected Counterexamples**:
- Stock incorrectly increases when cancelling unpaid orders
- No payment processing method exists
- Concurrent transactions can oversell products
- Order numbers may collide under high concurrency

### Fix Checking

**Goal**: Verify that for all inputs where the bug conditions hold, the fixed functions produce the expected behavior.

**Bug 1 - Stock Recovery:**
```
FOR ALL order WHERE order.paymentStatus == UNPAID DO
  initialStock := getProductStock(order.items[0].productId)
  cancelOrder_fixed(order.id, order.username)
  finalStock := getProductStock(order.items[0].productId)
  ASSERT finalStock == initialStock  // No stock recovery
END FOR

FOR ALL order WHERE order.paymentStatus == PAID DO
  initialStock := getProductStock(order.items[0].productId)
  cancelOrder_fixed(order.id, order.username)
  finalStock := getProductStock(order.items[0].productId)
  ASSERT finalStock == initialStock + order.items[0].quantity  // Stock recovered
END FOR
```

**Bug 2 - Payment Processing:**
```
FOR ALL order WHERE order.orderStatus == PENDING_PAYMENT DO
  initialStock := getProductStock(order.items[0].productId)
  result := payOrder_fixed(order.id, order.username, ALIPAY)
  finalStock := getProductStock(order.items[0].productId)
  
  ASSERT result.paymentStatus == PAID
  ASSERT result.orderStatus == PENDING_SHIPMENT
  ASSERT result.paymentTime IS NOT NULL
  ASSERT finalStock == initialStock - order.items[0].quantity
END FOR
```

**Bug 3 - Concurrent Overselling:**
```
FOR ALL concurrentRequests WHERE totalQuantity > availableStock DO
  results := executeConcurrently(concurrentRequests)
  successCount := COUNT(results WHERE success == true)
  
  ASSERT successCount <= FLOOR(availableStock / requestQuantity)
  ASSERT finalStock >= 0
END FOR
```

**Bug 4 - Order Number Uniqueness:**
```
FOR ALL orderBatch IN concurrentOrderCreation DO
  orderNumbers := COLLECT(order.orderNo FOR order IN orderBatch)
  ASSERT COUNT(DISTINCT orderNumbers) == COUNT(orderNumbers)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug conditions do NOT hold, the fixed functions produce the same results as the original functions.

**Pseudocode:**
```
FOR ALL orderOperation WHERE NOT affectedByBugFix(orderOperation) DO
  ASSERT orderOperation_original(input) == orderOperation_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-affected operations, then write property-based tests capturing that behavior.

**Test Cases**:

1. **Order Creation Preservation**: Verify that order creation (without payment) continues to work correctly
   - Create orders with various product combinations
   - Assert Order and OrderItem entities are created correctly
   - Assert orderStatus = PENDING_PAYMENT, paymentStatus = UNPAID
   - Assert stock is NOT deducted (new behavior, but preserves the validation logic)

2. **Order Retrieval Preservation**: Verify that order listing and retrieval operations are unchanged
   - List user orders with various filters
   - Retrieve order by ID and order number
   - Assert results match expected format and authorization rules

3. **Order Confirmation Preservation**: Verify that order confirmation continues to work
   - Confirm orders in PENDING_RECEIPT status
   - Assert orderStatus updates to COMPLETED
   - Assert endTime is set

4. **Administrator Operations Preservation**: Verify that admin operations continue to work
   - Ship orders in PENDING_SHIPMENT status
   - Update order status
   - Assert state transitions follow existing rules

5. **Authorization Preservation**: Verify that authorization checks remain unchanged
   - Attempt to access another user's order
   - Attempt to cancel another user's order
   - Assert ValidationException is thrown

### Unit Tests

- Test `cancelOrder` with UNPAID orders (stock should NOT be recovered)
- Test `cancelOrder` with PAID orders (stock should be recovered)
- Test `payOrder` with valid PENDING_PAYMENT orders (should succeed)
- Test `payOrder` with invalid order states (should throw ValidationException)
- Test `reduceStock` with sufficient stock (should succeed)
- Test `reduceStock` with insufficient stock (should throw ValidationException)
- Test `generateOrderNo` for format correctness
- Test order creation without stock deduction
- Test edge cases (zero quantity, negative values, null checks)

### Property-Based Tests

- Generate random order scenarios and verify stock recovery logic is correct based on payment status
- Generate random concurrent stock deduction requests and verify no overselling occurs
- Generate random order creation batches and verify all order numbers are unique
- Generate random order lifecycle transitions and verify preservation of existing validation rules
- Test that all non-payment-related order operations produce identical results before and after the fix

### Integration Tests

- Test full order-to-payment-to-cancellation flow with stock tracking
- Test concurrent order creation and payment with limited stock
- Test order timeout scenarios (unpaid orders that are never paid)
- Test payment failure scenarios and rollback behavior
- Test administrator workflow (order creation → payment → shipment → confirmation)
- Test edge cases (simultaneous payment and cancellation attempts)
