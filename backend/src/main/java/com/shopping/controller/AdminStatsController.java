package com.shopping.controller;

import com.shopping.dto.OrderDto;
import com.shopping.dto.Response;
import com.shopping.entity.Order;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.repository.OrderRepository;
import com.shopping.repository.ProductRepository;
import com.shopping.repository.UserRepository;
import com.shopping.utils.AdminUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public Response<Map<String, Object>> getDashboardStats(
            @RequestParam(defaultValue = "10") int lowStockThreshold,
            @RequestParam(defaultValue = "5") int topCategoryLimit) {
        AdminUtils.requireAdmin();

        long totalUsers = userRepository.count();
        long totalProducts = productRepository.count();

        List<Order> allOrders = orderRepository.findAllByOrderByCreatedTimeDesc();
        List<Product> allProducts = productRepository.findAll();
        List<Order> recentOrders = orderRepository.findTop5ByOrderByCreatedTimeDesc();

        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(6);
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal todayRevenue = BigDecimal.ZERO;
        int todayOrders = 0;
        int pendingOrders = 0;
        Map<Integer, Long> orderStatusCounts = new LinkedHashMap<>();
        Map<LocalDate, BigDecimal> dailyRevenue = new LinkedHashMap<>();
        Map<LocalDate, Integer> dailyOrderCounts = new LinkedHashMap<>();

        for (int i = 0; i < 7; i++) {
            LocalDate day = sevenDaysAgo.plusDays(i);
            dailyRevenue.put(day, BigDecimal.ZERO);
            dailyOrderCounts.put(day, 0);
        }

        for (Order order : allOrders) {
            int orderStatus = order.getOrderStatus() == null ? -1 : order.getOrderStatus();
            orderStatusCounts.merge(orderStatus, 1L, Long::sum);
            if (orderStatus == 0 || orderStatus == 1) {
                pendingOrders += 1;
            }

            LocalDate createdDate = order.getCreatedTime() == null ? null : order.getCreatedTime().toLocalDate();
            if (createdDate != null && createdDate.equals(today)) {
                todayOrders += 1;
            }

            if (orderStatus >= 1 && order.getTotalAmount() != null) {
                totalRevenue = totalRevenue.add(order.getTotalAmount());
                if (createdDate != null && createdDate.equals(today)) {
                    todayRevenue = todayRevenue.add(order.getTotalAmount());
                }
                if (createdDate != null && !createdDate.isBefore(sevenDaysAgo) && !createdDate.isAfter(today)) {
                    dailyRevenue.put(createdDate, dailyRevenue.get(createdDate).add(order.getTotalAmount()));
                    dailyOrderCounts.put(createdDate, dailyOrderCounts.get(createdDate) + 1);
                }
            } else if (createdDate != null && !createdDate.isBefore(sevenDaysAgo) && !createdDate.isAfter(today)) {
                dailyOrderCounts.put(createdDate, dailyOrderCounts.get(createdDate) + 1);
            }
        }

        long lowStockProducts = allProducts.stream()
                .filter(product -> product.getStock() != null && product.getStock() < lowStockThreshold)
                .count();

        List<Map<String, Object>> topCategories = allProducts.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        product -> product.getCategory() != null && product.getCategory().getName() != null
                                ? product.getCategory().getName()
                                : "未分类",
                        java.util.stream.Collectors.summingInt(product -> product.getSales() == null ? 0 : product.getSales())
                ))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
                .limit(Math.max(1, topCategoryLimit))
                .map(entry -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("categoryName", entry.getKey());
                    item.put("sales", entry.getValue());
                    return item;
                })
                .toList();

        List<Map<String, Object>> salesTrend = new ArrayList<>();
        for (Map.Entry<LocalDate, BigDecimal> entry : dailyRevenue.entrySet()) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", entry.getKey().toString());
            point.put("revenue", entry.getValue());
            point.put("orderCount", dailyOrderCounts.get(entry.getKey()));
            salesTrend.add(point);
        }

        List<Map<String, Object>> statusDistribution = orderStatusCounts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("status", entry.getKey());
                    item.put("count", entry.getValue());
                    return item;
                })
                .toList();

        List<Map<String, Object>> recentOrderDtos = recentOrders.stream()
                .map(this::toOrderSummary)
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalUsers", totalUsers);
        result.put("totalProducts", totalProducts);
        result.put("totalOrders", allOrders.size());
        result.put("totalRevenue", totalRevenue);
        result.put("todayOrders", todayOrders);
        result.put("todayRevenue", todayRevenue);
        result.put("pendingOrders", pendingOrders);
        result.put("lowStockProducts", lowStockProducts);
        result.put("salesTrend", salesTrend);
        result.put("orderStatusDistribution", statusDistribution);
        result.put("topCategories", topCategories);
        result.put("recentOrders", recentOrderDtos);
        return Response.success(result);
    }

    private Map<String, Object> toOrderSummary(Order order) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("id", order.getId());
        summary.put("orderNo", order.getOrderNo());
        User user = order.getUser();
        summary.put("username", user != null ? user.getUsername() : null);
        summary.put("totalAmount", order.getTotalAmount());
        summary.put("orderStatus", order.getOrderStatus());
        summary.put("createdTime", order.getCreatedTime());
        return summary;
    }
}
