package com.shopping.json;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.core.type.TypeReference;

import java.io.IOException;
import java.util.List;

public class JsonTextArrayDeserializer extends JsonDeserializer<String> {

    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};

    @Override
    public String deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        JsonToken currentToken = parser.currentToken();
        if (currentToken == JsonToken.VALUE_NULL) {
            return JsonTextArrayCodec.stringify(List.of());
        }
        if (currentToken == JsonToken.START_ARRAY) {
            List<String> values = parser.getCodec().readValue(parser, STRING_LIST_TYPE);
            return JsonTextArrayCodec.stringify(values);
        }
        if (currentToken == JsonToken.VALUE_STRING) {
            String value = parser.getValueAsString();
            if (value == null || value.isBlank()) {
                return JsonTextArrayCodec.stringify(List.of());
            }
            return JsonTextArrayCodec.stringify(JsonTextArrayCodec.parse(value));
        }
        return JsonTextArrayCodec.stringify(List.of());
    }
}
