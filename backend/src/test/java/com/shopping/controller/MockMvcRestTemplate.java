package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

class MockMvcRestTemplate {

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;

    MockMvcRestTemplate(MockMvc mockMvc, ObjectMapper objectMapper) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
    }

    <T> ResponseEntity<T> exchange(String url, HttpMethod method, HttpEntity<?> requestEntity, Class<T> responseType)
            throws Exception {
        return execute(url, method, requestEntity, responseType);
    }

    <T> ResponseEntity<T> postForEntity(String url, HttpEntity<?> requestEntity, Class<T> responseType)
            throws Exception {
        return execute(url, HttpMethod.POST, requestEntity, responseType);
    }

    private <T> ResponseEntity<T> execute(String url, HttpMethod method, HttpEntity<?> requestEntity, Class<T> responseType)
            throws Exception {
        MockHttpServletRequestBuilder builder = builderFor(url, method);
        HttpHeaders headers = requestEntity != null ? requestEntity.getHeaders() : HttpHeaders.EMPTY;
        headers.forEach((name, values) -> values.forEach(value -> builder.header(name, value)));

        Object body = requestEntity != null ? requestEntity.getBody() : null;
        if (body != null) {
            builder.contentType(headers.getContentType() != null ? headers.getContentType() : MediaType.APPLICATION_JSON);
            builder.content(objectMapper.writeValueAsBytes(body));
        }

        MvcResult result = mockMvc.perform(builder).andReturn();
        String content = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        T responseBody = content == null || content.isBlank() ? null : objectMapper.readValue(content, responseType);
        return ResponseEntity.status(result.getResponse().getStatus()).body(responseBody);
    }

    private MockHttpServletRequestBuilder builderFor(String url, HttpMethod method) {
        if (HttpMethod.GET.equals(method)) {
            return get(url);
        }
        if (HttpMethod.POST.equals(method)) {
            return post(url);
        }
        if (HttpMethod.PUT.equals(method)) {
            return put(url);
        }
        if (HttpMethod.DELETE.equals(method)) {
            return delete(url);
        }
        throw new IllegalArgumentException("Unsupported method: " + method);
    }
}
