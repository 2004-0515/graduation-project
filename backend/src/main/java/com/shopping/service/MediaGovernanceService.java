package com.shopping.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.entity.DemoImportedAsset;
import com.shopping.entity.Product;
import com.shopping.exception.ValidationException;
import com.shopping.json.JsonTextArrayCodec;
import com.shopping.repository.DemoImportedAssetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaGovernanceService {

    public enum StoredMediaKind {
        AVATAR_IMAGE,
        PRODUCT_IMAGE,
        CATEGORY_IMAGE,
        PROMOTION_IMAGE,
        BANNER_IMAGE,
        MUSIC_FILE,
        MUSIC_COVER,
        AD_VIDEO,
        REVIEW_IMAGE,
        GENERIC_IMAGE
    }

    public record StoredMedia(String url, Path absolutePath, long size, String sha256) {}

    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};
    private static final Set<String> MUSIC_EXTENSIONS = Set.of(".mp3", ".wav", ".ogg", ".m4a", ".opus");
    private static final Set<String> MUSIC_COVER_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp");
    private static final Set<String> IMAGE_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp");
    private static final Set<String> VIDEO_EXTENSIONS = Set.of(".mp4", ".webm", ".mov");

    @Value("${file.upload-dir:../uploads}")
    private String uploadDir;

    @Autowired
    private DemoImportedAssetRepository importedAssetRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String normalizeImageListJson(Object rawImages) {
        return toJsonArray(normalizeImageList(rawImages), "images");
    }

    public List<String> normalizeImageList(Object rawImages) {
        return normalizeMediaList(rawImages, StoredMediaKind.PRODUCT_IMAGE, "images", "商品图片列表格式无效");
    }

    public String normalizeReviewImageListJson(Object rawImages) {
        List<String> urls = normalizeReviewImageList(rawImages);
        if (urls.size() > 3) {
            throw new ValidationException("images", "评价图片最多上传3张");
        }
        return toJsonArray(urls, "images");
    }

    public List<String> normalizeReviewImageList(Object rawImages) {
        return normalizeMediaList(rawImages, StoredMediaKind.REVIEW_IMAGE, "images", "评价图片列表格式无效");
    }

    public String filterApprovedReviewImagesJson(String rawImages, Set<String> approvedPaths) {
        List<String> filtered = JsonTextArrayCodec.parse(rawImages).stream()
                .map(path -> validateMediaUrl(path, StoredMediaKind.REVIEW_IMAGE))
                .filter(approvedPaths::contains)
                .toList();
        return toJsonArray(filtered, "images");
    }

    public void normalizeProductMedia(Product product) {
        String mainImage = validateOptionalMediaUrl(product.getMainImage(), StoredMediaKind.PRODUCT_IMAGE);
        List<String> images = normalizeImageList(product.getImages());

        if (mainImage != null && !images.contains(mainImage)) {
            List<String> withMainFirst = new ArrayList<>();
            withMainFirst.add(mainImage);
            withMainFirst.addAll(images);
            images = withMainFirst;
        }

        if (mainImage == null && !images.isEmpty()) {
            mainImage = images.get(0);
        }

        if (mainImage != null && images.stream().noneMatch(mainImage::equals)) {
            throw new ValidationException("mainImage", "商品主图必须存在于图片列表中");
        }

        product.setMainImage(mainImage);
        product.setImages(normalizeImageListJson(images));
        product.setAdVideo(validateOptionalMediaUrl(product.getAdVideo(), StoredMediaKind.AD_VIDEO));
    }

    public void normalizeMusicMedia(com.shopping.entity.Music music) {
        music.setUrl(validateMediaUrl(music.getUrl(), StoredMediaKind.MUSIC_FILE));
        music.setCover(validateOptionalMediaUrl(music.getCover(), StoredMediaKind.MUSIC_COVER));
    }

    public void normalizeShowcaseImagePaths(com.shopping.entity.ShowcaseBanner banner) {
        banner.setImagePath(validateMediaUrl(banner.getImagePath(), StoredMediaKind.BANNER_IMAGE));
        banner.setMobileImagePath(validateOptionalMediaUrl(banner.getMobileImagePath(), StoredMediaKind.BANNER_IMAGE));
    }

    public String validateOptionalMediaUrl(String value, StoredMediaKind kind) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return validateMediaUrl(value.trim(), kind);
    }

    public String validateMediaUrl(String value, StoredMediaKind kind) {
        if (value == null || value.isBlank()) {
            throw new ValidationException("media", "媒体路径不能为空");
        }

        if (value.startsWith("data:")) {
            if (kind == StoredMediaKind.MUSIC_FILE || kind == StoredMediaKind.GENERIC_IMAGE) {
                return value;
            }
            throw new ValidationException("media", "该字段不允许 data URL");
        }

        if (value.startsWith("http://") || value.startsWith("https://")) {
            return value;
        }

        String normalized = value.startsWith("/") ? value : "/" + value;
        if (!normalized.startsWith("/uploads/")) {
            throw new ValidationException("media", "媒体路径必须位于 /uploads 下");
        }

        String lowered = normalized.toLowerCase(Locale.ROOT);
        switch (kind) {
            case AVATAR_IMAGE -> {
                if (!lowered.startsWith("/uploads/avatars/")) {
                    throw new ValidationException("avatar", "头像路径必须位于 /uploads/avatars 下");
                }
                ensureAllowedExtension(lowered, IMAGE_EXTENSIONS, "头像图片格式不受支持");
            }
            case PRODUCT_IMAGE -> {
                if (!lowered.startsWith("/uploads/products/")) {
                    throw new ValidationException("mainImage", "商品图片路径必须位于 /uploads/products 下");
                }
                ensureAllowedExtension(lowered, IMAGE_EXTENSIONS, "商品图片格式不受支持");
            }
            case CATEGORY_IMAGE -> {
                if (!lowered.startsWith("/uploads/categories/")) {
                    throw new ValidationException("icon", "分类图片路径必须位于 /uploads/categories 下");
                }
                ensureAllowedExtension(lowered, IMAGE_EXTENSIONS, "分类图片格式不受支持");
            }
            case PROMOTION_IMAGE -> {
                if (!lowered.startsWith("/uploads/promotions/")) {
                    throw new ValidationException("imagePath", "活动图片路径必须位于 /uploads/promotions 下");
                }
                ensureAllowedExtension(lowered, IMAGE_EXTENSIONS, "活动图片格式不受支持");
            }
            case BANNER_IMAGE -> {
                if (!lowered.startsWith("/uploads/banners/")) {
                    throw new ValidationException("imagePath", "展示图片路径必须位于 /uploads/banners 下");
                }
                ensureAllowedExtension(lowered, IMAGE_EXTENSIONS, "展示图片格式不受支持");
            }
            case MUSIC_FILE -> {
                if (!lowered.startsWith("/uploads/music/")) {
                    throw new ValidationException("url", "音乐文件路径必须位于 /uploads/music 下");
                }
                ensureAllowedExtension(lowered, MUSIC_EXTENSIONS, "音乐文件格式不受支持");
            }
            case MUSIC_COVER -> {
                if (!lowered.startsWith("/uploads/music/covers/")) {
                    throw new ValidationException("cover", "音乐封面路径必须位于 /uploads/music/covers 下");
                }
                ensureAllowedExtension(lowered, MUSIC_COVER_EXTENSIONS, "音乐封面格式不受支持");
            }
            case AD_VIDEO -> {
                if (!lowered.startsWith("/uploads/videos/")) {
                    throw new ValidationException("adVideo", "广告视频路径必须位于 /uploads/videos 下");
                }
                ensureAllowedExtension(lowered, VIDEO_EXTENSIONS, "广告视频格式不受支持");
            }
            case REVIEW_IMAGE -> {
                if (!lowered.startsWith("/uploads/reviews/")) {
                    throw new ValidationException("images", "评价图片路径必须位于 /uploads/reviews 下");
                }
                ensureAllowedExtension(lowered, IMAGE_EXTENSIONS, "评价图片格式不受支持");
            }
            case GENERIC_IMAGE -> ensureAllowedExtension(lowered, IMAGE_EXTENSIONS, "图片格式不受支持");
        }

        return normalized;
    }

    public StoredMedia storeMultipartFile(MultipartFile file, StoredMediaKind kind, String categoryName) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = extractExtension(originalFilename);
        validateExtensionForKind(extension, kind);

        Path targetDir = resolveTargetDirectory(kind, categoryName);
        Files.createDirectories(targetDir);

        byte[] bytes = file.getBytes();
        String sha256 = sha256Hex(bytes);
        String newFilename = UUID.randomUUID() + extension;
        Path targetFile = targetDir.resolve(newFilename);
        Files.write(targetFile, bytes);

        String relativePath = buildRelativeUrl(kind, categoryName, targetDir.getFileName() == null ? "" : "");
        String url = toUrl(targetFile);
        return new StoredMedia(url, targetFile, bytes.length, sha256);
    }

    public DemoImportedAsset upsertImportedAsset(DemoImportedAsset asset) {
        return importedAssetRepository
            .findBySourceUrlAndContentHash(asset.getSourceUrl(), asset.getContentHash())
            .map(existing -> {
                existing.setAssetType(asset.getAssetType());
                existing.setBusinessType(asset.getBusinessType());
                existing.setBusinessId(asset.getBusinessId());
                existing.setSourcePlatform(asset.getSourcePlatform());
                existing.setForeignLandingUrl(asset.getForeignLandingUrl());
                existing.setLicenseCode(asset.getLicenseCode());
                existing.setLicenseVersion(asset.getLicenseVersion());
                existing.setCreatorName(asset.getCreatorName());
                existing.setFilePath(asset.getFilePath());
                existing.setFileSize(asset.getFileSize());
                existing.setBatchId(asset.getBatchId());
                existing.setStatus(asset.getStatus());
                existing.setFailureReason(asset.getFailureReason());
                return importedAssetRepository.save(existing);
            })
            .orElseGet(() -> importedAssetRepository.save(asset));
    }

    public Path resolveAbsoluteUploadPath(String relativeUrl) {
        String normalized = validateMediaUrl(relativeUrl, StoredMediaKind.GENERIC_IMAGE);
        return getUploadBasePath().resolve(normalized.substring("/uploads/".length())).normalize();
    }

    public String categoryFolderName(String categoryName) {
        if (categoryName == null || categoryName.isBlank()) {
            return "other";
        }
        String sanitized = categoryName.trim()
            .replaceAll("[\\\\/:*?\"<>|]", "")
            .replaceAll("\\s+", "_");
        return sanitized.isBlank() ? "other" : sanitized;
    }

    private Path getUploadBasePath() {
        return Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    private Path resolveTargetDirectory(StoredMediaKind kind, String categoryName) {
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        Path base = getUploadBasePath();
        return switch (kind) {
            case AVATAR_IMAGE -> base.resolve("avatars").resolve(datePath);
            case PRODUCT_IMAGE -> base.resolve("products").resolve(categoryFolderName(categoryName)).resolve(datePath);
            case CATEGORY_IMAGE -> base.resolve("categories").resolve(datePath);
            case PROMOTION_IMAGE -> base.resolve("promotions").resolve(datePath);
            case BANNER_IMAGE -> base.resolve("banners").resolve(datePath);
            case MUSIC_FILE -> base.resolve("music").resolve(datePath);
            case MUSIC_COVER -> base.resolve("music").resolve("covers").resolve(datePath);
            case AD_VIDEO -> base.resolve("videos").resolve(datePath);
            case REVIEW_IMAGE -> base.resolve("reviews").resolve(datePath);
            case GENERIC_IMAGE -> base.resolve("images").resolve(datePath);
        };
    }

    private String buildRelativeUrl(StoredMediaKind kind, String categoryName, String ignored) {
        return switch (kind) {
            case AVATAR_IMAGE -> "/uploads/avatars/";
            case PRODUCT_IMAGE -> "/uploads/products/" + categoryFolderName(categoryName) + "/";
            case CATEGORY_IMAGE -> "/uploads/categories/";
            case PROMOTION_IMAGE -> "/uploads/promotions/";
            case BANNER_IMAGE -> "/uploads/banners/";
            case MUSIC_FILE -> "/uploads/music/";
            case MUSIC_COVER -> "/uploads/music/covers/";
            case AD_VIDEO -> "/uploads/videos/";
            case REVIEW_IMAGE -> "/uploads/reviews/";
            case GENERIC_IMAGE -> "/uploads/images/";
        };
    }

    private String toUrl(Path absoluteFile) {
        Path base = getUploadBasePath();
        Path relative = base.relativize(absoluteFile.normalize());
        return "/uploads/" + relative.toString().replace('\\', '/');
    }

    private void ensureAllowedExtension(String loweredValue, Set<String> allowedExtensions, String message) {
        boolean valid = allowedExtensions.stream().anyMatch(loweredValue::endsWith);
        if (!valid) {
            throw new ValidationException("media", message);
        }
    }

    private void validateExtensionForKind(String extension, StoredMediaKind kind) {
        Set<String> allowed = switch (kind) {
            case AVATAR_IMAGE, PRODUCT_IMAGE, CATEGORY_IMAGE, PROMOTION_IMAGE, BANNER_IMAGE, REVIEW_IMAGE, GENERIC_IMAGE -> IMAGE_EXTENSIONS;
            case MUSIC_FILE -> MUSIC_EXTENSIONS;
            case MUSIC_COVER -> MUSIC_COVER_EXTENSIONS;
            case AD_VIDEO -> VIDEO_EXTENSIONS;
        };
        if (!allowed.contains(extension)) {
            throw new ValidationException("media", "文件扩展名不受支持");
        }
    }

    private String extractExtension(String filename) {
        if (filename == null) {
            throw new ValidationException("media", "文件名无效");
        }
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex <= 0 || dotIndex == filename.length() - 1) {
            throw new ValidationException("media", "文件扩展名无效");
        }
        return filename.substring(dotIndex).toLowerCase(Locale.ROOT);
    }

    private String sha256Hex(byte[] payload) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(payload));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private List<String> normalizeMediaList(Object rawImages, StoredMediaKind kind, String fieldName, String invalidMessage) {
        if (rawImages == null) {
            return List.of();
        }

        List<String> values = new ArrayList<>();
        if (rawImages instanceof String text) {
            if (text.isBlank()) {
                return List.of();
            }
            String trimmed = text.trim();
            if (trimmed.startsWith("[")) {
                try {
                    List<String> parsed = objectMapper.readValue(trimmed, STRING_LIST_TYPE);
                    for (String item : parsed) {
                        if (item != null && !item.isBlank()) {
                            values.add(item.trim());
                        }
                    }
                } catch (JsonProcessingException e) {
                    throw new ValidationException(fieldName, invalidMessage);
                }
            } else {
                for (String part : trimmed.split(",")) {
                    if (!part.isBlank()) {
                        values.add(part.trim());
                    }
                }
            }
        } else if (rawImages instanceof Iterable<?> iterable) {
            for (Object value : iterable) {
                if (value instanceof String text && !text.isBlank()) {
                    values.add(text.trim());
                }
            }
        } else {
            throw new ValidationException(fieldName, invalidMessage);
        }

        Set<String> deduplicated = new LinkedHashSet<>();
        for (String value : values) {
            deduplicated.add(validateMediaUrl(value, kind));
        }
        return List.copyOf(deduplicated);
    }

    private String toJsonArray(List<String> values, String fieldName) {
        try {
            return objectMapper.writeValueAsString(values);
        } catch (JsonProcessingException e) {
            throw new ValidationException(fieldName, "媒体列表格式无效");
        }
    }
}
