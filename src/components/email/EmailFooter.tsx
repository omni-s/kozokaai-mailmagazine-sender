import React from 'react';

/**
 * メール用フッターコンポーネント
 *
 * **重要**: このコンポーネントは配信停止リンク（Unsubscribe）を含みます。
 * FTC（米国）およびGDPR（欧州）の法的要件に準拠するため、
 * 配信停止リンクを削除しないでください。
 *
 * @see docs/specs/architecture.md - 配信停止メカニズム
 * @see docs/ops/workflow.md - 配信停止機能
 */
export function EmailFooter() {
  return (
    <table
      width="600"
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{
        maxWidth: '600px',
        marginTop: '20px',
      }}
    >
      <tbody>
        <tr>
          <td
            align="center"
            style={{
              fontSize: '13px',
              color: '#94a3b8',
              lineHeight: '1.5',
            }}
          >
            <p style={{ margin: '0 0 8px 0' }}>
              このメールは kozokaAI からお送りしています
            </p>
            <p style={{ margin: 0 }} suppressHydrationWarning>
              © {new Date().getFullYear()} [会社名]. All rights reserved.
            </p>

            {/* 配信停止リンク（FTC/GDPR対応） */}
            {/* ⚠️ 重要: このリンクを削除しないでください */}
            <p style={{ margin: '12px 0 0 0' }}>
              <a
                href="{{{RESEND_UNSUBSCRIBE_URL}}}"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'underline',
                  fontSize: '12px',
                }}
              >
                配信停止 / Unsubscribe
              </a>
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
