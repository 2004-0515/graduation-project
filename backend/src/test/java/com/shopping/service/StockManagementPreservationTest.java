package com.shopping.service;

import com.shopping.entity.Category;
import com.shopping.entity.Product;
import com.shopping.repository.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Preservation Property Test for Non-Concurrent Stock Management Operations
 * 
 * **Validates: Requirements 3.4.1, 3.4.2**
 * 
 * This test verifies the BASELINE behavior that must be preserved after the concurrent overselling fix:
 * - updateProductStock() should continue to work correctly for manual stock adjustments
 * - increaseStock() should continue to work correctly for non-order-related stock increases
 * 
 * This test is designed to PASS on unfixed code to confirm the behavior we want to preserve.
 * After implementing the concurrent overselling fix (optimistic locking), this test should continue to PASS,
 * confirming no regression in non-concurrent stock operations.
 * 
 * Property-based testing approach: Multiple test cases with randomized inputs for stronger guarantees.
 */
@SpringBootTest
@Transactional
class StockManagementPreservationTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryRepository categoryRepository;

    /**
     * Property 2: Preservation - Non-Concurrent Stock Operations (updateProductStock)
     * 
     * For all non-concurrent stock operations using updateProductStock(), the system should
     * continue to function correctly without interference from order-related stock operations.
     * 
     * This property uses a property-based testing approach with multiple randomized
     * test cases to provide stronger guarantees.
     * 
     * EXPECTED OUTCOME ON UNFIXED CODE: Test PASSES
     * - updateProductStock() works correctly for manual adjustments
     * - This confirms the baseline behavior to preserve
     * 
     * EXPECTED OUTCOME ON FIXED CODE: Test PASSES
     * - updateProductStock() continues to work correctly after optimistic locking is added
     * - No regression introduced by the concurrent overselling fix
     */
    @Test
    @DisplayName("Property: updateProductStock should work correctly for manual adjustments (25 randomized test cases)")
    void updateProductStock_shouldWorkCorrectly() {
        Random random = new Random();
        int testCases = 25;
        int passedCases = 0;

        System.out.println("Running property-based test with " + testCases + " randomized test cases...");

        for (int i = 0; i < testCases; i++) {
            // Generate random test parameters
            int initialStock = 50 + random.nextInt(151); // 50-200
            int updateQuantity = random.nextInt(41) - 20; // -20 to +20

            System.out.println(String.format("\nTest case %d/%d: initialStock=%d, updateQuantity=%d",
                    i + 1, testCases, initialStock, updateQuantity));

            try {
                // Setup: Create test product
                Product testProduct = createTestProduct("Product_" + System.nanoTime(), initialStock);

                // Record initial stock level
                int stockBefore = testProduct.getStock();
                assertEquals(initialStock, stockBefore, "Initial stock should match");

                // Calculate expected stock after update
                int expectedStock = stockBefore + updateQuantity;

                // Perform stock update
                boolean updateResult = productService.updateProductStock(testProduct.getId(), updateQuantity);

                // Get final stock level
                Product productAfter = productService.getProductById(testProduct.getId());
                int stockAfter = productAfter.getStock();

                System.out.println(String.format("  Stock: before=%d, after=%d, expected=%d, updateResult=%b",
                        stockBefore, stockAfter, expectedStock, updateResult));

                // ASSERTION: updateProductStock should work correctly
                if (expectedStock >= 0) {
                    // Valid update: should succeed
                    assertTrue(updateResult,
                            String.format(
                                    "PRESERVATION CHECK FAILED: updateProductStock should return true for valid updates. " +
                                    "Initial stock: %d, Update quantity: %d, Expected stock: %d. " +
                                    "This behavior must be preserved after the concurrent overselling fix.",
                                    stockBefore, updateQuantity, expectedStock
                            ));

                    assertEquals(expectedStock, stockAfter,
                            String.format(
                                    "PRESERVATION CHECK FAILED: Stock should be updated correctly. " +
                                    "Initial stock: %d, Update quantity: %d, Expected stock: %d, Actual stock: %d. " +
                                    "This behavior must be preserved after the concurrent overselling fix.",
                                    stockBefore, updateQuantity, expectedStock, stockAfter
                            ));
                } else {
                    // Invalid update (would result in negative stock): should fail
                    assertFalse(updateResult,
                            String.format(
                                    "PRESERVATION CHECK FAILED: updateProductStock should return false for invalid updates. " +
                                    "Initial stock: %d, Update quantity: %d, Expected stock: %d (negative). " +
                                    "This behavior must be preserved after the concurrent overselling fix.",
                                    stockBefore, updateQuantity, expectedStock
                            ));

                    assertEquals(stockBefore, stockAfter,
                            String.format(
                                    "PRESERVATION CHECK FAILED: Stock should remain unchanged for invalid updates. " +
                                    "Initial stock: %d, Update quantity: %d, Actual stock: %d. " +
                                    "This behavior must be preserved after the concurrent overselling fix.",
                                    stockBefore, updateQuantity, stockAfter
                            ));
                }

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
     * Property 2: Preservation - Non-Concurrent Stock Operations (increaseStock)
     * 
     * For all non-concurrent stock operations using increaseStock(), the system should
     * continue to function correctly without interference from order-related stock operations.
     * 
     * This property focuses on the increaseStock() method used for non-order-related
     * stock increases (e.g., restocking, inventory adjustments).
     * 
     * EXPECTED OUTCOME ON UNFIXED CODE: Test PASSES
     * - increaseStock() works correctly for non-order operations
     * - This confirms the baseline behavior to preserve
     * 
     * EXPECTED OUTCOME ON FIXED CODE: Test PASSES
     * - increaseStock() continues to work correctly after optimistic locking is added
     * - No regression introduced by the concurrent overselling fix
     */
    @Test
    @DisplayName("Property: increaseStock should work correctly for non-order operations (20 randomized test cases)")
    void increaseStock_shouldWorkCorrectly() {
        Random random = new Random();
        int testCases = 20;
        int passedCases = 0;

        System.out.println("Running property-based test with " + testCases + " randomized test cases...");

        for (int i = 0; i < testCases; i++) {
            // Generate random test parameters
            int initialStock = 10 + random.nextInt(91); // 10-100
            int increaseQuantity = 1 + random.nextInt(50); // 1-50

            System.out.println(String.format("\nTest case %d/%d: initialStock=%d, increaseQuantity=%d",
                    i + 1, testCases, initialStock, increaseQuantity));

            try {
                // Setup: Create test product
                Product testProduct = createTestProduct("Product_" + System.nanoTime(), initialStock);

                // Record initial stock level
                int stockBefore = testProduct.getStock();
                assertEquals(initialStock, stockBefore, "Initial stock should match");

                // Calculate expected stock after increase
                int expectedStock = stockBefore + increaseQuantity;

                // Perform stock increase
                productService.increaseStock(testProduct.getId(), increaseQuantity);

                // Get final stock level
                Product productAfter = productService.getProductById(testProduct.getId());
                int stockAfter = productAfter.getStock();

                System.out.println(String.format("  Stock: before=%d, after=%d, expected=%d",
                        stockBefore, stockAfter, expectedStock));

                // ASSERTION: increaseStock should work correctly
                assertEquals(expectedStock, stockAfter,
                        String.format(
                                "PRESERVATION CHECK FAILED: Stock should be increased correctly. " +
                                "Initial stock: %d, Increase quantity: %d, Expected stock: %d, Actual stock: %d. " +
                                "This behavior must be preserved after the concurrent overselling fix.",
                                stockBefore, increaseQuantity, expectedStock, stockAfter
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
     * Property 2: Preservation - Sequential Stock Operations
     * 
     * For all sequential (non-concurrent) stock operations, the system should
     * maintain correct stock levels through multiple operations.
     * 
     * This property tests a sequence of stock operations to ensure they work correctly
     * when executed sequentially (not concurrently).
     * 
     * EXPECTED OUTCOME ON UNFIXED CODE: Test PASSES
     * - Sequential stock operations work correctly
     * - This confirms the baseline behavior to preserve
     * 
     * EXPECTED OUTCOME ON FIXED CODE: Test PASSES
     * - Sequential stock operations continue to work correctly after optimistic locking is added
     * - No regression introduced by the concurrent overselling fix
     */
    @Test
    @DisplayName("Property: Sequential stock operations should maintain correct stock levels (15 randomized test cases)")
    void sequentialStockOperations_shouldMaintainCorrectLevels() {
        Random random = new Random();
        int testCases = 15;
        int passedCases = 0;

        System.out.println("Running property-based test with " + testCases + " randomized test cases...");

        for (int i = 0; i < testCases; i++) {
            // Generate random test parameters
            int initialStock = 100 + random.nextInt(51); // 100-150

            System.out.println(String.format("\nTest case %d/%d: initialStock=%d",
                    i + 1, testCases, initialStock));

            try {
                // Setup: Create test product
                Product testProduct = createTestProduct("Product_" + System.nanoTime(), initialStock);

                // Record initial stock level
                int expectedStock = testProduct.getStock();
                assertEquals(initialStock, expectedStock, "Initial stock should match");

                System.out.println(String.format("  Initial stock: %d", expectedStock));

                // Perform a sequence of random stock operations
                int operationCount = 3 + random.nextInt(5); // 3-7 operations
                for (int j = 0; j < operationCount; j++) {
                    int operationType = random.nextInt(3); // 0=increase, 1=update(+), 2=update(-)

                    if (operationType == 0) {
                        // increaseStock
                        int increaseQty = 1 + random.nextInt(20);
                        productService.increaseStock(testProduct.getId(), increaseQty);
                        expectedStock += increaseQty;
                        System.out.println(String.format("    Op %d: increaseStock(%d) -> expected=%d",
                                j + 1, increaseQty, expectedStock));

                    } else if (operationType == 1) {
                        // updateProductStock (positive)
                        int updateQty = 1 + random.nextInt(15);
                        productService.updateProductStock(testProduct.getId(), updateQty);
                        expectedStock += updateQty;
                        System.out.println(String.format("    Op %d: updateProductStock(+%d) -> expected=%d",
                                j + 1, updateQty, expectedStock));

                    } else {
                        // updateProductStock (negative, but ensure it doesn't go below 0)
                        int maxDecrease = Math.min(expectedStock, 10);
                        if (maxDecrease > 0) {
                            int updateQty = -(1 + random.nextInt(maxDecrease));
                            productService.updateProductStock(testProduct.getId(), updateQty);
                            expectedStock += updateQty;
                            System.out.println(String.format("    Op %d: updateProductStock(%d) -> expected=%d",
                                    j + 1, updateQty, expectedStock));
                        }
                    }
                }

                // Get final stock level
                Product productAfter = productService.getProductById(testProduct.getId());
                int actualStock = productAfter.getStock();

                System.out.println(String.format("  Final stock: actual=%d, expected=%d",
                        actualStock, expectedStock));

                // ASSERTION: Final stock should match expected stock after all operations
                assertEquals(expectedStock, actualStock,
                        String.format(
                                "PRESERVATION CHECK FAILED: Sequential stock operations should maintain correct stock levels. " +
                                "Initial stock: %d, Expected final stock: %d, Actual final stock: %d. " +
                                "This behavior must be preserved after the concurrent overselling fix.",
                                initialStock, expectedStock, actualStock
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
     * Property 2: Preservation - Stock Operations with Edge Cases
     * 
     * For all stock operations with edge case values (zero, boundary values),
     * the system should handle them correctly.
     * 
     * EXPECTED OUTCOME ON UNFIXED CODE: Test PASSES
     * - Edge case stock operations work correctly
     * - This confirms the baseline behavior to preserve
     * 
     * EXPECTED OUTCOME ON FIXED CODE: Test PASSES
     * - Edge case stock operations continue to work correctly after optimistic locking is added
     * - No regression introduced by the concurrent overselling fix
     */
    @Test
    @DisplayName("Property: Stock operations should handle edge cases correctly (10 test cases)")
    void stockOperations_shouldHandleEdgeCases() {
        int testCases = 10;
        int passedCases = 0;

        System.out.println("Running property-based test with " + testCases + " edge case test cases...");

        // Test case 1: increaseStock with zero quantity
        try {
            System.out.println("\nTest case 1/10: increaseStock with zero quantity");
            Product product1 = createTestProduct("Product_" + System.nanoTime(), 50);
            int stockBefore = product1.getStock();
            
            productService.increaseStock(product1.getId(), 0);
            
            Product productAfter = productService.getProductById(product1.getId());
            assertEquals(stockBefore, productAfter.getStock(),
                    "Stock should remain unchanged when increasing by zero");
            
            passedCases++;
            System.out.println("  ✓ PASSED");
        } catch (AssertionError e) {
            System.err.println("  ✗ FAILED: " + e.getMessage());
            throw e;
        }

        // Test case 2: updateProductStock with zero quantity
        try {
            System.out.println("\nTest case 2/10: updateProductStock with zero quantity");
            Product product2 = createTestProduct("Product_" + System.nanoTime(), 50);
            int stockBefore = product2.getStock();
            
            boolean result = productService.updateProductStock(product2.getId(), 0);
            
            Product productAfter = productService.getProductById(product2.getId());
            assertTrue(result, "updateProductStock should return true for zero quantity");
            assertEquals(stockBefore, productAfter.getStock(),
                    "Stock should remain unchanged when updating by zero");
            
            passedCases++;
            System.out.println("  ✓ PASSED");
        } catch (AssertionError e) {
            System.err.println("  ✗ FAILED: " + e.getMessage());
            throw e;
        }

        // Test case 3: increaseStock from zero stock
        try {
            System.out.println("\nTest case 3/10: increaseStock from zero stock");
            Product product3 = createTestProduct("Product_" + System.nanoTime(), 0);
            
            productService.increaseStock(product3.getId(), 10);
            
            Product productAfter = productService.getProductById(product3.getId());
            assertEquals(10, productAfter.getStock(),
                    "Stock should be increased correctly from zero");
            
            passedCases++;
            System.out.println("  ✓ PASSED");
        } catch (AssertionError e) {
            System.err.println("  ✗ FAILED: " + e.getMessage());
            throw e;
        }

        // Test case 4: updateProductStock to exactly zero
        try {
            System.out.println("\nTest case 4/10: updateProductStock to exactly zero");
            Product product4 = createTestProduct("Product_" + System.nanoTime(), 10);
            
            boolean result = productService.updateProductStock(product4.getId(), -10);
            
            Product productAfter = productService.getProductById(product4.getId());
            assertTrue(result, "updateProductStock should return true when reducing to zero");
            assertEquals(0, productAfter.getStock(),
                    "Stock should be reduced to exactly zero");
            
            passedCases++;
            System.out.println("  ✓ PASSED");
        } catch (AssertionError e) {
            System.err.println("  ✗ FAILED: " + e.getMessage());
            throw e;
        }

        // Test case 5: updateProductStock below zero (should fail)
        try {
            System.out.println("\nTest case 5/10: updateProductStock below zero (should fail)");
            Product product5 = createTestProduct("Product_" + System.nanoTime(), 10);
            int stockBefore = product5.getStock();
            
            boolean result = productService.updateProductStock(product5.getId(), -15);
            
            Product productAfter = productService.getProductById(product5.getId());
            assertFalse(result, "updateProductStock should return false when result would be negative");
            assertEquals(stockBefore, productAfter.getStock(),
                    "Stock should remain unchanged when update would result in negative stock");
            
            passedCases++;
            System.out.println("  ✓ PASSED");
        } catch (AssertionError e) {
            System.err.println("  ✗ FAILED: " + e.getMessage());
            throw e;
        }

        // Test case 6: increaseStock with large quantity
        try {
            System.out.println("\nTest case 6/10: increaseStock with large quantity");
            Product product6 = createTestProduct("Product_" + System.nanoTime(), 100);
            
            productService.increaseStock(product6.getId(), 10000);
            
            Product productAfter = productService.getProductById(product6.getId());
            assertEquals(10100, productAfter.getStock(),
                    "Stock should handle large increase correctly");
            
            passedCases++;
            System.out.println("  ✓ PASSED");
        } catch (AssertionError e) {
            System.err.println("  ✗ FAILED: " + e.getMessage());
            throw e;
        }

        // Test case 7: updateProductStock with large positive quantity
        try {
            System.out.println("\nTest case 7/10: updateProductStock with large positive quantity");
            Product product7 = createTestProduct("Product_" + System.nanoTime(), 100);
            
            boolean result = productService.updateProductStock(product7.getId(), 5000);
            
            Product productAfter = productService.getProductById(product7.getId());
            assertTrue(result, "updateProductStock should return true for large positive quantity");
            assertEquals(5100, productAfter.getStock(),
                    "Stock should handle large positive update correctly");
            
            passedCases++;
            System.out.println("  ✓ PASSED");
        } catch (AssertionError e) {
            System.err.println("  ✗ FAILED: " + e.getMessage());
            throw e;
        }

        // Test case 8: Multiple increaseStock operations
        try {
            System.out.println("\nTest case 8/10: Multiple increaseStock operations");
            Product product8 = createTestProduct("Product_" + System.nanoTime(), 50);
            
            productService.increaseStock(product8.getId(), 10);
            productService.increaseStock(product8.getId(), 20);
            productService.increaseStock(product8.getId(), 30);
            
            Product productAfter = productService.getProductById(product8.getId());
            assertEquals(110, productAfter.getStock(),
                    "Stock should accumulate correctly through multiple increases");
            
            passedCases++;
            System.out.println("  ✓ PASSED");
        } catch (AssertionError e) {
            System.err.println("  ✗ FAILED: " + e.getMessage());
            throw e;
        }

        // Test case 9: Mixed updateProductStock operations
        try {
            System.out.println("\nTest case 9/10: Mixed updateProductStock operations");
            Product product9 = createTestProduct("Product_" + System.nanoTime(), 100);
            
            productService.updateProductStock(product9.getId(), 50);  // 150
            productService.updateProductStock(product9.getId(), -30); // 120
            productService.updateProductStock(product9.getId(), 10);  // 130
            
            Product productAfter = productService.getProductById(product9.getId());
            assertEquals(130, productAfter.getStock(),
                    "Stock should be calculated correctly through mixed updates");
            
            passedCases++;
            System.out.println("  ✓ PASSED");
        } catch (AssertionError e) {
            System.err.println("  ✗ FAILED: " + e.getMessage());
            throw e;
        }

        // Test case 10: increaseStock with quantity of 1
        try {
            System.out.println("\nTest case 10/10: increaseStock with quantity of 1");
            Product product10 = createTestProduct("Product_" + System.nanoTime(), 99);
            
            productService.increaseStock(product10.getId(), 1);
            
            Product productAfter = productService.getProductById(product10.getId());
            assertEquals(100, productAfter.getStock(),
                    "Stock should be increased correctly by 1");
            
            passedCases++;
            System.out.println("  ✓ PASSED");
        } catch (AssertionError e) {
            System.err.println("  ✗ FAILED: " + e.getMessage());
            throw e;
        }

        System.out.println(String.format("\n=== Property Test Summary: %d/%d test cases passed ===",
                passedCases, testCases));
    }

    // Helper method to create test data

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
