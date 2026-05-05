package com.shopping.service;

import com.shopping.constants.OrderConstants;
import com.shopping.constants.ProductConstants;
import com.shopping.dto.CreateOrderRequest;
import com.shopping.dto.OrderDto;
import com.shopping.entity.Address;
import com.shopping.entity.Category;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.exception.ValidationException;
import com.shopping.repository.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Preservation Property Test for Order Creation Validation and Entity Creation
 * 
 * **Validates: Requirements 3.1.1, 3.1.2, 3.1.3**
 * 
 * This test verifies the BASELINE behavior that must be preserved after the fix:
 * - Order creation validates product availability, stock levels, and address ownership
 * - Order and OrderItem entities are created correctly with proper pricing and product information
 * - Order status is set to PENDING_PAYMENT and payment status is set to UNPAID
 * 
 * This test is designed to PASS on unfixed code to confirm the behavior we want to preserve.
 * After implementing the fix (removing stock deduction from createOrder), this test should
 * continue to PASS, confirming no regression in validation and entity creation logic.
 * 
 * Property-based testing approach: Multiple test cases with randomized inputs for stronger guarantees.
 */
@SpringBootTest
class OrderCreationPreservationTest {

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
     * Property 2: Preservation - Order Creation Validation and Entity Creation
     * 
     * For all valid order creation requests, the system should:
     * 1. Validate product availability (status must be available)
     * 2. Validate stock levels (quantity must not exceed stock)
     * 3. Validate address ownership (address must belong to the user)
     * 4. Create Order entity with correct total amount
     * 5. Create OrderItem entities with correct pricing and product information
     * 6. Set orderStatus to PENDING_PAYMENT
     * 7. Set paymentStatus to UNPAID
     * 
     * This property uses property-based testing approach with multiple randomized
     * test cases for stronger guarantees.
     * 
     * EXPECTED OUTCOME ON UNFIXED CODE: Test PASSES
     * - All validation logic works correctly
     * - Order and OrderItem entities are created correctly
     * - This confirms the baseline behavior to preserve
     * 
     * EXPECTED OUTCOME ON FIXED CODE: Test PASSES
     * - Validation and entity creation continue to work correctly
     * - No regression introduced by removing stock deduction
     */
    @Test
    @DisplayName("Property: Order creation should validate and create entities correctly (20 randomized test cases)")
    @Transactional
    void orderCreation_shouldValidateAndCreateEntitiesCorrectly() {
        Random random = new Random();
        int testCases = 20;
        int passedCases = 0;

        System.out.println("Running property-based test with " + testCases + " randomized test cases...");

        for (int testCase = 0; testCase < testCases; testCase++) {
            // Generate random test parameters
            int initialStock = 50 + random.nextInt(151); // 50-200
            int orderQuantity = 1 + random.nextInt(10);  // 1-10
            int numberOfItems = 1 + random.nextInt(3);   // 1-3
            
            System.out.println(String.format("\n=== Test case %d/%d: initialStock=%d, orderQuantity=%d, numberOfItems=%d ===",
                    testCase + 1, testCases, initialStock, orderQuantity, numberOfItems));

            try {
                // Setup: Create test data
                User testUser = createTestUser("testuser_" + System.nanoTime());
                Address testAddress = createTestAddress(testUser);
                
                // Create multiple products for the order
                List<Product> testProducts = new ArrayList<>();
                for (int i = 0; i < numberOfItems; i++) {
                    Product product = createTestProduct("Product_" + System.nanoTime() + "_" + i, initialStock);
                    testProducts.add(product);
                }

                // Create order request
                CreateOrderRequest request = new CreateOrderRequest();
                request.setAddressId(testAddress.getId());
                request.setPaymentMethod(OrderConstants.PaymentMethod.ALIPAY);

                List<CreateOrderRequest.OrderItemRequest> itemRequests = new ArrayList<>();
                BigDecimal expectedTotalAmount = BigDecimal.ZERO;
                
                for (Product product : testProducts) {
                    CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
                    itemRequest.setProductId(product.getId());
                    itemRequest.setQuantity(orderQuantity);
                    itemRequests.add(itemRequest);
                    
                    // Calculate expected total amount
                    BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(orderQuantity));
                    expectedTotalAmount = expectedTotalAmount.add(itemTotal);
                }
                
                request.setItems(itemRequests);

                // Execute: Create order
                OrderDto createdOrder = orderService.createOrder(testUser.getUsername(), request);

                // Verify: Order entity is created correctly
                assertNotNull(createdOrder, "Order should be created");
                assertNotNull(createdOrder.getId(), "Order should have an ID");
                assertNotNull(createdOrder.getOrderNo(), "Order should have an order number");
                assertTrue(createdOrder.getOrderNo().startsWith("ORD"), "Order number should start with 'ORD'");
                
                // Verify: Order status is PENDING_PAYMENT
                assertEquals(OrderConstants.OrderStatus.PENDING_PAYMENT, createdOrder.getOrderStatus(),
                        "Order status should be PENDING_PAYMENT");
                
                // Verify: Payment status is UNPAID
                assertEquals(OrderConstants.PaymentStatus.UNPAID, createdOrder.getPaymentStatus(),
                        "Payment status should be UNPAID");
                
                // Verify: Total amount is calculated correctly
                assertEquals(0, expectedTotalAmount.compareTo(createdOrder.getTotalAmount()),
                        String.format("Total amount should be %s but was %s", 
                                expectedTotalAmount, createdOrder.getTotalAmount()));
                
                // Verify: OrderItem entities are created correctly
                assertNotNull(createdOrder.getItems(), "Order should have items");
                assertEquals(numberOfItems, createdOrder.getItems().size(),
                        "Order should have correct number of items");
                
                for (int i = 0; i < numberOfItems; i++) {
                    var orderItem = createdOrder.getItems().get(i);
                    var product = testProducts.get(i);
                    
                    assertNotNull(orderItem.getId(), "OrderItem should have an ID");
                    assertEquals(product.getId(), orderItem.getProductId(), "OrderItem should reference correct product");
                    assertEquals(product.getName(), orderItem.getProductName(), "OrderItem should have correct product name");
                    assertEquals(product.getMainImage(), orderItem.getProductImage(), "OrderItem should have correct product image");
                    assertEquals(0, product.getPrice().compareTo(orderItem.getPrice()), "OrderItem should have correct price");
                    assertEquals(orderQuantity, orderItem.getQuantity(), "OrderItem should have correct quantity");
                }
                
                // Verify: User information is correct
                assertEquals(testUser.getId(), createdOrder.getUserId(), "Order should belong to correct user");
                assertEquals(testUser.getUsername(), createdOrder.getUsername(), "Order should have correct username");
                
                // Verify: Address information is stored
                assertNotNull(createdOrder.getShippingAddress(), "Order should have shipping address");
                
                passedCases++;
                System.out.println("✓ Order creation validation and entity creation PASSED");
                
            } catch (AssertionError e) {
                System.err.println("✗ FAILED: " + e.getMessage());
                throw e;
            }
        }

