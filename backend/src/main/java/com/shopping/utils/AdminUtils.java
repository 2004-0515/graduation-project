package com.shopping.utils;

import com.shopping.exception.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 管理员权限验证工具类
 */
public class AdminUtils {
    
    /**
     * 检查当前用户是否为管理员
     * @return true 如果是管理员
     */
    public static boolean isAdmin() {
        return RoleUtils.isCurrentAdmin();
    }
    
    /**
     * 验证当前用户是否为管理员，如果不是则抛出异常
     * @throws AuthenticationException 如果不是管理员
     */
    public static void requireAdmin() {
        RoleUtils.requireAdmin();
    }
    
    /**
     * 获取当前用户名
     * @return 当前用户名
     * @throws AuthenticationException 如果用户未认证
     */
    public static String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AuthenticationException("用户未认证");
        }
        return auth.getName();
    }
}
