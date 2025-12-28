package com.shopping.service;

import com.shopping.entity.UploadFile;
import com.shopping.entity.User;
import com.shopping.repository.UploadFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UploadFileService {

    @Autowired
    private UploadFileRepository uploadFileRepository;

    @Autowired
    private UserService userService;

    /**
     * 保存上传文件记录
     */
    public UploadFile save(UploadFile uploadFile) {
        return uploadFileRepository.save(uploadFile);
    }

    /**
     * 根据ID查询
     */
    public UploadFile findById(Long id) {
        return uploadFileRepository.findById(id).orElse(null);
    }

    /**
     * 分页查询文件列表
     */
    public Page<UploadFile> findAll(int pageNo, int pageSize, Integer status, String fileType) {
        Pageable pageable = PageRequest.of(pageNo, pageSize, Sort.by(Sort.Direction.DESC, "createdTime"));
        
        if (status != null && fileType != null && !fileType.isEmpty()) {
            return uploadFileRepository.findByStatusAndFileType(status, fileType, pageable);
        } else if (status != null) {
            return uploadFileRepository.findByStatus(status, pageable);
        } else if (fileType != null && !fileType.isEmpty()) {
            return uploadFileRepository.findByFileType(fileType, pageable);
        }
        return uploadFileRepository.findAll(pageable);
    }

    /**
     * 审核文件
     */
    public UploadFile review(Long id, Integer status, String remark, User reviewer) {
        UploadFile file = uploadFileRepository.findById(id).orElse(null);
        if (file == null) {
            return null;
        }

        file.setStatus(status);
        file.setReviewerId(reviewer.getId());
        file.setReviewerName(reviewer.getUsername());
        file.setReviewTime(LocalDateTime.now());
        file.setReviewRemark(remark);

        // 如果是头像审核通过，更新用户头像
        if (status == UploadFile.STATUS_APPROVED && "AVATAR".equals(file.getFileType())) {
            User user = userService.findByUsername(file.getUsername());
            if (user != null) {
                user.setAvatar(file.getFilePath());
                userService.saveUser(user);
            }
        }

        return uploadFileRepository.save(file);
    }

    /**
     * 统计待审核数量
     */
    public long countPending() {
        return uploadFileRepository.countByStatus(UploadFile.STATUS_PENDING);
    }

    /**
     * 删除文件记录
     */
    public void delete(Long id) {
        uploadFileRepository.deleteById(id);
    }
}
