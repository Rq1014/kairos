package org.example.kairos.model.response.dict;

import java.util.List;

/**
 * 大学列表分页响应体。
 */
public class UniversityListResponse {
    /** 当前页大学数据 */
    private List<UniversityResponse> items;
    /** 满足条件的总记录数 */
    private long total;
    /** 当前页码,从 1 开始 */
    private int page;
    /** 每页大小 */
    private int pageSize;
    /** 是否还有下一页 */
    private boolean hasMore;
    /** 字典版本号,客户端可缓存,版本变更时主动重拉 */
    private int version;

    public List<UniversityResponse> getItems() { return items; }
    public void setItems(List<UniversityResponse> items) { this.items = items; }
    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
    public boolean isHasMore() { return hasMore; }
    public void setHasMore(boolean hasMore) { this.hasMore = hasMore; }
    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }
}
