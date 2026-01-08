import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkflowSection } from '@/components/home/WorkflowSection';

export const metadata = {
  title: '使い方 | Resend メール配信システム',
  description: 'メール配信システムの使い方とワークフロー',
};

export default function HelpPage() {
  return (
    <div className="container max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">使い方</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowSection />
        </CardContent>
      </Card>
    </div>
  );
}
