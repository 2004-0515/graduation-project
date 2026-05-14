package com.shopping.repository;

import com.shopping.entity.DemoImportedAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DemoImportedAssetRepository extends JpaRepository<DemoImportedAsset, Long> {
    Optional<DemoImportedAsset> findBySourceUrlAndContentHash(String sourceUrl, String contentHash);
    List<DemoImportedAsset> findByBusinessTypeAndBusinessIdOrderByIdAsc(String businessType, Long businessId);
    List<DemoImportedAsset> findByBatchIdOrderByIdAsc(String batchId);
}
