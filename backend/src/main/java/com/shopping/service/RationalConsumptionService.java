package com.shopping.service;

import com.shopping.dto.ConsumptionReportDto;
import com.shopping.dto.ConsumptionReportDto.CategoryConsumption;
import com.shopping.dto.ConsumptionReportDto.MonthlyTrend;
import com.shopping.entity.*;
import com.shopping.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 理性消费服务
 */
@Service
public class RationalConsumptionService {

    @Autowired
    private ConsumptionBudgetRepository budgetRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private OrderItemRepository orderItemRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private WishlistRepository wishlistRepository;
    
    @Autowired
    private ConsumptionAchievementRepository achievementRepository;

    /**
     * 获取或创建当月预算
     */
    public ConsumptionBudget getCurrentBudget(String username) {
        User user = userService.getUserByUsername(username);
        String currentMonth = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        
        return budgetRepository.findByUserIdAndBudgetMonth(user.getId(), currentMonth)
                .orElseGet(() -> {
                    // 查找最近的预算设置作为默认值
                    Optional<ConsumptionBudget> lastBudget = budgetRepository
                            .findFirstByUserIdOrderByBudgetMonthDesc(user.getId());
                    
                    ConsumptionBudget newBudget = new ConsumptionBudget();
                    newBudget.setUserId(user.getId());
                    newBudget.setBudgetMonth(currentMonth);
                    newBudget.setMonthlyBudget(lastBudget.map(ConsumptionBudget::getMonthlyBudget)
                            .orElse(new BigDecimal("2000")));
                    newBudget.setAlertEnabled(true);
                    newBudget.setAlertThreshold(80);
                    return budgetRepository.save(newBudget);
                });
    }

    /**
     * 设置月度预算
     */
    @Transactional
    public ConsumptionBudget setBudget(String username, BigDecimal amount, Integer alertThreshold) {
        User user = userService.getUserByUsername(username);
        String currentMonth = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        
        ConsumptionBudget budget = budgetRepository.findByUserIdAndBudgetMonth(user.getId(), currentMonth)
                .orElse(new ConsumptionBudget());
        
        budget.setUserId(user.getId());
        budget.setBudgetMonth(currentMonth);
        budget.setMonthlyBudget(amount);
        if (alertThreshold != null) {
            budget.setAlertThreshold(alertThreshold);
        }
        budget.setAlertEnabled(true);
        
        return budgetRepository.save(budget);
    }

    /**
     * 获取当月消费金额
     */
    public BigDecimal getCurrentMonthSpending(Long userId) {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1).minusSeconds(1);
        
        List<Order> orders = orderRepository.findByUserIdAndPaymentStatusAndCreatedTimeBetween(
                userId, 1, startOfMonth, endOfMonth);
        
