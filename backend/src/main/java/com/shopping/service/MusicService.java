package com.shopping.service;

import com.shopping.entity.Music;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.MusicRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 音乐服务类
 */
@Service
public class MusicService {
    
    @Autowired
    private MusicRepository musicRepository;

    @Autowired
    private MediaGovernanceService mediaGovernanceService;
    
    public List<Music> getAllMusic() {
        return musicRepository.findAllByOrderBySortOrderAsc();
    }
    
    public List<Music> getEnabledMusic() {
        return musicRepository.findByStatusOrderBySortOrderAsc(1);
    }
    
    public Music getMusicById(Long id) {
        return musicRepository.findById(id).orElse(null);
    }
    
    public Music saveMusic(Music music) {
        validateMusic(music);
        return musicRepository.save(music);
    }
    
    public void deleteMusic(Long id) {
        if (!musicRepository.existsById(id)) {
            throw new ResourceNotFoundException("音乐", id);
        }
        musicRepository.deleteById(id);
    }
    
    public void updateStatus(Long id, Integer status) {
        if (status == null || (status != 0 && status != 1)) {
            throw new ValidationException("status", "音乐状态无效");
        }
        Music music = musicRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("音乐", id));
        music.setStatus(status);
        musicRepository.save(music);
    }

    private void validateMusic(Music music) {
        if (music == null) {
            throw new ValidationException("music", "音乐不能为空");
        }
        if (music.getTitle() == null || music.getTitle().isBlank()) {
            throw new ValidationException("title", "音乐标题不能为空");
        }
        if (music.getSortOrder() == null) {
            music.setSortOrder(0);
        }
        if (music.getStatus() == null) {
            music.setStatus(1);
        }
        if (music.getStatus() != 0 && music.getStatus() != 1) {
            throw new ValidationException("status", "音乐状态无效");
        }
        mediaGovernanceService.normalizeMusicMedia(music);
    }
}
