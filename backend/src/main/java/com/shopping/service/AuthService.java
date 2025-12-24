package com.shopping.service;

import com.shopping.entity.User;
import com.shopping.repository.UserRepository;
import com.shopping.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    /**
     * 用户注册
     * @param user 用户注册信息
     * @return 注册成功的用户
     */
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
        return userRepository.save(user);
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
}