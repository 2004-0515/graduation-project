package com.shopping.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * 搜索历史记录实体类
 * 用于存储用户的搜索历史，支持快速重复搜索
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_search_history", indexes = {
    @Index(name = "idx_user_time", columnList = "user_id, search_time DESC")
}, uniqueConstraints = {
    @UniqueConstraint(name = "idx_user_keyword", columnNames = {"user_id", "keyword"})
})
public class SearchHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "keyword", nullable = false, length = 100)
    private String keyword;
    
    @Column(name = "search_time", nullable = false)
    private LocalDateTime searchTime;
    
    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;
    
    @Column(name = "updated_time", nullable = false)
    private LocalDateTime updatedTime;
    
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.searchTime == null) {
            this.searchTime = now;
        }
        if (this.createdTime == null) {
            this.createdTime = now;
        }
        if (this.updatedTime == null) {
            this.updatedTime = now;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedTime = LocalDateTime.now();
    }
}
