package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Music;
import com.shopping.exception.ValidationException;
import com.shopping.service.MediaGovernanceService;
import com.shopping.service.MusicService;
import com.shopping.utils.AdminUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * 音乐控制器
 */
@RestController
@RequestMapping("/music")
public class MusicController {

    private static final Logger log = LoggerFactory.getLogger(MusicController.class);
    
    @Autowired
    private MusicService musicService;

    @Autowired
    private MediaGovernanceService mediaGovernanceService;
    
    /**
     * 获取所有启用的音乐(前台播放器用)
     */
    @GetMapping("/enabled")
    public Response<List<Music>> getEnabledMusic() {
        return Response.success(musicService.getEnabledMusic());
    }
    
    /**
     * 【管理员】获取所有音乐(管理后台用)
     */
    @GetMapping
    public Response<List<Music>> getAllMusic() {
        AdminUtils.requireAdmin();
        return Response.success(musicService.getAllMusic());
    }
    
    /**
     * 【管理员】上传音乐文件
     */
    @PostMapping("/upload")
    public Response<String> uploadMusic(@RequestParam("file") MultipartFile file) {
        AdminUtils.requireAdmin();
        if (file.isEmpty()) {
            return Response.fail(400, "请选择文件");
        }
        try {
            var stored = mediaGovernanceService.storeMultipartFile(file, MediaGovernanceService.StoredMediaKind.MUSIC_FILE, null);
            return Response.success("上传成功", stored.url());
        } catch (ValidationException e) {
            return Response.fail(400, e.getMessage());
        } catch (IOException e) {
            log.error("上传音乐文件失败: filename={}", file.getOriginalFilename(), e);
            return Response.fail(500, "上传失败");
        }
    }
    
    /**
     * 【管理员】上传封面图片
     */
    @PostMapping("/upload-cover")
    public Response<String> uploadCover(@RequestParam("file") MultipartFile file) {
        AdminUtils.requireAdmin();
        if (file.isEmpty()) {
            return Response.fail(400, "请选择文件");
        }
        
        try {
            var stored = mediaGovernanceService.storeMultipartFile(file, MediaGovernanceService.StoredMediaKind.MUSIC_COVER, null);
            return Response.success("上传成功", stored.url());
        } catch (ValidationException e) {
            return Response.fail(400, e.getMessage());
        } catch (IOException e) {
            log.error("上传音乐封面失败: filename={}", file.getOriginalFilename(), e);
            return Response.fail(500, "上传失败");
        }
    }
    
    /**
     * 【管理员】添加音乐
     */
    @PostMapping
    public Response<Music> addMusic(@RequestBody Music music) {
        AdminUtils.requireAdmin();
        return Response.success("添加成功", musicService.saveMusic(music));
    }
    
    /**
     * 【管理员】更新音乐
     */
    @PutMapping("/{id}")
    public Response<Music> updateMusic(@PathVariable Long id, @RequestBody Music music) {
        AdminUtils.requireAdmin();
        music.setId(id);
        return Response.success("更新成功", musicService.saveMusic(music));
    }
    
    /**
     * 【管理员】删除音乐
     */
    @DeleteMapping("/{id}")
    public Response<String> deleteMusic(@PathVariable Long id) {
        AdminUtils.requireAdmin();
        musicService.deleteMusic(id);
        return Response.success("删除成功");
    }
    
    /**
     * 【管理员】更新音乐状态
     */
    @PutMapping("/{id}/status")
    public Response<String> updateStatus(@PathVariable Long id, @RequestBody java.util.Map<String, Integer> body) {
        AdminUtils.requireAdmin();
        musicService.updateStatus(id, body.get("status"));
        return Response.success("状态更新成功");
    }
}