        return orders.stream()
                .map(o -> o.getPayAmount() != null ? o.getPayAmount() : o.getTotalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * 获取预算使用情况
     */
    public Map<String, Object> getBudgetStatus(String username) {
        User user = userService.getUserByUsername(username);
        ConsumptionBudget budget = getCurrentBudget(username);
        BigDecimal spent = getCurrentMonthSpending(user.getId());
        
        Map<String, Object> result = new HashMap<>();
        result.put("budget", budget.getMonthlyBudget());
        result.put("spent", spent);
        result.put("remaining", budget.getMonthlyBudget().subtract(spent));
        
        int usedPercent = budget.getMonthlyBudget().compareTo(BigDecimal.ZERO) > 0
                ? spent.multiply(new BigDecimal("100"))
                    .divide(budget.getMonthlyBudget(), 0, RoundingMode.HALF_UP).intValue()
                : 0;
        result.put("usedPercent", usedPercent);
        result.put("alertThreshold", budget.getAlertThreshold());
        result.put("isOverBudget", usedPercent >= 100);
        result.put("isNearLimit", usedPercent >= budget.getAlertThreshold() && usedPercent < 100);
        
        return result;
    }

    /**
     * 生成消费报告
     */
    public ConsumptionReportDto generateReport(String username, String period) {
        User user = userService.getUserByUsername(username);
        ConsumptionReportDto report = new ConsumptionReportDto();
        report.setPeriod(period);
        
        // 确定时间范围
        LocalDateTime startTime, endTime;
        if (period.length() == 6) { // 月度报告 yyyyMM
            int year = Integer.parseInt(period.substring(0, 4));
            int month = Integer.parseInt(period.substring(4, 6));
            startTime = LocalDateTime.of(year, month, 1, 0, 0, 0);
            endTime = startTime.plusMonths(1).minusSeconds(1);
        } else { // 年度报告 yyyy
            int year = Integer.parseInt(period);
            startTime = LocalDateTime.of(year, 1, 1, 0, 0, 0);
            endTime = LocalDateTime.of(year, 12, 31, 23, 59, 59);
        }
        
        // 获取已支付订单
        List<Order> orders = orderRepository.findByUserIdAndPaymentStatusAndCreatedTimeBetween(
                user.getId(), 1, startTime, endTime);
        
        // 基础统计
        BigDecimal totalAmount = orders.stream()
                .map(o -> o.getPayAmount() != null ? o.getPayAmount() : o.getTotalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        report.setTotalAmount(totalAmount);
        report.setOrderCount(orders.size());
        
        int productCount = orders.stream()
                .flatMap(o -> o.getItems().stream())
                .mapToInt(OrderItem::getQuantity)
                .sum();
        report.setProductCount(productCount);
        
        // 预算信息
        if (period.length() == 6) {
            Optional<ConsumptionBudget> budget = budgetRepository.findByUserIdAndBudgetMonth(user.getId(), period);
            if (budget.isPresent()) {
                report.setMonthlyBudget(budget.get().getMonthlyBudget());
                int usedPercent = budget.get().getMonthlyBudget().compareTo(BigDecimal.ZERO) > 0
                        ? totalAmount.multiply(new BigDecimal("100"))
                            .divide(budget.get().getMonthlyBudget(), 0, RoundingMode.HALF_UP).intValue()
                        : 0;
                report.setBudgetUsedPercent(usedPercent);
            }
        }
        
        // 分类消费分布
        Map<Long, BigDecimal> categoryAmounts = new HashMap<>();
        Map<Long, Integer> categoryOrders = new HashMap<>();
        Map<Long, String> categoryNames = new HashMap<>();
        
        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product != null && product.getCategoryId() != null) {
                    Long catId = product.getCategoryId();
                    BigDecimal itemTotal = item.getPrice().multiply(new BigDecimal(item.getQuantity()));
                    categoryAmounts.merge(catId, itemTotal, BigDecimal::add);
                    categoryOrders.merge(catId, 1, Integer::sum);
                    if (!categoryNames.containsKey(catId)) {
                        categoryRepository.findById(catId).ifPresent(c -> categoryNames.put(catId, c.getName()));
                    }
                }
            }
        }
        
        List<CategoryConsumption> categoryList = new ArrayList<>();
        for (Long catId : categoryAmounts.keySet()) {
            BigDecimal amount = categoryAmounts.get(catId);
            int percent = totalAmount.compareTo(BigDecimal.ZERO) > 0
                    ? amount.multiply(new BigDecimal("100"))
                        .divide(totalAmount, 0, RoundingMode.HALF_UP).intValue()
                    : 0;
            categoryList.add(new CategoryConsumption(
                    catId,
                    categoryNames.getOrDefault(catId, "未知分类"),
                    amount,
                    percent,
                    categoryOrders.getOrDefault(catId, 0)
            ));
        }
        categoryList.sort((a, b) -> b.getAmount().compareTo(a.getAmount()));
        report.setCategoryDistribution(categoryList);
        
