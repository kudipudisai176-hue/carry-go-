import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const txnId = searchParams.get('txnId');
    const parcelId = searchParams.get('parcelId');

    if (!txnId || !parcelId) {
      setStatus('error');
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/payment/status/${txnId}?parcelId=${parcelId}`
        );
        const data = await res.json();

        if (data.code === 'PAYMENT_SUCCESS') {
          setStatus('success');
          toast.success('Payment Successful! Your parcel is now posted.');
          setTimeout(() => navigate('/dashboard'), 3000);
        } else {
          setStatus('failed');
          toast.error('Payment failed. Please try again.');
        }
      } catch (err) {
        console.error('Status check failed:', err);
        setStatus('error');
        toast.error('Could not verify payment status.');
      }
    };

    checkStatus();
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl border border-slate-100">
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Verifying Payment...</h2>
            <p className="text-slate-500">Please wait while we confirm your transaction with PhonePe.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Payment Successful!</h2>
            <p className="text-slate-500">Your parcel has been successfully posted and is now visible to travellers.</p>
            <div className="pt-4">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 rounded-2xl transition-all"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 p-4">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Payment Failed</h2>
            <p className="text-slate-500">Something went wrong with your transaction. Please check your bank account or try again.</p>
            <div className="pt-4 flex flex-col gap-3">
              <Button 
                onClick={() => navigate('/sender')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 rounded-2xl transition-all"
              >
                Try Again
              </Button>
              <Button 
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="w-full text-slate-500 font-bold"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-amber-100 p-4">
                <Loader2 className="h-12 w-12 text-amber-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Status Unknown</h2>
            <p className="text-slate-500">We couldn't retrieve the payment details. If money was deducted, your parcel will be updated shortly.</p>
            <div className="pt-4">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 rounded-2xl transition-all"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
