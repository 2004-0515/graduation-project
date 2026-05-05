# Implementation Plan

## Bug 1: Stock Recovery on Order Cancellation (Highest Priority)

- [x] 1. Write bug condition exploration test for stock recovery
  - **Property 1: Bug Condition** - Stock Recovery on Unpaid Order Cancellation
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate incorrect stock recovery for unpaid orders
  - **Scoped PBT Approach**: Scope the property to unpaid orders (paymentStatus = UNPAID) that are cancelled
  - Test implementation: Create order with PENDING_PAYMENT status and UNPAID paymentStatus, record initial stock, cancel order, assert stock remains unchanged (should NOT increase)
  - The test assertions should match: For unpaid orders, stock should NOT be recovered on cancellation
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (stock incorrectly increases - this proves the bug exists)
  - Document counterexamples found (e.g., "Cancelling unpaid order increases stock from 99 to 100")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1.1, 1.1.2, 2.1.1_

- [x] 2. Write preservation property tests for stock recovery (BEFORE implementing fix)
  - **Property 2: Preservation** - Stock Recovery for Paid Orders
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code: Create order, pay for it (status=PENDING_SHIPMENT, paymentStatus=PAID), cancel it, observe stock is recovered
  - Write property-based test: For all paid orders (paymentStatus = PAID), cancellation should recover stock by calling increaseStock() for each order item
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.2.1, 3.2.2, 3.2.3_

- [x] 3. Fix stock recovery logic in cancelOrder

  - [x] 3.1 Add payment status check before stock recovery
    - Modify `cancelOrder` method in `OrderService.java` (lines 196-211)
    - Add conditional check: `if (order.getPaymentStatus() == OrderConstants.PaymentStatus.PAID)`
    - Only recover stock for paid orders
    - Keep existing authorization and state validation logic unchanged
    - _Bug_Condition: isBugCondition1(order) where order.paymentStatus == UNPAID AND stockWasRecovered(order)_
    - _Expected_Behavior: For unpaid orders, stock SHALL NOT be recovered; for paid orders, stock SHALL be recovered_
    - _Preservation: Authorization checks, state validation, and order status update to CANCELLED must remain unchanged_
    - _Requirements: 1.1.1, 1.1.2, 2.1.1, 2.1.2, 2.1.3, 3.2.1, 3.2.2, 3.2.3_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Stock Not Recovered for Unpaid Orders
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms unpaid orders no longer incorrectly recover stock
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1.1, 2.1.2, 2.1.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Stock Recovery for Paid Orders
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm paid orders still correctly recover stock after fix

- [x] 4. Checkpoint - Ensure Bug 1 tests pass
  - Ensure all Bug 1 tests pass, ask the user if questions arise

## Bug 2: Missing Payment Functionality (High Priority)

- [x] 5. Write bug condition exploration test for missing payment method
  - **Property 1: Bug Condition** - Missing Payment Processing Method
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate missing payment functionality
  - **Scoped PBT Approach**: Scope the property to orders with PENDING_PAYMENT status and UNPAID paymentStatus
  - Test implementation: Create order, attempt to call payOrder method, assert method exists and processes payment correctly
  - The test assertions should match: payOrder method should exist, deduct stock, update payment status to PAID, update order status to PENDING_SHIPMENT
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (method does not exist or stock deducted at wrong time - this proves the bug exists)
  - Document counterexamples found (e.g., "payOrder method does not exist" or "Stock deducted at order creation instead of payment time")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.2.1, 1.2.2, 1.2.3, 2.2.1, 2.2.2_

- [x] 6. Write preservation property tests for order creation (BEFORE implementing fix)
  - **Property 2: Preservation** - Order Creation Validation and Entity Creation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code: Create orders with valid items and address, observe validation logic, entity creation, and status settings
  - Write property-based tests: For all valid order creation requests, system should validate product availability, stock levels, address ownership, and create Order/OrderItem entities correctly
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1.1, 3.1.2, 3.1.3_

