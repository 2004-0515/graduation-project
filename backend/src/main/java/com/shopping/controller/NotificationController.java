package com.shopping.controller;

import com.shopping.dto.NotificationDto;
import com.shopping.dto.Response;
import com.shopping.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    /**
     * 获取当前用户的所有通知
     */
    @GetMapping
    public Response<List<NotificationDto>> getNotifications(
            @RequestParam(required = false) String type) {
        String username = getCurrentUsername();
        List<NotificationDto> notifications;
        if (type != null && !type.isEmpty() && !"all".equals(type)) {
            notifications = notificationService.getUserNotificationsByType(username, type);
        } else {
            notifications = notificationService.getUserNotifications(username);
        }
        return Response.success("获取通知成功", notifications);
    }

    /**
     * 获取未读通知数量
     */
    @GetMapping("/unread-count")
    public Response<Long> getUnreadCount() {
        String username = getCurrentUsername();
        long count = notificationService.getUnreadCount(username);
        return Response.success("获取成功", count);
    }

    /**
     * 标记单条通知为已读
     */
    @PutMapping("/{id}/read")
    public Response<Void> markAsRead(@PathVariable Long id) {
        String username = getCurrentUsername();
        notificationService.markAsRead(username, id);
        return Response.success("标记成功");
    }

    /**
     * 标记所有通知为已读
     */
    @PutMapping("/read-all")
    public Response<Void> markAllAsRead() {
        String username = getCurrentUsername();
        notificationService.markAllAsRead(username);
        return Response.success("已全部标记为已读");
    }

    /**
     * 删除单条通知
     */
    @DeleteMapping("/{id}")
    public Response<Void> deleteNotification(@PathVariable Long id) {
        String username = getCurrentUsername();
        notificationService.deleteNotification(username, id);
        return Response.success("删除成功");
    }

    /**
     * 清空所有通知
     */
    @DeleteMapping("/clear")
    public Response<Void> clearAll() {
        String username = getCurrentUsername();
        notificationService.clearAll(username);
        return Response.success("已清空所有通知");
    }

    /**
     * 【管理员】发送通知给指定用户
     */
    @PostMapping("/admin/send")
    public Response<Void> sendNotification(@RequestBody Map<String, Object> body) {
        Long userId = ((Number) body.get("userId")).longValue();
        String type = (String) body.get("type");
        String title = (String) body.get("title");
        String message = (String) body.get("message");
        notificationService.sendToUser(userId, type, title, message);
        return Response.success("发送成功");
    }

    /**
     * 【管理员】发送通知给所有用户
     */
    @PostMapping("/admin/broadcast")
    public Response<Void> broadcastNotification(@RequestBody Map<String, Object> body) {
        String type = (String) body.get("type");
        String title = (String) body.get("title");
        String message = (String) body.get("message");
        @SuppressWarnings("unchecked")
        List<Number> userIdNumbers = (List<Number>) body.get("userIds");
        List<Long> userIds = userIdNumbers.stream().map(Number::longValue).toList();
        notificationService.sendToAllUsers(type, title, message, userIds);
        return Response.success("发送成功");
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new com.shopping.exception.AuthenticationException("用户未认证");
        }
        return auth.getName();
    }
}
