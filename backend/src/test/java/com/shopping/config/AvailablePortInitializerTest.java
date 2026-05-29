package com.shopping.config;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.InetSocketAddress;
import java.net.ServerSocket;

import org.junit.jupiter.api.Test;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

class AvailablePortInitializerTest {
    @Test
    void movesServerPortWhenConfiguredPortIsAlreadyInUse() throws Exception {
        try (ServerSocket occupiedSocket = new ServerSocket()) {
            occupiedSocket.setReuseAddress(false);
            occupiedSocket.bind(new InetSocketAddress(0));
            int occupiedPort = occupiedSocket.getLocalPort();

            GenericApplicationContext context = new GenericApplicationContext();
            ConfigurableEnvironment environment = context.getEnvironment();
            environment.getPropertySources().addFirst(new MapPropertySource(
                    "testServerPort",
                    java.util.Map.of("server.port", String.valueOf(occupiedPort))));

            new AvailablePortInitializer().initialize(context);

            int selectedPort = environment.getProperty("server.port", Integer.class);
            assertNotEquals(occupiedPort, selectedPort);
            assertTrue(selectedPort > occupiedPort);
        }
    }
}
