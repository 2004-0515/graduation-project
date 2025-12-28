package com.shopping.service;

import com.shopping.dto.RegisterRequest;
import com.shopping.dto.UserUpdateRequest;
import com.shopping.entity.User;
import com.shopping.exception.AuthenticationException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.UserRepository;
import com.shopping.utils.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private SecuritySettingsService securitySettingsService;

    @Autowired
    private PrivacySettingsService privacySettingsService;

    @Autowired
    private NotificationSettingsService notificationSettingsService;

    /**
     * 用户注册
     * @param request 用户注册信息
     * @return 注册成功的用户
     */
    @Transactional(rollbackFor = Exception.class)
    public User register(RegisterRequest request) {
        logger.info("Processing user registration for: {}", request.getUsername());

        // 检查用户名是否已存在
        if (userRepository.findByUsername(request.getUsername()) != null) {
            throw new ValidationException("用户名已存在");
        }

        // 检查邮箱是否已存在
        if (userRepository.findByEmail(request.getEmail()) != null) {
            throw new ValidationException("邮箱已被注册");
        }

        // 创建用户实体
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setStatus(1); // 默认启用
        user.setPoints(0);
        user.setGrowthValue(0);
        user.setMemberDays(0);

        // 保存用户
        User savedUser = userRepository.save(user);
        logger.info("User registered successfully: {}", savedUser.getUsername());

        // 初始化用户设置
        try {
            securitySettingsService.initializeSecuritySettings(savedUser);
            privacySettingsService.initializePrivacySettings(savedUser);
            notificationSettingsService.initializeNotificationSettings(savedUser);
        } catch (Exception e) {
            logger.error("Failed to initialize user settings for: {}", savedUser.getUsername(), e);
            // 不影响注册成功
        }

        return savedUser;
    }

    /**
     * 用户登录
     * @param username 用户名
     * @param password 密码
     * @return JWT令牌
     */
    public String login(String username, String password) {
        logger.info("Processing user login for: {}", username);
        try {
            // 认证用户
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
            );

            // 更新最后登录时间
            User user = userRepository.findByUsername(username);
            if (user != null) {
                user.setLastLoginTime(java.time.LocalDateTime.now());
                userRepository.save(user);
            }

            // 生成JWT令牌
            String token = jwtUtil.generateToken(username);
            logger.info("User logged in successfully: {}", username);
            return token;
        } catch (Exception e) {
            logger.warn("Login failed for user: {}", username);
            throw new AuthenticationException("用户名或密码错误");
        }
    }
    
    /**
     * 修改用户密码
     * @param username 用户名
     * @param currentPassword 当前密码
     * @param newPassword 新密码
     * @param confirmPassword 确认新密码
     * @throws ValidationException 密码验证失败时抛出异常
     */
    @Transactional(rollbackFor = Exception.class)
    public void changePassword(String username, String currentPassword, String newPassword, String confirmPassword) {
        logger.info("Processing password change for user: {}", username);

        // 1. 查找用户
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new com.shopping.exception.ResourceNotFoundException("用户", username);
        }

        // 2. 验证当前密码
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new ValidationException("旧密码输入错误");
        }

        // 3. 验证新密码与确认新密码是否一致
        if (!newPassword.equals(confirmPassword)) {
            throw new ValidationException("两次输入的新密码不一致");
        }

        // 4. 验证新密码与旧密码是否不同
        if (currentPassword.equals(newPassword)) {
            throw new ValidationException("新密码不能与当前密码相同");
        }

        // 5. 验证新密码复杂度
        validatePasswordStrength(newPassword);

        // 6. 加密并更新密码
        String encodedNewPassword = passwordEncoder.encode(newPassword);
        int updatedRows = userRepository.updatePasswordById(user.getId(), encodedNewPassword);

        if (updatedRows == 0) {
            throw new RuntimeException("密码更新失败，请稍后重试");
        }

        // 7. 更新安全设置中的密码修改时间
        try {
            securitySettingsService.recordPasswordChange(user.getId());
        } catch (Exception e) {
            logger.warn("Failed to record password change for user: {}", username, e);
            // 不影响密码修改成功
        }

        logger.info("Password changed successfully for user: {}", username);
    }

    /**
     * 更新用户资料
     * @param username 用户名
     * @param request 更新请求
     * @return 更新后的用户
     */
    @Transactional(rollbackFor = Exception.class)
    public User updateUserProfile(String username, UserUpdateRequest request) {
        logger.info("Updating user profile for: {}", username);

        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new com.shopping.exception.ResourceNotFoundException("用户", username);
        }

        // 检查邮箱是否已被其他用户使用
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            User existingUser = userRepository.findByEmail(request.getEmail());
            if (existingUser != null && !existingUser.getId().equals(user.getId())) {
                throw new ValidationException("邮箱已被其他用户使用");
            }
            user.setEmail(request.getEmail());
        }

        // 更新其他字段
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }

        User updatedUser = userRepository.save(user);
        logger.info("User profile updated successfully for: {}", username);
        return updatedUser;
    }

    /**
     * 验证密码强度
     * @param password 密码
     * @throws ValidationException 如果密码不符合要求
     */
    private void validatePasswordStrength(String password) {
        if (password.length() < 6 || password.length() > 20) {
            throw new ValidationException("密码长度必须在6-20个字符之间");
        }
        if (!password.matches(".*\\d.*")) {
            throw new ValidationException("密码必须包含至少一个数字");
        }
        if (!password.matches(".*[a-zA-Z].*")) {
            throw new ValidationException("密码必须包含至少一个字母");
        }
    }
}