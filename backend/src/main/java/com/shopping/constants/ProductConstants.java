package com.shopping.constants;

/**
 * 商品相关常量定义
 */
public final class ProductConstants {
    
    private ProductConstants() {
        throw new UnsupportedOperationException("常量类不能实例化");
    }
    
    // ==================== 商品状态 ====================
    
    public static final class Status {
        public static final int OFF_SHELF = 0;  // 已下架
        public static final int ON_SHELF = 1;   // 在售
        
        private Status() {}
        
        public static String getName(int status) {
            return switch (status) {
                case OFF_SHELF -> "已下架";
                case ON_SHELF -> "在售";
                default -> "未知";
            };
        }
        
        public static boolean isAvailable(int status) {
            return status == ON_SHELF;
        }
    }
}