- [x] 7. Implement payment processing workflow

  - [x] 7.1 Remove stock deduction from createOrder method
    - Remove lines 186-188 in `OrderService.createOrder()` method
    - Delete the stock deduction loop that calls `productService.reduceStock()`
    - Keep all other order creation logic unchanged (validation, entity creation, status setting)
    - _Bug_Condition: isBugCondition2(order) where stockAlreadyDeducted(order) at order creation time_
    - _Expected_Behavior: Stock SHALL NOT be deducted at order creation time_
    - _Preservation: Product validation, stock level checking, address validation, Order/OrderItem entity creation must remain unchanged_
    - _Requirements: 1.2.1, 1.2.3, 2.2.1, 3.1.1, 3.1.2, 3.1.3_

  - [x] 7.2 Implement payOrder method in OrderService
    - Add new method: `public OrderDto payOrder(Long orderId, String username, Integer paymentMethod)`
    - Validate order status is PENDING_PAYMENT (throw ValidationException if not)
    - Validate payment status is UNPAID (throw ValidationException if already paid)
    - Deduct stock for each order item by calling `productService.reduceStock()`
    - Update paymentStatus to PAID
    - Update orderStatus to PENDING_SHIPMENT
    - Set paymentTime to LocalDateTime.now()
    - Set paymentMethod
    - Increase product sales for each order item
    - Add @Transactional annotation for atomicity
    - Return OrderDto
    - _Bug_Condition: isBugCondition2(order) where NOT payOrderMethodExists()_
    - _Expected_Behavior: payOrder method SHALL atomically deduct stock, update payment status, update order status, set payment time and method_
    - _Preservation: Transaction boundaries and rollback behavior must remain unchanged_
    - _Requirements: 1.2.2, 2.2.2, 2.2.3, 2.2.4, 3.6.1_

  - [x] 7.3 Add payment endpoint in OrderController
    - Add new REST endpoint: `@PostMapping("/{id}/pay")`
    - Accept orderId, paymentMethod, and authenticated user
    - Call `orderService.payOrder()` method
    - Return Response.success(OrderDto)
    - _Expected_Behavior: REST API should expose payment functionality_
    - _Requirements: 2.2.2_

  - [x] 7.4 Update canCancel logic to allow cancellation of paid orders
    - Modify `OrderConstants.OrderStatus.canCancel()` method
    - Allow cancellation of both PENDING_PAYMENT and PENDING_SHIPMENT orders
    - This enables users to cancel paid orders (which will trigger stock recovery from Bug 1 fix)
    - _Preservation: Existing cancellation authorization and validation logic must remain unchanged_
    - _Requirements: 2.1.2, 3.2.1_

  - [x] 7.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Payment Processing Method Exists and Works
    - **IMPORTANT**: Re-run the SAME test from task 5 - do NOT write a new test
    - The test from task 5 encodes the expected behavior
    - When this test passes, it confirms payment processing works correctly
    - Run bug condition exploration test from step 5
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.2.1, 2.2.2, 2.2.3, 2.2.4_

  - [x] 7.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Order Creation Validation and Entity Creation
    - **IMPORTANT**: Re-run the SAME tests from task 6 - do NOT write new tests
    - Run preservation property tests from step 6
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm order creation validation and entity creation still work correctly

- [x] 8. Checkpoint - Ensure Bug 2 tests pass
  - Ensure all Bug 2 tests pass, ask the user if questions arise

## Bug 3: Inventory Concurrent Overselling (Medium Priority)

- [x] 9. Write bug condition exploration test for concurrent overselling
  - **Property 1: Bug Condition** - Concurrent Stock Deduction Race Condition
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate overselling under concurrent load
  - **Scoped PBT Approach**: Scope the property to concurrent transactions targeting the same product where totalRequested > availableStock
  - Test implementation: Set product stock to 5, launch 3 concurrent threads each requesting quantity=3, assert that at most 1 thread succeeds and others fail with "商品库存不足"
  - The test assertions should match: At most floor(stock/quantity) transactions should succeed, final stock should be >= 0
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (multiple threads succeed causing overselling - this proves the bug exists)
  - Document counterexamples found (e.g., "3 concurrent requests for quantity=3 all succeeded when stock=5, final stock=-4")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.3.1, 1.3.2, 2.3.1_

