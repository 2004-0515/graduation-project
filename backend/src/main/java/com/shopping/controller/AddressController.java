package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Address;
import com.shopping.entity.User;
import com.shopping.service.AddressService;
import com.shopping.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 地址控制器，处理地址相关API请求
 */
@RestController
@RequestMapping("/addresses")
public class AddressController {
    
    @Autowired
    private AddressService addressService;
    
    @Autowired
    private UserService userService;
    
    /**
     * 获取当前登录用户的所有地址
     * @return 地址列表
     */
    @GetMapping
    public Response<List<Address>> getCurrentUserAddresses() {
        // 获取当前登录用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // 检查用户是否已认证
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName().equals("anonymousUser")) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        
        // 检查用户是否存在
        if (user == null) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        List<Address> addresses = addressService.getActiveAddressesByUser(user);
        return Response.success(addresses);
    }
    
    /**
     * 根据ID获取地址
     * @param id 地址ID
     * @return 地址实体
     */
    @GetMapping("/{id}")
    public Response<Address> getAddressById(@PathVariable Long id) {
        // 获取当前登录用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // 检查用户是否已认证
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName().equals("anonymousUser")) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        
        // 检查用户是否存在
        if (user == null) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        Address address = addressService.getAddressById(id);
        if (address != null) {
            // 检查地址是否属于当前用户
            if (!address.getUser().getId().equals(user.getId())) {
                return Response.fail(403, "无权限访问此地址");
            }
            return Response.success(address);
        } else {
            return Response.fail(404, "地址不存在");
        }
    }
    
    /**
     * 获取当前登录用户的默认地址
     * @return 默认地址
     */
    @GetMapping("/default")
    public Response<Address> getDefaultAddress() {
        // 获取当前登录用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // 检查用户是否已认证
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName().equals("anonymousUser")) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        
        // 检查用户是否存在
        if (user == null) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        Address defaultAddress = addressService.getDefaultAddressByUser(user);
        if (defaultAddress != null) {
            return Response.success(defaultAddress);
        } else {
            return Response.fail(404, "未找到默认地址");
        }
    }
    
    /**
     * 创建新地址
     * @param address 地址实体
     * @return 创建后的地址
     */
    @PostMapping
    public Response<Address> createAddress(@RequestBody @Validated Address address) {
        // 获取当前登录用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // 检查用户是否已认证
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName().equals("anonymousUser")) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        
        // 检查用户是否存在
        if (user == null) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        // 设置地址所属用户
        address.setUser(user);
        Address createdAddress = addressService.createAddress(address);
        return Response.success("地址创建成功", createdAddress);
    }
    
    /**
     * 更新地址
     * @param id 地址ID
     * @param address 地址实体
     * @return 更新后的地址
     */
    @PutMapping("/{id}")
    public Response<Address> updateAddress(@PathVariable Long id, @RequestBody @Validated Address address) {
        // 获取当前登录用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // 检查用户是否已认证
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName().equals("anonymousUser")) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        
        // 检查用户是否存在
        if (user == null) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        // 检查地址是否存在且属于当前用户
        Address existingAddress = addressService.getAddressById(id);
        if (existingAddress == null) {
            return Response.fail(404, "地址不存在");
        }
        if (!existingAddress.getUser().getId().equals(user.getId())) {
            return Response.fail(403, "无权限操作此地址");
        }
        
        // 更新字段，保留原有的id、user和status
        existingAddress.setName(address.getName());
        existingAddress.setPhone(address.getPhone());
        existingAddress.setProvince(address.getProvince());
        existingAddress.setCity(address.getCity());
        existingAddress.setDistrict(address.getDistrict());
        existingAddress.setDetail(address.getDetail());
        existingAddress.setIsDefault(address.getIsDefault());
        
        Address updatedAddress = addressService.updateAddress(existingAddress);
        return Response.success("地址更新成功", updatedAddress);
    }
    
    /**
     * 删除地址
     * @param id 地址ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public Response<Void> deleteAddress(@PathVariable Long id) {
        // 获取当前登录用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // 检查用户是否已认证
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName().equals("anonymousUser")) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        
        // 检查用户是否存在
        if (user == null) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        // 检查地址是否存在且属于当前用户
        Address address = addressService.getAddressById(id);
        if (address == null) {
            return Response.fail(404, "地址不存在");
        }
        if (!address.getUser().getId().equals(user.getId())) {
            return Response.fail(403, "无权限操作此地址");
        }
        
        addressService.deleteAddress(id);
        return Response.success("地址删除成功");
    }
    
    /**
     * 设置默认地址
     * @param id 地址ID
     * @return 设置结果
     */
    @PutMapping("/{id}/default")
    public Response<Void> setDefaultAddress(@PathVariable Long id) {
        // 获取当前登录用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // 检查用户是否已认证
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName().equals("anonymousUser")) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        
        // 检查用户是否存在
        if (user == null) {
            return Response.fail(401, "用户未认证或认证失效");
        }
        
        // 检查地址是否存在且属于当前用户
        Address address = addressService.getAddressById(id);
        if (address == null) {
            return Response.fail(404, "地址不存在");
        }
        if (!address.getUser().getId().equals(user.getId())) {
            return Response.fail(403, "无权限操作此地址");
        }
        
        addressService.setDefaultAddress(id, user);
        return Response.success("默认地址设置成功");
    }
}
