package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.SecuritySettings;
import com.shopping.entity.User;
import com.shopping.service.SecuritySettingsService;
import com.shopping.service.UserService;
import com.shopping.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * 安全设置控制器
 */
@RestController
@RequestMapping("/security-settings")
public class SecuritySettingsController {
    private static final String AUTH_FAILED_MESSAGE = "用户未认证或认证失效";

    @Autowired
    private SecuritySettingsService securitySettingsService;
    
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
     * 获取当前用户的安全设置
     * @return 安全设置
     */
    @GetMapping("/me")
    public Response<SecuritySettings> getCurrentUserSecuritySettings() {
        Optional<User> currentUser = getCurrentUser();
        if (currentUser.isEmpty()) {
            return Response.fail(401, AUTH_FAILED_MESSAGE);
        }

        SecuritySettings securitySettings = securitySettingsService.getSecuritySettings(currentUser.get());
        return Response.success("获取安全设置成功", securitySettings);
    }

}
