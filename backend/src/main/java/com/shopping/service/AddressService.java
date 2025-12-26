package com.shopping.service;

import com.shopping.entity.Address;
import com.shopping.entity.User;

import java.util.List;

/**
 * 地址服务接口
 */
public interface AddressService {
    
    /**
     * 获取用户的所有地址
     * @param user 用户实体
     * @return 地址列表
     */
    List<Address> getAddressesByUser(User user);
    
    /**
     * 获取用户的所有有效地址
     * @param user 用户实体
     * @return 有效地址列表
     */
    List<Address> getActiveAddressesByUser(User user);
    
    /**
     * 根据ID获取地址
     * @param id 地址ID
     * @return 地址实体
     */
    Address getAddressById(Long id);
    
    /**
     * 获取用户的默认地址
     * @param user 用户实体
     * @return 默认地址
     */
    Address getDefaultAddressByUser(User user);
    
    /**
     * 创建新地址
     * @param address 地址实体
     * @return 创建后的地址
     */
    Address createAddress(Address address);
    
    /**
     * 更新地址
     * @param address 地址实体
     * @return 更新后的地址
     */
    Address updateAddress(Address address);
    
    /**
     * 删除地址
     * @param id 地址ID
     */
    void deleteAddress(Long id);
    
    /**
     * 设置默认地址
     * @param id 地址ID
     * @param user 用户实体
     */
    void setDefaultAddress(Long id, User user);
}
