package com.shopping.constants;

/**
 * 优惠券相关常量定义
 */
public final class CouponConstants {
    
    private CouponConstants() {
        throw new UnsupportedOperationException("常量类不能实例化");
    }
    
    // ==================== 优惠券类型 ====================
    
    public static final class CouponType {
        public static final int REDUCE = 1;       // 满减券
        public static final int DISCOUNT = 2;     // 折扣券
        public static final int NO_THRESHOLD = 3; // 无门槛券
        
        private CouponType() {}
        
        public static String getName(int type) {
            return switch (type) {
                case REDUCE -> "满减券";
                case DISCOUNT -> "折扣券";
                case NO_THRESHOLD -> "无门槛券";
                default -> "未知";
            };
        }
    }
    
    // ==================== 优惠券状态 ====================
    
    public static final class CouponStatus {
        public static final int DISABLED = 0;  // 禁用
        public static final int ENABLED = 1;   // 启用
        
        private CouponStatus() {}
        
        public static String getName(int status) {
            return switch (status) {
                case DISABLED -> "禁用";
                case ENABLED -> "启用";
                default -> "未知";
            };
        }
    }
    
    // ==================== 用户优惠券状态 ====================
    
    public static final class UserCouponStatus {
        public static final int UNUSED = 0;   // 未使用
        public static final int USED = 1;     // 已使用
        public static final int EXPIRED = 2;  // 已过期
        
        private UserCouponStatus() {}
        
        public static String getName(int status) {
            return switch (status) {
                case UNUSED -> "未使用";
                case USED -> "已使用";
                case EXPIRED -> "已过期";
                default -> "未知";
            };
        }
    }
}
