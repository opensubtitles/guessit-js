/*
 * WebAssembly wrapper for GuessIt functionality
 * This provides a C interface that can be compiled to WASM
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <emscripten.h>

// Simple pattern matching structure
typedef struct {
    char* name;
    char* pattern;
    int priority;
} Rule;

// Basic patterns for video file parsing
static Rule video_rules[] = {
    {"season", "s([0-9]+)", 10},
    {"episode", "e([0-9]+)", 10},
    {"season_episode", "s([0-9]+)e([0-9]+)", 15},
    {"year", "([0-9]{4})", 5},
    {"screen_size", "(720p|1080p|2160p|4k)", 8},
    {"video_codec", "(x264|x265|h264|h265|xvid)", 8},
    {"source", "(bluray|hdtv|webrip|dvd|cam)", 8},
    {"container", "\\.(mkv|mp4|avi|mov|wmv)$", 5},
    {NULL, NULL, 0}
};

// Simple JSON-like result builder
char result_buffer[4096];

EMSCRIPTEN_KEEPALIVE
char* guessit(const char* filename) {
    if (!filename) {
        return "{}";
    }
    
    // Clear result buffer
    memset(result_buffer, 0, sizeof(result_buffer));
    strcat(result_buffer, "{");
    
    int first = 1;
    
    // Simple pattern matching (this is a very basic implementation)
    // In a real implementation, you'd use a proper regex library
    
    // Check for season/episode patterns
    char* s_pos = strstr(filename, "S");
    char* e_pos = strstr(filename, "E");
    if (s_pos && e_pos && s_pos < e_pos) {
        int season = 0, episode = 0;
        sscanf(s_pos + 1, "%d", &season);
        sscanf(e_pos + 1, "%d", &episode);
        
        if (season > 0 && episode > 0) {
            if (!first) strcat(result_buffer, ",");
            sprintf(result_buffer + strlen(result_buffer), 
                    "\"season\":%d,\"episode\":%d", season, episode);
            first = 0;
        }
    }
    
    // Check for year (4 digits)
    for (int i = 0; filename[i]; i++) {
        if (filename[i] >= '1' && filename[i] <= '2' && 
            filename[i+1] >= '0' && filename[i+1] <= '9' &&
            filename[i+2] >= '0' && filename[i+2] <= '9' &&
            filename[i+3] >= '0' && filename[i+3] <= '9') {
            
            int year = (filename[i] - '0') * 1000 + 
                      (filename[i+1] - '0') * 100 + 
                      (filename[i+2] - '0') * 10 + 
                      (filename[i+3] - '0');
            
            if (year >= 1900 && year <= 2030) {
                if (!first) strcat(result_buffer, ",");
                sprintf(result_buffer + strlen(result_buffer), "\"year\":%d", year);
                first = 0;
                break;
            }
        }
    }
    
    // Check for resolution
    if (strstr(filename, "720p")) {
        if (!first) strcat(result_buffer, ",");
        strcat(result_buffer, "\"screen_size\":\"720p\"");
        first = 0;
    } else if (strstr(filename, "1080p")) {
        if (!first) strcat(result_buffer, ",");
        strcat(result_buffer, "\"screen_size\":\"1080p\"");
        first = 0;
    } else if (strstr(filename, "2160p") || strstr(filename, "4K")) {
        if (!first) strcat(result_buffer, ",");
        strcat(result_buffer, "\"screen_size\":\"2160p\"");
        first = 0;
    }
    
    // Check for video codec
    if (strstr(filename, "x264") || strstr(filename, "h264")) {
        if (!first) strcat(result_buffer, ",");
        strcat(result_buffer, "\"video_codec\":\"H.264\"");
        first = 0;
    } else if (strstr(filename, "x265") || strstr(filename, "h265")) {
        if (!first) strcat(result_buffer, ",");
        strcat(result_buffer, "\"video_codec\":\"H.265\"");
        first = 0;
    } else if (strstr(filename, "XviD")) {
        if (!first) strcat(result_buffer, ",");
        strcat(result_buffer, "\"video_codec\":\"XviD\"");
        first = 0;
    }
    
    // Check for source
    if (strstr(filename, "BluRay")) {
        if (!first) strcat(result_buffer, ",");
        strcat(result_buffer, "\"source\":\"BluRay\"");
        first = 0;
    } else if (strstr(filename, "HDTV")) {
        if (!first) strcat(result_buffer, ",");
        strcat(result_buffer, "\"source\":\"HDTV\"");
        first = 0;
    } else if (strstr(filename, "WEB")) {
        if (!first) strcat(result_buffer, ",");
        strcat(result_buffer, "\"source\":\"WEB\"");
        first = 0;
    }
    
    // Check for container
    char* ext = strrchr(filename, '.');
    if (ext) {
        if (!first) strcat(result_buffer, ",");
        sprintf(result_buffer + strlen(result_buffer), "\"container\":\"%s\"", ext + 1);
        first = 0;
    }
    
    strcat(result_buffer, "}");
    return result_buffer;
}

// Initialize the WASM module
EMSCRIPTEN_KEEPALIVE
void init() {
    // Initialization code if needed
}

// Get version information
EMSCRIPTEN_KEEPALIVE
char* version() {
    return "GuessIt WASM 1.0.0";
}

// Main function for standalone WASM
int main() {
    return 0;
}