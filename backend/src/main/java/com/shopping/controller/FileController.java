package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Product;
import com.shopping.entity.UploadFile;
import com.shopping.entity.User;
import com.shopping.exception.BusinessException;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.service.MediaGovernanceService;
import com.shopping.service.NotificationService;
import com.shopping.service.ProductService;
import com.shopping.service.UploadFileService;
import com.shopping.service.UserService;
import com.shopping.utils.AdminUtils;
import com.shopping.utils.RoleUtils;
import com.shopping.utils.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Optional;

/**
 * 文件上传控制器
 * 
 * 文件存储结构（类型/分类 + 年月）:
 * uploads/
 * ├── avatars/2025/01/           # 用户头像（按年月）
 * ├── products/                   # 商品图片（按分类+年月）
 * │   └── {分类名}/2025/01/
 * ├── categories/2025/01/         # 分类图片（按年月）
 * ├── promotions/2025/01/         # 促销活动图片（按年月）
 * ├── banners/2025/01/            # 轮播图（按年月）
 * └── reviews/2025/01/            # 评价图片（按年月）
 */
@RestController
@RequestMapping("/files")
public class FileController {

    private static final Logger log = LoggerFactory.getLogger(FileController.class);

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Autowired
    private UserService userService;
    
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UploadFileService uploadFileService;
    
    @Autowired
    private ProductService productService;

    @Autowired
    private MediaGovernanceService mediaGovernanceService;

    private Path getUploadBasePath() {
        return Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    private Optional<User> getCurrentUser() {
        Optional<String> username = getCurrentUsernameIfAuthenticated();
        if (username.isEmpty()) {
            return Optional.empty();
        }
        return Optional.ofNullable(userService.findByUsername(username.get()));
    }

    /**
     * 文件类型枚举
     */
    private enum FileType {
        AVATAR("avatars", 2, true, MediaGovernanceService.StoredMediaKind.AVATAR_IMAGE),           // 头像，最大2MB，需审核
        PRODUCT("products", 5, true, MediaGovernanceService.StoredMediaKind.PRODUCT_IMAGE),         // 商品图片，最大5MB，需审核
        CATEGORY("categories", 2, false, MediaGovernanceService.StoredMediaKind.CATEGORY_IMAGE),    // 分类图片，最大2MB，管理员直接通过
        BANNER("banners", 5, false, MediaGovernanceService.StoredMediaKind.BANNER_IMAGE),           // 展示图片，最大5MB，管理员直接通过
        PROMOTION("promotions", 5, false, MediaGovernanceService.StoredMediaKind.PROMOTION_IMAGE),  // 促销图片，最大5MB，管理员直接通过
        REVIEW("reviews", 10, true, MediaGovernanceService.StoredMediaKind.REVIEW_IMAGE);           // 评价图片，最大10MB，需审核

        private final String folder;
        private final int maxSizeMB;
        private final boolean needReview;
        private final MediaGovernanceService.StoredMediaKind storedMediaKind;

        FileType(String folder, int maxSizeMB, boolean needReview, MediaGovernanceService.StoredMediaKind storedMediaKind) {
            this.folder = folder;
            this.maxSizeMB = maxSizeMB;
            this.needReview = needReview;
            this.storedMediaKind = storedMediaKind;
        }
    }

    /**
     * 上传用户头像
     */
    @PostMapping("/avatar")
    public Response<String> uploadAvatar(@RequestParam("file") MultipartFile file) {
        return uploadFile(file, FileType.AVATAR);
    }

    /**
     * 上传商品图片
     */
    @PostMapping("/product")
    public Response<String> uploadProductImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String categoryName,
            @RequestParam(required = false) Long productId) {
        return uploadProductFile(file, categoryName, productId);
    }

    /**
     * 上传分类图片
     */
    @PostMapping("/category")
    public Response<String> uploadCategoryImage(@RequestParam("file") MultipartFile file) {
        return uploadFile(file, FileType.CATEGORY);
    }

    /**
     * 上传展示内容图片
     */
    @PostMapping("/banner")
    public Response<String> uploadBannerImage(@RequestParam("file") MultipartFile file) {
        AdminUtils.requireAdmin();
        return uploadFile(file, FileType.BANNER);
    }

