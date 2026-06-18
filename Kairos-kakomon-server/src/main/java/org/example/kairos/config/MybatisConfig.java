package org.example.kairos.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

/**
 * MyBatis 配置类。
 * <p>
 * 通过 {@link MapperScan} 扫描 mapper 包下的所有接口,
 * 配合 src/main/resources/mapper/ 下的 XML 完成 SQL 映射。
 * 类型别名(typeAliasesPackage)等其他配置在 application.yml 中。
 */
@Configuration
@MapperScan("org.example.kairos.mapper")
public class MybatisConfig {
}