- [x] 10. Write preservation property tests for stock management (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Concurrent Stock Operations
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code: Test sequential stock operations (updateProductStock, increaseStock for non-order operations)
  - Write property-based tests: For all non-concurrent stock operations, system should continue to function correctly without interference
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.4.1, 3.4.2_

- [x] 11. Implement optimistic locking for concurrent stock deduction

  - [x] 11.1 Add version field to Product entity
    - Add `@Version` annotation and `private Long version;` field to `Product.java`
    - This enables JPA optimistic locking to detect concurrent modifications
    - _Expected_Behavior: JPA will automatically manage version field for concurrency control_
    - _Requirements: 2.3.1, 2.3.2_

  - [x] 11.2 Add atomic stock deduction query to ProductRepository
    - Add custom query method in `ProductRepository.java`:
    - `@Modifying @Query("UPDATE Product p SET p.stock = p.stock - :quantity WHERE p.id = :id AND p.stock >= :quantity") int reduceStockAtomic(@Param("id") Long id, @Param("quantity") Integer quantity);`
    - This ensures stock check and deduction happen atomically in a single database operation
    - _Expected_Behavior: Stock check and deduction SHALL be atomic, preventing race conditions_
    - _Requirements: 2.3.2, 2.3.3_

  - [x] 11.3 Refactor reduceStock method to use atomic operation
    - Replace current `reduceStock` method in `ProductService.java` (lines 234-244)
    - Call `productRepository.reduceStockAtomic()` instead of read-modify-write pattern
    - Check rowsUpdated result: if 0, either product doesn't exist or insufficient stock
    - Provide clear error messages for different failure scenarios
    - Add @Transactional annotation
    - _Bug_Condition: isBugCondition3(transactions) where concurrent transactions can interleave between stock check and update_
    - _Expected_Behavior: Atomic UPDATE query SHALL prevent race conditions, at most N requests succeed where N = floor(stock/quantity)_
    - _Preservation: Error messages and exception types for stock validation must remain consistent_
    - _Requirements: 1.3.1, 1.3.2, 2.3.1, 2.3.2, 2.3.3, 3.6.2_

  - [x] 11.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - No Overselling Under Concurrent Load
    - **IMPORTANT**: Re-run the SAME test from task 9 - do NOT write a new test
    - The test from task 9 encodes the expected behavior
    - When this test passes, it confirms concurrent overselling is prevented
    - Run bug condition exploration test from step 9
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.3.1, 2.3.2, 2.3.3_

  - [x] 11.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Concurrent Stock Operations
    - **IMPORTANT**: Re-run the SAME tests from task 10 - do NOT write new tests
    - Run preservation property tests from step 10
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm non-concurrent stock operations still work correctly

- [x] 12. Checkpoint - Ensure Bug 3 tests pass
  - Ensure all Bug 3 tests pass, ask the user if questions arise

## Bug 4: Order Number Generation Weakness (Low Priority)

- [x] 13. Write bug condition exploration test for order number collisions
  - **Property 1: Bug Condition** - Order Number Collision Under High Concurrency
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate order number collisions
  - **Scoped PBT Approach**: Scope the property to orders created in the same millisecond or in rapid succession
  - Test implementation: Create 1000 orders in rapid succession, collect all order numbers, assert all are unique (no duplicates)
  - The test assertions should match: COUNT(DISTINCT orderNumbers) == COUNT(orderNumbers)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (some duplicate order numbers found - this proves the bug exists)
  - Document counterexamples found (e.g., "Order numbers ORD1234567890123456 and ORD1234567890123456 are duplicates")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.4.1, 1.4.2, 2.4.1_

- [x] 14. Write preservation property tests for order number format (BEFORE implementing fix)
  - **Property 2: Preservation** - Order Number Format and Prefix
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code: Generate order numbers, observe format starts with "ORD" prefix
  - Write property-based tests: For all generated order numbers, format should start with "ORD" and contain timestamp component
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.5.1, 3.5.2_

- [x] 15. Enhance order number generation

  - [x] 15.1 Update generateOrderNo method with more entropy
    - Replace `generateOrderNo` method in `OrderService.java` (line 318)
    - Use format: `String.format("ORD%d%04d%03d", timestamp, random, threadId)`
    - timestamp = System.currentTimeMillis()
    - random = (int)(Math.random() * 10000) // 4 digits: 0000-9999
    - threadId = Thread.currentThread().getId() % 1000 // 3 digits: 000-999
    - This provides 4 digits of randomness + 3 digits of thread ID for better uniqueness
    - _Bug_Condition: isBugCondition4(orders) where orders created in same millisecond have duplicate order numbers_
    - _Expected_Behavior: Order numbers SHALL be unique even when created in the same millisecond, using enhanced entropy_
    - _Preservation: Order number format prefix "ORD" and timestamp component must remain unchanged_
    - _Requirements: 1.4.1, 1.4.2, 2.4.1, 2.4.2_

  - [x] 15.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Unique Order Numbers Under High Concurrency
    - **IMPORTANT**: Re-run the SAME test from task 13 - do NOT write a new test
    - The test from task 13 encodes the expected behavior
    - When this test passes, it confirms order numbers are unique
    - Run bug condition exploration test from step 13
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.4.1, 2.4.2_

  - [x] 15.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Order Number Format and Prefix
    - **IMPORTANT**: Re-run the SAME tests from task 14 - do NOT write new tests
    - Run preservation property tests from step 14
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm order number format and prefix still correct

- [x] 16. Checkpoint - Ensure Bug 4 tests pass
  - Ensure all Bug 4 tests pass, ask the user if questions arise

## Final Integration Testing

- [x] 17. Run full integration test suite
  - Test complete order-to-payment-to-cancellation flow with stock tracking
  - Test concurrent order creation and payment with limited stock
  - Test order timeout scenarios (unpaid orders that are never paid)
  - Test payment failure scenarios and rollback behavior
  - Test administrator workflow (order creation → payment → shipment → confirmation)
  - Test edge cases (simultaneous payment and cancellation attempts)
  - Verify all four bugs are fixed and no regressions introduced
  - _Requirements: All requirements from 1.1 through 3.6_

- [x] 18. Final checkpoint - All tests pass
  - Ensure all tests pass across all four bug fixes
  - Verify system is ready for graduation defense demonstration
  - Ask the user if any questions or issues arise
