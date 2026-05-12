package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.PrivacySettings;
import com.shopping.entity.User;
import com.shopping.service.PrivacySettingsService;
import com.shopping.service.UserService;
import com.shopping.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * 隐私设置控制器
 */
@RestController
@RequestMapping("/privacy-settings")
public class PrivacySettingsController {
    private static final String AUTH_FAILED_MESSAGE = "用户未认证或认证失效";

    @Autowired
    private PrivacySettingsService privacySettingsService;
    
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
     * 获取当前用户的隐私设置
     * @return 隐私设置
     */
    @GetMapping("/me")
    public Response<PrivacySettings> getCurrentUserPrivacySettings() {
        Optional<User> currentUser = getCurrentUser();
        if (currentUser.isEmpty()) {
            return Response.fail(401, AUTH_FAILED_MESSAGE);
        }

        PrivacySettings privacySettings = privacySettingsService.getPrivacySettings(currentUser.get());
        return Response.success("获取隐私设置成功", privacySettings);
    }

    /**
     * 更新当前用户的隐私设置
     * @param privacySettings 隐私设置
     * @return 更新后的隐私设置
     */
    @PutMapping("/me")
    public Response<PrivacySettings> updateCurrentUserPrivacySettings(@RequestBody PrivacySettings privacySettings) {
        Optional<User> currentUser = getCurrentUser();
        if (currentUser.isEmpty()) {
            return Response.fail(401, AUTH_FAILED_MESSAGE);
        }

        // 设置用户信息，防止恶意修改
        privacySettings.setUser(currentUser.get());
        PrivacySettings updatedSettings = privacySettingsService.updatePrivacySettings(privacySettings);
        return Response.success("更新隐私设置成功", updatedSettings);
    }
}
