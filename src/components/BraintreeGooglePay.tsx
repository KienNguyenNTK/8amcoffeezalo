import React, { useEffect, useRef, useState } from "react";
import dropin from "braintree-web-drop-in";

interface BraintreeGooglePayProps {
  clientToken: string;
  onPaymentMethodReceived: (payload: any) => void;
}

const BraintreeGooglePay: React.FC<BraintreeGooglePayProps> = ({ clientToken, onPaymentMethodReceived }) => {
  const [instance, setInstance] = useState<any>(null);

  useEffect(() => {
    if (!clientToken) return;

    const initializeBraintree = async () => {
      try {
        const dropinInstance = await dropin.create({
          authorization: clientToken,
          container: '#dropin-container',
          googlePay: {
            googlePayVersion: 2,
            merchantId: '5928-5776-1021',
            transactionInfo: {
              totalPriceStatus: 'FINAL',
              totalPrice: '100000',
              currencyCode: 'VND'
            },
          },
          paypal: {
            flow: 'checkout',
            amount: '100000',
            currency: 'VND'
          }
        });

        setInstance(dropinInstance);
      } catch (error) {
        console.error("Error initializing Braintree:", error);
      }
    };

    initializeBraintree();

    return () => {
      if (instance) {
        instance.teardown();
      }
    };
  }, [clientToken]);

  const handlePayment = async () => {
    if (!instance) {
      console.error("Braintree instance not initialized");
      return;
    }

    try {
      const { nonce } = await instance.requestPaymentMethod();
      onPaymentMethodReceived({ nonce });
    } catch (error) {
      console.error("Error requesting payment method:", error);
    }
  };

  return (
    <div className="mt-4">
      <div id="dropin-container"></div>
      <button 
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={handlePayment}
      >
        Thanh toán
      </button>
    </div>
  );
};

export default BraintreeGooglePay;