package org.example.kairos.model.response.question;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/** 结构化题干块,宽松承载 text/math/image/table 四种类型。 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContentBlockDto {
    private String type;
    private String content;
    private String latex;
    private String url;
    private String caption;
    private List<List<String>> rows;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getLatex() { return latex; }
    public void setLatex(String latex) { this.latex = latex; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public List<List<String>> getRows() { return rows; }
    public void setRows(List<List<String>> rows) { this.rows = rows; }
}
