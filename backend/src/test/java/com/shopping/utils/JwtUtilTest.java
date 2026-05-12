package com.shopping.utils;

import com.shopping.config.JwtProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtUtilTest {

    private JwtUtil createJwtUtil() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("test-secret-for-jwt-signing-key-0123456789");
        properties.setExpiration(3600_000);
        properties.setHeader("Authorization");
        return new JwtUtil(properties);
    }

    @Test
    void generateAndValidateToken_ShouldSucceed() {
        JwtUtil jwtUtil = createJwtUtil();

        String token = jwtUtil.generateToken("buyer");

        assertNotNull(token);
        assertTrue(jwtUtil.validateToken(token));
    }

    @Test
    void validateToken_WhenMalformed_ShouldReturnFalse() {
        JwtUtil jwtUtil = createJwtUtil();

        assertFalse(jwtUtil.validateToken("bad-token"));
    }
}
