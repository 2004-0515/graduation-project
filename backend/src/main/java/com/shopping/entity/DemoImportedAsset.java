package com.shopping.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "demo_imported_asset", uniqueConstraints = {
    @UniqueConstraint(name = "uk_demo_asset_source_hash", columnNames = {"source_url", "content_hash"})
}, indexes = {
    @Index(name = "idx_demo_asset_business", columnList = "business_type,business_id"),
    @Index(name = "idx_demo_asset_batch", columnList = "batch_id"),
    @Index(name = "idx_demo_asset_status", columnList = "status")
})
public class DemoImportedAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_type", nullable = false, length = 30)
    private String assetType;

    @Column(name = "business_type", nullable = false, length = 30)
    private String businessType;

    @Column(name = "business_id")
    private Long businessId;

    @Column(name = "source_platform", nullable = false, length = 50)
    private String sourcePlatform;

    @Column(name = "source_url", nullable = false, length = 1000)
    private String sourceUrl;

    @Column(name = "foreign_landing_url", length = 1000)
    private String foreignLandingUrl;

    @Column(name = "license_code", length = 40)
    private String licenseCode;

    @Column(name = "license_version", length = 20)
    private String licenseVersion;

    @Column(name = "creator_name", length = 200)
    private String creatorName;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "batch_id", nullable = false, length = 64)
    private String batchId;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;

    @Column(name = "updated_time", nullable = false)
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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAssetType() {
        return assetType;
    }

    public void setAssetType(String assetType) {
        this.assetType = assetType;
    }

    public String getBusinessType() {
        return businessType;
    }

    public void setBusinessType(String businessType) {
        this.businessType = businessType;
    }

    public Long getBusinessId() {
        return businessId;
    }

    public void setBusinessId(Long businessId) {
        this.businessId = businessId;
    }

    public String getSourcePlatform() {
        return sourcePlatform;
    }

    public void setSourcePlatform(String sourcePlatform) {
        this.sourcePlatform = sourcePlatform;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public String getForeignLandingUrl() {
        return foreignLandingUrl;
    }

    public void setForeignLandingUrl(String foreignLandingUrl) {
        this.foreignLandingUrl = foreignLandingUrl;
    }

    public String getLicenseCode() {
        return licenseCode;
    }

    public void setLicenseCode(String licenseCode) {
        this.licenseCode = licenseCode;
    }

    public String getLicenseVersion() {
        return licenseVersion;
    }

    public void setLicenseVersion(String licenseVersion) {
        this.licenseVersion = licenseVersion;
    }

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }

    public String getContentHash() {
        return contentHash;
    }

    public void setContentHash(String contentHash) {
        this.contentHash = contentHash;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public LocalDateTime getCreatedTime() {
        return createdTime;
    }

    public void setCreatedTime(LocalDateTime createdTime) {
        this.createdTime = createdTime;
    }

    public LocalDateTime getUpdatedTime() {
        return updatedTime;
    }

    public void setUpdatedTime(LocalDateTime updatedTime) {
        this.updatedTime = updatedTime;
    }
}
