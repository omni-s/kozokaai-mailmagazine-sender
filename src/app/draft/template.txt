import React from 'react';
import { EmailWrapper } from '@/components/email/EmailWrapper';
import { Img } from '@/components/email/Img';

/**
 * メールテンプレート作業用ファイル
 *
 * このファイルを編集してメールをデザインします。
 * `pnpm run commit` 実行時に archives/ へ移動され、このファイルは初期テンプレートにリセットされます。
 *
 * 画像は public/mail-assets/ に配置してください。
 * 例: <Img src="/mail-assets/hero.jpg" alt="Hero Image" width="600" />
 */
export default function DraftEmail() {
  return (
    <EmailWrapper
      preview={true}
      previewText="サンプルメールマガジンのプレビューテキストです"
    >
      {/* ヘッダー画像カード */}
      <div
        style={{
          marginBottom: '24px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
        }}
      >
        <Img
          src="/mail-assets/placeholder.webp"
          alt="ヘッダー画像"
          width="520"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </div>

      {/* タイトルセクション */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            margin: '0 0 8px 0',
            fontSize: '30px',
            fontWeight: 600,
            color: '#0f172a',
            lineHeight: '1.2',
            letterSpacing: '-0.025em',
          }}
        >
          サンプルメールマガジン
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: '16px',
            color: '#64748b',
            lineHeight: '1.5',
          }}
        >
          このテンプレートを編集して、あなたのメールマガジンをデザインしてください。
        </p>
      </div>

      {/* コンテンツカード */}
      <div
        style={{
          marginBottom: '24px',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
        }}
      >
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '15px',
            color: '#1e293b',
            lineHeight: '1.6',
          }}
        >
          このファイルは作業用のテンプレートです。以下の手順でメールマガジンを作成できます：
        </p>

        <ol
          style={{
            margin: '0 0 16px 0',
            paddingLeft: '24px',
            fontSize: '15px',
            color: '#1e293b',
            lineHeight: '1.8',
          }}
        >
          <li style={{ marginBottom: '8px' }}>
            このファイル (src/app/draft/page.tsx) を編集
          </li>
          <li style={{ marginBottom: '8px' }}>
            画像を public/mail-assets/ に配置
          </li>
          <li style={{ marginBottom: '8px' }}>
            pnpm run dev でプレビュー確認
          </li>
          <li style={{ marginBottom: '8px' }}>
            完成したら pnpm run commit を実行
          </li>
        </ol>

        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '15px',
            color: '#1e293b',
            lineHeight: '1.6',
          }}
        >
          画像は以下のように使用できます：
        </p>
      </div>

      {/* CTA ボタン */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <a
          href="https://example.com"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 500,
            lineHeight: '1.5',
            transition: 'background-color 0.2s',
          }}
        >
          詳細を見る
        </a>
      </div>

      {/* 区切り線 */}
      <hr
        style={{
          margin: '24px 0',
          border: 'none',
          borderTop: '1px solid #e2e8f0',
        }}
      />

      {/* フッター情報 */}
      <p
        style={{
          margin: 0,
          fontSize: '14px',
          color: '#94a3b8',
          lineHeight: '1.6',
        }}
      >
        ご質問やお問い合わせは
        <a
          href="mailto:info@example.com"
          style={{
            color: '#2563eb',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          info@example.com
        </a>
        までご連絡ください。
      </p>
    </EmailWrapper>
  );
}
