package com.shopping.repository;

import com.shopping.entity.PriceAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * 降价提醒Repository
 */
@Repository
public interface PriceAlertRepository extends JpaRepository<PriceAlert, Long> {
    
    /**
     * 获取用户的所有降价提醒
     */
    List<PriceAlert> findByUserIdOrderByCreatedTimeDesc(Long userId);
    
    /**
     * 获取用户指定状态的降价提醒
     */
    List<PriceAlert> findByUserIdAndStatusOrderByCreatedTimeDesc(Long userId, Integer status);
    
    /**
     * 获取用户对某商品的降价提醒
     */
    Optional<PriceAlert> findByUserIdAndProductId(Long userId, Long productId);
    
    /**
     * 获取商品的所有有效降价提醒（用于价格变动时检查）
     */
    @Query("SELECT pa FROM PriceAlert pa WHERE pa.productId = :productId AND pa.status = 0")
    List<PriceAlert> findActiveAlertsByProductId(@Param("productId") Long productId);
    
    /**
     * 获取所有需要检查的降价提醒（目标价格高于等于当前价格）
     */
    @Query("SELECT pa FROM PriceAlert pa WHERE pa.status = 0 AND pa.targetPrice >= :currentPrice AND pa.productId = :productId")
    List<PriceAlert> findTriggeredAlerts(@Param("productId") Long productId, @Param("currentPrice") BigDecimal currentPrice);
    
    /**
     * 统计用户的有效降价提醒数量
     */
    long countByUserIdAndStatus(Long userId, Integer status);
    
    /**
     * 检查用户是否已设置某商品的降价提醒
     */
    boolean existsByUserIdAndProductIdAndStatus(Long userId, Long productId, Integer status);
    
    /**
     * 删除用户对某商品的降价提醒
     */
    void deleteByUserIdAndProductId(Long userId, Long productId);
    
    /**
     * 获取所有降价提醒（按创建时间倒序）
     */
    List<PriceAlert> findAllByOrderByCreatedTimeDesc();
    
    /**
     * 按状态获取降价提醒（按创建时间倒序）
     */
    List<PriceAlert> findByStatusOrderByCreatedTimeDesc(Integer status);
    
    /**
     * 统计指定状态的降价提醒数量
     */
    long countByStatus(Integer status);
}
