# Kairos-kakomon 数据库脚本

按以下顺序在目标数据库（MySQL 8.x，utf8mb4）中执行：

| 顺序 | 文件 | 作用 |
|---|---|---|
| 1 | [`V1_0__init_schema.sql`](./V1_0__init_schema.sql) | 建库与全部表结构（用户域 + 字典域）|
| 2 | [`V1_1__seed_dictionary.sql`](./V1_1__seed_dictionary.sql) | 灌入字典初始化数据：大学 / 研究科 / 专业 |
| 3 | [`V1_2__seed_demo_user.sql`](./V1_2__seed_demo_user.sql) | 灌入演示用户（对应前端 `DEMO_USER`，可选）|
| 4 | [`V1_3__billing.sql`](./V1_3__billing.sql) | 会员体系：支付订单流水 + 订阅有效期两张表 |
| 5 | [`V1_4__questions_schema.sql`](./V1_4__questions_schema.sql) | 题目 / 试卷表结构（专题学习 + 模拟考试）|
| 6 | [`V1_5__seed_questions.sql`](./V1_5__seed_questions.sql) | 灌入题目 / 试卷示例数据（可选）|
| 7 | [`V1_6__gradschool_code_migration.sql`](./V1_6__gradschool_code_migration.sql) | 研究科标识：日文名 → code 迁移 |
| 8 | [`V1_7__column_comments.sql`](./V1_7__column_comments.sql) | 补齐/校正 V1_0 各表列注释（仅线上已初始化库需要）|
| 9 | [`V1_8__subject_dict.sql`](./V1_8__subject_dict.sql) | 科目字典 `subject` + 专业-科目关联 `major_subject` 及种子数据 |

命令示例：

```bash
mysql -uroot -p < V1_0__init_schema.sql
mysql -uroot -p kakomon < V1_1__seed_dictionary.sql
mysql -uroot -p kakomon < V1_2__seed_demo_user.sql
mysql -uroot -p kakomon < V1_3__billing.sql
mysql -uroot -p kakomon < V1_4__questions_schema.sql
mysql -uroot -p kakomon < V1_5__seed_questions.sql
mysql -uroot -p kakomon < V1_6__gradschool_code_migration.sql
# 仅线上已初始化库需要，用于补注释：
mysql -uroot -p kakomon < V1_7__column_comments.sql
mysql -uroot -p kakomon < V1_8__subject_dict.sql
```

> **V1_0 已就地带完整列注释** —— 从零初始化的库无需执行 V1_7。
> V1_7 仅供「早于本次注释更新即已建表、无法重跑 V1_0」的线上库同步 COMMENT，全部为 `ALTER ... MODIFY`，可安全重复执行。

数据库 / 字符集 / 排序规则：

- 数据库名：`kakomon`
- 字符集：`utf8mb4`
- 排序规则：`utf8mb4_0900_ai_ci`（MySQL 8 默认）

> 文件名采用 Flyway 风格的 `V<版本>__<描述>.sql`，便于将来接入 Flyway / Liquibase 时直接复用。
