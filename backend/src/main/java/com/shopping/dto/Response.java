package com.shopping.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 统一API响应包装类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Response<T> implements Serializable {
    private static final long serialVersionUID = 1L;

    // 响应状态码
    private int code;
    // 响应消息
    private String message;
    // 是否成功
    private boolean success;
    // 响应数据
    private T data;

    /**
     * 成功响应，不带数据
     */
    public static <T> Response<T> success() {
        return new Response<>(200, "Success", true, null);
    }

    /**
     * 成功响应，带数据
     */
    public static <T> Response<T> success(T data) {
        return new Response<>(200, "Success", true, data);
    }

    /**
     * 成功响应，自定义消息
     */
    public static <T> Response<T> success(String message) {
        return new Response<>(200, message, true, null);
    }

    /**
     * 成功响应，自定义消息和数据
     */
    public static <T> Response<T> success(String message, T data) {
        return new Response<>(200, message, true, data);
    }

    /**
     * 失败响应
     */
    public static <T> Response<T> fail(int code, String message) {
        return new Response<>(code, message, false, null);
    }

    /**
     * 失败响应，默认500错误码
     */
    public static <T> Response<T> fail(String message) {
        return new Response<>(500, message, false, null);
    }

    /**
     * 失败响应，带数据
     */
    public static <T> Response<T> fail(int code, String message, T data) {
        return new Response<>(code, message, false, data);
    }
}