package com.shopping.service;

import com.shopping.entity.Music;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.MusicRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MusicServiceValidationTest {

    @Mock
    private MusicRepository musicRepository;
    @Mock
    private MediaGovernanceService mediaGovernanceService;

    @InjectMocks
    private MusicService musicService;

    @Test
    void saveMusic_shouldDefaultStatusAndSortOrder() {
        Music music = new Music();
        music.setTitle("track");
        music.setUrl("/uploads/music/2026/05/a.mp3");

        when(musicRepository.save(any(Music.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Music saved = musicService.saveMusic(music);

        assertEquals(0, saved.getSortOrder());
        assertEquals(1, saved.getStatus());
    }

    @Test
    void updateStatus_shouldRejectInvalidStatus() {
        ValidationException error = assertThrows(ValidationException.class, () -> musicService.updateStatus(1L, 9));
        assertEquals("Validation failed for field 'status': 音乐状态无效", error.getMessage());
    }

    @Test
    void deleteMusic_shouldRejectMissingRecord() {
        when(musicRepository.existsById(99L)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, () -> musicService.deleteMusic(99L));
    }

    @Test
    void updateStatus_shouldPersistOnExistingMusic() {
        Music music = new Music();
        music.setId(1L);
        music.setTitle("track");
        music.setUrl("/uploads/music/2026/05/a.mp3");
        when(musicRepository.findById(1L)).thenReturn(Optional.of(music));
        when(musicRepository.save(any(Music.class))).thenAnswer(invocation -> invocation.getArgument(0));

        musicService.updateStatus(1L, 0);

        assertEquals(0, music.getStatus());
    }
}
