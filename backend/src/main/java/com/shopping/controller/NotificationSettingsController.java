package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.NotificationSettings;
import com.shopping.entity.User;
import com.shopping.service.NotificationSettingsService;
import com.shopping.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 通知设置控制器
 */
@RestController
@RequestMapping("/notification-settings")
public class NotificationSettingsController {
    @Autowired
    private NotificationSettingsService notificationSettingsService;
    
    @Autowired
    private UserService userService;

    /**
     * 获取当前用户的通知设置
     * @return 通知设置
     */
    @GetMapping("/me")
    public Response<NotificationSettings> getCurrentUserNotificationSettings() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        NotificationSettings notificationSettings = notificationSettingsService.getNotificationSettings(user);
        return Response.success("获取通知设置成功", notificationSettings);
    }

    /**
     * 更新当前用户的通知设置
     * @param notificationSettings 通知设置
     * @return 更新后的通知设置
     */
    @PutMapping("/me")
    public Response<NotificationSettings> updateCurrentUserNotificationSettings(@RequestBody NotificationSettings notificationSettings) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        // 设置用户信息，防止恶意修改
        notificationSettings.setUser(user);
        NotificationSettings updatedSettings = notificationSettingsService.updateNotificationSettings(notificationSettings);
        return Response.success("更新通知设置成功", updatedSettings);
    }
}
