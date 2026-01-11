package com.shopping.controller;

import com.shopping.dto.ConsumptionReportDto;
import com.shopping.dto.Response;
import com.shopping.entity.ConsumptionBudget;
import com.shopping.service.RationalConsumptionService;
import com.shopping.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * 理性消费助手控制器
 */
@RestController
@RequestMapping("/rational-consumption")
public class RationalConsumptionController {

    @Autowired
    private RationalConsumptionService rationalConsumptionService;

    /**
     * 获取当前预算状态
     */
    @GetMapping("/budget/status")
    public Response<?> getBudgetStatus() {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return Response.fail("请先登录");
        }
        Map<String, Object> status = rationalConsumptionService.getBudgetStatus(username);
        return Response.success(status);
    }

    /**
     * 获取当前预算设置
     */
    @GetMapping("/budget")
    public Response<?> getCurrentBudget() {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return Response.fail("请先登录");
        }
        ConsumptionBudget budget = rationalConsumptionService.getCurrentBudget(username);
        return Response.success(budget);
    }

    /**
     * 设置月度预算
     */
    @PostMapping("/budget")
    public Response<?> setBudget(@RequestBody Map<String, Object> params) {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return Response.fail("请先登录");
        }
        
        BigDecimal amount = new BigDecimal(params.get("amount").toString());
        Integer alertThreshold = params.get("alertThreshold") != null 
                ? Integer.parseInt(params.get("alertThreshold").toString()) 
                : null;
        
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return Response.fail("预算金额必须大于0");
        }
        
        ConsumptionBudget budget = rationalConsumptionService.setBudget(username, amount, alertThreshold);
        return Response.success(budget);
    }

    /**
     * 获取消费报告
     */
    @GetMapping("/report")
    public Response<?> getReport(@RequestParam(required = false) String period) {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return Response.fail("请先登录");
        }
        
        // 默认当月
        if (period == null || period.isEmpty()) {
            period = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        }
        
        ConsumptionReportDto report = rationalConsumptionService.generateReport(username, period);
        return Response.success(report);
    }

    /**
     * 检测重复购买
     */
    @GetMapping("/duplicate-check/{productId}")
    public Response<?> checkDuplicate(@PathVariable Long productId) {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return Response.success(List.of()); // 未登录返回空列表
        }
        
        List<Map<String, Object>> duplicates = rationalConsumptionService.checkDuplicatePurchase(username, productId);
        return Response.success(duplicates);
    }

    /**
     * 批量检测重复购买（购物车场景）
     */
    @PostMapping("/duplicate-check/batch")
    public Response<?> checkDuplicateBatch(@RequestBody List<Long> productIds) {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return Response.success(Map.of());
        }
        
        Map<Long, List<Map<String, Object>>> result = new java.util.HashMap<>();
        for (Long productId : productIds) {
            List<Map<String, Object>> duplicates = rationalConsumptionService.checkDuplicatePurchase(username, productId);
            if (!duplicates.isEmpty()) {
                result.put(productId, duplicates);
            }
        }
        return Response.success(result);
    }

    // ==================== 想要清单接口 ====================

    /**
     * 添加到想要清单
     */
    @PostMapping("/wishlist")
    public Response<?> addToWishlist(@RequestBody Map<String, Object> params) {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return Response.fail("请先登录");
        }
        
        try {
            Long productId = Long.parseLong(params.get("productId").toString());
            Integer coolingDays = params.get("coolingDays") != null 
                    ? Integer.parseInt(params.get("coolingDays").toString()) : 3;
            String reason = params.get("reason") != null ? params.get("reason").toString() : null;
            
            rationalConsumptionService.addToWishlist(username, productId, coolingDays, reason);
            return Response.success("已添加到想要清单");
        } catch (RuntimeException e) {
            return Response.fail(e.getMessage());
        }
    }

    /**
     * 获取想要清单
     */
    @GetMapping("/wishlist")
    public Response<?> getWishlist() {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return Response.fail("请先登录");
        }
        
        List<Map<String, Object>> list = rationalConsumptionService.getWishlist(username);
        return Response.success(list);
    }

    /**
     * 获取想要清单统计
     */
    @GetMapping("/wishlist/stats")
    public Response<?> getWishlistStats() {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return Response.fail("请先登录");
        }
        
        Map<String, Object> stats = rationalConsumptionService.getWishlistStats(username);
        return Response.success(stats);
    }

    /**
     * 从想要清单移除
     */
    @DeleteMapping("/wishlist/{id}")
    public Response<?> removeFromWishlist(@PathVariable Long id) {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return Response.fail("请先登录");
        }
        
        try {
            rationalConsumptionService.removeFromWishlist(username, id);
            return Response.success("已移除");
        } catch (RuntimeException e) {
            return Response.fail(e.getMessage());
        }
    }

    /**
     * 标记为已购买
     */
    @PostMapping("/wishlist/{id}/purchased")
    public Response<?> markAsPurchased(@PathVariable Long id) {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return Response.fail("请先登录");
        }
        
        try {
            rationalConsumptionService.markAsPurchased(username, id);
            return Response.success("已标记为购买");
        } catch (RuntimeException e) {
            return Response.fail(e.getMessage());
        }
    }

    // ==================== 成就系统接口 ====================

    /**
     * 获取成就列表
     */
    @GetMapping("/achievements")
    public Response<?> getAchievements() {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return Response.fail("请先登录");
        }
        
        List<Map<String, Object>> achievements = rationalConsumptionService.getAchievements(username);
        return Response.success(achievements);
    }
}
