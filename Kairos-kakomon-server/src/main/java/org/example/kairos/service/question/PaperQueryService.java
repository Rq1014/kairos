package org.example.kairos.service.question;

import org.example.kairos.model.response.question.PaperListItemResponse;
import org.example.kairos.model.response.question.PaperResponse;

import java.util.List;

/** 试卷查询服务(只读)。 */
public interface PaperQueryService {
    List<PaperListItemResponse> listByScope(String universityId, String graduateSchool);

    PaperResponse getByCode(String code);
}
