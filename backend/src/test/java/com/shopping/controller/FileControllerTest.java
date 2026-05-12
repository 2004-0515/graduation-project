package com.shopping.controller;

import com.shopping.entity.UploadFile;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.service.NotificationService;
import com.shopping.service.ProductService;
import com.shopping.service.UploadFileService;
import com.shopping.service.UserService;
import com.shopping.handler.GlobalExceptionHandler;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class FileControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private UploadFileService uploadFileService;
    @Mock
    private ProductService productService;

    @InjectMocks
    private FileController fileController;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.standaloneSetup(fileController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        Path tempUploadDir = Files.createTempDirectory("file-controller-test");
        ReflectionTestUtils.setField(fileController, "uploadDir", tempUploadDir.toString());
    }

    @AfterEach
    void tearDown() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    void reviewFile_WhenAnonymous_ShouldReturn401BusinessError() throws Exception {
        mockMvc.perform(put("/files/1/review")
                        .contentType(APPLICATION_JSON)
                        .content("{\"status\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("需要管理员权限"));
    }

    @Test
    void uploadAdVideo_WhenAnonymous_ShouldReturn401() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "demo.mp4",
                "video/mp4",
                "demo".getBytes()
        );

        mockMvc.perform(multipart("/files/ad-video").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未登录"));
    }

    @Test
    void uploadAdVideo_WhenAuthenticatedUserMissing_ShouldReturn401() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken("ghost", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        when(userService.findByUsername("ghost")).thenReturn(null);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "demo.mp4",
                "video/mp4",
                "demo".getBytes()
        );

        mockMvc.perform(multipart("/files/ad-video").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未登录"));
    }

    @Test
    void deleteFile_WhenMissing_ShouldReturn404() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken("admin", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        when(uploadFileService.findById(9L)).thenReturn(null);

        mockMvc.perform(delete("/files/9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("文件不存在"));
    }

    @Test
    void deleteFile_WhenRecordExists_ShouldDeleteDatabaseRecord() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken("admin", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        UploadFile file = new UploadFile();
        file.setId(8L);
        file.setFilePath(null);
        when(uploadFileService.findById(8L)).thenReturn(file);

        mockMvc.perform(delete("/files/8"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("删除成功"));

        verify(uploadFileService).delete(8L);
    }

    @Test
    void reviewFile_WhenNotificationFails_ShouldStillSucceed() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken("admin", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        User reviewer = new User();
        reviewer.setId(1L);
        reviewer.setUsername("admin");
        when(userService.findByUsername("admin")).thenReturn(reviewer);

        UploadFile file = new UploadFile();
        file.setId(7L);
        file.setFileType("REVIEW");
        file.setUserId(12L);
        when(uploadFileService.review(7L, 1, "审核通过", reviewer)).thenReturn(file);

        doThrow(new RuntimeException("notify failed"))
                .when(notificationService)
                .createNotification(any(), any(), any(), any(), any());

        mockMvc.perform(put("/files/7/review")
                        .contentType(APPLICATION_JSON)
                        .content("{\"status\":1,\"remark\":\"审核通过\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("审核通过"))
                .andExpect(jsonPath("$.data.id").value(7));
    }

    @Test
    void reviewFile_WhenAvatarSideEffectFails_ShouldStillSucceed() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken("admin", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        User reviewer = new User();
        reviewer.setId(1L);
        reviewer.setUsername("admin");
        when(userService.findByUsername("admin")).thenReturn(reviewer);

        UploadFile file = new UploadFile();
        file.setId(15L);
        file.setFileType("AVATAR");
        file.setUserId(20L);
        file.setFilePath("/uploads/avatars/2026/05/demo.png");
        when(uploadFileService.review(15L, 1, "审核通过", reviewer)).thenReturn(file);

        doThrow(new RuntimeException("save failed"))
                .when(userService)
                .saveUser(any(User.class));
        when(userService.findById(20L)).thenReturn(new User());

        mockMvc.perform(put("/files/15/review")
                        .contentType(APPLICATION_JSON)
                        .content("{\"status\":1,\"remark\":\"审核通过\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("审核通过"))
                .andExpect(jsonPath("$.data.id").value(15));

        verify(uploadFileService).review(15L, 1, "审核通过", reviewer);
    }

    @Test
    void uploadReviewImage_WhenAdminNotificationFails_ShouldStillSucceed() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken("seller", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        User seller = new User();
        seller.setId(3L);
        seller.setUsername("seller");
        when(userService.findByUsername("seller")).thenReturn(seller);

        User admin = new User();
        admin.setId(1L);
        admin.setUsername("admin");
        when(userService.findByUsername("admin")).thenReturn(admin);

        doThrow(new RuntimeException("notify failed"))
                .when(notificationService)
                .createNotification(eq(1L), eq("file_review"), any(), any(), isNull());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "demo.png",
                "image/png",
                "demo".getBytes()
        );

        mockMvc.perform(multipart("/files/review").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("上传成功，等待管理员审核"));

        verify(uploadFileService).save(any(UploadFile.class));
    }

    @Test
    void uploadProductImage_WhenAdminProductUpdateFails_ShouldStillSucceed() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken("admin", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        User admin = new User();
        admin.setId(1L);
        admin.setUsername("admin");
        when(userService.findByUsername("admin")).thenReturn(admin);

        Product product = new Product();
        product.setId(8L);
        when(productService.findById(8L)).thenReturn(product);
        doThrow(new RuntimeException("save failed"))
                .when(productService)
                .saveProduct(any(Product.class));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "demo.png",
                "image/png",
                "demo".getBytes()
        );

        mockMvc.perform(multipart("/files/product")
                        .file(file)
                        .param("categoryName", "数码")
                        .param("productId", "8"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("上传成功"))
                .andExpect(jsonPath("$.data").isString());
    }
}
