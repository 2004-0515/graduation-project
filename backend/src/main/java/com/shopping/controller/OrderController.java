package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Order;
import com.shopping.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 订单控制器，处理订单相关API请求
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    
    @Autowired
    private OrderService orderService;
    
    /**
     * 获取用户订单列表
     * @param userId 用户ID
     * @return 订单列表
     */
    @GetMapping("/user/{userId}")
    public Response<List<Order>> getOrdersByUserId(@PathVariable Long userId) {
        List<Order> orders = orderService.getOrdersByUserId(userId);
        return Response.success(orders);
    }
    
    /**
     * 根据ID获取订单
     * @param id 订单ID
     * @return 订单信息
     */
    @GetMapping("/{id}")
    public Response<Order> getOrderById(@PathVariable Long id) {
        Order order = orderService.getOrderById(id);
        if (order != null) {
            return Response.success(order);
        } else {
            return Response.fail(404, "Order not found");
        }
    }
    
    /**
     * 根据订单号获取订单
     * @param orderNo 订单号
     * @return 订单信息
     */
    @GetMapping("/orderNo/{orderNo}")
    public Response<Order> getOrderByOrderNo(@PathVariable String orderNo) {
        Order order = orderService.getOrderByOrderNo(orderNo);
        if (order != null) {
            return Response.success(order);
        } else {
            return Response.fail(404, "Order not found");
        }
    }
    
    /**
     * 创建订单
     * @param order 订单信息
     * @return 创建后的订单
     */
    @PostMapping
    public Response<Order> createOrder(@RequestBody Order order) {
        Order createdOrder = orderService.createOrder(order);
        return Response.success("Order created successfully", createdOrder);
    }
    
    /**
     * 更新订单状态
     * @param id 订单ID
     * @param status 新状态
     * @return 更新后的订单
     */
    @PutMapping("/{id}/status")
    public Response<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam Integer status) {
        Order order = orderService.updateOrderStatus(id, status);
        if (order != null) {
            return Response.success("Order status updated successfully", order);
        } else {
            return Response.fail(404, "Order not found");
        }
    }
    
    /**
     * 删除订单
     * @param id 订单ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public Response<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return Response.success("Order deleted successfully");
    }
}