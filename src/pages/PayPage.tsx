import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { PayPanel } from '@/components/pay/PayPanel';
import { parsePayQuery } from '@/lib/payments/payment';

export function PayPage() {
  const location = useLocation();
  const initial = useMemo(() => parsePayQuery(location.search) ?? undefined, [location.search]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pay</h1>
          <p>Universal KAS / KTLX payment module. Prefills from payment-request links.</p>
        </div>
      </div>
      <PayPanel initial={initial ?? undefined} />
    </div>
  );
}
