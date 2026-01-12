package com.shopping.repository;

import com.shopping.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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
    
    // 统计指定状态的订单数量
    long countByOrderStatus(Integer orderStatus);
    
    // 【理性消费】根据用户ID、支付状态和时间范围查询订单
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product WHERE o.user.id = :userId AND o.paymentStatus = :paymentStatus AND o.createdTime BETWEEN :startTime AND :endTime")
    List<Order> findByUserIdAndPaymentStatusAndCreatedTimeBetween(
            @Param("userId") Long userId, 
            @Param("paymentStatus") Integer paymentStatus, 
            @Param("startTime") LocalDateTime startTime, 
            @Param("endTime") LocalDateTime endTime);
    
    // 【理性消费】根据用户ID、支付状态和时间查询订单（某时间之后）
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product WHERE o.user.id = :userId AND o.paymentStatus = :paymentStatus AND o.createdTime > :afterTime")
    List<Order> findByUserIdAndPaymentStatusAndCreatedTimeAfter(
            @Param("userId") Long userId, 
            @Param("paymentStatus") Integer paymentStatus, 
            @Param("afterTime") LocalDateTime afterTime);
    
    // 【管理员统计】根据支付状态和时间范围查询所有订单
    @Query("SELECT o FROM Order o WHERE o.paymentStatus = :paymentStatus AND o.createdTime BETWEEN :startTime AND :endTime")
    List<Order> findByPaymentStatusAndCreatedTimeBetween(
            @Param("paymentStatus") Integer paymentStatus,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}