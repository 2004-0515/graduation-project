package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.User;
import com.shopping.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 用户控制器，处理用户相关API请求
 */
@RestController
@RequestMapping("/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    /**
     * 获取用户列表，支持分页
     * @param pageNo 页码（从0开始）
     * @param pageSize 每页记录数
     * @return 分页用户列表
     */
    @GetMapping
    public Response<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize) {
        Page<User> users = userService.fetchUsers(pageNo, pageSize);
        return Response.success(users);
    }
    
    /**
     * 根据用户名获取用户信息
     * @param username 用户名
     * @return 用户信息
     */
    @GetMapping("/username/{username}")
    public Response<User> getUserByUsername(@PathVariable String username) {
        User user = userService.findByUsername(username);
        if (user != null) {
            return Response.success(user);
        } else {
            return Response.fail(404, "用户不存在");
        }
    }
    
    /**
     * 根据邮箱获取用户信息
     * @param email 邮箱
     * @return 用户信息
     */
    @GetMapping("/email/{email}")
    public Response<User> getUserByEmail(@PathVariable String email) {
        User user = userService.findByEmail(email);
        if (user != null) {
            return Response.success(user);
        } else {
            return Response.fail(404, "用户不存在");
        }
    }
    
    /**
     * 创建新用户
     * @param user 用户信息
     * @return 创建后的用户信息
     */
    @PostMapping
    public Response<User> createUser(@RequestBody User user) {
        User createdUser = userService.saveUser(user);
        return Response.success("用户创建成功", createdUser);
    }
    
    /**
     * 更新用户信息
     * @param id 用户ID
     * @param user 用户信息
     * @return 更新后的用户信息
     */
    @PutMapping("/{id}")
    public Response<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        user.setId(id);
        User updatedUser = userService.saveUser(user);
        return Response.success("用户更新成功", updatedUser);
    }
    
    /**
     * 删除当前登录用户的账号
     * @return 删除结果
     */
    @DeleteMapping("/me")
    public Response<String> deleteCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        // 获取用户名，而不是直接转换为User对象
        String username = authentication.getName();
        // 通过用户名查询实际的用户对象
        User user = userService.findByUsername(username);
        if (user != null) {
            userService.deleteAccount(user);
            return Response.success("账号删除成功");
        } else {
            return Response.fail(404, "用户不存在");
        }
    }
}