package com.shopping.repository;

import com.shopping.entity.UploadFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UploadFileRepository extends JpaRepository<UploadFile, Long> {
    
    /** 根据状态查询 */
    Page<UploadFile> findByStatus(Integer status, Pageable pageable);
    
    /** 根据文件类型查询 */
    Page<UploadFile> findByFileType(String fileType, Pageable pageable);
    
    /** 根据状态和文件类型查询 */
    Page<UploadFile> findByStatusAndFileType(Integer status, String fileType, Pageable pageable);
    
    /** 根据用户ID查询 */
    List<UploadFile> findByUserId(Long userId);
    
    /** 根据用户ID和状态查询 */
    List<UploadFile> findByUserIdAndStatus(Long userId, Integer status);
    
    /** 统计待审核数量 */
    long countByStatus(Integer status);
}
