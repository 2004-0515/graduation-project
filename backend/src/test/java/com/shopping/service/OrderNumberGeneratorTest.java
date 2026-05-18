package com.shopping.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.LongSupplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OrderNumberGeneratorTest {

    @Test
    @DisplayName("Generator should stay unique when system time moves backward")
    void nextOrderNo_WhenClockMovesBackward_ShouldRemainUniqueAndMonotonic() {
        long[] timestamps = {1000L, 999L, 999L, 1001L};
        AtomicInteger index = new AtomicInteger();
        LongSupplier supplier = () -> timestamps[Math.min(index.getAndIncrement(), timestamps.length - 1)];
        OrderNumberGenerator generator = new OrderNumberGenerator(supplier);

        List<String> orderNos = List.of(
                generator.nextOrderNo(),
                generator.nextOrderNo(),
                generator.nextOrderNo(),
                generator.nextOrderNo()
        );

        assertEquals(orderNos.size(), Set.copyOf(orderNos).size(), "Clock rollback must not create duplicates");
        assertEquals("1000", extractTimestamp(orderNos.get(0)));
        assertEquals("1000", extractTimestamp(orderNos.get(1)));
        assertEquals("1000", extractTimestamp(orderNos.get(2)));
        assertEquals("1001", extractTimestamp(orderNos.get(3)));
        assertTrue(orderNos.get(0).endsWith("000000"));
        assertTrue(orderNos.get(1).endsWith("000001"));
        assertTrue(orderNos.get(2).endsWith("000002"));
        assertTrue(orderNos.get(3).endsWith("000000"));
    }

    @Test
    @DisplayName("Generator should increment the suffix within the same millisecond")
    void nextOrderNo_WhenTimestampRepeats_ShouldIncrementSuffix() {
        OrderNumberGenerator generator = new OrderNumberGenerator(() -> 2000L);

        String first = generator.nextOrderNo();
        String second = generator.nextOrderNo();
        String third = generator.nextOrderNo();

        assertEquals("2000", extractTimestamp(first));
        assertEquals("2000", extractTimestamp(second));
        assertEquals("2000", extractTimestamp(third));
        assertTrue(first.endsWith("000000"));
        assertTrue(second.endsWith("000001"));
        assertTrue(third.endsWith("000002"));
    }

    private String extractTimestamp(String orderNo) {
        return orderNo.substring(3, orderNo.length() - 6);
    }
}
