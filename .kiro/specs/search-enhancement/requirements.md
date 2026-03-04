# Requirements Document

## Introduction

本功能旨在优化商品搜索体验，通过添加搜索历史记录、热门搜索词推荐和搜索建议功能，帮助用户更快速、更便捷地找到想要的商品。这是对现有基础搜索功能的增强，提升用户体验和搜索效率。

## Glossary

- **Search_System**: 商品搜索系统，负责处理用户的搜索请求和相关功能
- **Search_History**: 搜索历史记录，存储用户的历史搜索关键词
- **Hot_Keywords**: 热门搜索词，基于全站搜索频率统计的热门关键词
- **Search_Suggestion**: 搜索建议，根据用户输入实时提供的关键词补全建议
- **User**: 已登录的系统用户
- **Guest**: 未登录的访客用户

## Requirements

### Requirement 1: 搜索历史记录

**User Story:** As a user, I want to see my recent search history, so that I can quickly repeat previous searches without retyping.

#### Acceptance Criteria

1. WHEN a logged-in User performs a search, THE Search_System SHALL save the search keyword to the user's Search_History
2. WHEN a User focuses on the search input, THE Search_System SHALL display the user's recent Search_History (maximum 10 items)
3. WHEN a User clicks on a Search_History item, THE Search_System SHALL execute the search with that keyword
4. WHEN a User clicks the delete button on a Search_History item, THE Search_System SHALL remove that item from the history
5. WHEN a User clicks "Clear All History", THE Search_System SHALL remove all items from the user's Search_History
6. THE Search_System SHALL NOT save duplicate keywords to Search_History; instead, it SHALL update the timestamp of existing keywords
7. WHILE a User is not logged in, THE Search_System SHALL store Search_History in browser localStorage

### Requirement 2: 热门搜索词

**User Story:** As a user, I want to see popular search terms, so that I can discover trending products and get search inspiration.

#### Acceptance Criteria

1. WHEN a User focuses on the search input with an empty query, THE Search_System SHALL display Hot_Keywords
2. THE Search_System SHALL display a maximum of 8 Hot_Keywords
3. WHEN a User clicks on a Hot_Keywords item, THE Search_System SHALL execute the search with that keyword
4. THE Search_System SHALL update Hot_Keywords statistics WHEN any user performs a search
5. THE Search_System SHALL calculate Hot_Keywords based on search frequency within the last 7 days

### Requirement 3: 搜索建议（自动补全）

**User Story:** As a user, I want to see search suggestions as I type, so that I can find products faster with fewer keystrokes.

#### Acceptance Criteria

1. WHEN a User types at least 1 character in the search input, THE Search_System SHALL display Search_Suggestion within 300ms
2. THE Search_System SHALL display a maximum of 6 Search_Suggestion items
3. Search_Suggestion SHALL include matching product names and category names
4. THE Search_System SHALL highlight the matching portion of each Search_Suggestion
5. WHEN a User clicks on a Search_Suggestion item, THE Search_System SHALL execute the search with that suggestion
6. WHEN a User presses the up/down arrow keys, THE Search_System SHALL navigate through Search_Suggestion items
7. WHEN a User presses Enter while a Search_Suggestion is highlighted, THE Search_System SHALL execute the search with that suggestion

### Requirement 4: 搜索下拉面板UI

**User Story:** As a user, I want a clean and intuitive search dropdown panel, so that I can easily access search history, hot keywords, and suggestions.

#### Acceptance Criteria

1. WHEN the search input is focused, THE Search_System SHALL display a dropdown panel below the search box
2. THE dropdown panel SHALL be divided into sections: Search_History, Hot_Keywords, and Search_Suggestion
3. WHEN the search input is empty, THE Search_System SHALL show Search_History and Hot_Keywords sections
4. WHEN the search input has content, THE Search_System SHALL show only the Search_Suggestion section
5. WHEN a User clicks outside the dropdown panel, THE Search_System SHALL close the panel
6. THE Search_System SHALL provide smooth animations for panel open/close transitions

### Requirement 5: 搜索统计后端支持

**User Story:** As a system administrator, I want to track search statistics, so that I can understand user search behavior and optimize the search experience.

#### Acceptance Criteria

1. THE Search_System SHALL record each search query with timestamp and user_id (if logged in)
2. THE Search_System SHALL provide an API endpoint to retrieve Hot_Keywords
3. THE Search_System SHALL provide an API endpoint to retrieve Search_Suggestion based on input prefix
4. THE Search_System SHALL provide API endpoints for managing user Search_History (get, add, delete, clear)
5. IF a search query contains only whitespace, THEN THE Search_System SHALL NOT record it in statistics
