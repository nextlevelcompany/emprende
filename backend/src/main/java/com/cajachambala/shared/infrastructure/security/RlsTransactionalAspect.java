package com.cajachambala.shared.infrastructure.security;

import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

@Aspect
@Component
public class RlsTransactionalAspect {

    private final RlsContextManager rlsContextManager;
    private final TransactionTemplate transactionTemplate;

    public RlsTransactionalAspect(RlsContextManager rlsContextManager, TransactionTemplate transactionTemplate) {
        this.rlsContextManager = rlsContextManager;
        this.transactionTemplate = transactionTemplate;
    }

    @Around("@annotation(org.springframework.transaction.annotation.Transactional) || @within(org.springframework.transaction.annotation.Transactional)")
    public Object applyRlsContext(ProceedingJoinPoint invocation) throws Throwable {
        UserContext ctx = UserContextHolder.getContext();
        if (ctx == null || ctx.cajaId() == null) {
            return invocation.proceed();
        }

        try {
            return transactionTemplate.execute(status -> {
                rlsContextManager.setPostgresRlsContext(ctx.cajaId(), ctx.socioId(), ctx.role());
                try {
                    return invocation.proceed();
                } catch (Throwable error) {
                    throw new InvocationFailure(error);
                }
            });
        } catch (InvocationFailure failure) {
            throw failure.getCause();
        }
    }

    private static final class InvocationFailure extends RuntimeException {
        private InvocationFailure(Throwable cause) {
            super(cause);
        }
    }
}
