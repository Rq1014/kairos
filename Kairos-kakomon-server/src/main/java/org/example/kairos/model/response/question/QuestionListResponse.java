package org.example.kairos.model.response.question;

import java.util.List;

/** 大问分页列表壳(复刻 UniversityListResponse)。 */
public class QuestionListResponse {
    private List<QuestionListItemResponse> items;
    private long total;
    private int page;
    private int pageSize;
    private boolean hasMore;

    public List<QuestionListItemResponse> getItems() { return items; }
    public void setItems(List<QuestionListItemResponse> items) { this.items = items; }
    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
    public boolean isHasMore() { return hasMore; }
    public void setHasMore(boolean hasMore) { this.hasMore = hasMore; }
}
