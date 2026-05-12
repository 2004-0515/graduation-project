package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.dto.ContactMessageRequest;
import com.shopping.entity.ContactMessage;
import com.shopping.handler.GlobalExceptionHandler;
import com.shopping.service.ContactMessageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ContactMessageControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ContactMessageService contactMessageService;

    @InjectMocks
    private ContactMessageController contactMessageController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        mockMvc = MockMvcBuilders.standaloneSetup(contactMessageController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .build();
    }

    @Test
    void createMessage_WhenPayloadValid_ShouldPersistAndReturnSuccess() throws Exception {
        ContactMessage saved = new ContactMessage();
        saved.setId(8L);
        saved.setName("张三");
        saved.setContact("13800138000");
        saved.setType("order");
        saved.setContent("订单一直没有更新物流");

        when(contactMessageService.createMessage(any(ContactMessageRequest.class))).thenReturn(saved);

        mockMvc.perform(post("/contact-messages")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("留言提交成功，我们会尽快回复您"))
                .andExpect(jsonPath("$.data.id").value(8))
                .andExpect(jsonPath("$.data.name").value("张三"));

        verify(contactMessageService).createMessage(any(ContactMessageRequest.class));
    }

    @Test
    void createMessage_WhenNameMissing_ShouldReturnValidationMessage() throws Exception {
        ContactMessageRequest request = validRequest();
        request.setName(" ");

        mockMvc.perform(post("/contact-messages")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("姓名不能为空"));
    }

    @Test
    void getAllMessages_WhenNonAdmin_ShouldReturnChineseUnauthorizedMessage() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken("buyer", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        mockMvc.perform(get("/contact-messages/admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("需要管理员权限"));
    }

    @Test
    void getAllMessages_WhenAdmin_ShouldReturnList() throws Exception {
        setAdminAuthentication();
        ContactMessage message = new ContactMessage();
        message.setId(5L);
        message.setName("李四");
        message.setContact("buyer@example.com");
        message.setType("feedback");
        message.setContent("页面建议");

        when(contactMessageService.getAllMessages()).thenReturn(List.of(message));

        mockMvc.perform(get("/contact-messages/admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].id").value(5))
                .andExpect(jsonPath("$.data[0].name").value("李四"));
    }

    @Test
    void updateStatus_WhenAdmin_ShouldReturnUpdatedMessage() throws Exception {
        setAdminAuthentication();
        ContactMessage message = new ContactMessage();
        message.setId(5L);
        message.setStatus("handled");

        when(contactMessageService.updateStatus(5L, "handled")).thenReturn(message);

        mockMvc.perform(put("/contact-messages/admin/5/status")
                        .contentType(APPLICATION_JSON)
                        .content("{\"status\":\"handled\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("留言状态更新成功"))
                .andExpect(jsonPath("$.data.status").value("handled"));
    }

    @Test
    void deleteMessage_WhenAdmin_ShouldReturnSuccess() throws Exception {
        setAdminAuthentication();

        mockMvc.perform(delete("/contact-messages/admin/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("留言删除成功"));
    }

    private void setAdminAuthentication() {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken("admin", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private ContactMessageRequest validRequest() {
        ContactMessageRequest request = new ContactMessageRequest();
        request.setName("张三");
        request.setContact("13800138000");
        request.setType("order");
        request.setContent("订单一直没有更新物流");
        return request;
    }
}
