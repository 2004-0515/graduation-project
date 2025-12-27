package com.shopping.constants;

/**
 * 用户相关常量定义
 */
public final class UserConstants {
    
    private UserConstants() {
        throw new UnsupportedOperationException("常量类不能实例化");
    }
    
    // ==================== 用户状态 ====================
    
    public static final class Status {
        public static final int DISABLED = 0;  // 禁用
        public static final int ENABLED = 1;   // 启用
        
        private Status() {}
        
        public static String getName(int status) {
            return switch (status) {
                case DISABLED -> "禁用";
                case ENABLED -> "启用";
                default -> "未知";
            };
        }
    }
    
    // ==================== 验证规则 ====================
    
    public static final class Validation {
        public static final int USERNAME_MIN_LENGTH = 3;
        public static final int USERNAME_MAX_LENGTH = 20;
        public static final int PASSWORD_MIN_LENGTH = 6;
        public static final int PASSWORD_MAX_LENGTH = 20;
        public static final int NICKNAME_MIN_LENGTH = 2;
        public static final int NICKNAME_MAX_LENGTH = 20;
        
        public static final String PHONE_PATTERN = "^1[3-9]\\d{9}$";
        public static final String EMAIL_PATTERN = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.(com|cn|net|org|edu|gov|mil|biz|info|io|us)$";
        
        private Validation() {}
    }
    
    // ==================== 默认值 ====================
    
    public static final class Defaults {
        public static final int INITIAL_POINTS = 0;
        public static final int INITIAL_GROWTH_VALUE = 0;
        public static final int INITIAL_MEMBER_DAYS = 0;
        
        private Defaults() {}
    }
}
