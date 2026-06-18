package org.example.kairos.web.dict;

import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.PublicApi;
import org.example.kairos.service.dict.DictionaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 字典元信息接口,目前提供版本号查询。
 * 客户端在启动时拉取版本号,与本地缓存对比,版本不一致则重新拉取字典数据。
 */
@RestController
@RequestMapping("/api/dict")
@PublicApi
public class DictMetaController {

    @Autowired private DictionaryService dictionaryService;

    /** 获取当前字典版本号 */
    @GetMapping("/version")
    public Result<Map<String, Object>> version() {
        return Result.ok(Map.of("version", dictionaryService.getVersion()));
    }
}
