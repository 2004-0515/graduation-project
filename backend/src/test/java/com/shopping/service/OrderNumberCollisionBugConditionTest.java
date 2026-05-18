package com.shopping.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regression test for order number uniqueness.
 *
 * The order number guarantee belongs to the generator itself; testing it
 * directly avoids conflating business uniqueness with database-specific
 * identity behavior under stress.
 */
class OrderNumberCollisionBugConditionTest {

    private final OrderNumberGenerator generator = new OrderNumberGenerator();

    @Test
    @DisplayName("Bug Condition: concurrent generation should not produce duplicate order numbers")
    void concurrentGeneration_shouldNotProduceDuplicateOrderNumbers() throws InterruptedException {
        int numberOfOrders = 5_000;
        int threadPoolSize = 16;

        ExecutorService executor = Executors.newFixedThreadPool(threadPoolSize);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfOrders);
        ConcurrentLinkedQueue<String> orderNumbers = new ConcurrentLinkedQueue<>();

        for (int i = 0; i < numberOfOrders; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    orderNumbers.add(generator.nextOrderNo());
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean completed = doneLatch.await(30, TimeUnit.SECONDS);
        executor.shutdown();
        assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS), "Executor should stop cleanly");
        assertTrue(completed, "All concurrent generation tasks should complete within timeout");

        Set<String> uniqueOrderNumbers = new HashSet<>(orderNumbers);
        assertEquals(numberOfOrders, orderNumbers.size(), "All generated order numbers should be collected");
        assertEquals(numberOfOrders, uniqueOrderNumbers.size(), "Concurrent generation must not produce duplicates");
    }

    @Test
    @DisplayName("Bug Condition: sequential generation should not produce duplicate order numbers")
    void sequentialGeneration_shouldProduceUniqueOrderNumbers() {
        int numberOfOrders = 1_000;
        List<String> orderNumbers = new ArrayList<>(numberOfOrders);

        for (int i = 0; i < numberOfOrders; i++) {
            orderNumbers.add(generator.nextOrderNo());
        }

        Set<String> uniqueOrderNumbers = new HashSet<>(orderNumbers);
        assertEquals(numberOfOrders, uniqueOrderNumbers.size(), "Sequential generation must not produce duplicates");
    }
}
