package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Product;
import com.shopping.entity.UploadFile;
import com.shopping.entity.User;
import com.shopping.service.NotificationService;
import com.shopping.service.ProductService;
import com.shopping.service.UploadFileService;
import com.shopping.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

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

    /**
     * 文件类型枚举
     */
    private enum FileType {
        AVATAR("avatars", 2, true),           // 头像，最大2MB，需审核
        PRODUCT("products", 5, true),         // 商品图片，最大5MB，需审核
        CATEGORY("categories", 2, false),     // 分类图片，最大2MB，管理员直接通过
        PROMOTION("promotions", 5, false),    // 促销图片，最大5MB，管理员直接通过
        REVIEW("reviews", 10, true);          // 评价图片，最大10MB，需审核

        private final String folder;
        private final int maxSizeMB;
        private final boolean needReview;

        FileType(String folder, int maxSizeMB, boolean needReview) {
            this.folder = folder;
            this.maxSizeMB = maxSizeMB;
            this.needReview = needReview;
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
            // 获取当前用户
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return Response.fail(401, "用户未登录");
            }

            // 按年月存储
            String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
            Path uploadPath = Paths.get(uploadDir, "videos", datePath);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            }
            String newFilename = UUID.randomUUID().toString() + extension;

            // 保存文件
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath);

            // 生成访问URL
            String fileUrl = "/uploads/videos/" + datePath + "/" + newFilename;

            return Response.success("视频上传成功", fileUrl);
        } catch (IOException e) {
            return Response.fail(500, "视频上传失败: " + e.getMessage());
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

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User reviewer = userService.findByUsername(auth.getName());
        if (reviewer == null) {
            return Response.fail(401, "未登录");
        }

        UploadFile file = uploadFileService.review(id, status, remark, reviewer);
        if (file == null) {
            return Response.fail(404, "文件不存在");
        }

        // 审核通过时，更新关联的头像或商品图片
        if (status == 1) {
            try {
                if ("AVATAR".equals(file.getFileType())) {
                    // 更新用户头像
                    User user = userService.findById(file.getUserId());
                    if (user != null) {
                        System.out.println("更新用户头像: userId=" + user.getId() + ", avatar=" + file.getFilePath());
                        user.setAvatar(file.getFilePath());
                        userService.saveUser(user);
                        System.out.println("用户头像更新成功");
                    } else {
                        System.err.println("未找到用户: userId=" + file.getUserId());
                    }
                } else if ("PRODUCT".equals(file.getFileType()) && file.getRelatedId() != null) {
                    // 更新商品图片
                    Product product = productService.findById(file.getRelatedId());
                    if (product != null) {
                        System.out.println("更新商品图片: productId=" + product.getId() + ", image=" + file.getFilePath());
                        product.setMainImage(file.getFilePath());
                        productService.saveProduct(product);
                        System.out.println("商品图片更新成功");
                    }
                }
            } catch (Exception e) {
                System.err.println("更新关联记录失败: " + e.getMessage());
                e.printStackTrace();
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
            
            notificationService.createNotification(file.getUserId(), "system", title, message, null);
        } catch (Exception e) {
            // 通知发送失败不影响审核结果
            System.err.println("发送审核通知失败: " + e.getMessage());
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
        try {
            UploadFile file = uploadFileService.findById(id);
            if (file == null) {
                return Response.fail(404, "文件不存在");
            }
            
            // 删除物理文件
            String filePath = file.getFilePath();
            if (filePath != null && filePath.startsWith("/uploads/")) {
                Path path = Paths.get(uploadDir, filePath.substring("/uploads/".length()));
                Files.deleteIfExists(path);
            }
            
            // 删除数据库记录
            uploadFileService.delete(id);
            return Response.success("删除成功");
        } catch (Exception e) {
            return Response.fail(500, "删除失败: " + e.getMessage());
        }
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
            // 获取当前用户
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return Response.fail(401, "用户未登录");
            }

            // 判断是否为管理员
            boolean isAdmin = "admin".equals(username);

            // 按类型+年月存储
            String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
            Path uploadPath = Paths.get(uploadDir, fileType.folder, datePath);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            }
            String newFilename = UUID.randomUUID().toString() + extension;

            // 保存文件
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath);

            // 生成访问URL
            String fileUrl = "/uploads/" + fileType.folder + "/" + datePath + "/" + newFilename;

            // 创建上传记录
            UploadFile uploadFile = new UploadFile();
            uploadFile.setFileType(fileType.name());
            uploadFile.setFilePath(fileUrl);
            uploadFile.setOriginalName(originalFilename);
            uploadFile.setFileSize(file.getSize());
            uploadFile.setUserId(user.getId());
            uploadFile.setUsername(username);

            // 管理员上传或不需要审核的类型直接通过
            if (isAdmin || !fileType.needReview) {
                uploadFile.setStatus(UploadFile.STATUS_APPROVED);
                uploadFile.setReviewerId(user.getId());
                uploadFile.setReviewerName(username);
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
                    User admin = userService.findByUsername("admin");
                    if (admin != null) {
                        String title = "新的" + fileTypeName + "待审核";
                        String message = "用户 " + username + " 上传了新的" + fileTypeName + "，请及时审核。";
                        notificationService.createNotification(admin.getId(), "file_review", title, message, null);
                    }
                } catch (Exception e) {
                    // 通知发送失败不影响上传
                    System.err.println("发送审核通知给管理员失败: " + e.getMessage());
                }
            }

            uploadFileService.save(uploadFile);

            String message = (isAdmin || !fileType.needReview) ? "上传成功" : "上传成功，等待管理员审核";
            return Response.success(message, fileUrl);
        } catch (IOException e) {
            return Response.fail(500, "文件上传失败: " + e.getMessage());
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
            // 获取当前用户
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return Response.fail(401, "用户未登录");
            }

            // 判断是否为管理员
            boolean isAdmin = "admin".equals(username);

            // 年月路径
            String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
            
            // 确定存储路径：分类名/年月 或 其他/年月
            String categoryFolder = (categoryName != null && !categoryName.trim().isEmpty()) 
                ? sanitizeFolderName(categoryName) 
                : "其他";
            
            Path uploadPath = Paths.get(uploadDir, "products", categoryFolder, datePath);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            }
            String newFilename = UUID.randomUUID().toString() + extension;

            // 保存文件
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath);

            // 生成访问URL
            String fileUrl = "/uploads/products/" + categoryFolder + "/" + datePath + "/" + newFilename;

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
                } catch (Exception e) {
                    System.err.println("更新商品图片失败: " + e.getMessage());
                }
            }

            return Response.success("上传成功", fileUrl);
        } catch (IOException e) {
            return Response.fail(500, "文件上传失败: " + e.getMessage());
        }
    }
    
    /**
     * 将分类名转换为安全的文件夹名
     */
    private String sanitizeFolderName(String name) {
        if (name == null) return "other";
        // 移除特殊字符，只保留中文、字母、数字
        String sanitized = name.trim()
                .replaceAll("[\\\\/:*?\"<>|]", "")  // 移除Windows不允许的字符
                .replaceAll("\\s+", "_");           // 空格替换为下划线
        return sanitized.isEmpty() ? "other" : sanitized;
    }
}
