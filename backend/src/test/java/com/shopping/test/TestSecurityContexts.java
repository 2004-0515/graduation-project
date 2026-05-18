package com.shopping.test;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

public final class TestSecurityContexts {

    private TestSecurityContexts() {
    }

    public static UsernamePasswordAuthenticationToken authentication(String username) {
        String role = switch (username) {
            case "admin" -> "ADMIN";
            case "lisi", "xiaoming", "xiaohong", "zhouba", "seller", "demo" -> "SELLER";
            default -> "BUYER";
        };
        return new UsernamePasswordAuthenticationToken(
                username,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }
}
