package com.shopping.repository;

import com.shopping.entity.Address;
import com.shopping.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 地址数据访问接口
 */
@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    
    /**
     * 根据用户ID获取地址列表
     * @param user 用户实体
     * @return 地址列表
     */
    List<Address> findByUser(User user);
    
    /**
     * 根据用户ID和状态获取地址列表
     * @param user 用户实体
     * @param status 状态：1-正常，0-无效
     * @return 地址列表
     */
    List<Address> findByUserAndStatus(User user, Integer status);
    
    /**
     * 根据用户ID获取默认地址
     * @param user 用户实体
     * @param isDefault 是否默认
     * @param status 状态：1-正常，0-无效
     * @return 默认地址
     */
    Address findByUserAndIsDefaultAndStatus(User user, Boolean isDefault, Integer status);
}
