package com.shopping.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_showcase_banner", indexes = {
        @Index(name = "idx_showcase_placement", columnList = "placement"),
        @Index(name = "idx_showcase_status", columnList = "status"),
        @Index(name = "idx_showcase_sort", columnList = "sort_order")
})
public class ShowcaseBanner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "placement", nullable = false, length = 32)
    private String placement;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "subtitle", length = 120)
    private String subtitle;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "badge_text", length = 40)
    private String badgeText;

    @Column(name = "image_path", nullable = false, length = 255)
    private String imagePath;

    @Column(name = "mobile_image_path", length = 255)
    private String mobileImagePath;

    @Column(name = "button_text", length = 40)
    private String buttonText;

    @Column(name = "link_type", length = 32)
    private String linkType;

    @Column(name = "link_target", length = 255)
    private String linkTarget;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "status", nullable = false, columnDefinition = "tinyint default 1")
    private Integer status = 1;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "created_time", nullable = false, updatable = false)
    private LocalDateTime createdTime;

    @Column(name = "updated_time", nullable = false)
    private LocalDateTime updatedTime;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdTime = now;
        updatedTime = now;
        if (sortOrder == null) {
            sortOrder = 0;
        }
        if (status == null) {
            status = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedTime = LocalDateTime.now();
        if (sortOrder == null) {
            sortOrder = 0;
        }
        if (status == null) {
            status = 1;
        }
    }
}
