package com.shopping.repository;

import com.shopping.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 用户数据访问接口
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // 根据用户名查询用户
    User findByUsername(String username);
    
    // 根据邮箱查询用户
    User findByEmail(String email);

    @Query("""
        SELECT u FROM User u
        WHERE (:keyword IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:status IS NULL OR u.status = :status)
        """)
    Page<User> searchUsers(@Param("keyword") String keyword, @Param("status") Integer status, Pageable pageable);
    
    // 直接更新用户密码
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE User u SET u.password = :password WHERE u.id = :id")
    int updatePasswordById(@Param("id") Long id, @Param("password") String password);
}
