import { redirect } from 'next/navigation';

/**
 * "/draft" は現在 "/" にリダイレクトされます
 *
 * メール編集画面は "/" に統合されました。
 * 既存のブックマークやスクリプトの互換性を維持するため、
 * このルートは "/" へのリダイレクトとして残されています。
 */
export default function DraftPage() {
  redirect('/');
}
