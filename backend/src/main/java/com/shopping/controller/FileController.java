package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.UploadFile;
import com.shopping.entity.User;
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
 * 文件存储结构:
 * uploads/
 * ├── avatars/          # 用户头像
 * │   └── 2025/01/      # 按年月分类
 * ├── products/         # 商品图片
 * │   └── 2025/01/
 * ├── categories/       # 分类图片
 * │   └── 2025/01/
 * ├── promotions/       # 促销活动图片
 * │   └── 2025/01/
 * └── reviews/          # 评价图片
 *     └── 2025/01/
 */
@RestController
@RequestMapping("/files")
public class FileController {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Autowired
    private UserService userService;

    @Autowired
    private UploadFileService uploadFileService;

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
    public Response<String> uploadProductImage(@RequestParam("file") MultipartFile file) {
        return uploadFile(file, FileType.PRODUCT);
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
     * 【管理员】获取待审核文件列表
     */
    @GetMapping("/pending")
    public Response<Page<UploadFile>> getPendingFiles(
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String fileType) {
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

        return Response.success(status == 1 ? "审核通过" : "已拒绝", file);
    }

    /**
     * 【管理员】获取待审核数量
     */
    @GetMapping("/pending/count")
    public Response<Long> getPendingCount() {
        return Response.success(uploadFileService.countPending());
    }

    /**
     * 【管理员】删除文件记录
     */
    @DeleteMapping("/{id}")
    public Response<Void> deleteFile(@PathVariable Long id) {
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
     * 通用文件上传方法
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

            // 按年月创建子目录
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
            }

            uploadFileService.save(uploadFile);

            String message = (isAdmin || !fileType.needReview) ? "上传成功" : "上传成功，等待管理员审核";
            return Response.success(message, fileUrl);
        } catch (IOException e) {
            return Response.fail(500, "文件上传失败: " + e.getMessage());
        }
    }
}
