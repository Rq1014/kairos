# Kairos-kakomon 数据库脚本

按以下顺序在目标数据库（MySQL 8.x，utf8mb4）中执行：

| 顺序 | 文件 | 作用 |
|---|---|---|
| 1 | [`V1_0__init_schema.sql`](./V1_0__init_schema.sql) | 建库与全部表结构（用户域 + 字典域）|
| 2 | [`V1_1__seed_dictionary.sql`](./V1_1__seed_dictionary.sql) | 灌入字典初始化数据：大学 / 研究科 / 专业 |
| 3 | [`V1_2__seed_demo_user.sql`](./V1_2__seed_demo_user.sql) | 灌入演示用户（对应前端 `DEMO_USER`，可选）|

命令示例：

```bash
mysql -uroot -p < V1_0__init_schema.sql
mysql -uroot -p kakomon < V1_1__seed_dictionary.sql
mysql -uroot -p kakomon < V1_2__seed_demo_user.sql
```

数据库 / 字符集 / 排序规则：

- 数据库名：`kakomon`
- 字符集：`utf8mb4`
- 排序规则：`utf8mb4_0900_ai_ci`（MySQL 8 默认）

> 文件名采用 Flyway 风格的 `V<版本>__<描述>.sql`，便于将来接入 Flyway / Liquibase 时直接复用。
