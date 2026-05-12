package com.shopping.controller;

import com.shopping.entity.Music;
import com.shopping.handler.GlobalExceptionHandler;
import com.shopping.service.MusicService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MusicControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MusicService musicService;

    @InjectMocks
    private MusicController musicController;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.standaloneSetup(musicController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        setPrivateField(musicController, "uploadDir", "C:\\tmp\\music-controller-test");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getEnabledMusic_ShouldReturnMusicList() throws Exception {
        Music music = new Music();
        music.setId(1L);
        music.setTitle("bgm");
        when(musicService.getEnabledMusic()).thenReturn(List.of(music));

        mockMvc.perform(get("/music/enabled"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].title").value("bgm"));
    }

    @Test
    void getAllMusic_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/music"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("需要管理员权限"));
    }

    @Test
    void getAllMusic_WhenAdmin_ShouldReturnMusicList() throws Exception {
        setAdminUser();

        Music music = new Music();
        music.setId(2L);
        music.setTitle("admin-bgm");
        when(musicService.getAllMusic()).thenReturn(List.of(music));

        mockMvc.perform(get("/music"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].id").value(2))
                .andExpect(jsonPath("$.data[0].title").value("admin-bgm"));
    }

    @Test
    void uploadMusic_WhenFilenameHasNoExtension_ShouldReturn400() throws Exception {
        setAdminUser();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "track",
                "audio/mpeg",
                "demo".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/music/upload").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("文件类型无效"));
    }

    @Test
    void uploadMusic_WhenFileTypeInvalid_ShouldReturn400() throws Exception {
        setAdminUser();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "track.txt",
                "text/plain",
                "demo".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/music/upload").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("仅支持 mp3、wav、ogg、m4a 格式"));
    }

    @Test
    void uploadCover_WhenFileTypeInvalid_ShouldReturn400() throws Exception {
        setAdminUser();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cover.gif",
                "image/gif",
                "demo".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/music/upload-cover").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("仅支持 jpg、jpeg、png、webp 格式"));
    }

    @Test
    void uploadCover_WhenTransferFails_ShouldReturnGeneric500Message() {
        setAdminUser();

        MultipartFile file = new MultipartFile() {
            @Override
            public String getName() {
                return "file";
            }

            @Override
            public String getOriginalFilename() {
                return "cover.png";
            }

            @Override
            public String getContentType() {
                return "image/png";
            }

            @Override
            public boolean isEmpty() {
                return false;
            }

            @Override
            public long getSize() {
                return 4;
            }

            @Override
            public byte[] getBytes() {
                return "demo".getBytes(StandardCharsets.UTF_8);
            }

            @Override
            public InputStream getInputStream() {
                return InputStream.nullInputStream();
            }

            @Override
            public void transferTo(File dest) throws IOException {
                throw new IOException("disk full");
            }
        };

        var response = musicController.uploadCover(file);
        org.junit.jupiter.api.Assertions.assertEquals(500, response.getCode());
        org.junit.jupiter.api.Assertions.assertEquals("上传失败", response.getMessage());
    }

    @Test
    void addMusic_WhenAdmin_ShouldPersistMusic() throws Exception {
        setAdminUser();

        Music saved = new Music();
        saved.setId(10L);
        saved.setTitle("new track");
        when(musicService.saveMusic(any(Music.class))).thenReturn(saved);

        mockMvc.perform(post("/music")
                        .contentType(APPLICATION_JSON)
                        .content("{\"title\":\"new track\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("添加成功"))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.title").value("new track"));

        verify(musicService).saveMusic(any(Music.class));
    }

    @Test
    void updateMusic_WhenAdmin_ShouldBindPathId() throws Exception {
        setAdminUser();

        Music saved = new Music();
        saved.setId(11L);
        saved.setTitle("updated");
        when(musicService.saveMusic(any(Music.class))).thenReturn(saved);

        mockMvc.perform(put("/music/11")
                        .contentType(APPLICATION_JSON)
                        .content("{\"title\":\"updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("更新成功"))
                .andExpect(jsonPath("$.data.id").value(11))
                .andExpect(jsonPath("$.data.title").value("updated"));

        verify(musicService).saveMusic(any(Music.class));
    }

    @Test
    void deleteMusic_WhenAdmin_ShouldReturnSuccess() throws Exception {
        setAdminUser();

        mockMvc.perform(delete("/music/12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("删除成功"));

        verify(musicService).deleteMusic(12L);
    }

    @Test
    void updateStatus_WhenAdmin_ShouldPassStatusToService() throws Exception {
        setAdminUser();

        mockMvc.perform(put("/music/13/status")
                        .contentType(APPLICATION_JSON)
                        .content("{\"status\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("状态更新成功"));

        verify(musicService).updateStatus(13L, 1);
    }

    private void setAdminUser() {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken("admin", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private void setPrivateField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
