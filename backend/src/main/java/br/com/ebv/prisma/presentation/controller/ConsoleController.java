package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.console.port.in.GetConsoleUsageUseCase;
import br.com.ebv.prisma.domain.console.port.in.ListConsoleContractsUseCase;
import br.com.ebv.prisma.domain.console.port.in.ListConsoleInvoicesUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/console")
@Tag(name = "Console", description = "PRISMA-EP-05-F04 Consumo, faturas e contratos B2B")
public class ConsoleController {

    private final GetConsoleUsageUseCase usage;
    private final ListConsoleInvoicesUseCase invoices;
    private final ListConsoleContractsUseCase contracts;

    public ConsoleController(
            GetConsoleUsageUseCase usage,
            ListConsoleInvoicesUseCase invoices,
            ListConsoleContractsUseCase contracts
    ) {
        this.usage = usage;
        this.invoices = invoices;
        this.contracts = contracts;
    }

    @GetMapping("/usage")
    @Operation(summary = "Consumo por tenant (lab: tenantId query)")
    public Map<String, Object> usage(@RequestParam(required = false) String tenantId) {
        var r = usage.execute(new GetConsoleUsageUseCase.Query(tenantId));
        List<Map<String, Object>> items = r.items().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productCode", i.productCode());
            m.put("environment", i.environment());
            m.put("callCount", i.callCount());
            m.put("amount", i.amount());
            m.put("currency", i.currency());
            return m;
        }).toList();
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("callCount", r.totals().callCount());
        totals.put("amount", r.totals().amount());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("tenantId", r.tenantId());
        body.put("dataFreshnessAt", r.dataFreshnessAt().toString());
        body.put("items", items);
        body.put("totals", totals);
        return body;
    }

    @GetMapping("/invoices")
    @Operation(summary = "Lista faturas do tenant")
    public Map<String, Object> invoices(@RequestParam(required = false) String tenantId) {
        List<Map<String, Object>> items = invoices.execute(new ListConsoleInvoicesUseCase.Query(tenantId)).stream()
                .map(i -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", i.id().toString());
                    m.put("invoiceNumber", i.invoiceNumber());
                    m.put("periodLabel", i.periodLabel());
                    m.put("amount", i.amount());
                    m.put("currency", i.currency());
                    m.put("status", i.status());
                    m.put("issuedAt", i.issuedAt().toString());
                    return m;
                }).toList();
        return Map.of("items", items);
    }

    @GetMapping("/contracts")
    @Operation(summary = "Lista contratos do tenant")
    public Map<String, Object> contracts(@RequestParam(required = false) String tenantId) {
        List<Map<String, Object>> items = contracts.execute(new ListConsoleContractsUseCase.Query(tenantId)).stream()
                .map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", c.id().toString());
                    m.put("contractCode", c.contractCode());
                    m.put("version", c.version());
                    m.put("status", c.status());
                    m.put("acceptedAt", c.acceptedAt() != null ? c.acceptedAt().toString() : null);
                    return m;
                }).toList();
        return Map.of("items", items);
    }
}
