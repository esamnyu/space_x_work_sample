'use client';

import dynamic from 'next/dynamic';

const GlobeDemo = dynamic(
  () => import('@/components/ui/GlobeDemo').then((mod) => mod.GlobeDemo),
  { ssr: false }
);

export function ClientGlobe() {
  return <GlobeDemo />;
}