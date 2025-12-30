package com.shopping.controller;

import com.shopping.dto.*;
import com.shopping.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

/**
 * 订单控制器，处理订单相关API请求
 */
@RestController
@RequestMapping("/orders")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private OrderService orderService;

    /**
     * 获取当前用户的订单列表
     * @param status 订单状态过滤（可选）
     * @param page 页码（从0开始）
     * @param size 每页大小（默认1000，返回所有订单）
     * @return 订单列表
     */
    @GetMapping
    public Response<List<OrderDto>> getCurrentUserOrders(
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "1000") int size) {
        try {
            String username = getCurrentUsername();
            logger.info("Fetching orders for user: {}, status: {}, page: {}, size: {}", username, status, page, size);

            List<OrderDto> orders = orderService.getUserOrders(username, status, page, size);
            logger.info("Found {} orders for user {}", orders.size(), username);
            return Response.success("获取订单列表成功", orders);
        } catch (Exception e) {
            logger.error("获取订单列表失败", e);
            throw e;
        }
    }

    /**
     * 根据ID获取订单详情
     * @param id 订单ID
     * @return 订单详情
     */
    @GetMapping("/{id}")
    public Response<OrderDto> getOrderById(@PathVariable Long id) {
        String username = getCurrentUsername();
        logger.debug("Fetching order {} for user: {}", id, username);

        OrderDto order = orderService.getOrderByIdAndUser(id, username);
        return Response.success("获取订单详情成功", order);
    }

    /**
     * 根据订单号获取订单详情
     * @param orderNo 订单号
     * @return 订单详情
     */
    @GetMapping("/orderNo/{orderNo}")
    public Response<OrderDto> getOrderByOrderNo(@PathVariable String orderNo) {
        String username = getCurrentUsername();
        logger.debug("Fetching order by orderNo {} for user: {}", orderNo, username);

        OrderDto order = orderService.getOrderByOrderNoAndUser(orderNo, username);
        return Response.success("获取订单详情成功", order);
    }

    /**
     * 创建订单
     * @param request 创建订单请求
     * @return 创建的订单
     */
    @PostMapping
    public Response<OrderDto> createOrder(@RequestBody @Valid CreateOrderRequest request) {
        String username = getCurrentUsername();
        logger.info("Creating order for user: {}", username);

        OrderDto order = orderService.createOrder(username, request);
        logger.info("Order created successfully: {}", order.getOrderNo());
        return Response.success("订单创建成功", order);
    }

    /**
     * 取消订单
     * @param id 订单ID
     * @return 操作结果
     */
    @PutMapping("/{id}/cancel")
    public Response<String> cancelOrder(@PathVariable Long id) {
        String username = getCurrentUsername();
        logger.info("Cancelling order {} for user: {}", id, username);

        orderService.cancelOrder(id, username);
        logger.info("Order {} cancelled successfully", id);
        return Response.success("订单取消成功");
    }
    
    /**
     * 申请取消订单（待发货订单）
     * @param id 订单ID
     * @return 操作结果
     */
    @PutMapping("/{id}/request-cancel")
    public Response<String> requestCancelOrder(@PathVariable Long id) {
        String username = getCurrentUsername();
        logger.info("Requesting cancel for order {} by user: {}", id, username);

        orderService.requestCancelOrder(id, username);
        logger.info("Cancel request for order {} submitted successfully", id);
        return Response.success("取消申请已提交，等待管理员审核");
    }

    /**
     * 支付订单
     * @param id 订单ID
     * @param body 包含支付方式的请求体
     * @return 支付后的订单
     */
    @PutMapping("/{id}/pay")
    public Response<OrderDto> payOrder(@PathVariable Long id, @RequestBody java.util.Map<String, Integer> body) {
        String username = getCurrentUsername();
        Integer paymentMethod = body.get("paymentMethod");
        logger.info("Paying order {} for user: {}, paymentMethod: {}", id, username, paymentMethod);

        OrderDto order = orderService.payOrder(id, username, paymentMethod);
        logger.info("Order {} paid successfully", id);
        return Response.success("支付成功", order);
    }

    /**
     * 确认收货
     * @param id 订单ID
     * @return 操作结果
     */
    @PutMapping("/{id}/confirm")
    public Response<String> confirmOrder(@PathVariable Long id) {
        String username = getCurrentUsername();
        logger.info("Confirming order {} for user: {}", id, username);

        orderService.confirmOrder(id, username);
        logger.info("Order {} confirmed successfully", id);
        return Response.success("确认收货成功");
    }

    /**
     * 删除订单（仅限已取消或已完成的订单）
     * @param id 订单ID
     * @return 操作结果
     */
    @DeleteMapping("/{id}")
    public Response<String> deleteOrder(@PathVariable Long id) {
        String username = getCurrentUsername();
        logger.info("Deleting order {} for user: {}", id, username);

        orderService.deleteOrder(id, username);
        logger.info("Order {} deleted successfully", id);
        return Response.success("订单删除成功");
    }

    /**
     * 【管理员】获取待发货订单数量
     * @return 待发货订单数量
     */
    @GetMapping("/pending/count")
    public Response<Long> getPendingOrderCount() {
        logger.info("Admin fetching pending order count");
        long count = orderService.getPendingOrderCount();
        return Response.success("获取待发货订单数量成功", count);
    }

    /**
     * 【管理员】获取所有订单列表
     * @param status 订单状态过滤（可选）
     * @param page 页码（从0开始）
     * @param size 每页大小
     * @return 所有订单列表
     */
    @GetMapping("/admin")
    public Response<List<OrderDto>> getAllOrders(
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        logger.info("Admin fetching all orders, status: {}, page: {}, size: {}", status, page, size);
        List<OrderDto> orders = orderService.getAllOrders(status, page, size);
        logger.info("Admin found {} orders", orders.size());
        return Response.success("获取订单列表成功", orders);
    }

    /**
     * 【管理员】发货
     * @param id 订单ID
     * @return 操作结果
     */
    @PutMapping("/{id}/ship")
    public Response<String> shipOrder(@PathVariable Long id) {
        logger.info("Admin shipping order {}", id);
        orderService.shipOrder(id);
        logger.info("Order {} shipped successfully", id);
        return Response.success("发货成功");
    }

    /**
     * 【管理员】更新订单状态
     * @param id 订单ID
     * @param status 新状态
     * @return 操作结果
     */
    @PutMapping("/{id}/status")
    public Response<String> updateOrderStatus(@PathVariable Long id, @RequestBody java.util.Map<String, Integer> body) {
        Integer status = body.get("status");
        logger.info("Admin updating order {} status to {}", id, status);
        orderService.updateOrderStatus(id, status);
        return Response.success("订单状态更新成功");
    }
    
    /**
     * 【管理员】审核取消申请
     * @param id 订单ID
     * @param body 包含approved字段
     * @return 操作结果
     */
    @PutMapping("/{id}/review-cancel")
    public Response<String> reviewCancelRequest(@PathVariable Long id, @RequestBody java.util.Map<String, Boolean> body) {
        Boolean approved = body.get("approved");
        logger.info("Admin reviewing cancel request for order {}, approved: {}", id, approved);
        orderService.reviewCancelRequest(id, approved != null && approved);
        return Response.success(approved != null && approved ? "已同意取消申请" : "已拒绝取消申请");
    }

    /**
     * 获取当前登录用户名
     * @return 当前用户名
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
            authentication.getPrincipal().equals("anonymousUser")) {
            throw new com.shopping.exception.AuthenticationException("用户未认证");
        }
        return authentication.getName();
    }
}