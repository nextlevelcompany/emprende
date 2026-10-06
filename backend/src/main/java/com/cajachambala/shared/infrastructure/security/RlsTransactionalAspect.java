package com.cajachambala.shared.infrastructure.security;

import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 10)
public class RlsTransactionalAspect {

    private final RlsContextManager rlsContextManager;

    public RlsTransactionalAspect(RlsContextManager rlsContextManager) {
        this.rlsContextManager = rlsContextManager;
    }

    @Before("@annotation(org.springframework.transaction.annotation.Transactional) || @within(org.springframework.transaction.annotation.Transactional)")
    public void applyRlsContext() {
        UserContext ctx = UserContextHolder.getContext();
        if (ctx != null && ctx.cajaId() != null) {
            rlsContextManager.setPostgresRlsContext(ctx.cajaId(), ctx.socioId(), ctx.role());
        }
    }
}
