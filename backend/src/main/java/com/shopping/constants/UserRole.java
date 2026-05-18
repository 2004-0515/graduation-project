package com.shopping.constants;

import java.util.Set;

public final class UserRole {
    public static final String BUYER = "BUYER";
    public static final String SELLER = "SELLER";
    public static final String ADMIN = "ADMIN";

    private static final Set<String> VALID_ROLES = Set.of(BUYER, SELLER, ADMIN);

    private UserRole() {
        throw new UnsupportedOperationException("工具类不能实例化");
    }

    public static boolean isValid(String role) {
        return role != null && VALID_ROLES.contains(normalize(role));
    }

    public static String normalize(String role) {
        return role == null ? null : role.trim().toUpperCase();
    }
}
