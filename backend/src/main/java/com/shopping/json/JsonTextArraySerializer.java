package com.shopping.json;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;
import java.util.List;

public class JsonTextArraySerializer extends JsonSerializer<String> {

    @Override
    public void serialize(String value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        List<String> items = JsonTextArrayCodec.parse(value);
        gen.writeStartArray();
        for (String item : items) {
            gen.writeString(item);
        }
        gen.writeEndArray();
    }
}
