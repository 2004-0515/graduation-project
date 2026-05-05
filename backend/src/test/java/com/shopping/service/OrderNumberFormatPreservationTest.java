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
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Preservation Property Test for Order Number Format
 * 
 * **Validates: Requirements 3.5.1, 3.5.2**
 * 
 * This test verifies that the order number format is preserved after the fix.
 * The test observes the current behavior on UNFIXED code and ensures that
 * the format (prefix "ORD" and timestamp component) remains unchanged.
 * 
 * IMPORTANT: This test should PASS on UNFIXED code to confirm baseline behavior.
 * 
 * Property 2: Preservation - Order Number Format and Prefix
 * 
 * For all generated order numbers, the format should:
 * 1. Start with "ORD" prefix
 * 2. Contain a timestamp component (numeric digits after "ORD")
 * 3. Be a valid string format
 * 
 * This test uses property-based testing approach with multiple randomized test cases
 * for stronger guarantees that the format is preserved across all scenarios.
 */
@SpringBootTest
@Transactional
class OrderNumberFormatPreservationTest {

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

    // Pattern to match the current order number format: ORD + timestamp + random digits
    // Current format: "ORD" + System.currentTimeMillis() + (int)(Math.random() * 1000)
    // Example: ORD1234567890123456 (ORD + 13 digits timestamp + 1-3 digits random)
    private static final Pattern ORDER_NUMBER_PATTERN = Pattern.compile("^ORD\\d+$");
    
    // Minimum length: "ORD" (3) + timestamp (13 digits) = 16 characters
    private static final int MIN_ORDER_NUMBER_LENGTH = 16;

