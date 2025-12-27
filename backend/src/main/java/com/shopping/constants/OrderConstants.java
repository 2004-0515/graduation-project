package com.shopping.constants;

/**
 * 订单相关常量定义
 * 消除魔法数字，提高代码可维护性
 */
public final class OrderConstants {
    
    private OrderConstants() {
        throw new UnsupportedOperationException("常量类不能实例化");
    }
    
    // ==================== 订单状态 ====================
    
    public static final class OrderStatus {
        public static final int PENDING_PAYMENT = 0;  // 待支付
        public static final int PENDING_SHIPMENT = 1; // 待发货
        public static final int PENDING_RECEIPT = 2;  // 待收货
        public static final int COMPLETED = 3;        // 已完成
        public static final int CANCELLED = 4;        // 已取消
        
        private OrderStatus() {}
        
        public static String getName(int status) {
            return switch (status) {
                case PENDING_PAYMENT -> "待支付";
                case PENDING_SHIPMENT -> "待发货";
                case PENDING_RECEIPT -> "待收货";
                case COMPLETED -> "已完成";
                case CANCELLED -> "已取消";
                default -> "未知";
            };
        }
        
        public static boolean canCancel(int status) {
            return status == PENDING_PAYMENT || status == PENDING_SHIPMENT;
        }
        
        public static boolean canConfirm(int status) {
            return status == PENDING_RECEIPT;
        }
        
        public static boolean canDelete(int status) {
            return status == COMPLETED || status == CANCELLED;
        }
    }
    
    // ==================== 支付状态 ====================
    
    public static final class PaymentStatus {
        public static final int UNPAID = 0;      // 未支付
        public static final int PAID = 1;        // 已支付
        public static final int FAILED = 2;      // 支付失败
        
        private PaymentStatus() {}
        
        public static String getName(int status) {
            return switch (status) {
                case UNPAID -> "未支付";
                case PAID -> "已支付";
                case FAILED -> "支付失败";
                default -> "未知";
            };
        }
    }
    
    // ==================== 支付方式 ====================
    
    public static final class PaymentMethod {
        public static final int WECHAT = 1;  // 微信支付
        public static final int ALIPAY = 2;  // 支付宝
        
        private PaymentMethod() {}
        
        public static String getName(int method) {
            return switch (method) {
                case WECHAT -> "微信支付";
                case ALIPAY -> "支付宝";
                default -> "未知";
            };
        }
    }
}
