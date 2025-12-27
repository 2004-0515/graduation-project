package com.shopping.repository;

import com.shopping.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
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
}