    /**
     * Property: Order Number Format Preservation
     * 
     * For any order creation, the generated order number should:
     * 1. Start with "ORD" prefix
     * 2. Contain only alphanumeric characters (specifically: ORD followed by digits)
     * 3. Have a minimum length that includes the timestamp component
     * 
     * This property is tested across many randomly generated order scenarios
     * to ensure the format is consistent and preserved.
     * 
     * EXPECTED OUTCOME ON UNFIXED CODE: Test PASSES
     * - All order numbers start with "ORD"
     * - All order numbers contain timestamp component
     * - Format is consistent across all test cases
     * 
     * EXPECTED OUTCOME ON FIXED CODE: Test PASSES
     * - Same format preservation guarantees hold
     * - No regressions in order number format
     */
    @Test
    @DisplayName("Property: Order number format should start with ORD and contain timestamp (50 test cases)")
    void orderNumberFormat_shouldStartWithORDAndContainTimestamp() {
        System.out.println("\n=== Order Number Format Preservation Test ===");
        
        Random random = new Random();
        int totalTestCases = 50;
        
        for (int testCase = 1; testCase <= totalTestCases; testCase++) {
            // Randomize number of orders per test case (1-5)
            int numberOfOrders = random.nextInt(5) + 1;
            
            System.out.println("Test case " + testCase + "/" + totalTestCases + ": Testing with " + numberOfOrders + " order(s)");
            
            // Setup: Create test data
            User testUser = createTestUser("format_test_" + System.nanoTime() + "_" + testCase);
            Address testAddress = createTestAddress(testUser);
            Product testProduct = createTestProduct("FormatTest_" + System.nanoTime() + "_" + testCase, 1000);

            List<String> orderNumbers = new ArrayList<>();
            
            // Create orders and collect order numbers
            for (int i = 0; i < numberOfOrders; i++) {
                CreateOrderRequest request = new CreateOrderRequest();
                request.setAddressId(testAddress.getId());
                request.setPaymentMethod(OrderConstants.PaymentMethod.ALIPAY);

                CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
                itemRequest.setProductId(testProduct.getId());
                itemRequest.setQuantity(1);
                request.setItems(List.of(itemRequest));

                OrderDto createdOrder = orderService.createOrder(testUser.getUsername(), request);
                orderNumbers.add(createdOrder.getOrderNo());
            }
            
            // Verify all order numbers follow the expected format
            for (String orderNumber : orderNumbers) {
                // Property 1: Order number should not be null or empty
                assertNotNull(orderNumber, "Order number should not be null");
                assertFalse(orderNumber.isEmpty(), "Order number should not be empty");
                
                // Property 2: Order number should start with "ORD" prefix
                assertTrue(orderNumber.startsWith("ORD"),
                        String.format("Order number '%s' should start with 'ORD' prefix", orderNumber));
                
                // Property 3: Order number should match the expected pattern (ORD + digits)
                assertTrue(ORDER_NUMBER_PATTERN.matcher(orderNumber).matches(),
                        String.format("Order number '%s' should match pattern 'ORD' followed by digits", orderNumber));
                
                // Property 4: Order number should have minimum length (ORD + timestamp)
                assertTrue(orderNumber.length() >= MIN_ORDER_NUMBER_LENGTH,
                        String.format("Order number '%s' should have minimum length of %d characters (ORD + timestamp)",
                                orderNumber, MIN_ORDER_NUMBER_LENGTH));
                
                // Property 5: The timestamp component (first 13 digits after "ORD") should be parseable as a long
                // This verifies the timestamp component is present and valid
                // Note: The full numeric part may be longer due to additional entropy (random + thread ID)
                String numericPart = orderNumber.substring(3); // Remove "ORD" prefix
                assertTrue(numericPart.length() >= 13,
                        String.format("Order number '%s' should have at least 13 digits for timestamp after 'ORD'", orderNumber));
                
                // Extract and validate the timestamp portion (first 13 digits)
                String timestampStr = numericPart.substring(0, 13);
                try {
                    Long.parseLong(timestampStr);
                } catch (NumberFormatException e) {
                    fail(String.format("Order number '%s' should have valid numeric timestamp (first 13 digits) after 'ORD' prefix", orderNumber));
                }
                
                // Property 6: The timestamp component should be reasonable (within recent time range)
                // Extract the timestamp portion (first 13 digits after "ORD")
                if (numericPart.length() >= 13) {
                    long timestamp = Long.parseLong(timestampStr);
                    long currentTime = System.currentTimeMillis();
                    
                    // Timestamp should be within a reasonable range (not in the future, not too old)
                    assertTrue(timestamp <= currentTime,
                            String.format("Order number '%s' has timestamp %d which is in the future (current: %d)",
                                    orderNumber, timestamp, currentTime));
                    
                    // Timestamp should be recent (within last hour for this test)
                    long oneHourAgo = currentTime - (60 * 60 * 1000);
                    assertTrue(timestamp >= oneHourAgo,
                            String.format("Order number '%s' has timestamp %d which is too old (one hour ago: %d)",
                                    orderNumber, timestamp, oneHourAgo));
                }
            }
        }
        
        System.out.println("✓ All order numbers follow the expected format: ORD + timestamp + random digits");
        System.out.println("✓ Format preservation verified for " + totalTestCases + " test cases");
    }

