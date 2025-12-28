package com.shopping.repository;

import com.shopping.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 订单数据访问接口
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // 根据用户ID查询订单
    List<Order> findByUserId(Long userId);
    
    // 根据用户ID和订单状态查询订单，按创建时间倒序（带订单项和用户）
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items LEFT JOIN FETCH o.user WHERE o.user.id = :userId AND o.orderStatus = :orderStatus")
    List<Order> findByUserIdAndOrderStatusOrderByCreatedTimeDesc(@Param("userId") Long userId, @Param("orderStatus") Integer orderStatus);
    
    // 根据用户ID查询订单，按创建时间倒序（带订单项和用户）
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items LEFT JOIN FETCH o.user WHERE o.user.id = :userId")
    List<Order> findByUserIdOrderByCreatedTimeDesc(@Param("userId") Long userId);
    
    // 根据订单号查询订单
    Order findByOrderNo(String orderNo);
    
    // 根据ID查询订单（带订单项和用户）
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items LEFT JOIN FETCH o.user WHERE o.id = :id")
    Order findByIdWithDetails(@Param("id") Long id);
    
    // 根据状态查询订单
    List<Order> findByOrderStatus(Integer orderStatus);
    
    // 【管理员】查询所有订单，按创建时间倒序（带订单项和用户）
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items LEFT JOIN FETCH o.user ORDER BY o.createdTime DESC")
    List<Order> findAllByOrderByCreatedTimeDesc();
    
    // 【管理员】根据状态查询所有订单，按创建时间倒序（带订单项和用户）
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items LEFT JOIN FETCH o.user WHERE o.orderStatus = :orderStatus")
    List<Order> findByOrderStatusOrderByCreatedTimeDesc(@Param("orderStatus") Integer orderStatus);
}