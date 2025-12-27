package com.shopping.repository;

import com.shopping.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 购物车数据访问接口
 */
@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    
    // 根据用户ID查询购物车，使用JOIN FETCH初始化关联的Product实体
    @Query("SELECT c FROM Cart c JOIN FETCH c.product WHERE c.user.id = :userId")
    List<Cart> findByUserIdWithProduct(Long userId);

    // 根据用户ID查询购物车（原有方法）
    List<Cart> findByUserId(Long userId);
    
    // 根据用户ID和商品ID查询购物车项，使用JOIN FETCH初始化关联的Product和User实体
    @Query("SELECT c FROM Cart c JOIN FETCH c.product JOIN FETCH c.user WHERE c.user.id = :userId AND c.product.id = :productId")
    Optional<Cart> findByUserIdAndProductId(Long userId, Long productId);
    
    // 根据ID查询购物车项，使用JOIN FETCH初始化关联的Product实体
    @Query("SELECT c FROM Cart c JOIN FETCH c.product WHERE c.id = :id")
    Optional<Cart> findByIdWithProduct(Long id);
    
    // 根据用户ID删除购物车项
    @Modifying
    @Transactional
    @Query("DELETE FROM Cart c WHERE c.user.id = :userId")
    void deleteByUserId(Long userId);
}