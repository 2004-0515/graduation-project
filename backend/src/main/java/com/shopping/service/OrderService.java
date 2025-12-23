package com.shopping.service;

import com.shopping.entity.Order;
import com.shopping.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * 订单服务类，处理订单相关业务逻辑
 */
@Service
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private ProductService productService;
    
    /**
     * 获取用户订单列表
     * @param userId 用户ID
     * @return 订单列表
     */
    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId);
    }
    
    /**
     * 根据ID获取订单
     * @param id 订单ID
     * @return 订单信息
     */
    public Order getOrderById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }
    
    /**
     * 根据订单号获取订单
     * @param orderNo 订单号
     * @return 订单信息
     */
    public Order getOrderByOrderNo(String orderNo) {
        return orderRepository.findByOrderNo(orderNo);
    }
    
    /**
     * 创建订单
     * @param order 订单信息
     * @return 创建后的订单
     */
    public Order createOrder(Order order) {
        // 生成唯一订单号
        String orderNo = UUID.randomUUID().toString().replace("-", "");
        order.setOrderNo(orderNo);
        
        // 设置默认状态
        if (order.getStatus() == null) {
            order.setStatus(1); // 待付款
        }
        
        return orderRepository.save(order);
    }
    
    /**
     * 更新订单状态
     * @param id 订单ID
     * @param status 新状态
     * @return 更新后的订单
     */
    public Order updateOrderStatus(Long id, Integer status) {
        Order order = getOrderById(id);
        if (order != null) {
            order.setStatus(status);
            return orderRepository.save(order);
        }
        return null;
    }
    
    /**
     * 删除订单
     * @param id 订单ID
     */
    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }
}