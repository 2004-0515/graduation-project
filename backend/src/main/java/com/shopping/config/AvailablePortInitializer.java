package com.shopping.config;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

public class AvailablePortInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    private static final Logger log = LoggerFactory.getLogger(AvailablePortInitializer.class);
    private static final String PROPERTY_SOURCE_NAME = "availableServerPort";
    private static final int DEFAULT_SERVER_PORT = 8080;
    private static final int MAX_PORT_ATTEMPTS = 20;

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment environment = applicationContext.getEnvironment();
        if (!environment.getProperty("app.server.port-auto-increment.enabled", Boolean.class, true)) {
            return;
        }

        int requestedPort = environment.getProperty("server.port", Integer.class, DEFAULT_SERVER_PORT);
        if (requestedPort <= 0) {
            return;
        }

        int availablePort = findAvailablePort(requestedPort);
        if (availablePort != requestedPort) {
            environment.getPropertySources().addFirst(new MapPropertySource(
                    PROPERTY_SOURCE_NAME,
                    Map.of("server.port", String.valueOf(availablePort))));
            log.warn("Configured server port {} is already in use; starting on {} instead.",
                    requestedPort, availablePort);
        }
    }

    private int findAvailablePort(int firstPort) {
        for (int port = firstPort; port < firstPort + MAX_PORT_ATTEMPTS; port++) {
            if (isPortAvailable(port)) {
                return port;
            }
        }
        return firstPort;
    }

    private boolean isPortAvailable(int port) {
        try (ServerSocket socket = new ServerSocket()) {
            socket.setReuseAddress(false);
            socket.bind(new InetSocketAddress(port));
            return true;
        } catch (IOException ex) {
            return false;
        }
    }
}
