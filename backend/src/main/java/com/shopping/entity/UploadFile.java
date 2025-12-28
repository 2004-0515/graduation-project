package com.shopping.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * 上传文件实体类
 * 用于记录用户上传的文件及其审核状态
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_upload_file")
public class UploadFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 文件类型: AVATAR, PRODUCT, CATEGORY, PROMOTION, REVIEW */
    @Column(name = "file_type", nullable = false, length = 20)
    private String fileType;

    /** 文件路径 */
    @Column(name = "file_path", nullable = false, length = 255)
    private String filePath;

    /** 原始文件名 */
    @Column(name = "original_name", length = 255)
    private String originalName;

    /** 文件大小(字节) */
    @Column(name = "file_size")
    private Long fileSize;

    /** 上传用户ID */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 上传用户名 */
    @Column(name = "username", length = 50)
    private String username;

    /** 审核状态: 0-待审核, 1-已通过, 2-已拒绝 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint default 0")
    private Integer status = 0;

    /** 审核人ID */
    @Column(name = "reviewer_id")
    private Long reviewerId;

    /** 审核人用户名 */
    @Column(name = "reviewer_name", length = 50)
    private String reviewerName;

    /** 审核时间 */
    @Column(name = "review_time")
    private LocalDateTime reviewTime;

    /** 审核备注 */
    @Column(name = "review_remark", length = 200)
    private String reviewRemark;

    /** 上传时间 */
    @Column(name = "created_time", nullable = false, updatable = false)
    private LocalDateTime createdTime;

    @PrePersist
    protected void onCreate() {
        this.createdTime = LocalDateTime.now();
        if (this.status == null) {
            this.status = 0;
        }
    }

    // 审核状态常量
    public static final int STATUS_PENDING = 0;
    public static final int STATUS_APPROVED = 1;
    public static final int STATUS_REJECTED = 2;
}
