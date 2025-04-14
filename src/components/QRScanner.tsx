import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRPaymentData } from '../types/qr';
import { parseVietQR } from '../utils/qrParser';

interface QRScannerProps {
    onSuccess: (decodedText: string, decodedData?: QRPaymentData) => void;
    onError: (error: any) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onSuccess, onError }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        const startScanner = async () => {
            try {
                // Tạo instance mới của scanner
                scannerRef.current = new Html5Qrcode("reader");
                
                // Kiểm tra xem camera có sẵn không
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    await scannerRef.current.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 }
                        },
                        (decodedText) => {
                            try {
                                const parsedData = parseVietQR(decodedText);
                                onSuccess(decodedText, parsedData);
                            } catch (error) {
                                // If parsing fails, just return the raw text
                                onSuccess(decodedText);
                            }
                        },
                        onError
                    );
                } else {
                    onError(new Error('Không tìm thấy camera'));
                }
            } catch (err) {
                console.error('Error starting scanner:', err);
                onError(err);
            }
        };

        startScanner();

        // Cleanup function
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop()
                    .then(() => {
                        console.log('Scanner stopped successfully');
                    })
                    .catch((err) => {
                        console.error('Error stopping scanner:', err);
                    });
            }
        };
    }, [onSuccess, onError]);

    return (
        <div id="reader" style={{ width: '100%' }}></div>
    );
};

export default QRScanner; 