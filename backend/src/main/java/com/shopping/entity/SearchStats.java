package com.shopping.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 搜索统计实体类
 * 用于统计搜索关键词的热度，支持热门搜索词功能
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_search_stats", indexes = {
    @Index(name = "idx_date_count", columnList = "search_date, search_count DESC")
}, uniqueConstraints = {
    @UniqueConstraint(name = "idx_keyword_date", columnNames = {"keyword", "search_date"})
})
public class SearchStats {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "keyword", nullable = false, length = 100)
    private String keyword;
    
    @Column(name = "search_count", nullable = false)
    private Integer searchCount;
    
    @Column(name = "search_date", nullable = false)
    private LocalDate searchDate;
    
    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;
    
    @Column(name = "updated_time", nullable = false)
    private LocalDateTime updatedTime;
    
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.searchCount == null) {
            this.searchCount = 1;
        }
        if (this.searchDate == null) {
            this.searchDate = LocalDate.now();
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
