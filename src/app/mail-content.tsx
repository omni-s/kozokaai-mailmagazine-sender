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
            AIで現場をブースト！AIが"業務を動かす"瞬間を毎号お届けします！
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
                    src="/mail-assets/2026/02/12/活用中 note_バナ_47.png"
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
          GoogleのNotebookLMいいですよね。<br />
          僕は、特に音声解説が気に入っています。
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
          なぜかというと「なにかを要約する」「別の形式に変換する」など、自分の考えを整理したり膨らませるのに使えるんですよね。<br />
          またポッドキャスト風に二人の掛け合いにしてくれるので、頭にもすんなり入ってきますし、ビジネスにも使えるんじゃないかなぁと思っています。
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
          本記事では、僕がやっているやり方を紹介します。<br /><br />
          noteを読む：『<a
            href="https://note.com/kozokaai_sano/n/n7dfae5a75340"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#00ADAA', textDecoration: 'underline' }}
          >Google NotebookLMの音声解説で自分の考えを整理しよう</a>』
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
                    src="/mail-assets/2026/02/12/活用中 note_バナ_50.png"
                    alt="Claude CodeでRPGを書いてみたら、意外と書けた話"
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
                    Claude CodeでRPGを書いてみたら、意外と書けた話
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
                    IBM i (AS/400) に携わることになり、基幹システムを支える RPG という言語を知りました。銀行や製造業など、社会インフラ級のシステムで今なお現役ですが、書き手の減少が深刻な課題です。そこで学習を兼ねて、Claude Code に RPG のコードを書かせてみました。
                  </p>
                  <div style={{ marginTop: '16px', width: '100%' }}>
                  <a
                      href="https://note.com/fasai_kozokaai/n/n29aab71268b9"
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

        {/* サブ記事2 */}
        <EmailCard style={{ marginBottom: '16px' }}>
          <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
            <tbody>
              <tr>
                <td width="200" valign="top" style={{ paddingRight: '16px' }}>
                  <Img
                    src="/mail-assets/2026/02/12/活用中 note_バナ_47.png"
                    alt="Google NotebookLMの音声解説で自分の考えを整理しよう"
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
                    Google NotebookLMの音声解説で自分の考えを整理しよう
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
                    GoogleのNotebookLMいいですよね。僕は特に音声解説が気に入っています。本記事では、僕がやっている音声解説のやり方を紹介します。
                  </p>
                  <div style={{ marginTop: '16px', width: '100%' }}>
                  <a
                      href="https://note.com/kozokaai_sano/n/n7dfae5a75340"
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
                    src="/mail-assets/2026/02/12/bootcamp .png"
                    alt="3月3日(火)～東名阪で開催「 IBM i Bootcamp 2026 Spring」に登壇します！"
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
                    3月3日(火)～東名阪で開催「IBM i Bootcamp 2026 Spring」に登壇します！
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
                      
                      2026年3月、株式会社MONO-X が主催する特別セミナー 「IBM i Bootcamp 2026 Spring」が、東京・大阪・名古屋の3都市で開催されます。
                      そしてこの度、弊社代表の藤井が、全3会場すべてに登壇することが決定いたしました。
                  </p>
                  <div style={{ marginTop: '16px', width: '100%' }}>
                  <a
                      href="https://note.kozoka.ai/n/n06ac38688890"
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
                      申し込む
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
            株式会社kozokaAI  『kozokaAI BOOSTマガジン事務局』<br />
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
          〒106-6117 東京都港区六本木6-10-1 六本木ヒルズ森タワー 17階
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
