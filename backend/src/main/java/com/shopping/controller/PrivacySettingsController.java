package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.PrivacySettings;
import com.shopping.entity.User;
import com.shopping.service.PrivacySettingsService;
import com.shopping.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 隐私设置控制器
 */
@RestController
@RequestMapping("/privacy-settings")
public class PrivacySettingsController {
    @Autowired
    private PrivacySettingsService privacySettingsService;
    
    @Autowired
    private UserService userService;

    /**
     * 获取当前用户的隐私设置
     * @return 隐私设置
     */
    @GetMapping("/me")
    public Response<PrivacySettings> getCurrentUserPrivacySettings() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        PrivacySettings privacySettings = privacySettingsService.getPrivacySettings(user);
        return Response.success("获取隐私设置成功", privacySettings);
    }

    /**
     * 更新当前用户的隐私设置
     * @param privacySettings 隐私设置
     * @return 更新后的隐私设置
     */
    @PutMapping("/me")
    public Response<PrivacySettings> updateCurrentUserPrivacySettings(@RequestBody PrivacySettings privacySettings) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        // 设置用户信息，防止恶意修改
        privacySettings.setUser(user);
        PrivacySettings updatedSettings = privacySettingsService.updatePrivacySettings(privacySettings);
        return Response.success("更新隐私设置成功", updatedSettings);
    }
}
