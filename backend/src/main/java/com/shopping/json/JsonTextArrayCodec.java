package com.shopping.json;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public final class JsonTextArrayCodec {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};

    private JsonTextArrayCodec() {
    }

    public static List<String> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }

        String trimmed = raw.trim();
        List<String> values = new ArrayList<>();
        if (trimmed.startsWith("[")) {
            try {
                List<String> parsed = OBJECT_MAPPER.readValue(trimmed, STRING_LIST_TYPE);
                for (String item : parsed) {
                    if (item != null && !item.isBlank()) {
                        values.add(item.trim());
                    }
                }
            } catch (JsonProcessingException exception) {
                splitCommaSeparated(trimmed, values);
            }
        } else {
            splitCommaSeparated(trimmed, values);
        }

        Set<String> deduplicated = new LinkedHashSet<>(values);
        return List.copyOf(deduplicated);
    }

    public static String stringify(List<String> values) {
        List<String> safeValues = values == null ? List.of() : values.stream()
                .filter(item -> item != null && !item.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        try {
            return OBJECT_MAPPER.writeValueAsString(safeValues);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize string array", exception);
        }
    }

    private static void splitCommaSeparated(String raw, List<String> output) {
        for (String part : raw.split(",")) {
            if (!part.isBlank()) {
                output.add(part.trim());
            }
        }
    }
}
