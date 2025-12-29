import React from 'react';

interface EmailWrapperProps {
  children: React.ReactNode;
  previewText?: string;
  /**
   * プレビューモード（ブラウザ表示用）
   * true: <html>, <body> タグを出力しない（Next.js App Router用）
   * false: フルHTMLを出力（メール配信用）
   * @default false
   */
  preview?: boolean;
}

/**
 * メール共通レイアウトコンポーネント
 *
 * メールクライアント互換性のため、インラインスタイルを使用
 * テーブルレイアウトで中央揃え・最大幅を設定
 */
export function EmailWrapper({
  children,
  previewText,
  preview = false,
}: EmailWrapperProps) {
  // テーブルコンテンツ部分を共通化
  const tableContent = (
    <>
      {/* プレビューテキスト（メーラーの件名下に表示される） */}
      {previewText && (
        <div
          style={{
            display: 'none',
            maxHeight: 0,
            overflow: 'hidden',
          }}
        >
          {previewText}
        </div>
      )}

      {/* メインコンテンツ */}
      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        role="presentation"
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#f1f5f9',
        }}
      >
        <tbody>
          <tr>
            <td align="center" style={{ padding: '40px 0' }}>
              <table
                width="600"
                cellPadding="0"
                cellSpacing="0"
                role="presentation"
                style={{
                  maxWidth: '600px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow:
                    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ padding: '40px' }}>{children}</td>
                  </tr>
                </tbody>
              </table>

              {/* フッター */}
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
                        このメールは [会社名] からお送りしています
                      </p>
                      <p style={{ margin: 0 }}>
                        © {new Date().getFullYear()} [会社名]. All rights
                        reserved.
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );

  // プレビューモード: テーブルのみ返却
  if (preview) {
    return <div>{tableContent}</div>;
  }

  // メール配信モード: フルHTML
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#f1f5f9',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {tableContent}
      </body>
    </html>
  );
}