        // 月度趋势（最近6个月）
        List<MonthlyTrend> trends = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);
            
            List<Order> monthOrders = orderRepository.findByUserIdAndPaymentStatusAndCreatedTimeBetween(
                    user.getId(), 1, monthStart, monthEnd);
            
            BigDecimal monthAmount = monthOrders.stream()
                    .map(o -> o.getPayAmount() != null ? o.getPayAmount() : o.getTotalAmount())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            trends.add(new MonthlyTrend(
                    monthStart.format(DateTimeFormatter.ofPattern("yyyy-MM")),
                    monthAmount,
                    monthOrders.size()
            ));
        }
        report.setMonthlyTrend(trends);
        
        // 计算环比变化
        if (trends.size() >= 2) {
            BigDecimal current = trends.get(trends.size() - 1).getAmount();
            BigDecimal previous = trends.get(trends.size() - 2).getAmount();
            if (previous.compareTo(BigDecimal.ZERO) > 0) {
                int change = current.subtract(previous)
                        .multiply(new BigDecimal("100"))
                        .divide(previous, 0, RoundingMode.HALF_UP).intValue();
                report.setMonthOverMonthChange(change);
            }
        }
        
        // 计算理性消费指数
        int rationalIndex = calculateRationalIndex(user.getId(), orders, report);
        report.setRationalIndex(rationalIndex);
        report.setRationalLevel(getRationalLevel(rationalIndex));
        
        // 生成消费建议
        report.setSuggestions(generateSuggestions(report, categoryList));
        
        // 模拟数据
        report.setImpulseBlockedCount((int)(Math.random() * 10));
        report.setDuplicateAlertCount((int)(Math.random() * 5));
        report.setSavedAmount(new BigDecimal((int)(Math.random() * 200)));
        
        return report;
    }

    /**
     * 计算理性消费指数
     */
    private int calculateRationalIndex(Long userId, List<Order> orders, ConsumptionReportDto report) {
        int score = 70; // 基础分
        
        // 预算控制 (+/- 15分)
        if (report.getBudgetUsedPercent() != null) {
            if (report.getBudgetUsedPercent() <= 80) {
                score += 15;
            } else if (report.getBudgetUsedPercent() <= 100) {
                score += 5;
            } else {
                score -= 10;
            }
        }
        
        // 消费稳定性 (+/- 10分)
        if (report.getMonthOverMonthChange() != null) {
            int change = Math.abs(report.getMonthOverMonthChange());
            if (change <= 20) {
                score += 10;
            } else if (change <= 50) {
                score += 5;
            } else {
                score -= 5;
            }
        }
        
        // 分类多样性 (+/- 5分)
        if (report.getCategoryDistribution() != null) {
            int categories = report.getCategoryDistribution().size();
            if (categories >= 3 && categories <= 5) {
                score += 5;
            } else if (categories > 5) {
                score += 2;
            }
        }
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * 获取理性消费等级
     */
    private String getRationalLevel(int index) {
        if (index >= 90) return "理性消费达人";
        if (index >= 75) return "消费习惯良好";
        if (index >= 60) return "消费基本理性";
        if (index >= 40) return "需要注意控制";
        return "建议调整习惯";
    }

    /**
     * 生成消费建议
     */
    private List<String> generateSuggestions(ConsumptionReportDto report, List<CategoryConsumption> categories) {
        List<String> suggestions = new ArrayList<>();
        
        // 预算建议
        if (report.getBudgetUsedPercent() != null) {
            if (report.getBudgetUsedPercent() > 100) {
                suggestions.add("本月消费已超出预算，建议控制后续支出");
            } else if (report.getBudgetUsedPercent() > 80) {
                suggestions.add("预算使用已超过80%，请注意控制消费");
            } else if (report.getBudgetUsedPercent() < 50) {
                suggestions.add("预算使用合理，继续保持良好的消费习惯");
            }
        }
        
        // 分类建议
        if (!categories.isEmpty()) {
            CategoryConsumption top = categories.get(0);
            if (top.getPercent() > 50) {
                suggestions.add(top.getCategoryName() + "类消费占比过高(" + top.getPercent() + "%)，建议适当平衡");
            }
        }
        
        // 趋势建议
        if (report.getMonthOverMonthChange() != null) {
            if (report.getMonthOverMonthChange() > 30) {
                suggestions.add("消费环比增长" + report.getMonthOverMonthChange() + "%，建议关注消费增长原因");
            } else if (report.getMonthOverMonthChange() < -20) {
                suggestions.add("消费环比下降" + Math.abs(report.getMonthOverMonthChange()) + "%，节约意识很好");
            }
        }
        
        if (suggestions.isEmpty()) {
            suggestions.add("您的消费习惯良好，继续保持理性消费");
        }
        
        return suggestions;
    }

    /**
     * 检测重复购买
     */
    public List<Map<String, Object>> checkDuplicatePurchase(String username, Long productId) {
        User user = userService.getUserByUsername(username);
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return Collections.emptyList();
        
        // 查找最近3个月内购买过的相同分类商品
        LocalDateTime threeMonthsAgo = LocalDateTime.now().minusMonths(3);
        List<Order> recentOrders = orderRepository.findByUserIdAndPaymentStatusAndCreatedTimeAfter(
                user.getId(), 1, threeMonthsAgo);
        
        List<Map<String, Object>> duplicates = new ArrayList<>();
        for (Order order : recentOrders) {
            for (OrderItem item : order.getItems()) {
                // 检查是否是同一商品或同分类商品
                if (item.getProduct().getId().equals(productId)) {
                    Map<String, Object> dup = new HashMap<>();
                    dup.put("type", "same");
                    dup.put("message", "您在" + order.getCreatedTime().format(DateTimeFormatter.ofPattern("MM月dd日")) + "购买过此商品");
                    dup.put("orderId", order.getId());
                    dup.put("orderNo", order.getOrderNo());
                    dup.put("productName", item.getProductName());
                    dup.put("quantity", item.getQuantity());
                    duplicates.add(dup);
                } else if (item.getProduct().getCategoryId() != null 
                        && item.getProduct().getCategoryId().equals(product.getCategoryId())) {
                    Map<String, Object> dup = new HashMap<>();
                    dup.put("type", "similar");
                    dup.put("message", "您最近购买过同类商品：" + item.getProductName());
                    dup.put("orderId", order.getId());
                    dup.put("productName", item.getProductName());
                    duplicates.add(dup);
                }
            }
        }
        
        return duplicates.stream().limit(5).collect(Collectors.toList());
    }

    // ==================== 想要清单功能 ====================

    /**
     * 添加到想要清单
     */
    @Transactional
    public Wishlist addToWishlist(String username, Long productId, Integer coolingDays, String reason) {
        User user = userService.getUserByUsername(username);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("商品不存在"));
        
        // 检查是否已在清单中
        Optional<Wishlist> existing = wishlistRepository.findByUserIdAndProductIdAndStatusIn(
                user.getId(), productId, Arrays.asList(0, 1));
        if (existing.isPresent()) {
            throw new RuntimeException("该商品已在想要清单中");
        }
        
        Wishlist wishlist = new Wishlist();
        wishlist.setUserId(user.getId());
        wishlist.setProductId(productId);
        wishlist.setAddedPrice(product.getPrice());
        wishlist.setCoolingDays(coolingDays != null ? coolingDays : 3);
        wishlist.setReason(reason);
        wishlist.setStatus(0); // 冷静中
        
        Wishlist saved = wishlistRepository.save(wishlist);
        
        // 检查成就
        checkAndGrantAchievement(user.getId(), "FIRST_WISHLIST", "理性第一步", "首次使用想要清单");
        
        return saved;
    }

    /**
     * 获取想要清单
     */
    public List<Map<String, Object>> getWishlist(String username) {
        User user = userService.getUserByUsername(username);
        
        // 先更新冷静期状态
        updateCoolingStatus(user.getId());
        
        List<Wishlist> items = wishlistRepository.findByUserIdAndStatusInOrderByCreatedTimeDesc(
                user.getId(), Arrays.asList(0, 1));
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Wishlist item : items) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", item.getId());
            map.put("productId", item.getProductId());
            map.put("addedPrice", item.getAddedPrice());
            map.put("coolingDays", item.getCoolingDays());
            map.put("coolingEndTime", item.getCoolingEndTime());
            map.put("status", item.getStatus());
            map.put("reason", item.getReason());
            map.put("createdTime", item.getCreatedTime());
            
            // 计算剩余冷静时间
            if (item.getStatus() == 0 && item.getCoolingEndTime() != null) {
                long hoursLeft = ChronoUnit.HOURS.between(LocalDateTime.now(), item.getCoolingEndTime());
                map.put("hoursLeft", Math.max(0, hoursLeft));
            } else {
                map.put("hoursLeft", 0);
            }
            
            // 商品信息
            Product product = item.getProduct();
            if (product != null) {
                map.put("productName", product.getName());
                map.put("productImage", product.getMainImage());
                map.put("currentPrice", product.getPrice());
                
                // 价格变化
                if (item.getAddedPrice() != null && product.getPrice() != null) {
                    BigDecimal priceDiff = product.getPrice().subtract(item.getAddedPrice());
                    map.put("priceChange", priceDiff);
                    map.put("priceDropped", priceDiff.compareTo(BigDecimal.ZERO) < 0);
                }
            }
            
            result.add(map);
        }
        
        return result;
    }

    /**
     * 更新冷静期状态
     */
    @Transactional
    public void updateCoolingStatus(Long userId) {
        List<Wishlist> expired = wishlistRepository.findCoolingExpired(userId, LocalDateTime.now());
        for (Wishlist item : expired) {
            item.setStatus(1); // 可购买
            wishlistRepository.save(item);
        }
    }

    /**
     * 从想要清单移除
     */
    @Transactional
    public void removeFromWishlist(String username, Long wishlistId) {
        User user = userService.getUserByUsername(username);
        Wishlist wishlist = wishlistRepository.findById(wishlistId)
                .orElseThrow(() -> new RuntimeException("清单项不存在"));
        
        if (!wishlist.getUserId().equals(user.getId())) {
            throw new RuntimeException("无权操作");
        }
        
        wishlist.setStatus(3); // 已移除
        wishlistRepository.save(wishlist);
        
        // 检查成就 - 理性放弃
        int removedCount = wishlistRepository.countRemovedFromWishlist(user.getId());
        if (removedCount >= 5) {
            checkAndGrantAchievement(user.getId(), "RATIONAL_GIVEUP_5", "理性放弃者", "从想要清单移除5件商品");
        }
    }

    /**
     * 标记为已购买
     */
    @Transactional
    public void markAsPurchased(String username, Long wishlistId) {
        User user = userService.getUserByUsername(username);
        Wishlist wishlist = wishlistRepository.findById(wishlistId)
                .orElseThrow(() -> new RuntimeException("清单项不存在"));
        
        if (!wishlist.getUserId().equals(user.getId())) {
            throw new RuntimeException("无权操作");
        }
        
        wishlist.setStatus(2); // 已购买
        wishlistRepository.save(wishlist);
        
        // 检查成就 - 延迟满足
        int purchasedCount = wishlistRepository.countPurchasedFromWishlist(user.getId());
        if (purchasedCount >= 3) {
            checkAndGrantAchievement(user.getId(), "DELAYED_GRATIFICATION_3", "延迟满足达人", "通过想要清单购买3件商品");
        }
    }

    /**
     * 获取想要清单统计
     */
    public Map<String, Object> getWishlistStats(String username) {
        User user = userService.getUserByUsername(username);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("coolingCount", wishlistRepository.countByUserIdAndStatus(user.getId(), 0));
        stats.put("readyCount", wishlistRepository.countByUserIdAndStatus(user.getId(), 1));
        stats.put("purchasedCount", wishlistRepository.countPurchasedFromWishlist(user.getId()));
        stats.put("removedCount", wishlistRepository.countRemovedFromWishlist(user.getId()));
        
        return stats;
    }

    // ==================== 成就系统 ====================

    /**
     * 检查并授予成就
     */
    @Transactional
    public void checkAndGrantAchievement(Long userId, String type, String name, String desc) {
        Optional<ConsumptionAchievement> existing = achievementRepository.findByUserIdAndAchievementType(userId, type);
        if (existing.isEmpty()) {
            ConsumptionAchievement achievement = new ConsumptionAchievement();
            achievement.setUserId(userId);
            achievement.setAchievementType(type);
            achievement.setAchievementName(name);
            achievement.setAchievementDesc(desc);
            achievementRepository.save(achievement);
        }
    }

    /**
     * 获取用户成就列表
     */
    public List<Map<String, Object>> getAchievements(String username) {
        User user = userService.getUserByUsername(username);
        List<ConsumptionAchievement> achievements = achievementRepository.findByUserIdOrderByAchievedTimeDesc(user.getId());
        
        // 所有可能的成就
        List<Map<String, Object>> allAchievements = new ArrayList<>();
        
        // 定义所有成就
        String[][] achievementDefs = {
            {"FIRST_WISHLIST", "理性第一步", "首次使用想要清单", "wishlist"},
            {"DELAYED_GRATIFICATION_3", "延迟满足达人", "通过想要清单购买3件商品", "clock"},
            {"RATIONAL_GIVEUP_5", "理性放弃者", "从想要清单移除5件商品", "x-circle"},
            {"BUDGET_MASTER", "预算大师", "连续3个月未超预算", "target"},
            {"SAVING_STAR", "节约之星", "单月节省超过500元", "star"},
            {"RATIONAL_100", "理性消费达人", "理性指数达到100分", "award"}
        };
        
        Set<String> earnedTypes = achievements.stream()
                .map(ConsumptionAchievement::getAchievementType)
                .collect(Collectors.toSet());
        
        for (String[] def : achievementDefs) {
            Map<String, Object> item = new HashMap<>();
            item.put("type", def[0]);
            item.put("name", def[1]);
            item.put("description", def[2]);
            item.put("icon", def[3]);
            item.put("earned", earnedTypes.contains(def[0]));
            
            // 如果已获得，添加获得时间
            if (earnedTypes.contains(def[0])) {
                achievements.stream()
                        .filter(a -> a.getAchievementType().equals(def[0]))
                        .findFirst()
                        .ifPresent(a -> item.put("earnedTime", a.getAchievedTime()));
            }
            
            allAchievements.add(item);
        }
        
        return allAchievements;
    }

    /**
     * 检查预算相关成就
     */
    @Transactional
    public void checkBudgetAchievements(String username) {
        User user = userService.getUserByUsername(username);
        
        // 检查连续3个月未超预算
        LocalDateTime now = LocalDateTime.now();
        int underBudgetMonths = 0;
        
        for (int i = 0; i < 3; i++) {
            String month = now.minusMonths(i).format(DateTimeFormatter.ofPattern("yyyyMM"));
            Optional<ConsumptionBudget> budget = budgetRepository.findByUserIdAndBudgetMonth(user.getId(), month);
            
            if (budget.isPresent()) {
                LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
                LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);
                
                List<Order> orders = orderRepository.findByUserIdAndPaymentStatusAndCreatedTimeBetween(
                        user.getId(), 1, monthStart, monthEnd);
                
                BigDecimal spent = orders.stream()
                        .map(o -> o.getPayAmount() != null ? o.getPayAmount() : o.getTotalAmount())
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                if (spent.compareTo(budget.get().getMonthlyBudget()) <= 0) {
                    underBudgetMonths++;
                }
            }
        }
        
        if (underBudgetMonths >= 3) {
            checkAndGrantAchievement(user.getId(), "BUDGET_MASTER", "预算大师", "连续3个月未超预算");
        }
    }
}
