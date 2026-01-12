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
     * 检查商品是否在想要清单中
     */
    @GetMapping("/wishlist/check/{productId}")
    public Response<?> checkInWishlist(@PathVariable Long productId) {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return Response.success(Map.of("inWishlist", false));
        }
        
        boolean inWishlist = rationalConsumptionService.isInWishlist(username, productId);
        return Response.success(Map.of("inWishlist", inWishlist));
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

    // ==================== 管理员接口 ====================

    /**
     * 【管理员】获取理性消费统计数据
     */
    @GetMapping("/admin/stats")
    public Response<?> getAdminStats() {
        String username = SecurityUtils.getCurrentUsername();
        if (!"admin".equals(username)) {
            return Response.fail("无权限访问");
        }
        
        Map<String, Object> stats = rationalConsumptionService.getAdminStats();
        return Response.success(stats);
    }

    /**
     * 【管理员】获取全站消费趋势
     */
    @GetMapping("/admin/consumption-trend")
    public Response<?> getConsumptionTrend() {
        String username = SecurityUtils.getCurrentUsername();
        if (!"admin".equals(username)) {
            return Response.fail("无权限访问");
        }
        
        List<Map<String, Object>> trend = rationalConsumptionService.getGlobalConsumptionTrend();
        return Response.success(trend);
    }

    /**
     * 【管理员】获取最近想要清单活动
     */
    @GetMapping("/admin/wishlist-activity")
    public Response<?> getWishlistActivity() {
        String username = SecurityUtils.getCurrentUsername();
        if (!"admin".equals(username)) {
            return Response.fail("无权限访问");
        }
        
        List<Map<String, Object>> activities = rationalConsumptionService.getRecentWishlistActivity();
        return Response.success(activities);
    }

    /**
     * 【管理员】获取最近成就记录
     */
    @GetMapping("/admin/recent-achievements")
    public Response<?> getRecentAchievements() {
        String username = SecurityUtils.getCurrentUsername();
        if (!"admin".equals(username)) {
            return Response.fail("无权限访问");
        }
        
        List<Map<String, Object>> achievements = rationalConsumptionService.getRecentAchievements();
        return Response.success(achievements);
    }

    /**
     * 【管理员】手动授予成就
     */
    @PostMapping("/admin/grant-achievement")
    public Response<?> grantAchievement(@RequestBody Map<String, Object> params) {
        String username = SecurityUtils.getCurrentUsername();
        if (!"admin".equals(username)) {
            return Response.fail("无权限访问");
        }
        
        try {
            Long userId = Long.parseLong(params.get("userId").toString());
            String type = params.get("type").toString();
            
            rationalConsumptionService.grantAchievement(userId, type);
            return Response.success("成就授予成功");
        } catch (RuntimeException e) {
            return Response.fail(e.getMessage());
        }
    }

    /**
     * 【管理员】撤销成就
     */
    @PostMapping("/admin/revoke-achievement")
    public Response<?> revokeAchievement(@RequestBody Map<String, Object> params) {
        String username = SecurityUtils.getCurrentUsername();
        if (!"admin".equals(username)) {
            return Response.fail("无权限访问");
        }
        
        try {
            Long userId = Long.parseLong(params.get("userId").toString());
            String type = params.get("type").toString();
            
            rationalConsumptionService.revokeAchievement(userId, type);
            return Response.success("成就已撤销");
        } catch (RuntimeException e) {
            return Response.fail(e.getMessage());
        }
    }
}
