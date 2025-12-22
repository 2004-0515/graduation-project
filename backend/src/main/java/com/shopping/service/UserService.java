package com.shopping.service;

import com.shopping.entity.User;
import com.shopping.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 用户服务类，处理用户相关业务逻辑
 */
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private CacheManager cacheManager;
    
    /**
     * 获取用户列表，支持分页
     * @param pageNo 页码（从0开始）
     * @param pageSize 每页记录数
     * @return 分页用户列表
     */
    public Page<User> fetchUsers(int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        return userRepository.findAll(pageable);
    }
    
    /**
     * 根据用户名查询用户，添加缓存
     * @param username 用户名
     * @return 用户信息
     */
    @Cacheable(value = "users", key = "#username", unless = "#result == null")
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    /**
     * 根据邮箱查询用户，添加缓存
     * @param email 邮箱
     * @return 用户信息
     */
    @Cacheable(value = "users", key = "#email", unless = "#result == null")
    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    /**
     * 保存用户，清除相关缓存
     * @param user 用户信息
     * @return 保存后的用户信息
     */
    @CacheEvict(value = "users", key = "#user.username", allEntries = false, beforeInvocation = false)
    public User saveUser(User user) {
        // 如果是新用户且密码未加密，则加密密码
        if (user.getId() == null && user.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        User savedUser = userRepository.save(user);
        // 清除可能存在的邮箱缓存
        if (savedUser.getEmail() != null) {
            Cache usersCache = cacheManager.getCache("users");
            if (usersCache != null) {
                usersCache.evict(savedUser.getEmail());
            }
        }
        return savedUser;
    }
    
    /**
     * 检查用户名是否存在
     * @param username 用户名
     * @return 是否存在
     */
    public boolean existsByUsername(String username) {
        return findByUsername(username) != null;
    }
    
    /**
     * 检查邮箱是否存在
     * @param email 邮箱
     * @return 是否存在
     */
    public boolean existsByEmail(String email) {
        return findByEmail(email) != null;
    }
    
    /**
     * 更新用户密码，清除相关缓存
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
        User updatedUser = userRepository.save(user);
        
        // 清除缓存
        Cache usersCache = cacheManager.getCache("users");
        if (usersCache != null) {
            usersCache.evict(updatedUser.getUsername());
            if (updatedUser.getEmail() != null) {
                usersCache.evict(updatedUser.getEmail());
            }
        }
        return true;
    }
}