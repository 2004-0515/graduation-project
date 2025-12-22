package com.shopping.service;

import com.shopping.entity.User;
import com.shopping.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/**
 * 用户服务类，处理用户相关业务逻辑
 */
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
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
     * 根据用户名查询用户
     * @param username 用户名
     * @return 用户信息
     */
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    /**
     * 根据邮箱查询用户
     * @param email 邮箱
     * @return 用户信息
     */
    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    /**
     * 保存用户
     * @param user 用户信息
     * @return 保存后的用户信息
     */
    public User saveUser(User user) {
        return userRepository.save(user);
    }
}