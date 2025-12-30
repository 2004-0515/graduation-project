package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Music;
import com.shopping.service.MusicService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * 音乐控制器
 */
@RestController
@RequestMapping("/music")
public class MusicController {
    
    @Autowired
    private MusicService musicService;
    
    @Value("${file.upload-dir:../uploads}")
    private String uploadDir;
    
    /**
     * 获取所有启用的音乐(前台播放器用)
     */
    @GetMapping("/enabled")
    public Response<List<Music>> getEnabledMusic() {
        return Response.success(musicService.getEnabledMusic());
    }
    
    /**
     * 获取所有音乐(管理后台用)
     */
    @GetMapping
    public Response<List<Music>> getAllMusic() {
        return Response.success(musicService.getAllMusic());
    }
    
    /**
     * 上传音乐文件
     */
    @PostMapping("/upload")
    public Response<String> uploadMusic(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Response.fail(400, "请选择文件");
        }
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return Response.fail(400, "文件名无效");
        }
        
        // 检查文件类型
        String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        if (!ext.equals(".mp3") && !ext.equals(".wav") && !ext.equals(".ogg") && !ext.equals(".m4a")) {
            return Response.fail(400, "仅支持 mp3、wav、ogg、m4a 格式");
        }
        
        try {
            // 获取绝对路径
            Path basePath = Paths.get(uploadDir).toAbsolutePath().normalize();
            
            // 按日期创建子目录
            String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
            String relativePath = "music/" + datePath;
            Path dirPath = basePath.resolve(relativePath);
            
            // 创建目录
            Files.createDirectories(dirPath);
            
            // 生成唯一文件名
            String newFilename = UUID.randomUUID().toString() + ext;
            Path destPath = dirPath.resolve(newFilename);
            
            // 保存文件
            file.transferTo(destPath.toFile());
            
            // 返回访问路径
            String url = "/uploads/" + relativePath + "/" + newFilename;
            return Response.success("上传成功", url);
        } catch (IOException e) {
            e.printStackTrace();
            return Response.fail(500, "上传失败: " + e.getMessage());
        }
    }
    
    /**
     * 上传封面图片
     */
    @PostMapping("/upload-cover")
    public Response<String> uploadCover(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Response.fail(400, "请选择文件");
        }
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return Response.fail(400, "文件名无效");
        }
        
        String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        if (!ext.equals(".jpg") && !ext.equals(".jpeg") && !ext.equals(".png") && !ext.equals(".webp")) {
            return Response.fail(400, "仅支持 jpg、png、webp 格式");
        }
        
        try {
            Path basePath = Paths.get(uploadDir).toAbsolutePath().normalize();
            String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
            String relativePath = "music/covers/" + datePath;
            Path dirPath = basePath.resolve(relativePath);
            
            Files.createDirectories(dirPath);
            
            String newFilename = UUID.randomUUID().toString() + ext;
            Path destPath = dirPath.resolve(newFilename);
            
            file.transferTo(destPath.toFile());
            
            String url = "/uploads/" + relativePath + "/" + newFilename;
            return Response.success("上传成功", url);
        } catch (IOException e) {
            e.printStackTrace();
            return Response.fail(500, "上传失败: " + e.getMessage());
        }
    }
    
    /**
     * 添加音乐
     */
    @PostMapping
    public Response<Music> addMusic(@RequestBody Music music) {
        return Response.success("添加成功", musicService.saveMusic(music));
    }
    
    /**
     * 更新音乐
     */
    @PutMapping("/{id}")
    public Response<Music> updateMusic(@PathVariable Long id, @RequestBody Music music) {
        music.setId(id);
        return Response.success("更新成功", musicService.saveMusic(music));
    }
    
    /**
     * 删除音乐
     */
    @DeleteMapping("/{id}")
    public Response<String> deleteMusic(@PathVariable Long id) {
        musicService.deleteMusic(id);
        return Response.success("删除成功");
    }
    
    /**
     * 更新音乐状态
     */
    @PutMapping("/{id}/status")
    public Response<String> updateStatus(@PathVariable Long id, @RequestBody java.util.Map<String, Integer> body) {
        musicService.updateStatus(id, body.get("status"));
        return Response.success("状态更新成功");
    }
}
