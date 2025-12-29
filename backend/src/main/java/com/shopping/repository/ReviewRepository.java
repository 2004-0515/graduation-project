package com.shopping.repository;

import com.shopping.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    // 根据商品ID查询评价
    Page<Review> findByProductIdOrderByCreatedTimeDesc(Long productId, Pageable pageable);
    
    List<Review> findByProductIdOrderByCreatedTimeDesc(Long productId);
    
    // 根据用户ID查询评价
    List<Review> findByUserIdOrderByCreatedTimeDesc(Long userId);
    
    // 检查用户是否已评价某订单商品
    boolean existsByOrderIdAndProductId(Long orderId, Long productId);
    
    boolean existsByOrderItemId(Long orderItemId);
    
    // 统计商品评价数
    long countByProductId(Long productId);
    
    // 计算商品平均评分
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productId = ?1")
    Double getAverageRatingByProductId(Long productId);
    
    // 统计各评分数量
    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.productId = ?1 GROUP BY r.rating")
    List<Object[]> countByProductIdGroupByRating(Long productId);
}
