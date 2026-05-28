'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface EnrollButtonProps {
  courseId: string;
  isEnrolled: boolean;
  isSubscriptionRequired: boolean;
  courseStatus: string;
  className?: string;
}

export function EnrollButton({
  courseId,
  isEnrolled,
  isSubscriptionRequired,
  courseStatus,
  className,
}: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    if (isSubscriptionRequired) {
      // TODO: PAYMENT INTEGRATION — open payment modal
      toast.info('Payment integration coming soon. Please contact support to enroll.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to enroll');
        return;
      }
      toast.success('Enrolled successfully!');
      router.refresh();
      router.push(`/courses/${courseId}/learn`);
    } catch {
      toast.error('Failed to enroll');
    } finally {
      setLoading(false);
    }
  };

  if (isEnrolled) {
    return (
      <Button className={className} asChild>
        <a href={`/courses/${courseId}/learn`}>Continue Learning →</a>
      </Button>
    );
  }

  if (courseStatus === 'COMING_SOON') {
    return (
      <Button className={className} disabled>
        Coming Soon
      </Button>
    );
  }

  return (
    <Button className={className} onClick={handleEnroll} disabled={loading}>
      {loading ? 'Enrolling...' : (
        <>
          {isSubscriptionRequired && <Lock className="h-4 w-4 mr-2" />}
          {isSubscriptionRequired ? 'Subscribe to Enroll' : 'Enroll Now'}
        </>
      )}
    </Button>
  );
}
