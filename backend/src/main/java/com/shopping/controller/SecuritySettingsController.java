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

}
