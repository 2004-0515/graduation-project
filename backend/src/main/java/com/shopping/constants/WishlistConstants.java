package com.shopping.constants;

/**
 * 心愿单相关常量定义
 */
public final class WishlistConstants {
    
    private WishlistConstants() {
        throw new UnsupportedOperationException("常量类不能实例化");
    }
    
    // ==================== 心愿单状态 ====================
    
    public static final class WishlistStatus {
        public static final int COOLING = 0;    // 冷静中
        public static final int READY = 1;      // 可购买
        public static final int PURCHASED = 2;  // 已购买
        public static final int REMOVED = 3;    // 已移除
        
        private WishlistStatus() {}
        
        public static String getName(int status) {
            return switch (status) {
                case COOLING -> "冷静中";
                case READY -> "可购买";
                case PURCHASED -> "已购买";
                case REMOVED -> "已移除";
                default -> "未知";
            };
        }
    }
}