        System.out.println(String.format("\n=== Property Test Summary: %d/%d test cases passed ===",
                passedCases, testCases));
    }

    /**
     * Property: Order creation should reject unavailable products
     * 
     * This test verifies that product availability validation continues to work correctly.
     */
    @Test
    @DisplayName("Property: Order creation should reject unavailable products (10 randomized test cases)")
    @Transactional
    void orderCreation_shouldRejectUnavailableProducts() {
        Random random = new Random();
        int testCases = 10;
        int passedCases = 0;

        System.out.println("Running property-based test with " + testCases + " randomized test cases...");

        for (int testCase = 0; testCase < testCases; testCase++) {
            int initialStock = 50 + random.nextInt(151); // 50-200
            int orderQuantity = 1 + random.nextInt(10);  // 1-10
            
            System.out.println(String.format("\n=== Test case %d/%d (Unavailable Product): initialStock=%d, orderQuantity=%d ===",
                    testCase + 1, testCases, initialStock, orderQuantity));

            try {
                // Setup: Create test data with unavailable product
                User testUser = createTestUser("testuser_" + System.nanoTime());
                Address testAddress = createTestAddress(testUser);
                Product testProduct = createTestProduct("Product_" + System.nanoTime(), initialStock);
                
                // Make product unavailable
                testProduct.setStatus(ProductConstants.Status.OFF_SHELF);
                productService.saveProduct(testProduct);

                // Create order request
                CreateOrderRequest request = new CreateOrderRequest();
                request.setAddressId(testAddress.getId());
                request.setPaymentMethod(OrderConstants.PaymentMethod.ALIPAY);

                CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
                itemRequest.setProductId(testProduct.getId());
                itemRequest.setQuantity(orderQuantity);
                request.setItems(List.of(itemRequest));

                // Execute & Verify: Should throw ValidationException
                ValidationException exception = assertThrows(ValidationException.class,
                        () -> orderService.createOrder(testUser.getUsername(), request),
                        "Should reject unavailable product");
                
                assertTrue(exception.getMessage().contains("已下架"),
                        "Exception message should indicate product is unavailable");
                
                passedCases++;
                System.out.println("✓ Unavailable product rejection PASSED");
                
            } catch (AssertionError e) {
                System.err.println("✗ FAILED: " + e.getMessage());
                throw e;
            }
        }

        System.out.println(String.format("\n=== Property Test Summary: %d/%d test cases passed ===",
                passedCases, testCases));
    }

    /**
     * Property: Order creation should reject insufficient stock
     * 
     * This test verifies that stock level validation continues to work correctly.
     */
    @Test
    @DisplayName("Property: Order creation should reject insufficient stock (10 randomized test cases)")
    @Transactional
    void orderCreation_shouldRejectInsufficientStock() {
        Random random = new Random();
        int testCases = 10;
        int passedCases = 0;

        System.out.println("Running property-based test with " + testCases + " randomized test cases...");

        for (int testCase = 0; testCase < testCases; testCase++) {
            int initialStock = 5 + random.nextInt(16); // 5-20
            int orderQuantity = initialStock + 1; // Request more than available
            
            System.out.println(String.format("\n=== Test case %d/%d (Insufficient Stock): initialStock=%d, orderQuantity=%d ===",
                    testCase + 1, testCases, initialStock, orderQuantity));

            try {
                // Setup: Create test data
                User testUser = createTestUser("testuser_" + System.nanoTime());
                Address testAddress = createTestAddress(testUser);
                Product testProduct = createTestProduct("Product_" + System.nanoTime(), initialStock);

                // Create order request with quantity exceeding stock
                CreateOrderRequest request = new CreateOrderRequest();
                request.setAddressId(testAddress.getId());
                request.setPaymentMethod(OrderConstants.PaymentMethod.ALIPAY);

                CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
                itemRequest.setProductId(testProduct.getId());
                itemRequest.setQuantity(orderQuantity);
                request.setItems(List.of(itemRequest));

                // Execute & Verify: Should throw ValidationException
                ValidationException exception = assertThrows(ValidationException.class,
                        () -> orderService.createOrder(testUser.getUsername(), request),
                        "Should reject order with insufficient stock");
                
                assertTrue(exception.getMessage().contains("库存不足"),
                        "Exception message should indicate insufficient stock");
                
                passedCases++;
                System.out.println("✓ Insufficient stock rejection PASSED");
                
            } catch (AssertionError e) {
                System.err.println("✗ FAILED: " + e.getMessage());
                throw e;
            }
        }

        System.out.println(String.format("\n=== Property Test Summary: %d/%d test cases passed ===",
                passedCases, testCases));
    }

    /**
     * Property: Order creation should reject invalid address ownership
     * 
     * This test verifies that address ownership validation continues to work correctly.
     */
    @Test
    @DisplayName("Property: Order creation should reject invalid address ownership (10 randomized test cases)")
    @Transactional
    void orderCreation_shouldRejectInvalidAddressOwnership() {
        Random random = new Random();
        int testCases = 10;
        int passedCases = 0;

        System.out.println("Running property-based test with " + testCases + " randomized test cases...");

        for (int testCase = 0; testCase < testCases; testCase++) {
            int initialStock = 50 + random.nextInt(151); // 50-200
            int orderQuantity = 1 + random.nextInt(10);  // 1-10
            
            System.out.println(String.format("\n=== Test case %d/%d (Invalid Address): initialStock=%d, orderQuantity=%d ===",
                    testCase + 1, testCases, initialStock, orderQuantity));

            try {
                // Setup: Create two users and their addresses
                User testUser1 = createTestUser("testuser1_" + System.nanoTime());
                User testUser2 = createTestUser("testuser2_" + System.nanoTime());
                Address testAddress1 = createTestAddress(testUser1);
                Product testProduct = createTestProduct("Product_" + System.nanoTime(), initialStock);

                // Create order request for user2 using user1's address
                CreateOrderRequest request = new CreateOrderRequest();
                request.setAddressId(testAddress1.getId()); // User1's address
                request.setPaymentMethod(OrderConstants.PaymentMethod.ALIPAY);

                CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
                itemRequest.setProductId(testProduct.getId());
                itemRequest.setQuantity(orderQuantity);
                request.setItems(List.of(itemRequest));

                // Execute & Verify: Should throw ValidationException
                ValidationException exception = assertThrows(ValidationException.class,
                        () -> orderService.createOrder(testUser2.getUsername(), request),
                        "Should reject order with address belonging to another user");
                
                assertTrue(exception.getMessage().contains("地址") || exception.getMessage().contains("无效"),
                        "Exception message should indicate invalid address");
                
                passedCases++;
                System.out.println("✓ Invalid address ownership rejection PASSED");
                
            } catch (AssertionError e) {
                System.err.println("✗ FAILED: " + e.getMessage());
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
        product.setStatus(ProductConstants.Status.ON_SHELF); // Available
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
