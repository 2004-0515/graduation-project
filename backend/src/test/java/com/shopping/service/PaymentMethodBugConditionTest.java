package com.shopping.service;

import com.shopping.constants.OrderConstants;
import com.shopping.dto.CreateOrderRequest;
import com.shopping.dto.OrderDto;
import com.shopping.entity.Address;
import com.shopping.entity.Category;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.repository.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Bug Condition Exploration Test for Missing Payment Processing Method
 * 
 * **Validates: Requirements 1.2.1, 1.2.2, 1.2.3, 2.2.1, 2.2.2**
 * 
 * This test is designed to FAIL on unfixed code to confirm the bug exists.
 * The bug: No payOrder method exists to process payments, and stock is deducted
 * at order creation instead of payment time.
 * 
 * Expected behavior: 
 * - payOrder method should exist
 * - Stock should be deducted at payment time, not order creation time
 * - Payment should update order status to PENDING_SHIPMENT
 * - Payment should update payment status to PAID
 * 
 * CRITICAL: This test encodes the expected behavior and will validate the fix
 * when it passes after implementation.
 */
@SpringBootTest
@Transactional
class PaymentMethodBugConditionTest {

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

    /**
     * Property 1: Bug Condition - Missing Payment Processing Method
     * 
     * For any order with PENDING_PAYMENT status and UNPAID paymentStatus,
     * the system should provide a payOrder method that:
     * 1. Deducts stock at payment time (not order creation time)
     * 2. Updates payment status to PAID
     * 3. Updates order status to PENDING_SHIPMENT
     * 4. Sets payment time and payment method
     * 
     * This test is scoped to orders with PENDING_PAYMENT status and UNPAID paymentStatus.
     * 
     * EXPECTED OUTCOME ON UNFIXED CODE: Test FAILS
     * - payOrder method does not exist (UnsupportedOperationException)
     * - OR stock is deducted at order creation instead of payment time
     * 
     * EXPECTED OUTCOME ON FIXED CODE: Test PASSES
     * - payOrder method exists and processes payment correctly
     * - Stock is deducted at payment time, not order creation time
     */
    @Test
    @DisplayName("Bug Condition: Payment processing method should exist and deduct stock at payment time")
    void paymentProcessing_shouldExistAndDeductStockAtPaymentTime() {
        // Setup: Create test data with initial stock of 100
        int initialStock = 100;
        int orderQuantity = 5;
        
        User testUser = createTestUser("testuser_payment_" + System.nanoTime());
        Address testAddress = createTestAddress(testUser);
        Product testProduct = createTestProduct("Product_Payment_" + System.nanoTime(), initialStock);

        // Record initial stock level
        int stockBeforeOrder = testProduct.getStock();
        assertEquals(initialStock, stockBeforeOrder, "Initial stock should be " + initialStock);

        // Create an order (status=PENDING_PAYMENT, paymentStatus=UNPAID)
        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddressId(testAddress.getId());
        request.setPaymentMethod(OrderConstants.PaymentMethod.ALIPAY);

        CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
        itemRequest.setProductId(testProduct.getId());
        itemRequest.setQuantity(orderQuantity);
        request.setItems(List.of(itemRequest));

        OrderDto createdOrder = orderService.createOrder(testUser.getUsername(), request);

        // Verify order is in PENDING_PAYMENT status with UNPAID payment status
        assertEquals(OrderConstants.OrderStatus.PENDING_PAYMENT, createdOrder.getOrderStatus(),
                "Order should be in PENDING_PAYMENT status");
        assertEquals(OrderConstants.PaymentStatus.UNPAID, createdOrder.getPaymentStatus(),
                "Order should have UNPAID payment status");

        // Check stock after order creation
        Product productAfterOrder = productService.getProductById(testProduct.getId());
        int stockAfterOrder = productAfterOrder.getStock();
        
        System.out.println("Stock before order: " + stockBeforeOrder);
        System.out.println("Stock after order creation: " + stockAfterOrder);

        // EXPECTED BEHAVIOR: Stock should NOT be deducted at order creation time
        // In the fixed code, stock should remain unchanged after order creation
        // In the unfixed code, stock is incorrectly deducted at order creation
        
        // Attempt to pay for the order
        OrderDto paidOrder = null;
        boolean payOrderMethodExists = true;
        Exception payOrderException = null;
        
        try {
            paidOrder = orderService.payOrder(
                createdOrder.getId(), 
                testUser.getUsername(), 
                OrderConstants.PaymentMethod.ALIPAY
            );
        } catch (UnsupportedOperationException e) {
            payOrderMethodExists = false;
            payOrderException = e;
            System.err.println("COUNTEREXAMPLE FOUND: payOrder method does not exist");
            System.err.println("Exception: " + e.getMessage());
        }

        // ASSERTION 1: payOrder method should exist
        assertTrue(payOrderMethodExists, 
                "BUG DETECTED: payOrder method does not exist. " +
                "The system has no way to process payments. " +
                "Exception: " + (payOrderException != null ? payOrderException.getMessage() : "N/A"));

        // If payOrder method exists, verify it works correctly
        if (payOrderMethodExists && paidOrder != null) {
            // Check stock after payment
            Product productAfterPayment = productService.getProductById(testProduct.getId());
            int stockAfterPayment = productAfterPayment.getStock();
            
            System.out.println("Stock after payment: " + stockAfterPayment);

            // ASSERTION 2: Stock should be deducted at payment time
            int expectedStockAfterPayment = initialStock - orderQuantity;
            assertEquals(expectedStockAfterPayment, stockAfterPayment,
                    String.format(
                            "BUG DETECTED: Stock should be deducted at payment time. " +
                            "Initial stock: %d, Expected after payment: %d, Actual: %d. " +
                            "Stock after order creation: %d",
                            initialStock, expectedStockAfterPayment, stockAfterPayment, stockAfterOrder
                    ));

            // ASSERTION 3: Payment status should be PAID
            assertEquals(OrderConstants.PaymentStatus.PAID, paidOrder.getPaymentStatus(),
                    "Payment status should be PAID after payment");

            // ASSERTION 4: Order status should be PENDING_SHIPMENT
            assertEquals(OrderConstants.OrderStatus.PENDING_SHIPMENT, paidOrder.getOrderStatus(),
                    "Order status should be PENDING_SHIPMENT after payment");

            // ASSERTION 5: Payment time should be set
            assertNotNull(paidOrder.getPaymentTime(),
                    "Payment time should be set after payment");

            // ASSERTION 6: Payment method should be set correctly
            assertEquals(OrderConstants.PaymentMethod.ALIPAY, paidOrder.getPaymentMethod(),
                    "Payment method should be set correctly");

            // Document the expected behavior
            System.out.println("EXPECTED BEHAVIOR VERIFIED:");
            System.out.println("  - payOrder method exists");
            System.out.println("  - Stock deducted at payment time: " + initialStock + " -> " + stockAfterPayment);
            System.out.println("  - Payment status updated to PAID");
            System.out.println("  - Order status updated to PENDING_SHIPMENT");
            System.out.println("  - Payment time set: " + paidOrder.getPaymentTime());
        }

        // Additional check: In unfixed code, stock might be deducted at order creation
        if (stockAfterOrder < stockBeforeOrder) {
            System.err.println("COUNTEREXAMPLE FOUND:");
            System.err.println("  Stock incorrectly deducted at order creation time");
            System.err.println("  Stock before order: " + stockBeforeOrder);
            System.err.println("  Stock after order: " + stockAfterOrder);
            System.err.println("  This proves the bug exists: stock should only be deducted at payment time");
            
            fail(String.format(
                    "BUG DETECTED: Stock was deducted at order creation time. " +
                    "Stock before: %d, Stock after order creation: %d. " +
                    "Stock should only be deducted when payment is confirmed, not at order creation.",
                    stockBeforeOrder, stockAfterOrder
            ));
        }
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
        product.setDescription("Test product for payment bug condition exploration");
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
            newCategory.setDescription("Test category for bug exploration");
            newCategory.setStatus(1);
            return categoryRepository.save(newCategory);
        });
        product.setCategory(category);
        
        return productService.saveProduct(product);
    }
}
