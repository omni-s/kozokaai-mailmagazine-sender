import React from 'react';

/**
 * EmailHeader - メールヘッダーコンポーネント
 *
 * kozokaAI ブランドヘッダーを統一管理するコンポーネントです。
 * すべてのメールマガジンで共通のヘッダー画像を表示します。
 *
 * ⚠️ 重要: このコンポーネントは削除しないでください。
 * - ブランドの統一性を保つために必須です
 * - 画像パスは自動的に S3 URL に置換されます（開発時: /MAIL-ASSETS/header.png → 本番: S3 URL）
 *
 * @example
 * ```tsx
 * <EmailWrapper>
 *   <EmailHeader />
 *   <EmailSection>...</EmailSection>
 * </EmailWrapper>
 * ```
 */
export function EmailHeader() {
  return (
    <table
      width="600"
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{
        margin: '0',
        padding: '0',
        width: '600px',
        borderCollapse: 'collapse',
      }}
    >
      <tbody>
        <tr>
          <td
            align="center"
            style={{
              padding: '0',
              margin: '0',
            }}
          >
            <img
              src="/MAIL-ASSETS/kai-manaY.jpeg"
              alt="kozokaAI"
              width="600"
              height="200"
              style={{
                display: 'block',
                width: '600px',
                height: '200px',
                margin: '0',
                padding: '0',
                border: 'none',
              }}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}
