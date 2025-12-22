package com.shopping.repository;

import com.shopping.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.PagingAndSortingRepository;
import org.springframework.stereotype.Repository;

/**
 * 用户数据访问接口
 */
@Repository
public interface UserRepository extends PagingAndSortingRepository<User, Long> {
    
    // 根据用户名查询用户
    User findByUsername(String username);
    
    // 根据邮箱查询用户
    User findByEmail(String email);
}
