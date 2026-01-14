import React from 'react';
import { EmailWrapper } from '@/components/email/EmailWrapper';
import { EmailSection } from '@/components/email/EmailSection';
import { EmailCard } from '@/components/email/EmailCard';
import { EmailButton } from '@/components/email/EmailButton';
import { EmailHeading } from '@/components/email/EmailHeading';
import { EmailText } from '@/components/email/EmailText';
import { EmailDivider } from '@/components/email/EmailDivider';
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
export default function Home() {
  return (
    <EmailWrapper
      preview={true}
      previewText="サンプルメールマガジンのプレビューテキストです"
    >
      {/* ヘッダー画像 */}
      <EmailSection>
        <EmailCard backgroundColor="#ffffff" padding="0">
          <Img
            src="/mail-assets/placeholder.webp"
            alt="ヘッダー画像"
            width="520"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: '8px',
            }}
          />
        </EmailCard>
      </EmailSection>

      {/* タイトルセクション */}
      <EmailSection>
        <EmailHeading level={1}>サンプルメールマガジン</EmailHeading>
        <EmailText variant="muted">
          このテンプレートを編集して、あなたのメールマガジンをデザインしてください。
        </EmailText>
      </EmailSection>

      {/* コンテンツカード */}
      <EmailSection>
        <EmailCard>
          <EmailText margin="0 0 16px 0">
            このファイルは作業用のテンプレートです。以下の手順でメールマガジンを作成できます：
          </EmailText>

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
              このファイル (src/app/page.tsx) を編集
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

          <EmailText margin="0">画像は以下のように使用できます：</EmailText>
        </EmailCard>
      </EmailSection>

      {/* CTA ボタン */}
      <EmailSection>
        <div style={{ textAlign: 'center' }}>
          <EmailButton href="https://example.com">詳細を見る</EmailButton>
        </div>
      </EmailSection>

      {/* 区切り線 */}
      <EmailDivider />

      {/* フッター情報 */}
      <EmailText variant="muted">
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
      </EmailText>
    </EmailWrapper>
  );
}
