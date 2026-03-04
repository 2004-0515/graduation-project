package com.shopping.constants;

/**
 * 审核相关常量定义
 * 消除魔法数字，提高代码可维护性
 */
public final class AuditConstants {
    
    private AuditConstants() {
        throw new UnsupportedOperationException("常量类不能实例化");
    }
    
    // ==================== 审核状态 ====================
    
    public static final class AuditStatus {
        public static final int PENDING = 0;   // 待审核
        public static final int APPROVED = 1;  // 已通过
        public static final int REJECTED = 2;  // 已拒绝
        
        private AuditStatus() {}
        
        public static String getName(int status) {
            return switch (status) {
                case PENDING -> "待审核";
                case APPROVED -> "已通过";
                case REJECTED -> "已拒绝";
                default -> "未知";
            };
        }
    }
    
    // ==================== 商品状态 ====================
    
    public static final class ProductStatus {
        public static final int OFF_SHELF = 0;  // 已下架
        public static final int ON_SHELF = 1;   // 在售
        
        private ProductStatus() {}
        
        public static String getName(int status) {
            return switch (status) {
                case OFF_SHELF -> "已下架";
                case ON_SHELF -> "在售";
                default -> "未知";
            };
        }
    }
    
    // ==================== 用户状态 ====================
    
    public static final class UserStatus {
        public static final int DISABLED = 0;  // 禁用
        public static final int ENABLED = 1;   // 启用
        
        private UserStatus() {}
        
        public static String getName(int status) {
            return switch (status) {
                case DISABLED -> "禁用";
                case ENABLED -> "启用";
                default -> "未知";
            };
        }
    }
}
