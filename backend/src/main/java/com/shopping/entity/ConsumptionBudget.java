package com.shopping.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 消费预算实体
 */
@Entity
@Table(name = "tb_consumption_budget")
public class ConsumptionBudget {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    /** 月度预算金额 */
    @Column(name = "monthly_budget", precision = 10, scale = 2)
    private BigDecimal monthlyBudget;
    
    /** 预算年月 (格式: 202601) */
    @Column(name = "budget_month", length = 6)
    private String budgetMonth;
    
    /** 是否启用预算提醒 */
    @Column(name = "alert_enabled")
    private Boolean alertEnabled = true;
    
    /** 预算警告阈值(百分比，如80表示80%) */
    @Column(name = "alert_threshold")
    private Integer alertThreshold = 80;
    
    @Column(name = "created_time")
    private LocalDateTime createdTime;
    
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
    
    @PrePersist
    protected void onCreate() {
        createdTime = LocalDateTime.now();
        updatedTime = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedTime = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public BigDecimal getMonthlyBudget() { return monthlyBudget; }
    public void setMonthlyBudget(BigDecimal monthlyBudget) { this.monthlyBudget = monthlyBudget; }
    
    public String getBudgetMonth() { return budgetMonth; }
    public void setBudgetMonth(String budgetMonth) { this.budgetMonth = budgetMonth; }
    
    public Boolean getAlertEnabled() { return alertEnabled; }
    public void setAlertEnabled(Boolean alertEnabled) { this.alertEnabled = alertEnabled; }
    
    public Integer getAlertThreshold() { return alertThreshold; }
    public void setAlertThreshold(Integer alertThreshold) { this.alertThreshold = alertThreshold; }
    
    public LocalDateTime getCreatedTime() { return createdTime; }
    public void setCreatedTime(LocalDateTime createdTime) { this.createdTime = createdTime; }
    
    public LocalDateTime getUpdatedTime() { return updatedTime; }
    public void setUpdatedTime(LocalDateTime updatedTime) { this.updatedTime = updatedTime; }
}
