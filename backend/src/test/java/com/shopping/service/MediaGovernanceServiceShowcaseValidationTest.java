package com.shopping.service;

import com.shopping.entity.ShowcaseBanner;
import com.shopping.exception.ValidationException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MediaGovernanceServiceShowcaseValidationTest {

    private final MediaGovernanceService mediaGovernanceService = new MediaGovernanceService();

    @Test
    void normalizeShowcaseImagePaths_shouldAcceptBannerPathsForHomeHero() {
        ShowcaseBanner banner = new ShowcaseBanner();
        banner.setPlacement("HOME_HERO");
        banner.setImagePath("/uploads/banners/2026/05/home.jpg");
        banner.setMobileImagePath("/uploads/banners/2026/05/home-mobile.jpg");

        mediaGovernanceService.normalizeShowcaseImagePaths(banner);

        assertEquals("/uploads/banners/2026/05/home.jpg", banner.getImagePath());
        assertEquals("/uploads/banners/2026/05/home-mobile.jpg", banner.getMobileImagePath());
    }

    @Test
    void normalizeShowcaseImagePaths_shouldAcceptPromotionPathsForPromotionHero() {
        ShowcaseBanner banner = new ShowcaseBanner();
        banner.setPlacement("PROMOTION_HERO");
        banner.setImagePath("/uploads/promotions/2026/05/promo.jpg");
        banner.setMobileImagePath("/uploads/promotions/2026/05/promo-mobile.jpg");

        mediaGovernanceService.normalizeShowcaseImagePaths(banner);

        assertEquals("/uploads/promotions/2026/05/promo.jpg", banner.getImagePath());
        assertEquals("/uploads/promotions/2026/05/promo-mobile.jpg", banner.getMobileImagePath());
    }

    @Test
    void normalizeShowcaseImagePaths_shouldRejectBannerPathForPromotionHero() {
        ShowcaseBanner banner = new ShowcaseBanner();
        banner.setPlacement("PROMOTION_HERO");
        banner.setImagePath("/uploads/banners/2026/05/wrong.jpg");

        ValidationException error = assertThrows(
                ValidationException.class,
                () -> mediaGovernanceService.normalizeShowcaseImagePaths(banner)
        );

        assertEquals("Validation failed for field 'imagePath': 活动图片路径必须位于 /uploads/promotions 下", error.getMessage());
    }
}
