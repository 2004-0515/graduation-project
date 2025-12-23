package com.shopping.repository;

import com.shopping.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 购物车数据访问接口
 */
@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    
    // 根据用户ID查询购物车
    List<Cart> findByUserId(Long userId);
    
    // 根据用户ID和商品ID查询购物车项
    Optional<Cart> findByUserIdAndProductId(Long userId, Long productId);
    
    // 根据用户ID删除购物车项
    void deleteByUserId(Long userId);
}