    /**
     * 上传促销活动图片
     */
    @PostMapping("/promotion")
    public Response<String> uploadPromotionImage(@RequestParam("file") MultipartFile file) {
        return uploadFile(file, FileType.PROMOTION);
    }

    /**
     * 上传评价图片
     */
    @PostMapping("/review")
    public Response<String> uploadReviewImage(@RequestParam("file") MultipartFile file) {
        return uploadFile(file, FileType.REVIEW);
    }

    /**
     * 上传商品广告视频
     */
    @PostMapping("/ad-video")
    public Response<String> uploadAdVideo(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Response.fail(400, "请选择要上传的视频");
        }

        // 验证文件类型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("video/")) {
            return Response.fail(400, "只能上传视频文件");
        }

        // 验证文件大小 (50MB)
        long maxSize = 50 * 1024L * 1024L;
        if (file.getSize() > maxSize) {
            return Response.fail(400, "视频大小不能超过50MB");
        }

        try {
            Optional<String> username = getCurrentUsernameIfAuthenticated();
            Optional<User> currentUser = getCurrentUser();
            if (username.isEmpty() || currentUser.isEmpty()) {
                return Response.fail(401, "用户未登录");
            }
            User user = currentUser.get();

            var stored = mediaGovernanceService.storeMultipartFile(file, MediaGovernanceService.StoredMediaKind.AD_VIDEO, null);
            return Response.success("视频上传成功", stored.url());
        } catch (ValidationException e) {
            return Response.fail(400, e.getMessage());
        } catch (IOException e) {
            log.error("上传广告视频失败", e);
            return Response.fail(500, "视频上传失败");
        }
    }

    /**
     * 【管理员】获取待审核文件列表
     */
    @GetMapping("/pending")
    public Response<Page<UploadFile>> getPendingFiles(
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String fileType) {
        com.shopping.utils.AdminUtils.requireAdmin();
        Page<UploadFile> files = uploadFileService.findAll(pageNo, pageSize, status, fileType);
        return Response.success(files);
    }

    /**
     * 【管理员】审核文件
     */
    @PutMapping("/{id}/review")
    public Response<UploadFile> reviewFile(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        com.shopping.utils.AdminUtils.requireAdmin();
        Integer status = (Integer) body.get("status");
        String remark = (String) body.get("remark");

        if (status == null || (status != 1 && status != 2)) {
            return Response.fail(400, "审核状态无效");
        }

        Optional<String> username = getCurrentUsernameIfAuthenticated();
        if (username.isEmpty()) {
            return Response.fail(401, "未登录");
        }

        User reviewer = userService.findByUsername(username.get());
        if (reviewer == null) {
            return Response.fail(401, "未登录");
        }

        UploadFile file;
        try {
            file = uploadFileService.review(id, status, remark, reviewer);
        } catch (ResourceNotFoundException ex) {
            return Response.fail(404, "文件不存在");
        }

        // 审核通过时，更新关联的头像或商品图片
        if (status == 1) {
            try {
                if ("AVATAR".equals(file.getFileType())) {
                    // 更新用户头像
                    User user = userService.findById(file.getUserId());
                    if (user != null) {
                        log.info("更新用户头像: userId={}, avatar={}", user.getId(), file.getFilePath());
                        user.setAvatar(file.getFilePath());
                        userService.saveUser(user);
                        log.info("用户头像更新成功: userId={}", user.getId());
                    } else {
                        log.warn("更新头像时未找到用户: userId={}", file.getUserId());
                    }
                } else if ("PRODUCT".equals(file.getFileType()) && file.getRelatedId() != null) {
                    // 更新商品图片
                    Product product = productService.findById(file.getRelatedId());
                    if (product != null) {
                        log.info("更新商品图片: productId={}, image={}", product.getId(), file.getFilePath());
                        product.setMainImage(file.getFilePath());
                        productService.saveProduct(product);
                        log.info("商品图片更新成功: productId={}", product.getId());
                    }
                }
            } catch (RuntimeException e) {
                log.warn("更新关联记录失败: fileId={}, reason={}", file.getId(), e.getMessage());
            }
        }

        // 发送通知给上传者
        try {
            String fileTypeName = getFileTypeName(file.getFileType());
            String title, message;
            
            if (status == 1) {
                title = fileTypeName + "审核通过";
                message = "您上传的" + fileTypeName + "已通过审核，现已生效。";
            } else {
                title = fileTypeName + "审核未通过";
                message = "您上传的" + fileTypeName + "未通过审核。" + 
                         (remark != null && !remark.isEmpty() ? "原因：" + remark : "请重新上传符合要求的图片。");
            }
            
            notificationService.createNotification(file.getUserId(), "file_review", title, message, null);
        } catch (RuntimeException e) {
            // 通知发送失败不影响审核结果
            log.warn("发送审核通知失败: fileId={}, reason={}", file.getId(), e.getMessage());
        }

        return Response.success(status == 1 ? "审核通过" : "已拒绝", file);
    }
    
    /**
     * 获取文件类型的中文名称
     */
    private String getFileTypeName(String fileType) {
        if (fileType == null) return "文件";
        switch (fileType.toUpperCase()) {
            case "AVATAR": return "头像";
            case "PRODUCT": return "商品图片";
            case "CATEGORY": return "分类图片";
            case "BANNER": return "轮播图";
            case "PROMOTION": return "促销图片";
            case "REVIEW": return "评价图片";
            default: return "文件";
        }
    }

    /**
     * 【管理员】获取待审核数量
     */
    @GetMapping("/pending/count")
    public Response<Long> getPendingCount() {
        com.shopping.utils.AdminUtils.requireAdmin();
        return Response.success(uploadFileService.countPending());
    }

    /**
     * 【管理员】删除文件记录
     */
    @DeleteMapping("/{id}")
    public Response<Void> deleteFile(@PathVariable Long id) {
        com.shopping.utils.AdminUtils.requireAdmin();
        UploadFile file = uploadFileService.findById(id);
        if (file == null) {
            return Response.fail(404, "文件不存在");
        }

        deletePhysicalFile(file);
        uploadFileService.delete(id);
        return Response.success("删除成功");
    }

    /**
     * 通用文件上传方法（按类型+年月存储）
     */
    private Response<String> uploadFile(MultipartFile file, FileType fileType) {
        if (file.isEmpty()) {
            return Response.fail(400, "请选择要上传的文件");
        }

        // 验证文件类型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return Response.fail(400, "只能上传图片文件");
        }

        // 验证文件大小
        long maxSize = fileType.maxSizeMB * 1024L * 1024L;
        if (file.getSize() > maxSize) {
            return Response.fail(400, "图片大小不能超过" + fileType.maxSizeMB + "MB");
        }

        try {
            Optional<String> username = getCurrentUsernameIfAuthenticated();
            Optional<User> currentUser = getCurrentUser();
            if (username.isEmpty() || currentUser.isEmpty()) {
                return Response.fail(401, "用户未登录");
            }
            User user = currentUser.get();

            // 判断是否为管理员
            boolean isAdmin = RoleUtils.isCurrentAdmin();
            String originalFilename = file.getOriginalFilename();
            var stored = mediaGovernanceService.storeMultipartFile(file, fileType.storedMediaKind, null);
            String fileUrl = stored.url();

            // 创建上传记录
            UploadFile uploadFile = new UploadFile();
            uploadFile.setFileType(fileType.name());
            uploadFile.setFilePath(fileUrl);
            uploadFile.setOriginalName(originalFilename);
            uploadFile.setFileSize(file.getSize());
            uploadFile.setUserId(user.getId());
            uploadFile.setUsername(username.get());

            // 管理员上传或不需要审核的类型直接通过
            if (isAdmin || !fileType.needReview) {
                uploadFile.setStatus(UploadFile.STATUS_APPROVED);
                uploadFile.setReviewerId(user.getId());
                uploadFile.setReviewerName(username.get());
                uploadFile.setReviewRemark("管理员上传，自动通过");
                
                // 如果是头像，直接更新
                if (fileType == FileType.AVATAR) {
                    user.setAvatar(fileUrl);
                    userService.saveUser(user);
                }
            } else {
                uploadFile.setStatus(UploadFile.STATUS_PENDING);
                
                // 通知管理员有新的待审核文件
                try {
                    String fileTypeName = getFileTypeName(fileType.name());
                    for (User admin : userService.getAdminUsers()) {
                        String title = "新的" + fileTypeName + "待审核";
                        String message = "用户 " + username.get() + " 上传了新的" + fileTypeName + "，请及时审核。";
                        notificationService.createNotification(admin.getId(), "file_review", title, message, null);
                    }
                } catch (RuntimeException e) {
                    // 通知发送失败不影响上传
                    log.warn("发送审核通知给管理员失败: fileType={}, username={}, reason={}",
                            fileType.name(), username.get(), e.getMessage());
                }
            }

            uploadFileService.save(uploadFile);

            String message = (isAdmin || !fileType.needReview) ? "上传成功" : "上传成功，等待管理员审核";
            return Response.success(message, fileUrl);
        } catch (IOException e) {
            log.error("上传文件失败: type={}, originalName={}", fileType.name(), file.getOriginalFilename(), e);
            return Response.fail(500, "文件上传失败");
        } catch (ValidationException e) {
            return Response.fail(400, e.getMessage());
        }
    }

    /**
     * 上传商品图片（按分类+年月存储）
     */
    private Response<String> uploadProductFile(MultipartFile file, String categoryName, Long productId) {
        if (file.isEmpty()) {
            return Response.fail(400, "请选择要上传的文件");
        }

        // 验证文件类型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return Response.fail(400, "只能上传图片文件");
        }

        // 验证文件大小 (5MB)
        long maxSize = 5 * 1024L * 1024L;
        if (file.getSize() > maxSize) {
            return Response.fail(400, "图片大小不能超过5MB");
        }

        try {
            Optional<String> username = getCurrentUsernameIfAuthenticated();
            Optional<User> currentUser = getCurrentUser();
            if (username.isEmpty() || currentUser.isEmpty()) {
                return Response.fail(401, "用户未登录");
            }
            User user = currentUser.get();

            // 判断是否为管理员
            boolean isAdmin = RoleUtils.isCurrentAdmin();

            var stored = mediaGovernanceService.storeMultipartFile(file, MediaGovernanceService.StoredMediaKind.PRODUCT_IMAGE, categoryName);
            String fileUrl = stored.url();

            // 商品图片不需要单独审核，跟随商品审核流程
            // 直接返回URL，不创建审核记录
            
            // 如果是管理员且指定了商品ID，直接更新商品图片
            if (isAdmin && productId != null) {
                try {
                    Product product = productService.findById(productId);
                    if (product != null) {
                        product.setMainImage(fileUrl);
                        productService.saveProduct(product);
                    }
                } catch (RuntimeException e) {
                    log.warn("管理员上传后更新商品图片失败: productId={}, reason={}", productId, e.getMessage());
                }
            }

            return Response.success("上传成功", fileUrl);
        } catch (ValidationException e) {
            return Response.fail(400, e.getMessage());
        } catch (IOException e) {
            log.error("上传商品图片失败: categoryName={}, productId={}, originalName={}",
                    categoryName, productId, file.getOriginalFilename(), e);
            return Response.fail(500, "文件上传失败");
        }
    }

    private void deletePhysicalFile(UploadFile file) {
        String filePath = file.getFilePath();
        if (filePath == null || !filePath.startsWith("/uploads/")) {
            return;
        }
        if (isApprovedMediaInUse(file)) {
            log.info("跳过删除正在使用的媒体文件: fileId={}, fileType={}, filePath={}",
                    file.getId(), file.getFileType(), filePath);
            return;
        }

        try {
            Path path = mediaGovernanceService.resolveAbsoluteUploadPath(filePath);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.error("删除物理文件失败: id={}, filePath={}", file.getId(), filePath, e);
            throw new BusinessException(500, "删除文件失败");
        }
    }

    private boolean isApprovedMediaInUse(UploadFile file) {
        if (file.getStatus() == null || file.getStatus() != UploadFile.STATUS_APPROVED) {
            return false;
        }
        String filePath = file.getFilePath();
        if ("AVATAR".equals(file.getFileType())) {
            return userService.isAvatarPathInUse(filePath);
        }
        if ("PRODUCT".equals(file.getFileType())) {
            return productService.isImagePathInUse(filePath);
        }
        return false;
    }

    private java.util.Optional<String> getCurrentUsernameIfAuthenticated() {
        if (!SecurityUtils.isAuthenticated()) {
            return java.util.Optional.empty();
        }
        return java.util.Optional.ofNullable(SecurityUtils.getCurrentUsername());
    }
}
