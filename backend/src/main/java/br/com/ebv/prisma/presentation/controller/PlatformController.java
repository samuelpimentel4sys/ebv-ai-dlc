package br.com.ebv.prisma.presentation.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class PlatformController {

    @GetMapping("/platform/info")
    public ResponseEntity<Map<String, Object>> info() {
        return ResponseEntity.ok(Map.of(
                "product", "EBV Prisma",
                "module", "backend",
                "architecture", "hexagonal",
                "java", "21",
                "status", "bootstrap"
        ));
    }
}
