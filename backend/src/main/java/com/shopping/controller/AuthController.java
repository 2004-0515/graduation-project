package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.User;
import com.shopping.service.AuthService;
import com.shopping.utils.CaptchaUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 认证控制器，处理登录注册请求
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * 生成验证码
     * @return 验证码和图片
     */
    @GetMapping("/captcha")
    public Response<Map<String, String>> generateCaptcha() {
        Map<String, String> captcha = CaptchaUtil.generateCaptcha();
        return Response.success("Captcha generated successfully", captcha);
    }

    /**
     * 用户注册
     * @param user 注册信息
     * @return 注册结果
     */
    @PostMapping("/register")
    public Response<User> register(@RequestBody User user) {
        User registeredUser = authService.register(user);
        return Response.success("User registered successfully", registeredUser);
    }

    /**
     * 用户登录
     * @param loginRequest 登录信息，包含username和password
     * @return 登录结果，包含JWT令牌
     */
    @PostMapping("/login")
    public Response<Map<String, String>> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");
        String token = authService.login(username, password);
        return Response.success("Login successful", Map.of("token", token));
    }

    /**
     * 验证验证码
     * @param request 验证请求，包含captchaCode（用户输入的验证码）和correctCode（正确的验证码）
     * @return 验证结果
     */
    @PostMapping("/validate-captcha")
    public Response<Boolean> validateCaptcha(@RequestBody Map<String, String> request) {
        String captchaCode = request.get("captchaCode");
        String correctCode = request.get("correctCode");
        boolean isValid = CaptchaUtil.validateCaptcha(captchaCode, correctCode);
        return Response.success("Captcha validated successfully", isValid);
    }
}