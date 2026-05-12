package com.shopping.controller;

import com.shopping.dto.ContactMessageRequest;
import com.shopping.dto.Response;
import com.shopping.entity.ContactMessage;
import com.shopping.service.ContactMessageService;
import com.shopping.utils.AdminUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 联系我们留言控制器
 */
@RestController
@RequestMapping("/contact-messages")
@RequiredArgsConstructor
public class ContactMessageController {

    private final ContactMessageService contactMessageService;

    @PostMapping
    public Response<ContactMessage> createMessage(@RequestBody @Valid ContactMessageRequest request) {
        ContactMessage savedMessage = contactMessageService.createMessage(request);
        return Response.success("留言提交成功，我们会尽快回复您", savedMessage);
    }

    @GetMapping("/admin")
    public Response<List<ContactMessage>> getAllMessages() {
        AdminUtils.requireAdmin();
        return Response.success("获取留言列表成功", contactMessageService.getAllMessages());
    }

    @PutMapping("/admin/{id}/status")
    public Response<ContactMessage> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        AdminUtils.requireAdmin();
        ContactMessage updated = contactMessageService.updateStatus(id, body.get("status"));
        return Response.success("留言状态更新成功", updated);
    }

    @DeleteMapping("/admin/{id}")
    public Response<Void> deleteMessage(@PathVariable Long id) {
        AdminUtils.requireAdmin();
        contactMessageService.deleteMessage(id);
        return Response.success("留言删除成功");
    }
}
