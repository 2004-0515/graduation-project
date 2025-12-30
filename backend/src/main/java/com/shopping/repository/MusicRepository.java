package com.shopping.repository;

import com.shopping.entity.Music;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 音乐仓库接口
 */
@Repository
public interface MusicRepository extends JpaRepository<Music, Long> {
    
    List<Music> findByStatusOrderBySortOrderAsc(Integer status);
    
    List<Music> findAllByOrderBySortOrderAsc();
}
