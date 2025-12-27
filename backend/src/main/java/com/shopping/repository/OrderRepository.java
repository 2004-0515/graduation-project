package com.shopping.repository;

import com.shopping.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 订单数据访问接口
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // 根据用户ID查询订单
    List<Order> findByUserId(Long userId);
    
    // 根据用户ID和订单状态查询订单，按创建时间倒序
    List<Order> findByUserIdAndOrderStatusOrderByCreatedTimeDesc(Long userId, Integer orderStatus);
    
    // 根据用户ID查询订单，按创建时间倒序
    List<Order> findByUserIdOrderByCreatedTimeDesc(Long userId);
    
    // 根据订单号查询订单
    Order findByOrderNo(String orderNo);
    
    // 根据状态查询订单
    List<Order> findByOrderStatus(Integer orderStatus);
    
    // 【管理员】查询所有订单，按创建时间倒序
    List<Order> findAllByOrderByCreatedTimeDesc();
    
    // 【管理员】根据状态查询所有订单，按创建时间倒序
    List<Order> findByOrderStatusOrderByCreatedTimeDesc(Integer orderStatus);
}