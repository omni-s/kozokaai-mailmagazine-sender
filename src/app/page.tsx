import React from 'react';
import { EmailWrapper } from '@/components/email/EmailWrapper';
import { EmailSection } from '@/components/email/EmailSection';
import { EmailText } from '@/components/email/EmailText';
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
      previewText="メールマガジンのプレビューテキストです"
    >
      {/* メイン画像 */}
      <EmailSection>
        <Img
          src="/mail-assets/shibuya-jmt-1.jpeg"
          alt="メイン画像"
          width="520"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </EmailSection>

      {/* テキストコンテンツ */}
      <EmailSection>
        <EmailText>
          シンプルで美しいメールマガジンです。
        </EmailText>
      </EmailSection>
    </EmailWrapper>
  );
}
