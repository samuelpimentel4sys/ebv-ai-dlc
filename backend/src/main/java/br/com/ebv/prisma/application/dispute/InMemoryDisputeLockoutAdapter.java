package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.port.out.DisputeLockoutPort;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemoryDisputeLockoutAdapter implements DisputeLockoutPort {

    private static final int MAX_FAILURES = 3;
    private static final long LOCK_MINUTES = 30;

    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    private record Entry(int attempts, Instant lockedUntil) {}

    @Override
    public boolean isLocked(String key) {
        Entry e = store.get(normalize(key));
        if (e == null || e.lockedUntil() == null) {
            return false;
        }
        if (Instant.now().isAfter(e.lockedUntil())) {
            store.remove(normalize(key));
            return false;
        }
        return true;
    }

    @Override
    public Instant lockedUntil(String key) {
        Entry e = store.get(normalize(key));
        return e == null ? null : e.lockedUntil();
    }

    @Override
    public int registerFailure(String key) {
        String k = normalize(key);
        Entry updated = store.compute(k, (ignored, current) -> {
            int next = (current == null ? 0 : current.attempts()) + 1;
            Instant until = next >= MAX_FAILURES
                    ? Instant.now().plus(LOCK_MINUTES, ChronoUnit.MINUTES)
                    : (current == null ? null : current.lockedUntil());
            return new Entry(next, until);
        });
        return updated.attempts();
    }

    @Override
    public void reset(String key) {
        store.remove(normalize(key));
    }

    private static String normalize(String key) {
        return key == null ? "" : key.trim().toLowerCase();
    }
}
