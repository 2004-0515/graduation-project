package com.shopping.constants;

/**
 * 通知相关常量定义
 */
public final class NotificationConstants {
    
    private NotificationConstants() {
        throw new UnsupportedOperationException("常量类不能实例化");
    }
    
    // ==================== 通知类型 ====================
    
    public static final class NotificationType {
        public static final String SYSTEM = "system";           // 系统通知
        public static final String PROMOTION = "promotion";     // 促销通知
        public static final String PRICE_ALERT = "price_alert"; // 价格提醒
        public static final String ORDER = "order";             // 订单通知
        public static final String FILE_REVIEW = "file_review"; // 文件审核通知
        public static final String PRODUCT = "product";         // 商品通知
        
        private NotificationType() {}
    }
    
    // ==================== 通知状态 ====================
    
    public static final class NotificationStatus {
        public static final int UNREAD = 0;  // 未读
        public static final int READ = 1;    // 已读
        
        private NotificationStatus() {}
        
        public static String getName(int status) {
            return switch (status) {
                case UNREAD -> "未读";
                case READ -> "已读";
                default -> "未知";
            };
        }
    }
    
    // ==================== 文件类型 ====================
    
    public static final class FileType {
        public static final String AVATAR = "AVATAR";       // 用户头像
        public static final String PRODUCT = "PRODUCT";     // 商品图片
        public static final String REVIEW = "REVIEW";       // 评价图片
        public static final String CATEGORY = "CATEGORY";   // 分类图片
        public static final String PROMOTION = "PROMOTION"; // 促销图片
        
        private FileType() {}
    }
    
    // ==================== 文件审核状态 ====================
    
    public static final class FileReviewStatus {
        public static final int PENDING = 0;   // 待审核
        public static final int APPROVED = 1;  // 已通过
        public static final int REJECTED = 2;  // 已拒绝
        
        private FileReviewStatus() {}
        
        public static String getName(int status) {
            return switch (status) {
                case PENDING -> "待审核";
                case APPROVED -> "已通过";
                case REJECTED -> "已拒绝";
                default -> "未知";
            };
        }
    }
}
