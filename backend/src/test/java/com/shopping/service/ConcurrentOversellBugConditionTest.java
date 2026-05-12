package com.shopping.service;

import com.shopping.entity.Category;
import com.shopping.entity.Product;
import com.shopping.exception.ValidationException;
import com.shopping.repository.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Bug Condition Exploration Test for Concurrent Overselling
 * 
 * **Validates: Requirements 1.3.1, 1.3.2, 2.3.1**
 * 
 * This test is designed to FAIL on unfixed code to confirm the bug exists.
 * The bug: When multiple users simultaneously attempt to purchase a product with
 * limited stock, the system allows overselling due to race conditions in the
 * stock check and deduction logic.
 * 
 * Expected behavior: At most floor(stock/quantity) transactions should succeed,
 * and final stock should be >= 0.
 * 
 * CRITICAL: This test encodes the expected behavior and will validate the fix
 * when it passes after implementation.
 */
@SpringBootTest
@ActiveProfiles("test")
class ConcurrentOversellBugConditionTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryRepository categoryRepository;

    /**
     * Property 1: Bug Condition - Concurrent Stock Deduction Race Condition
     * 
     * For any set of concurrent stock deduction requests targeting the same product
     * where totalRequested > availableStock, at most floor(stock/quantity) requests
     * should succeed, and all other requests should fail with "商品库存不足".
     * 
     * This test is scoped to concurrent transactions targeting the same product.
     * 
     * Test scenario:
     * - Product stock: 5
     * - 3 concurrent threads each requesting quantity: 3
     * - Expected: At most 1 thread succeeds (floor(5/3) = 1)
     * - Expected: Final stock >= 0
     * 
     * EXPECTED OUTCOME ON UNFIXED CODE: Test FAILS
     * - Multiple threads succeed causing overselling
     * - Final stock becomes negative
     * - Example counterexample: "3 concurrent requests for quantity=3 all succeeded when stock=5, final stock=-4"
     * 
     * EXPECTED OUTCOME ON FIXED CODE: Test PASSES
     * - At most 1 thread succeeds
     * - Other threads fail with "商品库存不足"
     * - Final stock >= 0
     */
    @Test
    @DisplayName("Bug Condition: Concurrent stock deduction should prevent overselling")
    void concurrentStockDeduction_shouldPreventOverselling() throws InterruptedException {
        // Setup: Create test product with initial stock of 5
        int initialStock = 5;
        int requestQuantity = 3;
        int concurrentThreads = 3;
        int expectedMaxSuccesses = initialStock / requestQuantity; // floor(5/3) = 1

        Product testProduct = createTestProduct("ConcurrentTest_" + System.nanoTime(), initialStock);
        Long productId = testProduct.getId();

        System.out.println("=== Concurrent Overselling Bug Condition Test ===");
        System.out.println("Initial stock: " + initialStock);
        System.out.println("Request quantity per thread: " + requestQuantity);
        System.out.println("Number of concurrent threads: " + concurrentThreads);
        System.out.println("Expected max successes: " + expectedMaxSuccesses);
        System.out.println("Total requested: " + (requestQuantity * concurrentThreads));

        // Use CountDownLatch to synchronize thread start for maximum concurrency
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(concurrentThreads);
        
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        List<String> results = new CopyOnWriteArrayList<>();
        
        // Create thread pool
        ExecutorService executor = Executors.newFixedThreadPool(concurrentThreads);
        
        // Submit concurrent stock deduction tasks
        for (int i = 0; i < concurrentThreads; i++) {
            final int threadNum = i + 1;
            executor.submit(() -> {
                try {
                    // Wait for all threads to be ready
                    startLatch.await();
                    
                    // Attempt to reduce stock
                    productService.reduceStock(productId, requestQuantity);
                    
                    // If we reach here, the operation succeeded
                    successCount.incrementAndGet();
                    String result = "Thread " + threadNum + ": SUCCESS - reduced stock by " + requestQuantity;
                    results.add(result);
                    System.out.println(result);
                    
                } catch (ValidationException e) {
                    // Expected failure when stock is insufficient
                    failureCount.incrementAndGet();
                    String result = "Thread " + threadNum + ": FAILED - " + e.getMessage();
                    results.add(result);
                    System.out.println(result);
                    
                } catch (Exception e) {
                    String result = "Thread " + threadNum + ": ERROR - " + e.getMessage();
                    results.add(result);
                    System.err.println(result);
                    e.printStackTrace();
                    
                } finally {
                    doneLatch.countDown();
                }
            });
        }
        
        // Start all threads simultaneously
        startLatch.countDown();
        
        // Wait for all threads to complete (with timeout)
        boolean completed = doneLatch.await(10, TimeUnit.SECONDS);
        assertTrue(completed, "All threads should complete within timeout");
        
        // Shutdown executor
        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);
        
        // Get final stock level
        Product finalProduct = productService.getProductById(productId);
        int finalStock = finalProduct.getStock();
        
        System.out.println("\n=== Results ===");
        System.out.println("Successful reductions: " + successCount.get());
        System.out.println("Failed reductions: " + failureCount.get());
        System.out.println("Final stock: " + finalStock);
        System.out.println("\nDetailed results:");
        results.forEach(System.out::println);
        
        // ASSERTION 1: At most floor(stock/quantity) transactions should succeed
        boolean oversellDetected = successCount.get() > expectedMaxSuccesses;
        
        if (oversellDetected) {
            System.err.println("\n!!! COUNTEREXAMPLE FOUND !!!");
            System.err.println("BUG DETECTED: Concurrent overselling occurred!");
            System.err.println("  Initial stock: " + initialStock);
            System.err.println("  Request quantity: " + requestQuantity);
            System.err.println("  Expected max successes: " + expectedMaxSuccesses);
            System.err.println("  Actual successes: " + successCount.get());
            System.err.println("  Final stock: " + finalStock);
            System.err.println("  This proves the bug exists: multiple concurrent transactions succeeded when they should not have.");
        }
        
        assertFalse(oversellDetected,
                String.format(
                        "BUG DETECTED: Overselling occurred! " +
                        "Expected at most %d successful transactions (floor(%d/%d)), but got %d. " +
                        "Initial stock: %d, Final stock: %d. " +
                        "This confirms the bug exists: the system allows concurrent overselling.",
                        expectedMaxSuccesses, initialStock, requestQuantity, successCount.get(),
                        initialStock, finalStock
                ));
        
        // ASSERTION 2: Final stock should be >= 0 (no negative stock)
        boolean negativeStockDetected = finalStock < 0;
        
        if (negativeStockDetected) {
            System.err.println("\n!!! CRITICAL BUG !!!");
            System.err.println("NEGATIVE STOCK DETECTED: " + finalStock);
            System.err.println("  This is a critical data integrity violation!");
        }
        
        assertTrue(finalStock >= 0,
                String.format(
                        "CRITICAL BUG: Final stock is negative (%d)! " +
                        "This is a severe data integrity violation. " +
                        "Initial stock: %d, Successes: %d, Quantity per request: %d",
                        finalStock, initialStock, successCount.get(), requestQuantity
                ));
        
        // ASSERTION 3: Verify stock calculation is correct
        int expectedFinalStock = initialStock - (successCount.get() * requestQuantity);
        assertEquals(expectedFinalStock, finalStock,
                String.format(
                        "Stock calculation mismatch! " +
                        "Expected final stock: %d (initial %d - %d successes * %d quantity), " +
                        "but got: %d",
                        expectedFinalStock, initialStock, successCount.get(), requestQuantity, finalStock
                ));
        
        System.out.println("\n=== Test Completed ===");
        if (!oversellDetected && !negativeStockDetected) {
            System.out.println("✓ No overselling detected - bug is fixed!");
        }
    }

    /**
     * Additional test: More aggressive concurrent scenario
     * 
     * This test uses even more threads to increase the likelihood of detecting
     * the race condition on unfixed code.
     */
    @Test
    @DisplayName("Bug Condition: High concurrency scenario should prevent overselling")
    void highConcurrency_shouldPreventOverselling() throws InterruptedException {
        // Setup: Create test product with initial stock of 10
        int initialStock = 10;
        int requestQuantity = 2;
        int concurrentThreads = 10; // More threads than available stock units
        int expectedMaxSuccesses = initialStock / requestQuantity; // floor(10/2) = 5

        Product testProduct = createTestProduct("HighConcurrency_" + System.nanoTime(), initialStock);
        Long productId = testProduct.getId();

        System.out.println("\n=== High Concurrency Test ===");
        System.out.println("Initial stock: " + initialStock);
        System.out.println("Request quantity per thread: " + requestQuantity);
        System.out.println("Number of concurrent threads: " + concurrentThreads);
        System.out.println("Expected max successes: " + expectedMaxSuccesses);

        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(concurrentThreads);
        
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        
        ExecutorService executor = Executors.newFixedThreadPool(concurrentThreads);
        
        for (int i = 0; i < concurrentThreads; i++) {
            final int threadNum = i + 1;
            executor.submit(() -> {
                try {
                    startLatch.await();
                    productService.reduceStock(productId, requestQuantity);
                    successCount.incrementAndGet();
                    System.out.println("Thread " + threadNum + ": SUCCESS");
                } catch (ValidationException e) {
                    failureCount.incrementAndGet();
                } catch (Exception e) {
                    System.err.println("Thread " + threadNum + ": ERROR - " + e.getMessage());
                } finally {
                    doneLatch.countDown();
                }
            });
        }
        
        startLatch.countDown();
        boolean completed = doneLatch.await(10, TimeUnit.SECONDS);
        assertTrue(completed, "All threads should complete within timeout");
        
        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);
        
        Product finalProduct = productService.getProductById(productId);
        int finalStock = finalProduct.getStock();
        
        System.out.println("Successful reductions: " + successCount.get());
        System.out.println("Failed reductions: " + failureCount.get());
        System.out.println("Final stock: " + finalStock);
        
        // Assertions
        assertFalse(successCount.get() > expectedMaxSuccesses,
                String.format(
                        "BUG DETECTED: Overselling in high concurrency! " +
                        "Expected at most %d successes, but got %d. " +
                        "Final stock: %d",
                        expectedMaxSuccesses, successCount.get(), finalStock
                ));
        
        assertTrue(finalStock >= 0,
                "CRITICAL BUG: Final stock is negative: " + finalStock);
        
        int expectedFinalStock = initialStock - (successCount.get() * requestQuantity);
        assertEquals(expectedFinalStock, finalStock,
                "Stock calculation mismatch in high concurrency scenario");
    }

    // Helper method to create test product

    private Product createTestProduct(String name, int stock) {
        Product product = new Product();
        product.setName(name);
        product.setDescription("Test product for concurrent overselling bug exploration");
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
