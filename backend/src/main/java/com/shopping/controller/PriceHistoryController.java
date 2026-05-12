package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.PriceAlert;
import com.shopping.entity.PriceHistory;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
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
import java.time.format.DateTimeParseException;
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
    private Optional<Long> getCurrentUserId() {
        if (!SecurityUtils.isAuthenticated()) {
            return Optional.empty();
        }
        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByUsername(username);
        return user != null ? Optional.of(user.getId()) : Optional.empty();
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

    private <T> Response<T> unauthorized() {
        return Response.fail(401, "请先登录");
    }

    private <T> Response<T> forbidden() {
        return Response.fail(403, "无权限");
    }

    private LocalDateTime parseDateTimeOrThrow(String value, String fieldName) {
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException e) {
            throw new ValidationException(fieldName + "格式不正确，应为 yyyy-MM-ddTHH:mm:ss");
        }
    }

    private Long parseRequiredLong(Map<String, Object> params, String fieldName) {
        Object value = params.get(fieldName);
        if (value == null || value.toString().trim().isEmpty()) {
            throw new ValidationException(fieldName + "不能为空");
        }
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException e) {
            throw new ValidationException(fieldName + "格式不正确");
        }
    }

    private BigDecimal parseRequiredBigDecimal(Map<String, Object> params, String fieldName) {
        Object value = params.get(fieldName);
        if (value == null || value.toString().trim().isEmpty()) {
            throw new ValidationException(fieldName + "不能为空");
        }
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            throw new ValidationException(fieldName + "格式不正确");
        }
    }
    
    /**
     * 获取商品价格历史
     */
    @GetMapping("/history/{productId}")
    public Response<List<PriceHistory>> getPriceHistory(@PathVariable Long productId) {
        List<PriceHistory> history = priceHistoryService.getPriceHistory(productId);
        return Response.success(history);
    }
    
    /**
     * 获取指定时间范围内的价格历史
     */
    @GetMapping("/history/{productId}/range")
    public Response<List<PriceHistory>> getPriceHistoryInRange(
            @PathVariable Long productId,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        LocalDateTime start = startTime != null ? parseDateTimeOrThrow(startTime, "开始时间") : LocalDateTime.now().minusMonths(3);
        LocalDateTime end = endTime != null ? parseDateTimeOrThrow(endTime, "结束时间") : LocalDateTime.now();
        if (start.isAfter(end)) {
            throw new ValidationException("开始时间不能晚于结束时间");
        }
        List<PriceHistory> history = priceHistoryService.getPriceHistoryInRange(productId, start, end);
        return Response.success(history);
    }

    
    /**
     * 获取价格统计信息
     */
    @GetMapping("/stats/{productId}")
    public Response<Map<String, Object>> getPriceStats(@PathVariable Long productId) {
        Map<String, Object> stats = priceHistoryService.getPriceStats(productId);
        return Response.success(stats);
    }
    
    /**
     * 创建降价提醒
     */
    @PostMapping("/alert")
    public Response<PriceAlert> createAlert(@RequestBody Map<String, Object> params) {
        Optional<Long> userId = getCurrentUserId();
        if (userId.isEmpty()) {
            return unauthorized();
        }

        Long productId = parseRequiredLong(params, "productId");
        BigDecimal targetPrice = parseRequiredBigDecimal(params, "targetPrice");

        PriceAlert alert = priceAlertService.createAlert(userId.get(), productId, targetPrice);
        return Response.success("降价提醒设置成功", alert);
    }
    
    /**
     * 取消降价提醒
     */
    @DeleteMapping("/alert/{productId}")
    public Response<Void> cancelAlert(@PathVariable Long productId) {
        Optional<Long> userId = getCurrentUserId();
        if (userId.isEmpty()) {
            return unauthorized();
        }

        priceAlertService.cancelAlert(userId.get(), productId);
        return Response.success("已取消降价提醒", null);
    }

    /**
     * 删除降价提醒记录
     */
    @DeleteMapping("/alert/{productId}/record")
    public Response<Void> deleteUserAlertRecord(@PathVariable Long productId) {
        Optional<Long> userId = getCurrentUserId();
        if (userId.isEmpty()) {
            return unauthorized();
        }

        priceAlertService.deleteAlert(userId.get(), productId);
        return Response.success("已删除降价提醒记录", null);
    }
    
    /**
     * 获取用户的降价提醒列表
     */
    @GetMapping("/alerts")
    public Response<List<PriceAlert>> getUserAlerts() {
        Optional<Long> userId = getCurrentUserId();
        if (userId.isEmpty()) {
            return unauthorized();
        }

        List<PriceAlert> alerts = priceAlertService.getUserAlerts(userId.get());
        return Response.success(alerts);
    }
    
    /**
     * 获取用户的降价提醒列表（带商品详情）
     */
    @GetMapping("/alerts/detail")
    public Response<List<Map<String, Object>>> getUserAlertsWithDetail() {
        Optional<Long> userId = getCurrentUserId();
        if (userId.isEmpty()) {
            return unauthorized();
        }

        List<PriceAlert> alerts = priceAlertService.getUserAlerts(userId.get());

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

            Product product = productService.findById(alert.getProductId());
            if (product != null) {
                map.put("productName", product.getName());
                map.put("productImage", product.getMainImage());
                map.put("productPrice", product.getPrice());
            }

            return map;
        }).collect(Collectors.toList());

        return Response.success(result);
    }
    
    /**
     * 获取用户对某商品的降价提醒
     */
    @GetMapping("/alert/{productId}")
    public Response<PriceAlert> getUserProductAlert(@PathVariable Long productId) {
        Optional<Long> userId = getCurrentUserId();
        if (userId.isEmpty()) {
            return Response.success(null);
        }

        Optional<PriceAlert> alert = priceAlertService.getUserProductAlert(userId.get(), productId);
        return Response.success(alert.orElse(null));
    }
    
    /**
     * 检查用户是否已设置某商品的降价提醒
     */
    @GetMapping("/alert/{productId}/exists")
    public Response<Boolean> hasActiveAlert(@PathVariable Long productId) {
        Optional<Long> userId = getCurrentUserId();
        if (userId.isEmpty()) {
            return Response.success(false);
        }

        boolean exists = priceAlertService.hasActiveAlert(userId.get(), productId);
        return Response.success(exists);
    }
    
    // ==================== 管理员API ====================
    
    /**
     * 【管理员】获取所有降价提醒
     */
    @GetMapping("/admin/alerts")
    public Response<List<Map<String, Object>>> getAllAlerts(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String keyword) {
        if (!isAdmin()) {
            return forbidden();
        }

        List<PriceAlert> alerts = priceAlertService.getAllAlerts(status);

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

            User user = userService.findById(alert.getUserId());
            map.put("username", user != null ? user.getUsername() : null);

            Product product = productService.findById(alert.getProductId());
            map.put("productName", product != null ? product.getName() : null);

            return map;
        }).collect(Collectors.toList());

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
    }
    
    /**
     * 【管理员】获取有效降价提醒数量
     */
    @GetMapping("/admin/alerts/count")
    public Response<Long> getActiveAlertCount() {
        if (!isAdmin()) {
            return forbidden();
        }
        long count = priceAlertService.countActiveAlerts();
        return Response.success(count);
    }
    
    /**
     * 【管理员】手动记录价格
     */
    @PostMapping("/admin/record")
    public Response<PriceHistory> recordPrice(@RequestBody Map<String, Object> params) {
        if (!isAdmin()) {
            return forbidden();
        }

        Long productId = parseRequiredLong(params, "productId");
        BigDecimal price = parseRequiredBigDecimal(params, "price");
        BigDecimal originalPrice = params.get("originalPrice") != null && !params.get("originalPrice").toString().trim().isEmpty()
                ? parseRequiredBigDecimal(params, "originalPrice")
                : null;

        PriceHistory history = priceHistoryService.recordPriceChange(productId, price, originalPrice);
        return Response.success("价格记录成功", history);
    }
    
    /**
     * 【管理员】删除价格历史记录
     */
    @DeleteMapping("/admin/history/{id}")
    public Response<Void> deleteHistory(@PathVariable Long id) {
        if (!isAdmin()) {
            return forbidden();
        }
        priceHistoryService.deleteHistory(id);
        return Response.success("删除成功", null);
    }
    
    /**
     * 【管理员】手动触发降价提醒
     */
    @PostMapping("/admin/alert/{id}/trigger")
    public Response<Void> triggerAlert(@PathVariable Long id) {
        if (!isAdmin()) {
            return forbidden();
        }
        priceAlertService.manualTriggerAlert(id);
        return Response.success("已触发并发送通知", null);
    }
    
    /**
     * 【管理员】回退降价提醒到监控状态
     */
    @PostMapping("/admin/alert/{id}/reset")
    public Response<Void> resetAlert(@PathVariable Long id) {
        if (!isAdmin()) {
            return forbidden();
        }
        priceAlertService.resetAlert(id);
        return Response.success("已回退到监控状态", null);
    }
    
    /**
     * 【管理员】删除降价提醒
     */
    @DeleteMapping("/admin/alert/{id}")
    public Response<Void> deleteAlert(@PathVariable Long id) {
        if (!isAdmin()) {
            return forbidden();
        }
        priceAlertService.deleteAlertById(id);
        return Response.success("删除成功", null);
    }
}
