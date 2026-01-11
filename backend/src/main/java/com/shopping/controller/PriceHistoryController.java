package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.PriceAlert;
import com.shopping.entity.PriceHistory;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.service.PriceAlertService;
import com.shopping.service.PriceHistoryService;
import com.shopping.service.ProductService;
import com.shopping.service.UserService;
import com.shopping.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 价格历史与降价提醒控制器
 */
@Slf4j
@RestController
@RequestMapping("/price")
@RequiredArgsConstructor
public class PriceHistoryController {
    
    private final PriceHistoryService priceHistoryService;
    private final PriceAlertService priceAlertService;
    private final UserService userService;
    private final ProductService productService;
    
    /**
     * 获取当前用户ID
     */
    private Long getCurrentUserId() {
        if (!SecurityUtils.isAuthenticated()) {
            return null;
        }
        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByUsername(username);
        return user != null ? user.getId() : null;
    }
    
    /**
     * 检查是否是管理员
     */
    private boolean isAdmin() {
        if (!SecurityUtils.isAuthenticated()) {
            return false;
        }
        String username = SecurityUtils.getCurrentUsername();
        return "admin".equals(username);
    }
    
    /**
     * 获取商品价格历史
     */
    @GetMapping("/history/{productId}")
    public Response<List<PriceHistory>> getPriceHistory(@PathVariable Long productId) {
        try {
            List<PriceHistory> history = priceHistoryService.getPriceHistory(productId);
            return Response.success(history);
        } catch (Exception e) {
            log.error("获取价格历史失败", e);
            return Response.fail("获取价格历史失败");
        }
    }
    
    /**
     * 获取指定时间范围内的价格历史
     */
    @GetMapping("/history/{productId}/range")
    public Response<List<PriceHistory>> getPriceHistoryInRange(
            @PathVariable Long productId,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        try {
            LocalDateTime start = startTime != null ? LocalDateTime.parse(startTime) : LocalDateTime.now().minusMonths(3);
            LocalDateTime end = endTime != null ? LocalDateTime.parse(endTime) : LocalDateTime.now();
            List<PriceHistory> history = priceHistoryService.getPriceHistoryInRange(productId, start, end);
            return Response.success(history);
        } catch (Exception e) {
            log.error("获取价格历史失败", e);
            return Response.fail("获取价格历史失败");
        }
    }

    
    /**
     * 获取价格统计信息
     */
    @GetMapping("/stats/{productId}")
    public Response<Map<String, Object>> getPriceStats(@PathVariable Long productId) {
        try {
            Map<String, Object> stats = priceHistoryService.getPriceStats(productId);
            return Response.success(stats);
        } catch (Exception e) {
            log.error("获取价格统计失败", e);
            return Response.fail("获取价格统计失败");
        }
    }
    
