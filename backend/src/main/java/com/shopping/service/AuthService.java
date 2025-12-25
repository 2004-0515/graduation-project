package com.shopping.service;

import com.shopping.entity.User;
import com.shopping.repository.UserRepository;
import com.shopping.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

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
     * @param user 用户注册信息
     * @return 注册成功的用户
     */
    @Transactional(rollbackFor = Exception.class)
    public User register(User user) {
        // 检查用户名是否已存在
        if (userRepository.findByUsername(user.getUsername()) != null) {
            throw new RuntimeException("Username already exists");
        }
        // 检查邮箱是否已存在
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new RuntimeException("Email already exists");
        }
        // 设置默认状态为1（正常）
        if (user.getStatus() == null) {
            user.setStatus(1);
        }
        // 密码加密
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        // 保存用户
        User savedUser = userRepository.save(user);
        
        // 初始化安全设置
        securitySettingsService.initializeSecuritySettings(savedUser);
        // 初始化隐私设置
        privacySettingsService.initializePrivacySettings(savedUser);
        // 初始化通知设置
        notificationSettingsService.initializeNotificationSettings(savedUser);
        
        return savedUser;
    }

    /**
     * 用户登录
     * @param username 用户名
     * @param password 密码
     * @return JWT令牌
     */
    public String login(String username, String password) {
        // 认证用户
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(username, password)
        );
        // 生成JWT令牌
        return jwtUtil.generateToken(username);
    }
    
    /**
     * 更新用户密码
     * @param id 用户ID
     * @param oldPassword 旧密码
     * @param newPassword 新密码
     * @return 是否更新成功
     */
    public boolean updatePassword(Long id, String oldPassword, String newPassword) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return false;
        }
        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return false;
        }
        // 设置新密码
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return true;
    }
    
    /**
     * 修改用户密码
     * @param username 用户名
     * @param currentPassword 当前密码
     * @param newPassword 新密码
     * @param confirmPassword 确认新密码
     * @throws RuntimeException 密码修改失败时抛出异常
     */
    @Transactional(rollbackFor = Exception.class)
    public void changePassword(String username, String currentPassword, String newPassword, String confirmPassword) {
        // 1. 查找用户
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        
        // 2. 验证当前密码
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("输入的旧密码错误");
        }
        
        // 3. 验证新密码与确认新密码是否一致
        if (!newPassword.equals(confirmPassword)) {
            throw new RuntimeException("两次输入的新密码不一致");
        }
        
        // 4. 验证新密码与旧密码是否不同
        if (currentPassword.equals(newPassword)) {
            throw new RuntimeException("新密码不能与旧密码相同");
        }
        
        // 5. 验证新密码复杂度
        if (newPassword.length() < 6 || newPassword.length() > 20) {
            throw new RuntimeException("新密码长度必须在6-20个字符之间");
        }
        if (!newPassword.matches(".*\\d.*")) {
            throw new RuntimeException("新密码必须包含至少一个数字");
        }
        
        // 6. 加密并更新密码
        String encodedNewPassword = passwordEncoder.encode(newPassword);
        int updatedRows = userRepository.updatePasswordById(user.getId(), encodedNewPassword);
        
        if (updatedRows == 0) {
            throw new RuntimeException("密码更新失败");
        }
        
        // 7. 更新安全设置中的密码修改时间
        securitySettingsService.recordPasswordChange(user.getId());
    }
}