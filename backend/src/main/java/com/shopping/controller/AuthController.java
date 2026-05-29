package com.shopping.controller;

import com.shopping.dto.*;
import com.shopping.entity.User;
import com.shopping.service.AuthService;
import com.shopping.service.UserService;
import com.shopping.utils.SecurityUtils;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 认证控制器，处理登录、注册和用户资料相关请求。
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    /**
     * 用户注册。
     */
    @PostMapping("/register")
    public Response<UserDto> register(@RequestBody @Valid RegisterRequest request) {
        logger.info("User registration attempt for username: {}", request.getUsername());
        User registeredUser = authService.register(request);
        UserDto userDto = convertToDto(registeredUser);
        logger.info("User registered successfully: {}", request.getUsername());
        return Response.success("用户注册成功", userDto);
    }

    /**
     * 用户登录。
     */
    @PostMapping("/login")
    public Response<Map<String, Object>> login(@RequestBody @Valid LoginRequest request) {
        logger.info("User login attempt for username: {}", request.getUsername());
        String token = authService.login(request.getUsername(), request.getPassword());
        User user = userService.getUserByUsername(request.getUsername());

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("token", token);
        responseData.put("user", convertToDto(user));

        logger.info("User logged in successfully: {}", request.getUsername());
        return Response.success("登录成功", responseData);
    }

    /**
     * 获取当前登录用户信息。
     */
    @GetMapping("/me")
    public Response<UserDto> getCurrentUser() {
        String username = SecurityUtils.getCurrentUsername();
        logger.debug("Fetching current user info for: {}", username);

        User user = userService.getUserByUsername(username);
        return Response.success("获取当前用户成功", convertToDto(user));
    }

    /**
     * 更新当前登录用户信息。
     */
    @PutMapping("/me")
    public Response<UserDto> updateCurrentUser(@RequestBody @Valid UserUpdateRequest request) {
        String username = SecurityUtils.getCurrentUsername();
        logger.info("User profile update attempt for: {}", username);

        User updatedUser = authService.updateUserProfile(username, request);
        logger.info("User profile updated successfully: {}", username);
        return Response.success("用户信息更新成功", convertToDto(updatedUser));
    }

    /**
     * 修改当前登录用户密码。
     */
    @PostMapping("/change-password")
    public Response<String> changePassword(@RequestBody @Valid PasswordChangeDto request) {
        String username = SecurityUtils.getCurrentUsername();
        logger.info("Password change attempt for user: {}", username);

        authService.changePassword(
            username,
            request.getCurrentPassword(),
            request.getNewPassword(),
            request.getConfirmPassword()
        );

        logger.info("Password changed successfully for user: {}", username);
        return Response.success("密码修改成功");
    }

    /**
     * 用户退出登录。
     */
    @PostMapping("/logout")
    public Response<String> logout() {
        String username = SecurityUtils.getCurrentUsername();
        logger.info("User logout: {}", username);

        return Response.success("退出登录成功");
    }

    /**
     * 将 User 实体转换为 UserDto。
     */
    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setNickname(user.getNickname());
        dto.setBio(user.getBio());
        dto.setAvatar(user.getAvatar());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setPoints(user.getPoints());
        dto.setGrowthValue(user.getGrowthValue());
        dto.setMemberDays(user.getMemberDays());
        dto.setCreatedTime(user.getCreatedTime());
        dto.setUpdatedTime(user.getUpdatedTime());
        dto.setLastLoginTime(user.getLastLoginTime());
        return dto;
    }
}
