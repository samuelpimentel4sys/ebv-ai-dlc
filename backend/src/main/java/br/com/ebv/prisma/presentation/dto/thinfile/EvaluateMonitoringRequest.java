package br.com.ebv.prisma.presentation.dto.thinfile;

import java.math.BigDecimal;

public record EvaluateMonitoringRequest(String modelVersion, BigDecimal aucCurrent) {}
