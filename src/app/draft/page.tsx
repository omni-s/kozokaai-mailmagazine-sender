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
    <EmailWrapper previewText="サンプルメールマガジンのプレビューテキストです">
      {/* ヘッダー画像 */}
      <div style={{ marginBottom: '32px' }}>
        <Img
          src="/mail-assets/header-placeholder.jpg"
          alt="ヘッダー画像"
          width="520"
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '8px',
          }}
        />
      </div>

      {/* タイトル */}
      <h1
        style={{
          margin: '0 0 16px 0',
          fontSize: '28px',
          fontWeight: 700,
          color: '#1a1a1a',
          lineHeight: '1.3',
        }}
      >
        サンプルメールマガジン
      </h1>

      {/* サブタイトル */}
      <p
        style={{
          margin: '0 0 24px 0',
          fontSize: '16px',
          color: '#666666',
          lineHeight: '1.6',
        }}
      >
        このテンプレートを編集して、あなたのメールマガジンをデザインしてください。
      </p>

      {/* 本文 */}
      <div
        style={{
          marginBottom: '32px',
          fontSize: '15px',
          color: '#333333',
          lineHeight: '1.7',
        }}
      >
        <p style={{ margin: '0 0 16px 0' }}>
          このファイルは作業用のテンプレートです。以下の手順でメールマガジンを作成できます：
        </p>

        <ol style={{ margin: '0 0 16px 0', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>
            このファイル (src/app/draft/page.tsx) を編集
          </li>
          <li style={{ marginBottom: '8px' }}>
            画像を public/mail-assets/ に配置
          </li>
          <li style={{ marginBottom: '8px' }}>pnpm run dev でプレビュー確認</li>
          <li style={{ marginBottom: '8px' }}>
            完成したら pnpm run commit を実行
          </li>
        </ol>

        <p style={{ margin: '0 0 16px 0' }}>
          画像は以下のように使用できます：
        </p>

        <div style={{ marginBottom: '16px' }}>
          <Img
            src="/mail-assets/placeholder.jpg"
            alt="サンプル画像"
            width="520"
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>

      {/* CTA ボタン */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <a
          href="https://example.com"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            backgroundColor: '#007bff',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          詳細を見る
        </a>
      </div>

      {/* 区切り線 */}
      <hr
        style={{
          margin: '32px 0',
          border: 'none',
          borderTop: '1px solid #e0e0e0',
        }}
      />

      {/* フッター情報 */}
      <p
        style={{
          margin: 0,
          fontSize: '14px',
          color: '#999999',
          lineHeight: '1.6',
        }}
      >
        ご質問やお問い合わせは
        <a
          href="mailto:info@example.com"
          style={{ color: '#007bff', textDecoration: 'none' }}
        >
          info@example.com
        </a>
        までご連絡ください。
      </p>
    </EmailWrapper>
  );
}
