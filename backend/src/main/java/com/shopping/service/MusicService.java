package com.shopping.service;

import com.shopping.entity.Music;
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
        return musicRepository.save(music);
    }
    
    public void deleteMusic(Long id) {
        musicRepository.deleteById(id);
    }
    
    public void updateStatus(Long id, Integer status) {
        Music music = musicRepository.findById(id).orElse(null);
        if (music != null) {
            music.setStatus(status);
            musicRepository.save(music);
        }
    }
}
