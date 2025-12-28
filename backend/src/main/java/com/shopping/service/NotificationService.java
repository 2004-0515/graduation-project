package com.shopping.service;

import com.shopping.dto.NotificationDto;
import com.shopping.entity.Notification;
import com.shopping.entity.User;
import com.shopping.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserService userService;

    public List<NotificationDto> getUserNotifications(String username) {
        User user = userService.getUserByUsername(username);
        return notificationRepository.findByUserIdOrderByCreatedTimeDesc(user.getId())
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<NotificationDto> getUserNotificationsByType(String username, String type) {
        User user = userService.getUserByUsername(username);
        if ("unread".equals(type)) {
            return notificationRepository.findByUserIdAndReadOrderByCreatedTimeDesc(user.getId(), false)
                    .stream().map(this::toDto).collect(Collectors.toList());
        }
        return notificationRepository.findByUserIdAndTypeOrderByCreatedTimeDesc(user.getId(), type)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public long getUnreadCount(String username) {
        User user = userService.getUserByUsername(username);
        return notificationRepository.countByUserIdAndRead(user.getId(), false);
    }

    @Transactional
    public void markAsRead(String username, Long notificationId) {
        User user = userService.getUserByUsername(username);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("通知不存在"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("无权操作此通知");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String username) {
        User user = userService.getUserByUsername(username);
        notificationRepository.markAllAsReadByUserId(user.getId());
    }

    @Transactional
    public void deleteNotification(String username, Long notificationId) {
        User user = userService.getUserByUsername(username);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("通知不存在"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("无权操作此通知");
        }
        notificationRepository.delete(notification);
    }

    @Transactional
    public void clearAll(String username) {
        User user = userService.getUserByUsername(username);
        notificationRepository.deleteAllByUserId(user.getId());
    }

    /**
     * 创建通知（供其他服务调用）
     */
    @Transactional
    public void createNotification(Long userId, String type, String title, String message, Long relatedId) {
        Notification notification = new Notification();
        // 直接设置用户引用
        User user = new User();
        user.setId(userId);
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRelatedId(relatedId);
        notificationRepository.save(notification);
    }

    /**
     * 发送订单状态变更通知
     */
    @Transactional
    public void sendOrderNotification(Long userId, Long orderId, String orderNo, String statusName) {
        createNotification(userId, "order", "订单状态更新", 
                "您的订单 " + orderNo + " " + statusName, orderId);
    }

    /**
     * 【管理员】发送通知给指定用户
     */
    @Transactional
    public void sendToUser(Long userId, String type, String title, String message) {
        createNotification(userId, type, title, message, null);
    }

    /**
     * 【管理员】发送通知给所有用户
     */
    @Transactional
    public void sendToAllUsers(String type, String title, String message, List<Long> userIds) {
        for (Long userId : userIds) {
            createNotification(userId, type, title, message, null);
        }
    }

    private NotificationDto toDto(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.setId(n.getId());
        dto.setType(n.getType());
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setRead(n.getRead());
        dto.setRelatedId(n.getRelatedId());
        dto.setCreatedTime(n.getCreatedTime());
        dto.setTimeAgo(formatTimeAgo(n.getCreatedTime()));
        return dto;
    }

    private String formatTimeAgo(LocalDateTime time) {
        if (time == null) return "";
        Duration duration = Duration.between(time, LocalDateTime.now());
        long minutes = duration.toMinutes();
        if (minutes < 1) return "刚刚";
        if (minutes < 60) return minutes + "分钟前";
        long hours = duration.toHours();
        if (hours < 24) return hours + "小时前";
        long days = duration.toDays();
        if (days < 7) return days + "天前";
        return time.toLocalDate().toString();
    }
}
