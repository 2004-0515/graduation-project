package com.shopping.service;

import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.function.LongSupplier;

/**
 * JVM-local order number generator that preserves the ORD + timestamp format
 * while guaranteeing uniqueness within a single application instance.
 */
@Component
public class OrderNumberGenerator {

    private static final String PREFIX = "ORD";
    private static final int SEQUENCE_WIDTH = 6;
    private static final int MAX_SEQUENCE = 999_999;

    private final LongSupplier currentTimeSupplier;
    private long lastTimestamp = -1L;
    private int sequence = 0;

    public OrderNumberGenerator() {
        this(System::currentTimeMillis);
    }

    OrderNumberGenerator(LongSupplier currentTimeSupplier) {
        this.currentTimeSupplier = Objects.requireNonNull(currentTimeSupplier);
    }

    public synchronized String nextOrderNo() {
        long timestamp = currentTimeSupplier.getAsLong();
        if (timestamp < lastTimestamp) {
            timestamp = lastTimestamp;
        }

        if (timestamp == lastTimestamp) {
            if (sequence >= MAX_SEQUENCE) {
                timestamp = waitNextMillis(timestamp);
                sequence = 0;
            } else {
                sequence++;
            }
        } else {
            lastTimestamp = timestamp;
            sequence = 0;
        }

        lastTimestamp = timestamp;
        return String.format("%s%d%0" + SEQUENCE_WIDTH + "d", PREFIX, timestamp, sequence);
    }

    private long waitNextMillis(long currentTimestamp) {
        long timestamp = currentTimeSupplier.getAsLong();
        while (timestamp <= currentTimestamp) {
            Thread.onSpinWait();
            timestamp = currentTimeSupplier.getAsLong();
        }
        return timestamp;
    }
}
