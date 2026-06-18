package org.example.kairos.gateway.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.kairos.common.constant.HeaderKeys;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * 链路追踪 ID 过滤器。
 * <p>
 * 优先级仅次于最高级别,确保在所有业务逻辑前注入 traceId:
 * <ol>
 *   <li>读取请求头 X-Trace-Id;若无则自动生成 UUID</li>
 *   <li>写入 MDC,使日志框架自动打印 traceId</li>
 *   <li>回写到响应头 X-Trace-Id,方便前端日志关联</li>
 *   <li>请求结束清理 MDC,防止线程复用串号</li>
 * </ol>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 100)
public class TraceIdFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String traceId = request.getHeader(HeaderKeys.TRACE_ID);
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString().replace("-", "");
        }
        MDC.put("traceId", traceId);
        response.setHeader(HeaderKeys.TRACE_ID, traceId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("traceId");
        }
    }
}
