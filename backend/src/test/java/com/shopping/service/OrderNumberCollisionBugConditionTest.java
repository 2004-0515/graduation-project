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
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Bug Condition Exploration Test for Order Number Collisions
 * 
 * **Validates: Requirements 1.4.1, 1.4.2, 2.4.1**
 * 
 * This test is designed to FAIL on unfixed code to confirm the bug exists.
 * The bug: When multiple orders are created in rapid succession or in the same
 * millisecond, the current order number generation format "ORD" + timestamp + 
 * random(0-999) has insufficient uniqueness guarantees, leading to potential collisions.
 * 
 * Expected behavior: All order numbers should be unique, even when created
 * in the same millisecond or in rapid succession.
 * 
 * CRITICAL: This test encodes the expected behavior and will validate the fix
 * when it passes after implementation.
 */
@SpringBootTest
@ActiveProfiles("test")
class OrderNumberCollisionBugConditionTest {

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
     * Property 1: Bug Condition - Order Number Collision Under High Concurrency
     * 
     * For any set of orders created concurrently (including within the same millisecond),
     * all order numbers should be unique. The current implementation uses only 3 digits
     * of randomness (0-999), which is insufficient for high-concurrency scenarios.
     * 
     * This test is scoped to orders created in rapid succession.
     * 
     * Test scenario:
     * - Create 1000 orders in rapid succession
     * - Collect all order numbers
     * - Assert all are unique (no duplicates)
     * 
     * EXPECTED OUTCOME ON UNFIXED CODE: Test FAILS
     * - Some duplicate order numbers are found
     * - Example counterexample: "Order numbers ORD1234567890123456 and ORD1234567890123456 are duplicates"
     * 
     * EXPECTED OUTCOME ON FIXED CODE: Test PASSES
     * - All order numbers are unique
     * - COUNT(DISTINCT orderNumbers) == COUNT(orderNumbers)
     */
    @Test
    @DisplayName("Bug Condition: Rapid order creation should not produce duplicate order numbers")
    void rapidOrderCreation_shouldNotProduceDuplicateOrderNumbers() throws InterruptedException {
        // Setup: Create test data
        int numberOfOrders = 1000;
        
        User testUser = createTestUser("ordernum_test_" + System.nanoTime());
        Address testAddress = createTestAddress(testUser);
        Product testProduct = createTestProduct("OrderNumTest_" + System.nanoTime(), 10000);

        System.out.println("=== Order Number Collision Bug Condition Test ===");
        System.out.println("Creating " + numberOfOrders + " orders in rapid succession...");
        System.out.println("Current order number format: ORD + timestamp + random(0-999)");
        System.out.println("With only 3 digits of randomness, collisions are likely in same millisecond");

        // Use concurrent execution to maximize the chance of same-millisecond orders
        int threadPoolSize = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadPoolSize);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfOrders);
        
        List<String> orderNumbers = new CopyOnWriteArrayList<>();
        List<String> errors = new CopyOnWriteArrayList<>();
        
        // Submit order creation tasks
        for (int i = 0; i < numberOfOrders; i++) {
            final int orderNum = i + 1;
            executor.submit(() -> {
                try {
                    // Wait for all threads to be ready
                    startLatch.await();
                    
                    // Create order request
                    CreateOrderRequest request = new CreateOrderRequest();
                    request.setAddressId(testAddress.getId());
                    request.setPaymentMethod(OrderConstants.PaymentMethod.ALIPAY);

                    CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
                    itemRequest.setProductId(testProduct.getId());
                    itemRequest.setQuantity(1);
                    request.setItems(List.of(itemRequest));

                    // Create order
                    OrderDto createdOrder = orderService.createOrder(testUser.getUsername(), request);
                    orderNumbers.add(createdOrder.getOrderNo());
                    
                    if (orderNum % 100 == 0) {
                        System.out.println("Created " + orderNum + " orders...");
                    }
                    
                } catch (Exception e) {
                    errors.add("Order " + orderNum + " failed: " + e.getMessage());
                } finally {
                    doneLatch.countDown();
                }
            });
        }
        
        // Start all threads simultaneously
        long startTime = System.currentTimeMillis();
        startLatch.countDown();
        
        // Wait for all orders to be created (with timeout)
        boolean completed = doneLatch.await(60, TimeUnit.SECONDS);
        long endTime = System.currentTimeMillis();
        
        assertTrue(completed, "All order creation tasks should complete within timeout");
        
        // Shutdown executor
        executor.shutdown();
        executor.awaitTermination(10, TimeUnit.SECONDS);
        
        System.out.println("\n=== Order Creation Completed ===");
        System.out.println("Time taken: " + (endTime - startTime) + " ms");
        System.out.println("Orders created: " + orderNumbers.size());
        System.out.println("Errors: " + errors.size());
        
        // Check for duplicate order number errors (database constraint violations)
        boolean duplicateErrorDetected = errors.stream()
                .anyMatch(error -> error.contains("Duplicate entry") && error.contains("order_no"));
        
        if (!errors.isEmpty()) {
            System.err.println("\nErrors encountered:");
            errors.forEach(System.err::println);
            
            if (duplicateErrorDetected) {
                System.err.println("\n!!! COUNTEREXAMPLE FOUND (Database Constraint Violation) !!!");
                System.err.println("BUG DETECTED: Order number collision detected by database!");
                System.err.println("The database rejected an order due to duplicate order_no.");
                System.err.println("This proves the bug exists: order number generation produces duplicates.");
            }
        }
        
        // Analyze order numbers for duplicates
        int totalOrders = orderNumbers.size();
        Set<String> uniqueOrderNumbers = new HashSet<>(orderNumbers);
        int uniqueCount = uniqueOrderNumbers.size();
        
        System.out.println("\n=== Order Number Analysis ===");
        System.out.println("Total order numbers: " + totalOrders);
        System.out.println("Unique order numbers: " + uniqueCount);
        System.out.println("Duplicates found: " + (totalOrders - uniqueCount));
        
        // Find and document duplicate order numbers
        if (uniqueCount < totalOrders) {
            System.err.println("\n!!! COUNTEREXAMPLE FOUND !!!");
            System.err.println("BUG DETECTED: Order number collisions occurred!");
            
            // Find which order numbers are duplicated
            Map<String, Long> orderNumberCounts = orderNumbers.stream()
                    .collect(Collectors.groupingBy(orderNo -> orderNo, Collectors.counting()));
            
            List<Map.Entry<String, Long>> duplicates = orderNumberCounts.entrySet().stream()
                    .filter(entry -> entry.getValue() > 1)
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .collect(Collectors.toList());
            
            System.err.println("\nDuplicate order numbers (showing up to 10):");
            duplicates.stream().limit(10).forEach(entry -> {
                System.err.println("  Order number: " + entry.getKey() + 
                                 " (appears " + entry.getValue() + " times)");
            });
            
            System.err.println("\nThis proves the bug exists: the current order number generation");
            System.err.println("format with only 3 digits of randomness is insufficient for");
            System.err.println("high-concurrency scenarios, leading to collisions.");
        }
        
        // ASSERTION 1: Check for database constraint violations due to duplicates
        assertFalse(duplicateErrorDetected,
                String.format(
                        "BUG DETECTED: Order number collision detected by database constraint! " +
                        "At least one order failed due to duplicate order_no. " +
                        "This confirms the bug exists: the current order number generation " +
                        "format (ORD + timestamp + random(0-999)) has insufficient uniqueness " +
                        "guarantees for high-concurrency scenarios. " +
                        "Successfully created: %d orders, Errors: %d",
                        totalOrders, errors.size()
                ));
        
        // ASSERTION 2: All successfully created order numbers should be unique
        // COUNT(DISTINCT orderNumbers) == COUNT(orderNumbers)
        assertEquals(totalOrders, uniqueCount,
                String.format(
                        "BUG DETECTED: Order number collisions found in successfully created orders! " +
                        "Created %d orders but only %d unique order numbers. " +
                        "%d duplicate(s) detected. " +
                        "This confirms the bug exists: the current order number generation " +
                        "format (ORD + timestamp + random(0-999)) has insufficient uniqueness " +
                        "guarantees for high-concurrency scenarios.",
                        totalOrders, uniqueCount, (totalOrders - uniqueCount)
                ));
        
        System.out.println("\n=== Test Completed ===");
        if (uniqueCount == totalOrders) {
            System.out.println("✓ No collisions detected - bug is fixed!");
        }
    }

    /**
     * Additional test: Sequential order creation
     * 
     * This test creates orders sequentially (not concurrently) to verify that
     * even in a simpler scenario, the order number generation should work correctly.
     * This serves as a baseline test.
     */
    @Test
    @DisplayName("Bug Condition: Sequential order creation should produce unique order numbers")
    void sequentialOrderCreation_shouldProduceUniqueOrderNumbers() {
        // Setup: Create test data
        int numberOfOrders = 100;
        
        User testUser = createTestUser("sequential_test_" + System.nanoTime());
        Address testAddress = createTestAddress(testUser);
        Product testProduct = createTestProduct("SequentialTest_" + System.nanoTime(), 1000);

        System.out.println("\n=== Sequential Order Creation Test ===");
        System.out.println("Creating " + numberOfOrders + " orders sequentially...");

        List<String> orderNumbers = new ArrayList<>();
        
        // Create orders sequentially
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
        
        // Analyze order numbers
        int totalOrders = orderNumbers.size();
        Set<String> uniqueOrderNumbers = new HashSet<>(orderNumbers);
        int uniqueCount = uniqueOrderNumbers.size();
        
        System.out.println("Total order numbers: " + totalOrders);
        System.out.println("Unique order numbers: " + uniqueCount);
        
        if (uniqueCount < totalOrders) {
            System.err.println("\n!!! COUNTEREXAMPLE FOUND (Sequential) !!!");
            System.err.println("BUG DETECTED: Even in sequential order creation, collisions occurred!");
            System.err.println("Duplicates found: " + (totalOrders - uniqueCount));
        }
        
        // ASSERTION: All order numbers should be unique
        assertEquals(totalOrders, uniqueCount,
                String.format(
                        "BUG DETECTED: Order number collisions in sequential creation! " +
                        "Created %d orders but only %d unique order numbers.",
                        totalOrders, uniqueCount
                ));
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
        product.setDescription("Test product for order number collision bug exploration");
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
