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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Bug Condition Exploration Test for Stock Recovery on Unpaid Order Cancellation
 * 
 * **Validates: Requirements 1.1.1, 1.1.2, 2.1.1**
 * 
 * This test is designed to FAIL on unfixed code to confirm the bug exists.
 * The bug: When an unpaid order is cancelled, stock is incorrectly recovered
 * even though stock was never deducted for unpaid orders.
 * 
 * Expected behavior: For unpaid orders, stock should NOT be recovered on cancellation.
 * 
 * CRITICAL: This test encodes the expected behavior and will validate the fix
 * when it passes after implementation.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StockRecoveryBugConditionTest {

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
     * Property 1: Bug Condition - Stock Recovery on Unpaid Order Cancellation
     * 
     * For any unpaid order that is cancelled, the stock should NOT be recovered
     * because stock was never deducted for unpaid orders.
     * 
     * This test is scoped to unpaid orders (paymentStatus = UNPAID) that are cancelled.
     * 
     * EXPECTED OUTCOME ON UNFIXED CODE: Test FAILS
     * - Stock incorrectly increases when cancelling unpaid orders
     * - Example counterexample: "Cancelling unpaid order increases stock from 99 to 100"
     * 
     * EXPECTED OUTCOME ON FIXED CODE: Test PASSES
     * - Stock remains unchanged when cancelling unpaid orders
     */
    @Test
    @DisplayName("Bug Condition: Unpaid order cancellation should NOT recover stock")
    void unpaidOrderCancellation_shouldNotRecoverStock() {
        // Setup: Create test data with initial stock of 100
        int initialStock = 100;
        int orderQuantity = 5;
        
        User testUser = createTestUser("testuser_" + System.nanoTime());
        Address testAddress = createTestAddress(testUser);
        Product testProduct = createTestProduct("Product_" + System.nanoTime(), initialStock);

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

        // Record stock after order creation (may be deducted in unfixed code)
        Product productAfterOrder = productService.getProductById(testProduct.getId());
        int stockAfterOrder = productAfterOrder.getStock();
        
        System.out.println("Stock before order: " + stockBeforeOrder);
        System.out.println("Stock after order creation: " + stockAfterOrder);

        // Cancel the unpaid order
        orderService.cancelOrder(createdOrder.getId(), testUser.getUsername());

        // Get final stock level
        Product productAfterCancel = productService.getProductById(testProduct.getId());
        int stockAfterCancel = productAfterCancel.getStock();
        
        System.out.println("Stock after cancellation: " + stockAfterCancel);

        // ASSERTION: For unpaid orders, stock should NOT be recovered on cancellation
        // Stock after cancellation should equal stock after order creation
        assertEquals(stockAfterOrder, stockAfterCancel,
                String.format(
                        "BUG DETECTED: Stock incorrectly changed on unpaid order cancellation. " +
                        "Initial stock: %d, Stock after order: %d, Stock after cancel: %d. " +
                        "For unpaid orders, stock should remain unchanged on cancellation. " +
                        "This confirms the bug exists: the system incorrectly recovers stock for unpaid orders.",
                        stockBeforeOrder, stockAfterOrder, stockAfterCancel
                ));
        
        // Additional documentation of the counterexample
        if (stockAfterCancel != stockAfterOrder) {
            System.err.println("COUNTEREXAMPLE FOUND:");
            System.err.println("  Cancelling unpaid order incorrectly changed stock from " + 
                             stockAfterOrder + " to " + stockAfterCancel);
            System.err.println("  This proves the bug exists in the unfixed code.");
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
        product.setDescription("Test product for bug condition exploration");
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
