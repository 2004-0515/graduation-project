package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.SecuritySettings;
import com.shopping.entity.User;
import com.shopping.service.SecuritySettingsService;
import com.shopping.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 安全设置控制器
 */
@RestController
@RequestMapping("/security-settings")
public class SecuritySettingsController {
    @Autowired
    private SecuritySettingsService securitySettingsService;
    
    @Autowired
    private UserService userService;

    /**
     * 获取当前用户的安全设置
     * @return 安全设置
     */
    @GetMapping("/me")
    public Response<SecuritySettings> getCurrentUserSecuritySettings() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        SecuritySettings securitySettings = securitySettingsService.getSecuritySettings(user);
        return Response.success("获取安全设置成功", securitySettings);
    }

    /**
     * 更新当前用户的安全设置
     * @param securitySettings 安全设置
     * @return 更新后的安全设置
     */
    @PutMapping("/me")
    public Response<SecuritySettings> updateCurrentUserSecuritySettings(@RequestBody SecuritySettings securitySettings) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        // 设置用户信息，防止恶意修改
        securitySettings.setUser(user);
        SecuritySettings updatedSettings = securitySettingsService.updateSecuritySettings(securitySettings);
        return Response.success("更新安全设置成功", updatedSettings);
    }

    /**
     * 重置登录失败次数
     * @return 操作结果
     */
    @PostMapping("/reset-login-attempts")
    public Response<Void> resetLoginAttempts() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        securitySettingsService.resetLoginAttempts(user.getId());
        return Response.success("重置登录失败次数成功");
    }

    /**
     * 解锁账号
     * @param userId 用户ID
     * @return 操作结果
     */
    @PostMapping("/unlock/{userId}")
    public Response<Void> unlockAccount(@PathVariable Long userId) {
        securitySettingsService.unlockAccount(userId);
        return Response.success("解锁账号成功");
    }

    /**
     * 检查账号是否锁定
     * @param userId 用户ID
     * @return 检查结果
     */
    @GetMapping("/check-lock/{userId}")
    public Response<Boolean> checkAccountLocked(@PathVariable Long userId) {
        boolean isLocked = securitySettingsService.isAccountLocked(userId);
        return Response.success("检查账号锁定状态成功", isLocked);
    }
}
