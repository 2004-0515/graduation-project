package com.shopping.filter;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 速率限制过滤器，用于对API请求进行速率限制
 */
@Component
public class RateLimiterFilter extends OncePerRequestFilter {

    @Autowired
    private RateLimiterRegistry rateLimiterRegistry;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        RateLimiter rateLimiter;

        // 对登录请求使用更严格的速率限制
        if (path.equals("/api/auth/login") || path.equals("/auth/login")) {
            rateLimiter = rateLimiterRegistry.rateLimiter("login-rate-limiter");
        } else {
            // 对其他API请求使用普通速率限制
            rateLimiter = rateLimiterRegistry.rateLimiter("api-rate-limiter");
        }

        // 尝试获取许可
        boolean allowed = rateLimiter.acquirePermission();
        if (allowed) {
            // 允许请求通过
            filterChain.doFilter(request, response);
        } else {
            // 超过速率限制，返回429 Too Many Requests
            response.setStatus(429); // 使用数字值代替常量
            response.setContentType("application/json");
            response.getWriter().write("{\"code\": 429, \"message\": \"请求过于频繁，请稍后重试\", \"success\": false}");
        }
    }
}