    /**
     * Property: Order Number Prefix Consistency
     * 
     * A focused property test that specifically verifies the "ORD" prefix
     * is consistently applied to all order numbers, regardless of the
     * order creation scenario.
     * 
     * This is a critical preservation requirement: the prefix must remain
     * "ORD" even after the fix enhances the uniqueness guarantees.
     */
    @Test
    @DisplayName("Property: Order number prefix should always be ORD (100 test cases)")
    void orderNumberPrefix_shouldAlwaysBeORD() {
        System.out.println("\n=== Order Number Prefix Consistency Test ===");
        
        int totalTestCases = 100;
        
        for (int testCase = 1; testCase <= totalTestCases; testCase++) {
            // Setup: Create test data
            User testUser = createTestUser("prefix_test_" + System.nanoTime() + "_" + testCase);
            Address testAddress = createTestAddress(testUser);
            Product testProduct = createTestProduct("PrefixTest_" + System.nanoTime() + "_" + testCase, 1000);

            // Create a single order
            CreateOrderRequest request = new CreateOrderRequest();
            request.setAddressId(testAddress.getId());
            request.setPaymentMethod(OrderConstants.PaymentMethod.ALIPAY);

            CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
            itemRequest.setProductId(testProduct.getId());
            itemRequest.setQuantity(1);
            request.setItems(List.of(itemRequest));

            OrderDto createdOrder = orderService.createOrder(testUser.getUsername(), request);
            String orderNumber = createdOrder.getOrderNo();
            
            if (testCase % 20 == 0) {
                System.out.println("Test case " + testCase + "/" + totalTestCases + ": Order number = " + orderNumber);
            }
            
            // Verify the prefix
            assertNotNull(orderNumber, "Order number should not be null");
            assertTrue(orderNumber.startsWith("ORD"),
                    String.format("Order number '%s' must start with 'ORD' prefix", orderNumber));
            
            // Verify the prefix is exactly "ORD" (not "ORDER" or other variations)
            String prefix = orderNumber.substring(0, Math.min(3, orderNumber.length()));
            assertEquals("ORD", prefix,
                    String.format("Order number prefix should be exactly 'ORD', but got '%s'", prefix));
        }
        
        System.out.println("✓ Order number prefix 'ORD' is consistent across " + totalTestCases + " test cases");
    }

    /**
     * Property: Order Number Contains Timestamp Component
     * 
     * This property verifies that the order number contains a timestamp
     * component that reflects the time of order creation. This is important
     * for maintaining chronological ordering and debugging.
     * 
     * The timestamp should be:
     * 1. Present in the order number (after the "ORD" prefix)
     * 2. Reasonable (close to the current time)
     * 3. In milliseconds format (13 digits)
     */
    @Test
    @DisplayName("Property: Order number should contain timestamp component (50 test cases)")
    void orderNumber_shouldContainTimestampComponent() {
        System.out.println("\n=== Order Number Timestamp Component Test ===");
        
        int totalTestCases = 50;
        
        for (int testCase = 1; testCase <= totalTestCases; testCase++) {
            // Setup: Create test data
            User testUser = createTestUser("timestamp_test_" + System.nanoTime() + "_" + testCase);
            Address testAddress = createTestAddress(testUser);
            Product testProduct = createTestProduct("TimestampTest_" + System.nanoTime() + "_" + testCase, 1000);

            // Record time before order creation
            long beforeCreation = System.currentTimeMillis();
            
            // Create order
            CreateOrderRequest request = new CreateOrderRequest();
            request.setAddressId(testAddress.getId());
            request.setPaymentMethod(OrderConstants.PaymentMethod.ALIPAY);

            CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
            itemRequest.setProductId(testProduct.getId());
            itemRequest.setQuantity(1);
            request.setItems(List.of(itemRequest));

            OrderDto createdOrder = orderService.createOrder(testUser.getUsername(), request);
            String orderNumber = createdOrder.getOrderNo();
            
            // Record time after order creation
            long afterCreation = System.currentTimeMillis();
            
            if (testCase % 10 == 0) {
                System.out.println("Test case " + testCase + "/" + totalTestCases + ": Order number = " + orderNumber);
            }
            
            // Extract the numeric part after "ORD"
            assertNotNull(orderNumber, "Order number should not be null");
            assertTrue(orderNumber.startsWith("ORD"), "Order number should start with 'ORD'");
            
            String numericPart = orderNumber.substring(3);
            assertTrue(numericPart.length() >= 13,
                    String.format("Order number '%s' should have at least 13 digits for timestamp", orderNumber));
            
            // Extract the timestamp (first 13 digits)
            String timestampStr = numericPart.substring(0, 13);
            long timestamp = Long.parseLong(timestampStr);
            
            // Verify timestamp is within the creation time range
            assertTrue(timestamp >= beforeCreation && timestamp <= afterCreation,
                    String.format("Order number timestamp %d should be between %d and %d",
                            timestamp, beforeCreation, afterCreation));
        }
        
        System.out.println("✓ Order number contains valid timestamp component across " + totalTestCases + " test cases");
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
        product.setDescription("Test product for order number format preservation");
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
