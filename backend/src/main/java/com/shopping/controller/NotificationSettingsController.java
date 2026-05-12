package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.NotificationSettings;
import com.shopping.entity.User;
import com.shopping.service.NotificationSettingsService;
import com.shopping.service.UserService;
import com.shopping.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * 通知设置控制器
 */
@RestController
@RequestMapping("/notification-settings")
public class NotificationSettingsController {
    private static final String AUTH_FAILED_MESSAGE = "用户未认证或认证失效";

    @Autowired
    private NotificationSettingsService notificationSettingsService;
    
    @Autowired
    private UserService userService;

    private Optional<User> getCurrentUser() {
        if (!SecurityUtils.isAuthenticated()) {
            return Optional.empty();
        }
        String username = SecurityUtils.getCurrentUsername();
        return Optional.ofNullable(userService.findByUsername(username));
    }

    /**
     * 获取当前用户的通知设置
     * @return 通知设置
     */
    @GetMapping("/me")
    public Response<NotificationSettings> getCurrentUserNotificationSettings() {
        Optional<User> currentUser = getCurrentUser();
        if (currentUser.isEmpty()) {
            return Response.fail(401, AUTH_FAILED_MESSAGE);
        }

        NotificationSettings notificationSettings =
                notificationSettingsService.getNotificationSettings(currentUser.get());
        return Response.success("获取通知设置成功", notificationSettings);
    }

    /**
     * 更新当前用户的通知设置
     * @param notificationSettings 通知设置
     * @return 更新后的通知设置
     */
    @PutMapping("/me")
    public Response<NotificationSettings> updateCurrentUserNotificationSettings(@RequestBody NotificationSettings notificationSettings) {
        Optional<User> currentUser = getCurrentUser();
        if (currentUser.isEmpty()) {
            return Response.fail(401, AUTH_FAILED_MESSAGE);
        }

        // 设置用户信息，防止恶意修改
        notificationSettings.setUser(currentUser.get());
        NotificationSettings updatedSettings = notificationSettingsService.updateNotificationSettings(notificationSettings);
        return Response.success("更新通知设置成功", updatedSettings);
    }
}
