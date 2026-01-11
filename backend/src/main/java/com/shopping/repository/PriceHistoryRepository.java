package com.shopping.repository;

import com.shopping.entity.PriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 价格历史Repository
 */
@Repository
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {
    
    /**
     * 获取商品的价格历史记录（按时间升序）
     */
    List<PriceHistory> findByProductIdOrderByRecordedTimeAsc(Long productId);
    
    /**
     * 获取商品指定时间范围内的价格历史
     */
    @Query("SELECT ph FROM PriceHistory ph WHERE ph.productId = :productId " +
           "AND ph.recordedTime BETWEEN :startTime AND :endTime " +
           "ORDER BY ph.recordedTime ASC")
    List<PriceHistory> findByProductIdAndTimeRange(
        @Param("productId") Long productId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
    
    /**
     * 获取商品最近N条价格记录
     */
    @Query("SELECT ph FROM PriceHistory ph WHERE ph.productId = :productId " +
           "ORDER BY ph.recordedTime DESC LIMIT :limit")
    List<PriceHistory> findRecentByProductId(
        @Param("productId") Long productId,
        @Param("limit") int limit
    );
    
    /**
     * 获取商品最新的价格记录
     */
    Optional<PriceHistory> findTopByProductIdOrderByRecordedTimeDesc(Long productId);
    
    /**
     * 获取商品的历史最低价
     */
    @Query("SELECT MIN(ph.price) FROM PriceHistory ph WHERE ph.productId = :productId")
    Optional<java.math.BigDecimal> findLowestPriceByProductId(@Param("productId") Long productId);
    
    /**
     * 获取商品的历史最高价
     */
    @Query("SELECT MAX(ph.price) FROM PriceHistory ph WHERE ph.productId = :productId")
    Optional<java.math.BigDecimal> findHighestPriceByProductId(@Param("productId") Long productId);
    
    /**
     * 获取商品的平均价格
     */
    @Query("SELECT AVG(ph.price) FROM PriceHistory ph WHERE ph.productId = :productId")
    Optional<java.math.BigDecimal> findAveragePriceByProductId(@Param("productId") Long productId);
    
    /**
     * 统计商品价格记录数量
     */
    long countByProductId(Long productId);
}
