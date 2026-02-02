'use client';

import React from 'react';
import { EmailWrapper } from '@/components/email/EmailWrapper';
import { EmailSection } from '@/components/email/EmailSection';
import { EmailCard } from '@/components/email/EmailCard';
import { EmailButton } from '@/components/email/EmailButton';
import { EmailText } from '@/components/email/EmailText';
import { EmailDivider } from '@/components/email/EmailDivider';
import { Img } from '@/components/email/Img';

/**
 * MailContentBody - メールコンテンツ本体
 *
 * MailContent と Home で共通化されたメールコンテンツです。
 * ブラウザプレビューと配信メールの不整合を防止します。
 *
 * ⚠️ 重要: このコンポーネントを編集すると、両方に反映されます。
 */
export function MailContentBody({ preview = false }: { preview?: boolean }) {
  return (
    <EmailWrapper
      preview={preview}
      previewText="ChatGPTの登場以降、 「AIが仕事を変える」という言葉を聞かない日はなくなりました。 しかし一方で、企業の現場ではこんな声をよく耳にします。 導入したが、使う人が限られている。 PoCまでで、本採用に至らなかった。 多くの企業はここで「教育が足りない」「現場の意識が低い」と結論づけがちですが、私はそうは思っていません。 問題は人ではなく、「設計」にあると考えています。"
    >
      {/* ロゴ */}
      <EmailSection marginBottom="0">
        <div style={{ textAlign: 'center', paddingTop: '10px', paddingBottom: '10px', marginTop: '-30px' }}>
          <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={{ backgroundColor: '#ffffff' }}>
            <tbody>
              <tr>
                <td style={{ backgroundColor: '#ffffff', padding: 0, textAlign: 'center' }}>
                  <Img
                    src="/mail-assets/2026/01/28/kozokaAI_logo.png"
                    alt="kozokaAI"
                    width="200"
                    height="41"
                    style={{
                      width: '200px',
                      height: '41px',
                      display: 'block',
                      margin: '0 auto',
                      backgroundColor: '#ffffff',
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <p
            style={{
              fontSize: '11px',
              color: '#333333',
              lineHeight: '1.6',
              marginTop: '8px',
              marginBottom: 0,
              fontFamily: 'sans-serif',
            }}
          >
            AIで現場をブースト！AIが"業務を動かす"瞬間を毎号お届けします。
          </p>
          <div style={{ marginTop: '5px', marginBottom: '5px' }}>
            <hr
              style={{
                margin: '0',
                border: 'none',
                borderTop: '1px solid #e2e8f0',
              }}
            />
          </div>
        </div>
      </EmailSection>

      {/* バナー画像 */}
      <EmailSection>
        <EmailCard backgroundColor="#ffffff" padding="0">
          <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={{ backgroundColor: '#ffffff' }}>
            <tbody>
              <tr>
                <td style={{ backgroundColor: '#ffffff', padding: 0 }}>
                  <Img
                    src="/mail-assets/2026/01/28/活用中 note_バナー.png"
                    alt="活用中 note_バナー"
                    width="560"
                    height="293"
                    style={{
                      width: '100%',
                      maxWidth: '560px',
                      height: 'auto',
                      display: 'block',
                      backgroundColor: '#ffffff',
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </EmailCard>
      </EmailSection>

      {/* 導入の挨拶 */}
      <EmailSection>
        <p
          style={{
            fontSize: '15px',
            color: '#333333',
            lineHeight: '1.8',
            marginBottom: '16px',
            marginTop: 0,
            fontFamily: 'sans-serif',
          }}
        >
          ChatGPTの登場以降、<br />
          「AIが仕事を変える」という言葉を聞かない日はなくなりました。<br />
          しかし一方で、企業の現場ではこんな声をよく耳にします。
        </p>
        <p
          style={{
            fontSize: '15px',
            color: '#333333',
            lineHeight: '1.8',
            marginBottom: '16px',
            marginTop: 0,
            fontFamily: 'sans-serif',
          }}
        >
          ・導入したが、使う人が限られている<br />
          ・PoCまでで、本採用に至らなかった
        </p>
        <p
            style={{
            fontSize: '15px',
              color: '#333333',
            lineHeight: '1.8',
            marginBottom: '16px',
              marginTop: 0,
              fontFamily: 'sans-serif',
            }}
          >
          多くの企業はここで「教育が足りない」「現場の意識が低い」と結論づけがちですが、私はそうは思っていません。
        </p>
          <p
            style={{
              fontSize: '15px',
              color: '#333333',
              lineHeight: '1.8',
              marginBottom: '16px',
              marginTop: 0,
              fontFamily: 'sans-serif',
            }}
          >
          問題は人ではなく、「設計」にあると考えています。
          </p>
          <p
            style={{
              fontSize: '15px',
              color: '#333333',
              lineHeight: '1.8',
              marginBottom: '16px',
              marginTop: 0,
              fontFamily: 'sans-serif',
            }}
          >
          noteを読む：「<a
            href="https://note.com/shota827/n/ned657c93dcf8"
            target="_blank"
            rel="noopener noreferrer"
          style={{
              color: '#00ADAA',
              textDecoration: 'underline',
          }}
        >
            チャットインターフェースAIが業務に向いていない3つの理由
          </a>」
        </p>
      </EmailSection>
        
      {/* メインコンテンツ */}
      <EmailSection>
        <EmailCard>
          <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
            <tbody>
              {/* タイトル：全幅 */}
              <tr>
                <td colSpan={2} style={{ paddingBottom: '12px', paddingLeft: '10px', paddingRight: '10px' }}>
                  <h2
                    style={{
                      fontSize: '22px',
                      color: '#333333',
                      marginBottom: 0,
                      marginTop: 0,
                      fontWeight: 600,
                      lineHeight: '1.4',
                      fontFamily: 'sans-serif',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    AIで、その「手作業」をゼロにしませんか？
                  </h2>
                </td>
              </tr>
              {/* 説明文と画像：横並び */}
              <tr>
                <td valign="top" style={{ paddingRight: '20px' }}>
                  <p
                    style={{
                      fontSize: '15px',
                      color: '#333333',
                      lineHeight: '1.8',
                      marginBottom: '8px',
                      marginTop: 0,
                      fontFamily: 'sans-serif',
                    }}
                  >
                    毎日届くFAXの入力、終わらない議事録作成、活用できていない基幹データ……。<br />
                    弊社のAIソリューションが、貴社の業務を劇的にスマートにします。
                  </p>
                  <div style={{ marginTop: '0px', textAlign: 'center' }}>
                    <EmailButton href="https://www.kozoka.ai/contact" target="_blank" rel="noopener noreferrer" backgroundColor="#66f9f5" color="#000000">問い合わせる</EmailButton>
                  </div>
                </td>
                <td width="150" valign="top" style={{ paddingLeft: '5px' }}>
                  <Img
                    src="/mail-assets/2026/01/28/注注くん.png"
                    alt="注注くん"
                    width="130"
                    height="130"
                    style={{
                      maxWidth: '130px',
                      width: '130px',
                      height: '130px',
                      display: 'block',
                      backgroundColor: '#ffffff',
                    }}
                  />
                  <p
                    style={{
                      fontSize: '8px',
                      color: '#666666',
                      lineHeight: '1.4',
                      marginTop: '4px',
                      marginBottom: 0,
                      fontFamily: 'sans-serif',
                      textAlign: 'center',
                    }}
                  >
                    FAX受注入力AI 公式キャラクター<br />
                    注注くん（ちゅうちゅう）
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </EmailCard>
      </EmailSection>

      {/* 区切り線 */}
      <EmailDivider />

      {/* サブコンテンツ（画像付き記事） */}
      <EmailSection>
        <h2
          style={{
            fontSize: '18px',
            color: '#333333',
            marginBottom: '16px',
            marginTop: 0,
            fontWeight: 600,
            lineHeight: '1.4',
            fontFamily: 'sans-serif',
          }}
        >
          最新トピックをご紹介！
        </h2>

        {/* サブ記事1 */}
        <EmailCard style={{ marginBottom: '16px' }}>
          <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
            <tbody>
              <tr>
                <td width="200" valign="top" style={{ paddingRight: '16px' }}>
                  <Img
                    src="/mail-assets/2026/01/28/260128.png"
                    alt="【YouTube】製品紹介動画を公開しました！"
                    width="200"
                    height="103"
                    style={{
                      width: '100%',
                      maxWidth: '200px',
                      height: 'auto',
                      display: 'block',
                      backgroundColor: '#ffffff',
                    }}
                  />
                </td>
                <td valign="top">
                  <h3
                    style={{
                      fontSize: '16px',
                      color: '#333333',
                      marginBottom: '8px',
                      marginTop: 0,
                      fontWeight: 600,
                      lineHeight: '1.4',
                      fontFamily: 'sans-serif',
                    }}
                  >
                    【YouTube】製品紹介動画を公開しました！
                  </h3>
                  <div style={{ marginTop: '8px', marginBottom: '8px', width: '100%' }}>
                    <hr
                      style={{
                        margin: '0',
                        border: 'none',
                        borderTop: '1px solid #e2e8f0',
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: '15px',
                      color: '#333333',
                      lineHeight: '1.8',
                      marginBottom: 0,
                      marginTop: 0,
                      fontFamily: 'sans-serif',
                      width: '100%',
                    }}
                  >
                    FAX受注入力、しんどくないですか？ 毎日続く手入力、確認、修正…。 その作業、AIに任せられます。 kozokaAI FAX受注入力は、 FAX受注業務をAIで自動化するソリューションです。詳しい製品紹介動画をアップしたので、是非ご覧ください！
                  </p>
                  <div style={{ marginTop: '16px', width: '100%' }}>
                  <a
                      href="https://youtu.be/dEWx8ps9meI?si=2gxYLcUGEVbaFY4Y"
                      target="_blank"
                      rel="noopener noreferrer"
                    style={{
                        display: 'block',
                        margin: '0 auto',
                        padding: '6px 12px',
                        backgroundColor: '#10c4c1',
                        color: '#ffffff',
                      textDecoration: 'none',
                        borderRadius: '25px',
                        fontSize: '15px',
                      fontWeight: 500,
                        lineHeight: '1.5',
                        fontFamily: 'sans-serif',
                        width: 'fit-content',
                    }}
                  >
                      <span style={{ marginRight: '4px' }}>&gt;&gt;</span>
                      動画を見る
                  </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </EmailCard>

        {/* サブ記事2 */}
        <EmailCard style={{ marginBottom: '16px' }}>
          <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
            <tbody>
              <tr>
                <td width="200" valign="top" style={{ paddingRight: '16px' }}>
                  <Img
                    src="/mail-assets/2026/01/28/吉野くん.png"
                    alt="「大会」に出まくって派手に暴れるGrokの戦略"
                    width="200"
                    height="103"
                    style={{
                      width: '100%',
                      maxWidth: '200px',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                </td>
                <td valign="top">
                  <h3
                    style={{
                      fontSize: '16px',
                      color: '#333333',
                      marginBottom: '8px',
                      marginTop: 0,
                      fontWeight: 600,
                      lineHeight: '1.4',
                      fontFamily: 'sans-serif',
                    }}
                  >
                    「大会」に出まくって派手に暴れるGrokの戦略
                  </h3>
                  <div style={{ marginTop: '8px', marginBottom: '8px', width: '100%' }}>
                    <hr
                      style={{
                        margin: '0',
                        border: 'none',
                        borderTop: '1px solid #e2e8f0',
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: '15px',
                      color: '#333333',
                      lineHeight: '1.8',
                      marginBottom: 0,
                      marginTop: 0,
                      fontFamily: 'sans-serif',
                    }}
                  >
                    最近Grokがいろんな「大会」に出ているのをご存知ですか？トレーディング大会で優勝したり、プロゲーマーに挑戦状を出したり。今回はその事例を紹介します。
                  </p>
                  <div style={{ marginTop: '16px', width: '100%' }}>
                  <a
                      href="https://note.com/t_yoshino_kzk/n/nc04603cad05f"
                      target="_blank"
                      rel="noopener noreferrer"
                    style={{
                        display: 'block',
                        margin: '0 auto',
                        padding: '6px 12px',
                        backgroundColor: '#10c4c1',
                        color: '#ffffff',
                      textDecoration: 'none',
                        borderRadius: '25px',
                        fontSize: '15px',
                      fontWeight: 500,
                        lineHeight: '1.5',
                        fontFamily: 'sans-serif',
                        width: 'fit-content',
                    }}
                  >
                      <span style={{ marginRight: '4px' }}>&gt;&gt;</span>
                      続きを読む
                  </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </EmailCard>

        {/* サブ記事3 */}
        <EmailCard style={{ marginBottom: '16px' }}>
          <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
            <tbody>
              <tr>
                <td width="200" valign="top" style={{ paddingRight: '16px' }}>
                  <Img
                    src="/mail-assets/2026/01/28/ITトレンドEXPO.jpg"
                    alt="kozokaAIがイベントに出展します！✨"
                    width="200"
                    height="103"
                    style={{
                      width: '100%',
                      maxWidth: '200px',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                </td>
                <td valign="top">
                  <h3
                    style={{
                      fontSize: '16px',
                      color: '#333333',
                      marginBottom: '8px',
                      marginTop: 0,
                      fontWeight: 600,
                      lineHeight: '1.4',
                      fontFamily: 'sans-serif',
                    }}
                  >
                    kozokaAIがイベントに出展します！✨
                  </h3>
                  <div style={{ marginTop: '8px', marginBottom: '8px', width: '100%' }}>
                    <hr
                      style={{
                        margin: '0',
                        border: 'none',
                        borderTop: '1px solid #e2e8f0',
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: '15px',
                      color: '#333333',
                      lineHeight: '1.8',
                      marginBottom: 0,
                      marginTop: 0,
                      fontFamily: 'sans-serif',
                    }}
                  >
                      
3月3日(火)～3月7日(土)開催の最大級オンライン展示会「ITトレンドEXPO 2026 Spring」に出展することになりました！
豪華出演者に加え、Amazonギフトプレゼントキャンペーンもございます！お見逃しなく！
                  </p>
                  <div style={{ marginTop: '16px', width: '100%' }}>
                  <a
                      href="https://note.kozoka.ai/n/n19573af245b2?magazine_key=ma0bd2991946f"
                      target="_blank"
                      rel="noopener noreferrer"
                    style={{
                        display: 'block',
                        margin: '0 auto',
                        padding: '6px 12px',
                        backgroundColor: '#10c4c1',
                        color: '#ffffff',
                      textDecoration: 'none',
                        borderRadius: '25px',
                        fontSize: '15px',
                      fontWeight: 500,
                        lineHeight: '1.5',
                        fontFamily: 'sans-serif',
                        width: 'fit-content',
                    }}
                  >
                      <span style={{ marginRight: '4px' }}>&gt;&gt;</span>
                      詳細を見る
                  </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </EmailCard>

      </EmailSection>

      {/* 区切り線 */}
      <EmailDivider />

      {/* 事務局情報 */}
      <EmailSection>
        <EmailCard backgroundColor="#ffffff" padding="20px">
          <EmailText variant="muted" style={{ fontSize: '13px', color: '#666666', lineHeight: '1.6', textAlign: 'center' }}>
            株式会社kozokaAI  kozokaAI BOOSTマガジン事務局<br />
            COMPANY：
          <a
              href="https://www.kozoka-ai.co.jp/"
              target="_blank"
              rel="noopener noreferrer"
            style={{
                color: '#00ADAA',
              textDecoration: 'underline',
            }}
          >
              https://www.kozoka-ai.co.jp/
          </a>
          <br />
            ご質問やお問い合わせは
          <a
              href="mailto:kozoka@kozoka-ai.co.jp"
            style={{
                color: '#00ADAA',
                textDecoration: 'none',
                fontWeight: 400,
              }}
            >
              kozoka@kozoka-ai.co.jp
            </a>
            までご連絡ください。
          </EmailText>
        </EmailCard>
      </EmailSection>

      {/* フッター */}
      <EmailSection>
        <EmailText variant="muted" style={{ fontSize: '11px', color: '#999999', lineHeight: '1.6', marginTop: '20px' }}>
          本メールは、弊社および関連会社（株式会社MONO-X）の社員と名刺交換させて頂いた方、セミナーやイベントのご登録、各種資料をダウンロードおよびお知らせメールをご希望頂いた皆さまにお送りしております。お預かりした個人情報は、各社のプライバシーポリシー（
          <a
            href="https://www.kozoka-ai.co.jp/assets/documents/kozokaAI-privacy-policy.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#999999', textDecoration: 'underline' }}
          >
            kozokaAI
          </a>
          {' / '}
          <a
            href="https://mono-x.com/security/#privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#999999', textDecoration: 'underline' }}
          >
            MONO-X
          </a>
          ）に基づき、適切に管理・運用させていただきます。当社からのご案内が不要の場合、お手数ですが、
          <a
            href="https://www.kozoka.ai/unsubscribe"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#999999', textDecoration: 'underline' }}
          >
            配信停止
          </a>
          よりお手続きをお願いいたします。※配信停止の設定後も、システムの都合により数日〜最大1か月ほどメールが届く場合がございます。あらかじめご了承ください。
        </EmailText>
        <EmailText variant="muted" style={{ fontSize: '11px', color: '#999999', lineHeight: '1.6', marginTop: '12px' }}>
          株式会社kozokaAI<br />
          〒106-6117 東京都港区六本木6-10-1 六本木ヒルズ森タワー 17F
        </EmailText>
      </EmailSection>
    </EmailWrapper>
  );
}

/**
 * メール配信用コンポーネント（Hooksなし）
 * @react-email/render でレンダリングされます
 */
export function MailContent() {
  return <MailContentBody />;
}
