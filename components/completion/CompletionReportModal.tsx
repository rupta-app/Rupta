import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/ui/AppModal';
import { Button } from '@/components/ui/Button';
import { submitReport } from '@/services/reports';
import type { Database } from '@/types/database';

const REASONS: Database['public']['Tables']['reports']['Row']['reason'][] = [
  'fake_proof',
  'stolen_image',
  'harassment',
  'dangerous_content',
  'spam',
];

export function CompletionReportModal({
  visible,
  onClose,
  completionId,
  reportedUserId,
  reporterId,
}: {
  visible: boolean;
  onClose: () => void;
  completionId: string;
  reportedUserId: string;
  reporterId: string;
}) {
  const { t } = useTranslation();
  const [reason, setReason] =
    useState<Database['public']['Tables']['reports']['Row']['reason']>('spam');

  return (
    <AppModal visible={visible} onClose={onClose} title={t('report.title')} footer={false}>
      {REASONS.map((item) => (
        <Pressable
          key={item}
          onPress={() => setReason(item)}
          className={`py-3 border-b border-border/30 ${reason === item ? 'bg-primary/10' : ''}`}
        >
          <Text className="text-foreground">
            {item === 'fake_proof'
              ? t('report.fake')
              : item === 'stolen_image'
                ? t('report.stolen')
                : item === 'harassment'
                  ? t('report.harassment')
                  : item === 'dangerous_content'
                    ? t('report.dangerous')
                    : t('report.spam')}
          </Text>
        </Pressable>
      ))}
      <Button
        className="mt-4"
        variant="danger"
        onPress={async () => {
          await submitReport({
            reporterId,
            completionId,
            reportedUserId,
            reason,
          });
          onClose();
        }}
      >
        {t('report.submit')}
      </Button>
    </AppModal>
  );
}
