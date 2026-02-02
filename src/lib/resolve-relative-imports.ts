import * as fs from 'fs';
import * as path from 'path';

/**
 * 相対インポート検出・コピーユーティリティ
 *
 * mail.tsx が `./xxx` 形式の相対インポートを持つ場合、
 * アーカイブディレクトリに依存ファイルを自動コピーする。
 */

/** 試行する拡張子リスト */
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.json'];

/**
 * ファイル内容から `./xxx` 形式の相対インポートを検出する。
 * `@/xxx` エイリアスは対象外（tsconfigで解決される）。
 *
 * @param fileContent - ソースファイルの内容
 * @returns 相対モジュールパスの配列（例: ['./mail-content', './utils']）
 */
export function detectRelativeImports(fileContent: string): string[] {
  const imports = new Set<string>();

  // ESM: import ... from './xxx'  /  export ... from './xxx'
  const esmPattern = /(?:import|export)\s+[\s\S]*?\s+from\s+['"](\.[^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = esmPattern.exec(fileContent)) !== null) {
    imports.add(match[1]);
  }

  // CJS: require('./xxx')
  const cjsPattern = /require\(\s*['"](\.[^'"]+)['"]\s*\)/g;
  while ((match = cjsPattern.exec(fileContent)) !== null) {
    imports.add(match[1]);
  }

  return Array.from(imports);
}

/**
 * モジュールパスから実ファイルを解決する。
 *
 * @param modulePath - 相対モジュールパス（例: './mail-content'）
 * @param sourceDir  - モジュール解決の起点ディレクトリ
 * @returns 解決されたファイルの絶対パス、または null
 */
export function resolveModuleFile(
  modulePath: string,
  sourceDir: string,
): string | null {
  const absolute = path.resolve(sourceDir, modulePath);

  // 拡張子が既についている場合
  if (path.extname(absolute) !== '') {
    return fs.existsSync(absolute) ? absolute : null;
  }

  // 拡張子なし — 各拡張子を試行
  for (const ext of EXTENSIONS) {
    const candidate = absolute + ext;
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // ディレクトリインポート（index ファイル）
  for (const ext of EXTENSIONS) {
    const candidate = path.join(absolute, `index${ext}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * mail.tsx の相対インポートを検出し、アーカイブディレクトリにコピーする。
 *
 * @param mailFileContent - mail.tsx の内容
 * @param sourceDir       - 元ファイルが存在するディレクトリ（src/app/）
 * @param archiveDir      - コピー先アーカイブディレクトリ
 * @returns コピー結果（コピーしたファイル名一覧と警告メッセージ）
 */
export function copyRelativeImports(
  mailFileContent: string,
  sourceDir: string,
  archiveDir: string,
): { copied: string[]; warnings: string[] } {
  const copied: string[] = [];
  const warnings: string[] = [];

  const modulePaths = detectRelativeImports(mailFileContent);

  for (const modulePath of modulePaths) {
    const resolved = resolveModuleFile(modulePath, sourceDir);

    if (!resolved) {
      warnings.push(
        `相対インポート '${modulePath}' のファイルが見つかりません（${sourceDir} 内）`,
      );
      continue;
    }

    const filename = path.basename(resolved);
    const dest = path.join(archiveDir, filename);

    try {
      fs.copyFileSync(resolved, dest);
      copied.push(filename);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push(`'${filename}' のコピーに失敗しました: ${msg}`);
    }
  }

  return { copied, warnings };
}
