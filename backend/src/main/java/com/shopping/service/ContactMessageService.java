package com.shopping.service;

import com.shopping.dto.ContactMessageRequest;
import com.shopping.entity.ContactMessage;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.ContactMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 联系我们留言服务
 */
@Service
@RequiredArgsConstructor
public class ContactMessageService {

    private final ContactMessageRepository contactMessageRepository;

    @Transactional
    public ContactMessage createMessage(ContactMessageRequest request) {
        ContactMessage message = new ContactMessage();
        message.setName(request.getName().trim());
        message.setContact(request.getContact().trim());
        message.setType(request.getType().trim());
        message.setContent(request.getContent().trim());
        return contactMessageRepository.save(message);
    }

    public List<ContactMessage> getAllMessages() {
        return contactMessageRepository.findAllByOrderByCreatedTimeDesc();
    }

    @Transactional
    public ContactMessage updateStatus(Long id, String status) {
        if (!"pending".equals(status) && !"handled".equals(status)) {
            throw new ValidationException("留言状态无效");
        }

        ContactMessage message = contactMessageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("留言", id));
        message.setStatus(status);
        return contactMessageRepository.save(message);
    }

    @Transactional
    public void deleteMessage(Long id) {
        if (!contactMessageRepository.existsById(id)) {
            throw new ResourceNotFoundException("留言", id);
        }
        contactMessageRepository.deleteById(id);
    }
}
