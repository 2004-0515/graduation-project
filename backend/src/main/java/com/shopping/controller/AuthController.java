package com.shopping.controller;

import com.shopping.dto.PasswordChangeDto;
import com.shopping.dto.Response;
import com.shopping.entity.User;
import com.shopping.repository.UserRepository;
import com.shopping.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 认证控制器，处理登录注册请求
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;



    /**
     * 用户注册
     * @param user 注册信息
     * @return 注册结果
     */
    @PostMapping("/register")
    public Response<User> register(@RequestBody @Valid User user) {
        User registeredUser = authService.register(user);
        return Response.success("用户注册成功", registeredUser);
    }

    /**
     * 用户登录
     * @param loginRequest 登录信息，包含username和password
     * @return 登录结果，包含JWT令牌和用户信息
     */
    @PostMapping("/login")
    public Response<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");
        String token = authService.login(username, password);
        // 获取用户信息
        User user = userRepository.findByUsername(username);
        // 构建响应，包含token和user信息
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("token", token);
        responseData.put("user", user);
        return Response.success("登录成功", responseData);
    }


    
    /**
     * 获取当前登录用户信息
     * @return 当前登录用户信息
     */
    @GetMapping("/me")
    public Response<User> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Response.fail(401, "用户未认证");
        }
        // 获取用户名
        String username = authentication.getName();
        // 根据用户名获取用户信息
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return Response.fail(404, "用户不存在");
        }
        return Response.success("获取当前用户成功", user);
    }
    
    /**
     * 更新当前登录用户信息
     * @param userUpdate 更新的用户信息
     * @return 更新后的用户信息
     */
    @PostMapping("/me")
    public Response<User> updateCurrentUser(@RequestBody @Valid User userUpdate) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Response.fail(401, "用户未认证");
        }
        // 获取用户名
        String username = authentication.getName();
        // 根据用户名获取用户信息
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return Response.fail(404, "用户不存在");
        }
        
        // 更新用户信息
        if (userUpdate.getEmail() != null) {
            user.setEmail(userUpdate.getEmail());
        }
        if (userUpdate.getPhone() != null) {
            user.setPhone(userUpdate.getPhone());
        }
        if (userUpdate.getNickname() != null) {
            user.setNickname(userUpdate.getNickname());
        }
        if (userUpdate.getBio() != null) {
            user.setBio(userUpdate.getBio());
        }
        if (userUpdate.getAvatar() != null) {
            user.setAvatar(userUpdate.getAvatar());
        }
        
        // 保存更新后的用户信息
        User updatedUser = userRepository.save(user);
        return Response.success("用户信息更新成功", updatedUser);
    }
    
    /**
     * 修改当前登录用户密码
     * @param passwordChangeDto 密码更新请求DTO
     * @return 修改结果
     */
    @PostMapping("/change-password")
    @Transactional(rollbackFor = Exception.class)
    public Response<String> changePassword(@RequestBody @Valid PasswordChangeDto passwordChangeDto) {
        // 获取当前登录用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return Response.fail(401, "用户未认证");
        }
        
        String username = authentication.getName();
        
        try {
            // 调用服务层处理密码修改逻辑
            authService.changePassword(
                username,
                passwordChangeDto.getCurrentPassword(),
                passwordChangeDto.getNewPassword(),
                passwordChangeDto.getConfirmPassword()
            );
            return Response.success("密码修改成功");
        } catch (RuntimeException e) {
            // 返回具体的错误信息
            return Response.fail(400, e.getMessage());
        }
    }
    
    /**
     * 用户退出登录
     * @return 退出结果
     */
    @PostMapping("/logout")
    public Response<String> logout() {
        // 在JWT认证机制中，logout主要是在客户端完成的（删除本地存储的token）
        // 这里主要是为了保持API的完整性，实际操作可以很简单
        return Response.success("退出登录成功");
    }
    
    /**
     * 测试密码匹配功能（用于调试）
     * @param request 请求参数，包含username、password
     * @return 密码匹配结果
     */
    @PostMapping("/test-password-match")
    public Response<Map<String, Object>> testPasswordMatch(@RequestBody Map<String, String> request) {
        System.out.println("=== 测试密码匹配功能 ===");
        String username = request.get("username");
        String password = request.get("password");
        
        Map<String, Object> result = new HashMap<>();
        result.put("username", username);
        result.put("password", password);
        
        if (username == null || password == null) {
            result.put("match", false);
            result.put("message", "用户名或密码不能为空");
            return Response.success("密码匹配测试", result);
        }
        
        User user = userRepository.findByUsername(username);
        if (user == null) {
            result.put("match", false);
            result.put("message", "用户不存在");
            return Response.success("密码匹配测试", result);
        }
        
        result.put("storedPassword", user.getPassword());
        
        boolean isMatch = passwordEncoder.matches(password, user.getPassword());
        result.put("match", isMatch);
        result.put("message", isMatch ? "密码匹配成功" : "密码匹配失败");
        
        // 额外调试信息
        String reEncryptedPassword = passwordEncoder.encode(password);
        result.put("reEncryptedPassword", reEncryptedPassword);
        result.put("directCompare", password.equals(user.getPassword()));
        result.put("reEncryptedCompare", reEncryptedPassword.equals(user.getPassword()));
        
        System.out.println("=== 测试密码匹配功能完成 ===");
        
        return Response.success("密码匹配测试", result);
    }
}