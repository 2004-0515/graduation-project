package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.entity.Address;
import com.shopping.entity.User;
import com.shopping.service.AddressService;
import com.shopping.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AddressControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private AddressService addressService;

    @Mock
    private UserService userService;

    @InjectMocks
    private AddressController addressController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(addressController).build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setAuthenticatedUser(String username) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    void getCurrentUserAddresses_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/addresses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证或认证失效"));
    }

    @Test
    void getAddressById_WhenAuthenticatedUserMissing_ShouldReturn401() throws Exception {
        setAuthenticatedUser("ghost");
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(get("/addresses/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证或认证失效"));
    }

    @Test
    void getAddressById_WhenAddressBelongsToAnotherUser_ShouldReturn403() throws Exception {
        setAuthenticatedUser("buyer");

        User currentUser = new User();
        currentUser.setId(1L);
        when(userService.findByUsername("buyer")).thenReturn(currentUser);

        User anotherUser = new User();
        anotherUser.setId(2L);
        Address address = new Address();
        address.setId(8L);
        address.setUser(anotherUser);
        when(addressService.getAddressById(8L)).thenReturn(address);

        mockMvc.perform(get("/addresses/8"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("无权限访问此地址"));
    }

    @Test
    void getAddressById_WhenAddressMissing_ShouldReturn404() throws Exception {
        setAuthenticatedUser("buyer");

        User currentUser = new User();
        currentUser.setId(1L);
        when(userService.findByUsername("buyer")).thenReturn(currentUser);
        when(addressService.getAddressById(9L)).thenReturn(null);

        mockMvc.perform(get("/addresses/9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("地址不存在"));
    }

    @Test
    void createAddress_WhenAuthenticated_ShouldBindCurrentUser() throws Exception {
        setAuthenticatedUser("buyer");

        User currentUser = new User();
        currentUser.setId(1L);
        currentUser.setUsername("buyer");
        when(userService.findByUsername("buyer")).thenReturn(currentUser);
        when(addressService.createAddress(any(Address.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/addresses")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildAddressPayload())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("地址创建成功"))
                .andExpect(jsonPath("$.data.name").value("张三"));

        ArgumentCaptor<Address> captor = ArgumentCaptor.forClass(Address.class);
        verify(addressService).createAddress(captor.capture());
        assertEquals(1L, captor.getValue().getUser().getId());
    }

    private Address buildAddressPayload() {
        Address address = new Address();
        address.setName("张三");
        address.setPhone("13800138000");
        address.setProvince("上海市");
        address.setCity("上海市");
        address.setDistrict("浦东新区");
        address.setDetail("世纪大道100号");
        address.setIsDefault(true);
        return address;
    }
}
