package com.shopping.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 消费报告DTO
 */
public class ConsumptionReportDto {
    
    /** 报告周期 (月份或年份) */
    private String period;
    
    /** 总消费金额 */
    private BigDecimal totalAmount;
    
    /** 订单数量 */
    private Integer orderCount;
    
    /** 商品数量 */
    private Integer productCount;
    
    /** 月度预算 */
    private BigDecimal monthlyBudget;
    
    /** 预算使用百分比 */
    private Integer budgetUsedPercent;
    
    /** 理性消费指数 (0-100) */
    private Integer rationalIndex;
    
    /** 理性消费等级 */
    private String rationalLevel;
    
    /** 各分类消费分布 */
    private List<CategoryConsumption> categoryDistribution;
    
    /** 月度消费趋势 */
    private List<MonthlyTrend> monthlyTrend;
    
    /** 同比变化百分比 */
    private Integer yearOverYearChange;
    
    /** 环比变化百分比 */
    private Integer monthOverMonthChange;
    
    /** 消费建议 */
    private List<String> suggestions;
    
    /** 冲动消费拦截次数 */
    private Integer impulseBlockedCount;
    
    /** 重复购买提醒次数 */
    private Integer duplicateAlertCount;
    
    /** 节省金额 */
    private BigDecimal savedAmount;

    // 内部类：分类消费
    public static class CategoryConsumption {
        private Long categoryId;
        private String categoryName;
        private BigDecimal amount;
        private Integer percent;
        private Integer orderCount;
        
        public CategoryConsumption() {}
        
        public CategoryConsumption(Long categoryId, String categoryName, BigDecimal amount, Integer percent, Integer orderCount) {
            this.categoryId = categoryId;
            this.categoryName = categoryName;
            this.amount = amount;
            this.percent = percent;
            this.orderCount = orderCount;
        }

        public Long getCategoryId() { return categoryId; }
        public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public Integer getPercent() { return percent; }
        public void setPercent(Integer percent) { this.percent = percent; }
        public Integer getOrderCount() { return orderCount; }
        public void setOrderCount(Integer orderCount) { this.orderCount = orderCount; }
    }
    
    // 内部类：月度趋势
    public static class MonthlyTrend {
        private String month;
        private BigDecimal amount;
        private Integer orderCount;
        
        public MonthlyTrend() {}
        
        public MonthlyTrend(String month, BigDecimal amount, Integer orderCount) {
            this.month = month;
            this.amount = amount;
            this.orderCount = orderCount;
        }

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public Integer getOrderCount() { return orderCount; }
        public void setOrderCount(Integer orderCount) { this.orderCount = orderCount; }
    }

    // Getters and Setters
    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
    
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    
    public Integer getOrderCount() { return orderCount; }
    public void setOrderCount(Integer orderCount) { this.orderCount = orderCount; }
    
    public Integer getProductCount() { return productCount; }
    public void setProductCount(Integer productCount) { this.productCount = productCount; }
    
    public BigDecimal getMonthlyBudget() { return monthlyBudget; }
    public void setMonthlyBudget(BigDecimal monthlyBudget) { this.monthlyBudget = monthlyBudget; }
    
    public Integer getBudgetUsedPercent() { return budgetUsedPercent; }
    public void setBudgetUsedPercent(Integer budgetUsedPercent) { this.budgetUsedPercent = budgetUsedPercent; }
    
    public Integer getRationalIndex() { return rationalIndex; }
    public void setRationalIndex(Integer rationalIndex) { this.rationalIndex = rationalIndex; }
    
    public String getRationalLevel() { return rationalLevel; }
    public void setRationalLevel(String rationalLevel) { this.rationalLevel = rationalLevel; }
    
    public List<CategoryConsumption> getCategoryDistribution() { return categoryDistribution; }
    public void setCategoryDistribution(List<CategoryConsumption> categoryDistribution) { this.categoryDistribution = categoryDistribution; }
    
    public List<MonthlyTrend> getMonthlyTrend() { return monthlyTrend; }
    public void setMonthlyTrend(List<MonthlyTrend> monthlyTrend) { this.monthlyTrend = monthlyTrend; }
    
    public Integer getYearOverYearChange() { return yearOverYearChange; }
    public void setYearOverYearChange(Integer yearOverYearChange) { this.yearOverYearChange = yearOverYearChange; }
    
    public Integer getMonthOverMonthChange() { return monthOverMonthChange; }
    public void setMonthOverMonthChange(Integer monthOverMonthChange) { this.monthOverMonthChange = monthOverMonthChange; }
    
    public List<String> getSuggestions() { return suggestions; }
    public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions; }
    
    public Integer getImpulseBlockedCount() { return impulseBlockedCount; }
    public void setImpulseBlockedCount(Integer impulseBlockedCount) { this.impulseBlockedCount = impulseBlockedCount; }
    
    public Integer getDuplicateAlertCount() { return duplicateAlertCount; }
    public void setDuplicateAlertCount(Integer duplicateAlertCount) { this.duplicateAlertCount = duplicateAlertCount; }
    
    public BigDecimal getSavedAmount() { return savedAmount; }
    public void setSavedAmount(BigDecimal savedAmount) { this.savedAmount = savedAmount; }
}
