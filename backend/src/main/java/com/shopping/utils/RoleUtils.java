package com.shopping.utils;

import com.shopping.constants.UserRole;
import com.shopping.exception.AuthenticationException;
import com.shopping.exception.AuthorizationException;
import com.shopping.exception.BusinessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

/**
 * Centralized role checks based on authenticated authorities.
 */
public final class RoleUtils {

    private RoleUtils() {
        throw new UnsupportedOperationException("工具类不能实例化");
    }

    public static String requireAuthenticatedUser() {
        return SecurityUtils.getCurrentUsername();
    }

    public static boolean hasCurrentRole(String role) {
        if (!SecurityUtils.isAuthenticated()) {
            return false;
        }
        Authentication authentication = SecurityUtils.getAuthentication();
        if (authentication == null) {
            return false;
        }
        String authority = "ROLE_" + UserRole.normalize(role);
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority::equals);
    }

    public static boolean isCurrentAdmin() {
        return hasCurrentRole(UserRole.ADMIN);
    }

    public static void requireAdmin() {
        if (!SecurityUtils.isAuthenticated()) {
            throw new AuthenticationException("需要管理员权限");
        }
        if (!isCurrentAdmin()) {
            throw new AuthorizationException("需要管理员权限");
        }
    }

    public static boolean isCurrentSeller() {
        return hasCurrentRole(UserRole.SELLER);
    }

    public static String requireSeller() {
        if (!SecurityUtils.isAuthenticated()) {
            throw new AuthenticationException("需要卖家权限");
        }
        String username = SecurityUtils.getCurrentUsername();
        if (!isCurrentSeller()) {
            throw new AuthorizationException("需要卖家权限");
        }
        return username;
    }

    public static void requireSellerOwnership(Long resourceSellerId, Long currentSellerId) {
        if (resourceSellerId == null || currentSellerId == null || !resourceSellerId.equals(currentSellerId)) {
            throw new BusinessException(403, "无权操作此资源");
        }
    }
}
