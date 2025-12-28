package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Coupon;
import com.shopping.entity.UserCoupon;
import com.shopping.entity.User;
import com.shopping.service.CouponService;
import com.shopping.service.UserService;
import com.shopping.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/coupons")
public class CouponController {
    
    @Autowired
    private CouponService couponService;
    
    @Autowired
    private UserService userService;
    
    /**
     * 获取可领取的优惠券列表
     */
    @GetMapping
    public Response<List<Map<String, Object>>> getAvailableCoupons() {
        List<Coupon> coupons = couponService.getAvailableCoupons();
        
        // 检查当前用户是否已领取
        Long userId = null;
        try {
            String username = SecurityUtils.getCurrentUsername();
            User user = userService.findByUsername(username);
            if (user != null) userId = user.getId();
        } catch (Exception e) {}
        
        final Long currentUserId = userId;
        List<Map<String, Object>> result = coupons.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("name", c.getName());
            map.put("description", c.getDescription());
            map.put("type", c.getType());
            map.put("discountAmount", c.getDiscountAmount());
            map.put("discountRate", c.getDiscountRate());
            map.put("minAmount", c.getMinAmount());
            map.put("maxDiscount", c.getMaxDiscount());
            map.put("totalCount", c.getTotalCount());
            map.put("claimedCount", c.getClaimedCount());
            map.put("remaining", c.getTotalCount() - c.getClaimedCount());
            map.put("startTime", c.getStartTime());
            map.put("endTime", c.getEndTime());
            
            // 检查是否已领取
            boolean claimed = currentUserId != null && couponService.hasUserClaimed(currentUserId, c.getId());
            map.put("claimed", claimed);
            
            return map;
        }).toList();
        
        return Response.success(result);
    }
    
    /**
     * 领取优惠券
     */
    @PostMapping("/{id}/claim")
    public Response<UserCoupon> claimCoupon(@PathVariable Long id) {
        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByUsername(username);
        if (user == null) {
            return Response.fail(401, "请先登录");
        }
        
        try {
            UserCoupon userCoupon = couponService.claimCoupon(user.getId(), id);
            return Response.success("领取成功", userCoupon);
        } catch (Exception e) {
            return Response.fail(400, e.getMessage());
        }
    }
    
    /**
     * 获取用户的优惠券
     */
    @GetMapping("/my")
    public Response<List<Map<String, Object>>> getMyCoupons(@RequestParam(required = false) String status) {
        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByUsername(username);
        if (user == null) {
            return Response.fail(401, "请先登录");
        }
        
        List<UserCoupon> userCoupons;
        if ("available".equals(status)) {
            userCoupons = couponService.getUserAvailableCoupons(user.getId());
        } else {
            userCoupons = couponService.getUserCoupons(user.getId());
        }
        
        List<Map<String, Object>> result = userCoupons.stream().map(uc -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", uc.getId());
            map.put("couponId", uc.getCouponId());
            map.put("status", uc.getStatus());
            map.put("usedTime", uc.getUsedTime());
            map.put("createdTime", uc.getCreatedTime());
            
            Coupon c = uc.getCoupon();
            if (c != null) {
                map.put("name", c.getName());
                map.put("description", c.getDescription());
                map.put("type", c.getType());
                map.put("discountAmount", c.getDiscountAmount());
                map.put("discountRate", c.getDiscountRate());
                map.put("minAmount", c.getMinAmount());
                map.put("maxDiscount", c.getMaxDiscount());
                map.put("startTime", c.getStartTime());
                map.put("endTime", c.getEndTime());
                
                // 检查是否过期
                LocalDateTime now = LocalDateTime.now();
                boolean expired = now.isAfter(c.getEndTime());
                map.put("expired", expired);
            }
            
            return map;
        }).toList();
        
        return Response.success(result);
    }
    
    /**
     * 获取用户可用于某订单的优惠券
     */
    @GetMapping("/available")
    public Response<List<Map<String, Object>>> getAvailableForOrder(@RequestParam BigDecimal orderAmount) {
        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByUsername(username);
        if (user == null) {
            return Response.fail(401, "请先登录");
        }
        
        List<UserCoupon> userCoupons = couponService.getUserAvailableCoupons(user.getId());
        
        List<Map<String, Object>> result = userCoupons.stream()
            .filter(uc -> {
                Coupon c = uc.getCoupon();
                // 检查最低消费
                return c != null && (c.getMinAmount() == null || orderAmount.compareTo(c.getMinAmount()) >= 0);
            })
            .map(uc -> {
                Map<String, Object> map = new HashMap<>();
                Coupon c = uc.getCoupon();
                
                map.put("id", uc.getId());
                map.put("couponId", uc.getCouponId());
                map.put("name", c.getName());
                map.put("type", c.getType());
                map.put("discountAmount", c.getDiscountAmount());
                map.put("discountRate", c.getDiscountRate());
                map.put("minAmount", c.getMinAmount());
                map.put("maxDiscount", c.getMaxDiscount());
                map.put("endTime", c.getEndTime());
                
                // 计算优惠金额
                BigDecimal discount = couponService.calculateDiscount(uc, orderAmount);
                map.put("discount", discount);
                
                return map;
            })
            .sorted((a, b) -> ((BigDecimal)b.get("discount")).compareTo((BigDecimal)a.get("discount")))
            .toList();
        
        return Response.success(result);
    }
    
    // ========== 管理员接口 ==========
    
    /**
     * 获取所有优惠券（管理员）
     */
    @GetMapping("/admin/all")
    public Response<List<Coupon>> getAllCoupons() {
        return Response.success(couponService.getAllCoupons());
    }
    
    /**
     * 创建优惠券（管理员）
     */
    @PostMapping("/admin")
    public Response<Coupon> createCoupon(@RequestBody Coupon coupon) {
        return Response.success("创建成功", couponService.createCoupon(coupon));
    }
    
    /**
     * 更新优惠券（管理员）
     */
    @PutMapping("/admin/{id}")
    public Response<Coupon> updateCoupon(@PathVariable Long id, @RequestBody Coupon coupon) {
        return Response.success("更新成功", couponService.updateCoupon(id, coupon));
    }
    
    /**
     * 删除优惠券（管理员）
     */
    @DeleteMapping("/admin/{id}")
    public Response<Void> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return Response.success("删除成功");
    }
    
    /**
     * 重置用户的优惠券领取记录（管理员）
     */
    @PostMapping("/admin/reset-user-coupon")
    public Response<Integer> resetUserCoupon(@RequestBody java.util.Map<String, Long> body) {
        Long userId = body.get("userId");
        Long couponId = body.get("couponId");
        
        if (userId == null) {
            return Response.fail(400, "用户ID不能为空");
        }
        
        int count;
        if (couponId != null) {
            count = couponService.resetUserCoupons(userId, couponId);
        } else {
            count = couponService.resetAllUserCoupons(userId);
        }
        
        return Response.success("已重置 " + count + " 张优惠券", count);
    }
}
