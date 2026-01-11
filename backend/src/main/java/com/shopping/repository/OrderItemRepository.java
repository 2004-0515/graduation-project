package com.shopping.repository;

import com.shopping.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 订单项数据访问接口
 */
@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    
    // 根据订单ID查询订单项
    List<OrderItem> findByOrderId(Long orderId);
    
    // 根据商品ID查询订单项
    List<OrderItem> findByProductId(Long productId);
    
    // 根据卖家ID查询订单项（按创建时间倒序）
    @Query("SELECT oi FROM OrderItem oi JOIN FETCH oi.order o JOIN FETCH o.user WHERE oi.sellerId = :sellerId AND o.orderStatus = 1 ORDER BY oi.createdTime DESC")
    List<OrderItem> findBySellerIdOrderByCreatedTimeDesc(@Param("sellerId") Long sellerId);
    
    // 根据卖家ID和发货状态查询订单项
    @Query("SELECT oi FROM OrderItem oi JOIN FETCH oi.order o JOIN FETCH o.user WHERE oi.sellerId = :sellerId AND oi.shipStatus = :shipStatus AND o.orderStatus = 1 ORDER BY oi.createdTime DESC")
    List<OrderItem> findBySellerIdAndShipStatusOrderByCreatedTimeDesc(@Param("sellerId") Long sellerId, @Param("shipStatus") Integer shipStatus);
    
    // 统计卖家待发货订单项数量
    @Query("SELECT COUNT(oi) FROM OrderItem oi JOIN oi.order o WHERE oi.sellerId = :sellerId AND oi.shipStatus = :shipStatus AND o.orderStatus = 1")
    long countBySellerIdAndShipStatus(@Param("sellerId") Long sellerId, @Param("shipStatus") Integer shipStatus);
}