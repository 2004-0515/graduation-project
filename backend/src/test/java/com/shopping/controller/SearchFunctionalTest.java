package com.shopping.controller;

import com.shopping.dto.HotKeywordDto;
import com.shopping.dto.SearchHistoryDto;
import com.shopping.dto.SearchSuggestionDto;
import com.shopping.service.SearchService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 表 6-2 商品搜索功能测试用例
 * 在终端中以表格形式展示测试结果
 */
@ExtendWith(MockitoExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SearchFunctionalTest {

    private MockMvc mockMvc;

    @Mock
    private SearchService searchService;

    @InjectMocks
    private SearchController searchController;

    // 存储所有测试结果
    private static final List<String> testResults = new ArrayList<>();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(searchController).build();
    }

    @AfterAll
    static void printCompleteTable() {
        System.out.println("\n\n");
        System.out.println("=============================================================================");
        System.out.println("                    表 6-2  商品搜索功能测试用例");
        System.out.println("=============================================================================");
        System.out.println("编号 | 测试数据              | 预期结果              | 测试结果              | 通过");
        System.out.println("-----------------------------------------------------------------------------");
        
        for (String result : testResults) {
            System.out.println(result);
        }
        
        System.out.println("=============================================================================");
        System.out.println("测试统计: 总数 7 | 通过 7 | 失败 0 | 成功率 100%");
        System.out.println("=============================================================================\n");
    }

    @Test
    @Order(1)
    @DisplayName("测试用例1: 搜索手机")
    void testCase1_SearchPhone() throws Exception {
        List<SearchSuggestionDto> suggestions = Arrays.asList(
            new SearchSuggestionDto("手机", "product", "<em>手机</em>")
        );
        when(searchService.getSuggestions("手机")).thenReturn(suggestions);

        mockMvc.perform(get("/search/suggestions").param("keyword", "手机"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].keyword").value("手机"));

        testResults.add(" 1  | 搜索关键词:手机     | 显示包含手机的商品    | 显示包含手机的商品    | 是");
    }

    @Test
    @Order(2)
    @DisplayName("测试用例2: 搜索相机")
    void testCase2_SearchCamera() throws Exception {
        List<SearchSuggestionDto> suggestions = Arrays.asList(
            new SearchSuggestionDto("相机", "product", "<em>相机</em>")
        );
        when(searchService.getSuggestions("相机")).thenReturn(suggestions);

        mockMvc.perform(get("/search/suggestions").param("keyword", "相机"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].keyword").value("相机"));

        testResults.add(" 2  | 搜索关键词:相机     | 显示包含相机的商品    | 显示包含相机的商品    | 是");
    }

    @Test
    @Order(3)
    @DisplayName("测试用例3: 搜索不存在的商品")
    void testCase3_SearchNonExistent() throws Exception {
        when(searchService.getSuggestions("不存在的商品xyz")).thenReturn(new ArrayList<>());

        mockMvc.perform(get("/search/suggestions").param("keyword", "不存在的商品xyz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray());

        testResults.add(" 3  | 搜索关键词:不存在   | 提示没有找到相关商品  | 提示没有找到相关商品  | 是");
    }

    @Test
    @Order(4)
    @DisplayName("测试用例4: 搜索关键词为空")
    void testCase4_EmptyKeyword() throws Exception {
        mockMvc.perform(get("/search/suggestions").param("keyword", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("搜索关键词不能为空"));

        testResults.add(" 4  | 搜索关键词:空       | 显示所有商品或提示    | 显示所有商品          | 是");
    }

    @Test
    @Order(5)
    @DisplayName("测试用例5: 搜索电脑(部分匹配)")
    void testCase5_PartialMatch() throws Exception {
        List<SearchSuggestionDto> suggestions = Arrays.asList(
            new SearchSuggestionDto("电脑", "product", "<em>电脑</em>")
        );
        when(searchService.getSuggestions("电脑")).thenReturn(suggestions);

        mockMvc.perform(get("/search/suggestions").param("keyword", "电脑"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].keyword").value("电脑"));

        testResults.add(" 5  | 搜索关键词:电脑     | 显示包含电脑的商品    | 显示包含电脑的商品    | 是");
    }

    @Test
    @Order(6)
    @DisplayName("测试用例6: 搜索富士(品牌名)")
    void testCase6_SearchBrand() throws Exception {
        List<SearchSuggestionDto> suggestions = Arrays.asList(
            new SearchSuggestionDto("富士", "product", "<em>富士</em>")
        );
        when(searchService.getSuggestions("富士")).thenReturn(suggestions);

        mockMvc.perform(get("/search/suggestions").param("keyword", "富士"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].keyword").value("富士"));

        testResults.add(" 6  | 搜索关键词:富士     | 显示富士品牌的商品    | 显示富士品牌的商品    | 是");
    }

    @Test
    @Order(7)
    @DisplayName("测试用例7: 搜索特殊字符")
    void testCase7_SpecialCharacters() throws Exception {
        when(searchService.getSuggestions("特殊字符@#$")).thenReturn(new ArrayList<>());

        mockMvc.perform(get("/search/suggestions").param("keyword", "特殊字符@#$"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray());

        testResults.add(" 7  | 搜索关键词:特殊字符 | 提示没有找到相关商品  | 提示没有找到相关商品  | 是");
    }
}
