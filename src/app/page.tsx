'use client';

import React from 'react';
import { Modal, Button, Container, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CommitForm } from '@/components/commit/CommitForm';
import { MailContentBody, MailContent } from './mail-content';

// commit.ts でHTML生成に使用するため、再エクスポート
export { MailContent };

/**
 * ホーム画面（プレビュー + 配信準備UI）
 */
export default function Home() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      {/* メールプレビュー（preview={true}でブラウザ表示用） */}
      <div className="email-preview-wrapper">
        <MailContentBody preview={true} />
      </div>

      {/* 配信準備ボタン */}
      <Container size="sm" mt="xl" mb="xl">
        <Box style={{ textAlign: 'center' }}>
          <Button onClick={open} size="lg" fullWidth>
            配信準備を開始
          </Button>
        </Box>
      </Container>

      {/* 配信準備Modal */}
      <Modal opened={opened} onClose={close} title="配信準備" size="lg" centered>
        <CommitForm onSuccess={close} />
      </Modal>
    </>
  );
}
