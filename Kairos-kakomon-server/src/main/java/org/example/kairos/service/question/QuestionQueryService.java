package org.example.kairos.service.question;

import org.example.kairos.model.response.question.QuestionListResponse;
import org.example.kairos.model.response.question.QuestionResponse;
import org.example.kairos.model.response.question.RelatedQuestionResponse;

import java.util.List;

/** 大问查询服务(只读)。 */
public interface QuestionQueryService {
    QuestionListResponse list(String universityId, String graduateSchool, String majorId, Integer year,
                              String subjectCode, String knowledgePoint, String keyword,
                              int page, int pageSize);

    QuestionResponse getByCode(String code);

    List<RelatedQuestionResponse> getRelated(String code);
}
