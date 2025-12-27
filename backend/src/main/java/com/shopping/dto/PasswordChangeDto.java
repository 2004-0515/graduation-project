package com.shopping.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 密码修改请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordChangeDto implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 当前密码
     */
    @NotNull(message = "旧密码不能为空")
    @Size(min = 6, max = 20, message = "旧密码长度必须在6-20个字符之间")
    private String currentPassword;

    /**
     * 新密码
     */
    @NotNull(message = "新密码不能为空")
    @Size(min = 6, max = 20, message = "新密码长度必须在6-20个字符之间")
    @Pattern(regexp = ".*\\d.*", message = "新密码必须包含至少一个数字")
    private String newPassword;

    /**
     * 确认新密码
     */
    @NotNull(message = "确认新密码不能为空")
    private String confirmPassword;
}