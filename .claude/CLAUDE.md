# CLAUDE.md（docs 連携・運用ルール）

本プロジェクトにおける知見・ルールは `docs/` を唯一のソース・オブ・トゥルース（SoT）とします。エージェントや開発者が得た知見は、適切な `docs/` 配下の Markdown に追記、または新規作成し、索引である `docs/INDEX.md` を必ず更新します。

## 基本方針
- ルール/知見は `docs/` に集約。
- 変更時は `docs/INDEX.md`（索引・運用ルール）を更新。
- ドキュメントコミットは `DOC:` プレフィックス。
- 機密情報（PII等）は `docs/` に保存しない。

## 運用フロー（PDCA）
1. PLAN: `docs/INDEX.md` で既存配置と命名を確認。
2. DO: 該当 `docs/` ファイルを更新 or 新規作成。必要に応じてカテゴリディレクトリ追加。
3. CHECK: リンク切れ/重複/命名不整合が無いか確認。
4. ACTION: 運用改善点や不足ルールをドキュメント化。

## 命名・配置ガイド
- ファイル名は `kebab-case.md`、目的が明確な名前。
- 1ファイルが 300 行超 or 技術領域が分岐 → 分割/ディレクトリ化。
- 代表例：
  - `docs/dev/branch.md`（ブランチ戦略/CI）
  - `docs/coding-standards.md`（規約）
  - `docs/import-path-migration.md`（移行ガイド）

## 索引（参照）
- ドキュメントのエンドポイント: `docs/INDEX.md`
- ブランチ戦略: `docs/dev/branch.md`

最終更新日: 2025-10-24