    /**
     * 创建降价提醒
     */
    @PostMapping("/alert")
    public Response<PriceAlert> createAlert(@RequestBody Map<String, Object> params) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return Response.fail("请先登录");
            }
            
            Long productId = Long.valueOf(params.get("productId").toString());
            BigDecimal targetPrice = new BigDecimal(params.get("targetPrice").toString());
            
            PriceAlert alert = priceAlertService.createAlert(userId, productId, targetPrice);
            return Response.success("降价提醒设置成功", alert);
        } catch (RuntimeException e) {
            return Response.fail(e.getMessage());
        } catch (Exception e) {
            log.error("创建降价提醒失败", e);
            return Response.fail("创建降价提醒失败");
        }
    }
    
    /**
     * 取消降价提醒
     */
    @DeleteMapping("/alert/{productId}")
    public Response<Void> cancelAlert(@PathVariable Long productId) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return Response.fail("请先登录");
            }
            
            priceAlertService.cancelAlert(userId, productId);
            return Response.success("已取消降价提醒", null);
        } catch (Exception e) {
            log.error("取消降价提醒失败", e);
            return Response.fail("取消降价提醒失败");
        }
    }
    
    /**
     * 获取用户的降价提醒列表
     */
    @GetMapping("/alerts")
    public Response<List<PriceAlert>> getUserAlerts() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return Response.fail("请先登录");
            }
            
            List<PriceAlert> alerts = priceAlertService.getUserAlerts(userId);
            return Response.success(alerts);
        } catch (Exception e) {
            log.error("获取降价提醒列表失败", e);
            return Response.fail("获取降价提醒列表失败");
        }
    }
    
    /**
     * 获取用户的降价提醒列表（带商品详情）
     */
    @GetMapping("/alerts/detail")
    public Response<List<Map<String, Object>>> getUserAlertsWithDetail() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return Response.fail("请先登录");
            }
            
            List<PriceAlert> alerts = priceAlertService.getUserAlerts(userId);
            
            // 转换为包含商品信息的Map
            List<Map<String, Object>> result = alerts.stream().map(alert -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", alert.getId());
                map.put("productId", alert.getProductId());
                map.put("targetPrice", alert.getTargetPrice());
                map.put("currentPrice", alert.getCurrentPrice());
                map.put("status", alert.getStatus());
                map.put("triggeredTime", alert.getTriggeredTime());
                map.put("triggeredPrice", alert.getTriggeredPrice());
                map.put("notified", alert.getNotified());
                map.put("createdTime", alert.getCreatedTime());
                
                // 获取商品信息
                Product product = productService.findById(alert.getProductId());
                if (product != null) {
                    map.put("productName", product.getName());
                    map.put("productImage", product.getMainImage());
                    map.put("productPrice", product.getPrice());
                }
                
                return map;
            }).collect(Collectors.toList());
            
            return Response.success(result);
        } catch (Exception e) {
            log.error("获取降价提醒列表失败", e);
            return Response.fail("获取降价提醒列表失败");
        }
    }
    
    /**
     * 获取用户对某商品的降价提醒
     */
    @GetMapping("/alert/{productId}")
    public Response<PriceAlert> getUserProductAlert(@PathVariable Long productId) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return Response.success(null);
            }
            
            Optional<PriceAlert> alert = priceAlertService.getUserProductAlert(userId, productId);
            return Response.success(alert.orElse(null));
        } catch (Exception e) {
            log.error("获取降价提醒失败", e);
            return Response.fail("获取降价提醒失败");
        }
    }
    
    /**
     * 检查用户是否已设置某商品的降价提醒
     */
    @GetMapping("/alert/{productId}/exists")
    public Response<Boolean> hasActiveAlert(@PathVariable Long productId) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return Response.success(false);
            }
            
            boolean exists = priceAlertService.hasActiveAlert(userId, productId);
            return Response.success(exists);
        } catch (Exception e) {
            log.error("检查降价提醒失败", e);
            return Response.fail("检查降价提醒失败");
        }
    }
    
    // ==================== 管理员API ====================
    
    /**
     * 【管理员】获取所有降价提醒
     */
    @GetMapping("/admin/alerts")
    public Response<List<Map<String, Object>>> getAllAlerts(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String keyword) {
        try {
            if (!isAdmin()) {
                return Response.fail("无权限");
            }
            
            List<PriceAlert> alerts = priceAlertService.getAllAlerts(status);
            
            // 转换为包含用户名和商品名的Map
            List<Map<String, Object>> result = alerts.stream().map(alert -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", alert.getId());
                map.put("userId", alert.getUserId());
                map.put("productId", alert.getProductId());
                map.put("targetPrice", alert.getTargetPrice());
                map.put("currentPrice", alert.getCurrentPrice());
                map.put("status", alert.getStatus());
                map.put("triggeredTime", alert.getTriggeredTime());
                map.put("triggeredPrice", alert.getTriggeredPrice());
                map.put("notified", alert.getNotified());
                map.put("createdTime", alert.getCreatedTime());
                
                // 获取用户名
                User user = userService.findById(alert.getUserId());
                map.put("username", user != null ? user.getUsername() : null);
                
                // 获取商品名
                Product product = productService.findById(alert.getProductId());
                map.put("productName", product != null ? product.getName() : null);
                
                return map;
            }).collect(Collectors.toList());
            
            // 关键字过滤
            if (keyword != null && !keyword.isEmpty()) {
                String kw = keyword.toLowerCase();
                result = result.stream().filter(m -> {
                    String username = (String) m.get("username");
                    String productName = (String) m.get("productName");
                    return (username != null && username.toLowerCase().contains(kw)) ||
                           (productName != null && productName.toLowerCase().contains(kw));
                }).collect(Collectors.toList());
            }
            
            return Response.success(result);
        } catch (Exception e) {
            log.error("获取降价提醒列表失败", e);
            return Response.fail("获取降价提醒列表失败");
        }
    }
    
    /**
     * 【管理员】获取有效降价提醒数量
     */
    @GetMapping("/admin/alerts/count")
    public Response<Long> getActiveAlertCount() {
        try {
            if (!isAdmin()) {
                return Response.fail("无权限");
            }
            long count = priceAlertService.countActiveAlerts();
            return Response.success(count);
        } catch (Exception e) {
            log.error("获取降价提醒数量失败", e);
            return Response.fail("获取降价提醒数量失败");
        }
    }
    
    /**
     * 【管理员】手动记录价格
     */
    @PostMapping("/admin/record")
    public Response<PriceHistory> recordPrice(@RequestBody Map<String, Object> params) {
        try {
            if (!isAdmin()) {
                return Response.fail("无权限");
            }
            
            Long productId = Long.valueOf(params.get("productId").toString());
            BigDecimal price = new BigDecimal(params.get("price").toString());
            BigDecimal originalPrice = params.get("originalPrice") != null ? 
                    new BigDecimal(params.get("originalPrice").toString()) : null;
            
            PriceHistory history = priceHistoryService.recordPriceChange(productId, price, originalPrice);
            return Response.success("价格记录成功", history);
        } catch (Exception e) {
            log.error("记录价格失败", e);
            return Response.fail("记录价格失败");
        }
    }
    
    /**
     * 【管理员】删除价格历史记录
     */
    @DeleteMapping("/admin/history/{id}")
    public Response<Void> deleteHistory(@PathVariable Long id) {
        try {
            if (!isAdmin()) {
                return Response.fail("无权限");
            }
            priceHistoryService.deleteHistory(id);
            return Response.success("删除成功", null);
        } catch (Exception e) {
            log.error("删除价格历史失败", e);
            return Response.fail("删除失败");
        }
    }
    
    /**
     * 【管理员】手动触发降价提醒
     */
    @PostMapping("/admin/alert/{id}/trigger")
    public Response<Void> triggerAlert(@PathVariable Long id) {
        try {
            if (!isAdmin()) {
                return Response.fail("无权限");
            }
            priceAlertService.manualTriggerAlert(id);
            return Response.success("已触发并发送通知", null);
        } catch (Exception e) {
            log.error("触发降价提醒失败", e);
            return Response.fail("触发失败: " + e.getMessage());
        }
    }
    
    /**
     * 【管理员】回退降价提醒到监控状态
     */
    @PostMapping("/admin/alert/{id}/reset")
    public Response<Void> resetAlert(@PathVariable Long id) {
        try {
            if (!isAdmin()) {
                return Response.fail("无权限");
            }
            priceAlertService.resetAlert(id);
            return Response.success("已回退到监控状态", null);
        } catch (Exception e) {
            log.error("回退降价提醒失败", e);
            return Response.fail("回退失败: " + e.getMessage());
        }
    }
    
    /**
     * 【管理员】删除降价提醒
     */
    @DeleteMapping("/admin/alert/{id}")
    public Response<Void> deleteAlert(@PathVariable Long id) {
        try {
            if (!isAdmin()) {
                return Response.fail("无权限");
            }
            priceAlertService.deleteAlertById(id);
            return Response.success("删除成功", null);
        } catch (Exception e) {
            log.error("删除降价提醒失败", e);
            return Response.fail("删除失败");
        }
    }
}
