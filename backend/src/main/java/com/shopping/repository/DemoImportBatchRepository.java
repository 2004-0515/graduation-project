package com.shopping.repository;

import com.shopping.entity.DemoImportBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DemoImportBatchRepository extends JpaRepository<DemoImportBatch, Long> {
    Optional<DemoImportBatch> findByBatchId(String batchId);
}
