import { EmailWrapper } from '@/components/email/EmailWrapper';
import { EmailSection } from '@/components/email/EmailSection';
import { EmailHeading } from '@/components/email/EmailHeading';
import { EmailText } from '@/components/email/EmailText';

export default function Home() {
  return (
    <EmailWrapper preview={true} previewText="">
      <EmailSection>
        <EmailHeading level={1}>シンプルテストメール</EmailHeading>
        <EmailText>シンプルですね。</EmailText>
      </EmailSection>
    </EmailWrapper>
  );
}
