package com.shopping.service;

import com.shopping.constants.OrderConstants;
import com.shopping.dto.CreateOrderRequest;
import com.shopping.dto.OrderDto;
import com.shopping.entity.Address;
import com.shopping.entity.Category;
import com.shopping.entity.Order;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.repository.CategoryRepository;
import com.shopping.repository.OrderRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Preservation Property Test for Stock Recovery on Paid Order Cancellation
 * 
 * **Validates: Requirements 3.2.1, 3.2.2, 3.2.3**
 * 
 * This test verifies the BASELINE behavior that must be preserved after the fix:
 * When a PAID order is cancelled, stock should be recovered.
 * 
 * This test is designed to PASS on unfixed code to confirm the behavior we want to preserve.
 * After implementing the fix, this test should continue to PASS, confirming no regression.
 * 
 * Property-based testing approach: Multiple test cases with randomized inputs for stronger guarantees.
 */
@SpringBootTest
@Transactional
class StockRecoveryPreservationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductService productService;

    @Autowired
    private UserService userService;

    @Autowired
    private AddressService addressService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    /**
     * Property 2: Preservation - Stock Recovery for Paid Orders
     * 
     * For all paid orders (paymentStatus = PAID), cancellation should recover stock
     * by calling increaseStock() for each order item.
     * 
     * This property uses a property-based testing approach with multiple randomized
     * test cases to provide stronger guarantees.
     * 
     * EXPECTED OUTCOME ON UNFIXED CODE: Test PASSES
     * - Stock is correctly recovered when cancelling paid orders
     * - This confirms the baseline behavior to preserve
     * 
     * EXPECTED OUTCOME ON FIXED CODE: Test PASSES
     * - Stock recovery for paid orders continues to work correctly
     * - No regression introduced by the fix
     */
    @Test
    @DisplayName("Property: Paid order cancellation should recover stock (20 randomized test cases)")
    void paidOrderCancellation_shouldRecoverStock() {
        Random random = new Random();
        int testCases = 20;
        int passedCases = 0;

        System.out.println("Running property-based test with " + testCases + " randomized test cases...");

        for (int i = 0; i < testCases; i++) {
            // Generate random test parameters
            int initialStock = 50 + random.nextInt(151); // 50-200
            int orderQuantity = 1 + random.nextInt(10);  // 1-10

            System.out.println(String.format("\nTest case %d/%d: initialStock=%d, orderQuantity=%d",
                    i + 1, testCases, initialStock, orderQuantity));

            try {
                // Setup: Create test data
                User testUser = createTestUser("testuser_" + System.nanoTime());
                Address testAddress = createTestAddress(testUser);
                Product testProduct = createTestProduct("Product_" + System.nanoTime(), initialStock);

                // Record initial stock level
                int stockBeforeOrder = testProduct.getStock();
                assertEquals(initialStock, stockBeforeOrder, "Initial stock should match");

                // Create an order (status=PENDING_PAYMENT, paymentStatus=UNPAID)
                CreateOrderRequest request = new CreateOrderRequest();
                request.setAddressId(testAddress.getId());
                request.setPaymentMethod(OrderConstants.PaymentMethod.ALIPAY);

                CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
                itemRequest.setProductId(testProduct.getId());
                itemRequest.setQuantity(orderQuantity);
                request.setItems(List.of(itemRequest));

                OrderDto createdOrder = orderService.createOrder(testUser.getUsername(), request);

                // Manually simulate payment by updating payment status to PAID
                // BUT keep order status as PENDING_PAYMENT so it can be cancelled
                // (In unfixed code, only PENDING_PAYMENT orders can be cancelled)
                // This creates an inconsistent state, but it's necessary to test stock recovery
                Order order = orderRepository.findById(createdOrder.getId()).orElseThrow();
                order.setPaymentStatus(OrderConstants.PaymentStatus.PAID);
                // Keep orderStatus as PENDING_PAYMENT to allow cancellation in unfixed code
                order.setPaymentTime(LocalDateTime.now());
                orderRepository.save(order);

                // Verify order has PAID payment status
                OrderDto paidOrder = orderService.getOrderByIdAndUser(createdOrder.getId(), testUser.getUsername());
                assertEquals(OrderConstants.PaymentStatus.PAID, paidOrder.getPaymentStatus(),
                        "Order should have PAID payment status");
                // Note: orderStatus remains PENDING_PAYMENT to allow cancellation

                // Record stock after payment (should be deducted in unfixed code)
                Product productAfterPayment = productService.getProductById(testProduct.getId());
                int stockAfterPayment = productAfterPayment.getStock();

                System.out.println(String.format("  Stock: before=%d, after_payment=%d",
                        stockBeforeOrder, stockAfterPayment));

                // Cancel the paid order
                orderService.cancelOrder(createdOrder.getId(), testUser.getUsername());

                // Get final stock level
                Product productAfterCancel = productService.getProductById(testProduct.getId());
                int stockAfterCancel = productAfterCancel.getStock();

                System.out.println(String.format("  Stock after cancel: %d (expected: %d)",
                        stockAfterCancel, stockAfterPayment + orderQuantity));

                // ASSERTION: For paid orders, stock SHOULD be recovered on cancellation
                // Stock after cancellation should equal stock after payment + order quantity
                assertEquals(stockAfterPayment + orderQuantity, stockAfterCancel,
                        String.format(
                                "PRESERVATION CHECK FAILED: Stock should be recovered for paid orders. " +
                                "Initial stock: %d, Stock after payment: %d, Stock after cancel: %d, Order quantity: %d. " +
                                "Expected stock after cancel: %d (stock after payment + order quantity). " +
                                "This behavior must be preserved after the fix.",
                                stockBeforeOrder, stockAfterPayment, stockAfterCancel, orderQuantity,
                                stockAfterPayment + orderQuantity
                        ));

                passedCases++;
                System.out.println("  ✓ PASSED");

            } catch (AssertionError e) {
                System.err.println("  ✗ FAILED: " + e.getMessage());
                throw e;
            }
        }

        System.out.println(String.format("\n=== Property Test Summary: %d/%d test cases passed ===",
                passedCases, testCases));
    }

    /**
     * Additional property test: Verify stock recovery amount matches order quantity
     * 
     * This test focuses on verifying that the exact quantity ordered is recovered,
     * not more, not less.
     */
    @Test
    @DisplayName("Property: Paid order cancellation should recover exact quantity (15 randomized test cases)")
    void paidOrderCancellation_shouldRecoverExactQuantity() {
        Random random = new Random();
        int testCases = 15;
        int passedCases = 0;

        System.out.println("Running property-based test with " + testCases + " randomized test cases...");

        for (int i = 0; i < testCases; i++) {
            // Generate random test parameters
            int initialStock = 100 + random.nextInt(51); // 100-150
            int orderQuantity = 5 + random.nextInt(11);  // 5-15

            System.out.println(String.format("\nTest case %d/%d: initialStock=%d, orderQuantity=%d",
                    i + 1, testCases, initialStock, orderQuantity));

            try {
                // Setup
                User testUser = createTestUser("testuser_" + System.nanoTime());
                Address testAddress = createTestAddress(testUser);
                Product testProduct = createTestProduct("Product_" + System.nanoTime(), initialStock);

                int stockBeforeOrder = testProduct.getStock();

                // Create order
                CreateOrderRequest request = new CreateOrderRequest();
                request.setAddressId(testAddress.getId());
                request.setPaymentMethod(OrderConstants.PaymentMethod.WECHAT);

                CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
                itemRequest.setProductId(testProduct.getId());
                itemRequest.setQuantity(orderQuantity);
                request.setItems(List.of(itemRequest));

                OrderDto createdOrder = orderService.createOrder(testUser.getUsername(), request);

                // Simulate payment by setting payment status to PAID
                // BUT keep order status as PENDING_PAYMENT so it can be cancelled
                Order order = orderRepository.findById(createdOrder.getId()).orElseThrow();
                order.setPaymentStatus(OrderConstants.PaymentStatus.PAID);
                // Keep orderStatus as PENDING_PAYMENT to allow cancellation in unfixed code
                order.setPaymentTime(LocalDateTime.now());
                orderRepository.save(order);

                // Get stock after payment
                Product productAfterPayment = productService.getProductById(testProduct.getId());
                int stockAfterPayment = productAfterPayment.getStock();

                // Cancel order
                orderService.cancelOrder(createdOrder.getId(), testUser.getUsername());

                // Verify exact recovery
                Product productAfterCancel = productService.getProductById(testProduct.getId());
                int stockAfterCancel = productAfterCancel.getStock();

                int recoveredAmount = stockAfterCancel - stockAfterPayment;

                System.out.println(String.format("  Recovered: %d (expected: %d)",
                        recoveredAmount, orderQuantity));

                assertEquals(orderQuantity, recoveredAmount,
                        String.format(
                                "PRESERVATION CHECK FAILED: Recovered stock amount should exactly match order quantity. " +
                                "Order quantity: %d, Recovered amount: %d. " +
                                "This precision must be preserved after the fix.",
                                orderQuantity, recoveredAmount
                        ));

                passedCases++;
                System.out.println("  ✓ PASSED");

            } catch (AssertionError e) {
                System.err.println("  ✗ FAILED: " + e.getMessage());
                throw e;
            }
        }

        System.out.println(String.format("\n=== Property Test Summary: %d/%d test cases passed ===",
                passedCases, testCases));
    }

    // Helper methods to create test data

    private User createTestUser(String username) {
        User user = new User();
        user.setUsername(username);
        user.setPassword("$2a$10$test"); // BCrypt encoded password
        user.setEmail(username + "@test.com");
        user.setPhone("13800138000");
        user.setStatus(1); // Active user
        return userService.saveUser(user);
    }

    private Address createTestAddress(User user) {
        Address address = new Address();
        address.setUser(user);
        address.setName("Test User");
        address.setPhone("13800138000");
        address.setProvince("Guangdong");
        address.setCity("Shenzhen");
        address.setDistrict("Nanshan");
        address.setDetail("Science Park Road 1");
        address.setIsDefault(true);
        return addressService.createAddress(address);
    }

    private Product createTestProduct(String name, int stock) {
        Product product = new Product();
        product.setName(name);
        product.setDescription("Test product for preservation testing");
        product.setPrice(BigDecimal.valueOf(99.99));
        product.setOriginalPrice(BigDecimal.valueOf(149.99));
        product.setStock(stock);
        product.setSales(0);
        product.setStatus(1); // Available
        product.setAuditStatus(1); // Approved
        product.setMainImage("http://example.com/image.jpg");
        
        // Get or create a test category
        Category category = categoryRepository.findById(1L).orElseGet(() -> {
            Category newCategory = new Category();
            newCategory.setName("Test Category");
            newCategory.setDescription("Test category for preservation testing");
            newCategory.setStatus(1);
            return categoryRepository.save(newCategory);
        });
        product.setCategory(category);
        
        return productService.saveProduct(product);
    }
}
