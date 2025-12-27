package com.shopping.utils;

import com.shopping.exception.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 安全工具类
 * 提供统一的安全相关操作，消除控制器中的重复代码
 */
public final class SecurityUtils {
    
    private SecurityUtils() {
        throw new UnsupportedOperationException("工具类不能实例化");
    }
    
    /**
     * 获取当前登录用户名
     * @return 当前用户名
     * @throws AuthenticationException 如果用户未认证
     */
    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
            "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AuthenticationException("用户未认证");
        }
        return authentication.getName();
    }
    
    /**
     * 检查用户是否已认证
     * @return 是否已认证
     */
    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && 
               authentication.isAuthenticated() && 
               !"anonymousUser".equals(authentication.getPrincipal());
    }
    
    /**
     * 获取当前认证信息
     * @return 认证信息，如果未认证则返回null
     */
    public static Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }
}
