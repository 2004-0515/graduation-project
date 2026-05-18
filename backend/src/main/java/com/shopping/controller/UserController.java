package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.User;
import com.shopping.service.UserService;
import com.shopping.utils.AdminUtils;
import com.shopping.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

/**
 * 用户控制器，处理用户相关API请求
 */
@RestController
@RequestMapping("/users")
public class UserController {

    private static final String AUTH_FAILED_MESSAGE = "用户未认证或认证失效";
    
    @Autowired
    private UserService userService;
    
    /**
     * 【管理员】获取用户列表，支持分页
     * @param pageNo 页码（从0开始）
     * @param pageSize 每页记录数
     * @return 分页用户列表
     */
    @GetMapping
    public Response<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        AdminUtils.requireAdmin();
        Page<User> users = userService.fetchUsers(pageNo, pageSize, keyword, status);
        return Response.success(users);
    }
    
    /**
     * 【管理员】根据用户名获取用户信息
     * @param username 用户名
     * @return 用户信息
     */
    @GetMapping("/username/{username}")
    public Response<User> getUserByUsername(@PathVariable String username) {
        AdminUtils.requireAdmin();
        User user = userService.findByUsername(username);
        if (user != null) {
            return Response.success(user);
        } else {
            return Response.fail(404, "用户不存在");
        }
    }
    
    /**
     * 【管理员】根据邮箱获取用户信息
     * @param email 邮箱
     * @return 用户信息
     */
    @GetMapping("/email/{email}")
    public Response<User> getUserByEmail(@PathVariable String email) {
        AdminUtils.requireAdmin();
        User user = userService.findByEmail(email);
        if (user != null) {
            return Response.success(user);
        } else {
            return Response.fail(404, "用户不存在");
        }
    }
    
    /**
     * 【管理员】创建新用户
     * @param user 用户信息
     * @return 创建后的用户信息
     */
    @PostMapping
    public Response<User> createUser(@RequestBody User user) {
        AdminUtils.requireAdmin();
        User createdUser = userService.saveUser(user);
        return Response.success("用户创建成功", createdUser);
    }
    
    /**
     * 【管理员】更新用户信息
     * @param id 用户ID
     * @param user 用户信息
     * @return 更新后的用户信息
     */
    @PutMapping("/{id}")
    public Response<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        AdminUtils.requireAdmin();
        user.setId(id);
        User updatedUser = userService.saveUser(user);
        return Response.success("用户更新成功", updatedUser);
    }
    
    /**
     * 【管理员】更新用户状态
     * @param id 用户ID
     * @param body 包含status字段的请求体
     * @return 操作结果
     */
    @PutMapping("/{id}/status")
    public Response<String> updateUserStatus(@PathVariable Long id, @RequestBody java.util.Map<String, Integer> body) {
        AdminUtils.requireAdmin();
        Integer status = body.get("status");
        userService.updateUserStatus(id, status);
        return Response.success("用户状态更新成功");
    }

    /**
     * 【管理员】更新用户角色
     */
    @PutMapping("/{id}/role")
    public Response<User> updateUserRole(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        AdminUtils.requireAdmin();
        User updatedUser = userService.updateUserRole(id, body.get("role"));
        return Response.success("用户角色更新成功", updatedUser);
    }
    
    /**
     * 【管理员】删除用户
     * @param id 用户ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public Response<String> deleteUser(@PathVariable Long id) {
        AdminUtils.requireAdmin();
        userService.deleteUserById(id);
        return Response.success("用户删除成功");
    }
    
    /**
     * 删除当前登录用户的账号
     * @return 删除结果
     */
    @DeleteMapping("/me")
    public Response<String> deleteCurrentUser() {
        if (!SecurityUtils.isAuthenticated()) {
            return Response.fail(401, AUTH_FAILED_MESSAGE);
        }

        String username = SecurityUtils.getCurrentUsername();
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
