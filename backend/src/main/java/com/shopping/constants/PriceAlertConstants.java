package com.shopping.constants;

/**
 * 价格提醒相关常量定义
 */
public final class PriceAlertConstants {
    
    private PriceAlertConstants() {
        throw new UnsupportedOperationException("常量类不能实例化");
    }
    
    // ==================== 价格提醒状态 ====================
    
    public static final class AlertStatus {
        public static final int MONITORING = 0;  // 监控中
        public static final int TRIGGERED = 1;   // 已触发
        public static final int CANCELLED = 2;   // 已取消
        
        private AlertStatus() {}
        
        public static String getName(int status) {
            return switch (status) {
                case MONITORING -> "监控中";
                case TRIGGERED -> "已触发";
                case CANCELLED -> "已取消";
                default -> "未知";
            };
        }
    }
}
