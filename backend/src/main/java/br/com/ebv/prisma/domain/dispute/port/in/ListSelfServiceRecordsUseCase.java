package br.com.ebv.prisma.domain.dispute.port.in;

import java.util.List;

public interface ListSelfServiceRecordsUseCase {

    record Query(String sessionToken) {}

    record RecordItem(String recordRef, String type, String creditor, String amount, String status) {}

    List<RecordItem> execute(Query query);
}
