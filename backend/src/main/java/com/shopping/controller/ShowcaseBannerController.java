package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.ShowcaseBanner;
import com.shopping.service.ShowcaseBannerService;
import com.shopping.utils.AdminUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ShowcaseBannerController {

    @Autowired
    private ShowcaseBannerService showcaseBannerService;

    @GetMapping("/content/banners")
    public Response<List<ShowcaseBanner>> getPublicBanners(@RequestParam String placement) {
        return Response.success(showcaseBannerService.getPublicBanners(placement));
    }

    @GetMapping("/admin/content/banners")
    public Response<List<ShowcaseBanner>> getAdminBanners(@RequestParam(required = false) String placement) {
        AdminUtils.requireAdmin();
        return Response.success(showcaseBannerService.getAdminBanners(placement));
    }

    @PostMapping("/admin/content/banners")
    public Response<ShowcaseBanner> createBanner(@RequestBody ShowcaseBanner banner) {
        AdminUtils.requireAdmin();
        return Response.success("创建成功", showcaseBannerService.create(banner));
    }

    @PutMapping("/admin/content/banners/{id}")
    public Response<ShowcaseBanner> updateBanner(@PathVariable Long id, @RequestBody ShowcaseBanner banner) {
        AdminUtils.requireAdmin();
        return Response.success("更新成功", showcaseBannerService.update(id, banner));
    }

    @DeleteMapping("/admin/content/banners/{id}")
    public Response<Void> deleteBanner(@PathVariable Long id) {
        AdminUtils.requireAdmin();
        showcaseBannerService.delete(id);
        return Response.success("删除成功");
    }
}
