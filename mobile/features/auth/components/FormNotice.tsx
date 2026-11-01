import React from 'react';

import { Banner, type BannerTone } from '@/components/ui/Banner';

export interface FormNoticeState {
  tone: BannerTone;
  message: string;
  title?: string;
}

export function FormNotice({ notice }: { notice: FormNoticeState | null }) {
  if (!notice) return null;
  return <Banner tone={notice.tone} message={notice.message} title={notice.title} />;
}
