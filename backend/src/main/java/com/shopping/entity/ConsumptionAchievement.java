package com.shopping.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 消费成就实体
 */
@Entity
@Table(name = "tb_consumption_achievement")
public class ConsumptionAchievement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "achievement_type", nullable = false, length = 50)
    private String achievementType;
    
    @Column(name = "achievement_name", nullable = false, length = 100)
    private String achievementName;
    
    @Column(name = "achievement_desc", length = 200)
    private String achievementDesc;
    
    @Column(name = "achieved_time")
    private LocalDateTime achievedTime;
    
    @PrePersist
    protected void onCreate() {
        achievedTime = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getAchievementType() { return achievementType; }
    public void setAchievementType(String achievementType) { this.achievementType = achievementType; }
    
    public String getAchievementName() { return achievementName; }
    public void setAchievementName(String achievementName) { this.achievementName = achievementName; }
    
    public String getAchievementDesc() { return achievementDesc; }
    public void setAchievementDesc(String achievementDesc) { this.achievementDesc = achievementDesc; }
    
    public LocalDateTime getAchievedTime() { return achievedTime; }
    public void setAchievedTime(LocalDateTime achievedTime) { this.achievedTime = achievedTime; }
}
