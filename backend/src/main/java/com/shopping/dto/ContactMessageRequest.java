package com.shopping.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 联系我们留言提交请求
 */
public class ContactMessageRequest {

    @NotBlank(message = "姓名不能为空")
    @Size(max = 50, message = "姓名不能超过50个字符")
    private String name;

    @NotBlank(message = "联系方式不能为空")
    @Size(max = 100, message = "联系方式不能超过100个字符")
    private String contact;

    @NotBlank(message = "问题类型不能为空")
    @Size(max = 30, message = "问题类型不能超过30个字符")
    private String type;

    @NotBlank(message = "问题描述不能为空")
    @Size(max = 1000, message = "问题描述不能超过1000个字符")
    private String content;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
