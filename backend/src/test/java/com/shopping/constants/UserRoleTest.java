package com.shopping.constants;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UserRoleTest {

    @Test
    void isValid_ShouldAcceptNormalizedRoles() {
        assertTrue(UserRole.isValid("buyer"));
        assertTrue(UserRole.isValid(" SELLER "));
        assertTrue(UserRole.isValid("ADMIN"));
    }

    @Test
    void isValid_ShouldRejectUnknownRoles() {
        assertFalse(UserRole.isValid(null));
        assertFalse(UserRole.isValid(""));
        assertFalse(UserRole.isValid("manager"));
    }

    @Test
    void normalize_ShouldTrimAndUppercaseRole() {
        assertEquals("SELLER", UserRole.normalize(" seller "));
        assertNull(UserRole.normalize(null));
    }
}
