package com.shopping.service;

import com.shopping.entity.ShowcaseBanner;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.ShowcaseBannerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class ShowcaseBannerService {

    private static final Set<String> ALLOWED_PLACEMENTS = Set.of("HOME_HERO", "PROMOTION_HERO", "CATEGORY_SPOTLIGHT");
    private static final Set<String> ALLOWED_LINK_TYPES = Set.of("NONE", "CATEGORY", "PRODUCT", "PROMOTION", "URL", "ROUTE");

    @Autowired
    private ShowcaseBannerRepository showcaseBannerRepository;

    @Autowired
    private MediaGovernanceService mediaGovernanceService;

    public List<ShowcaseBanner> getPublicBanners(String placement) {
        validatePlacement(placement);
        return showcaseBannerRepository.findActiveByPlacement(placement, LocalDateTime.now());
    }

    public List<ShowcaseBanner> getAdminBanners(String placement) {
        if (placement == null || placement.isBlank()) {
            return showcaseBannerRepository.findAllByOrderByPlacementAscSortOrderAscIdAsc();
        }
        validatePlacement(placement);
        return showcaseBannerRepository.findByPlacementOrderBySortOrderAscIdAsc(placement);
    }

    public ShowcaseBanner create(ShowcaseBanner banner) {
        normalize(banner);
        return showcaseBannerRepository.save(banner);
    }

    public ShowcaseBanner update(Long id, ShowcaseBanner payload) {
        ShowcaseBanner banner = showcaseBannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("展示内容", id));
        banner.setPlacement(payload.getPlacement());
        banner.setTitle(payload.getTitle());
        banner.setSubtitle(payload.getSubtitle());
        banner.setDescription(payload.getDescription());
        banner.setBadgeText(payload.getBadgeText());
        banner.setImagePath(payload.getImagePath());
        banner.setMobileImagePath(payload.getMobileImagePath());
        banner.setButtonText(payload.getButtonText());
        banner.setLinkType(payload.getLinkType());
        banner.setLinkTarget(payload.getLinkTarget());
        banner.setSortOrder(payload.getSortOrder());
        banner.setStatus(payload.getStatus());
        banner.setStartTime(payload.getStartTime());
        banner.setEndTime(payload.getEndTime());
        normalize(banner);
        return showcaseBannerRepository.save(banner);
    }

    public void delete(Long id) {
        if (!showcaseBannerRepository.existsById(id)) {
            throw new ResourceNotFoundException("展示内容", id);
        }
        showcaseBannerRepository.deleteById(id);
    }

    private void normalize(ShowcaseBanner banner) {
        if (banner == null) {
            throw new ValidationException("banner", "展示内容不能为空");
        }
        validatePlacement(banner.getPlacement());
        if (banner.getTitle() == null || banner.getTitle().isBlank()) {
            throw new ValidationException("title", "标题不能为空");
        }
        String normalizedLinkType = banner.getLinkType() == null || banner.getLinkType().isBlank()
                ? "NONE"
                : banner.getLinkType().trim().toUpperCase();
        if (!ALLOWED_LINK_TYPES.contains(normalizedLinkType)) {
            throw new ValidationException("linkType", "链接类型不受支持");
        }
        banner.setLinkType(normalizedLinkType);
        banner.setPlacement(banner.getPlacement().trim().toUpperCase());
        banner.setTitle(banner.getTitle().trim());
        banner.setSubtitle(trimToNull(banner.getSubtitle()));
        banner.setDescription(trimToNull(banner.getDescription()));
        banner.setBadgeText(trimToNull(banner.getBadgeText()));
        banner.setButtonText(trimToNull(banner.getButtonText()));
        banner.setLinkTarget(trimToNull(banner.getLinkTarget()));
        if (!"NONE".equals(normalizedLinkType) && (banner.getLinkTarget() == null || banner.getLinkTarget().isBlank())) {
            throw new ValidationException("linkTarget", "链接目标不能为空");
        }
        if (banner.getSortOrder() == null) {
            banner.setSortOrder(0);
        }
        if (banner.getStatus() == null) {
            banner.setStatus(1);
        }
        if (banner.getStartTime() != null && banner.getEndTime() != null && banner.getEndTime().isBefore(banner.getStartTime())) {
            throw new ValidationException("endTime", "结束时间不能早于开始时间");
        }
        mediaGovernanceService.normalizeShowcaseImagePaths(banner);
    }

    private void validatePlacement(String placement) {
        String normalized = placement == null ? "" : placement.trim().toUpperCase();
        if (!ALLOWED_PLACEMENTS.contains(normalized)) {
            throw new ValidationException("placement", "展示位置不受支持");
        }
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
