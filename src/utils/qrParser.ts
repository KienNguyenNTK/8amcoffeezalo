import { QRPaymentData } from "../types/qr";

export function parseVietQR(qrString: string): QRPaymentData {
    const data: QRPaymentData = {
        version: '',
        initiationMethod: '',
        bankInfo: {
            acquirerId: '',
            bankId: '',
            accountNumber: ''
        },
        currency: '',
        amount: 0,
        country: '',
        rawText: qrString
    };

    try {
        // Parse version
        data.version = qrString.substring(0, 4);

        // Parse initiation method
        data.initiationMethod = qrString.substring(4, 6);

        // Parse bank information
        let currentIndex = 6;
        while (currentIndex < qrString.length) {
            const id = qrString.substring(currentIndex, currentIndex + 2);
            const length = parseInt(qrString.substring(currentIndex + 2, currentIndex + 4));
            const value = qrString.substring(currentIndex + 4, currentIndex + 4 + length);

            console.log('Parsing segment:', { id, length, value });

            switch (id) {
                case "00":
                    // Bỏ qua giá trị này
                    break;
                case "38": // Bank information
                    if (value.startsWith("0010A000000727")) {
                        data.bankInfo.acquirerId = "A000000727"; // MBBank BIN
                    }
                    break;
                case "01": // Account number
                    console.log('Processing account number segment:', {
                        fullValue: value,
                        valueLength: value.length,
                        substring14to20: value.substring(14, 20),
                        last6: value.slice(-6)
                    });

                    // Thử cả hai cách lấy số tài khoản
                    const accountNumber1 = value.substring(14, 20);
                    const accountNumber2 = value.slice(-6);

                    console.log('Possible account numbers:', {
                        method1: accountNumber1,
                        method2: accountNumber2
                    });

                    // Chọn số tài khoản hợp lệ
                    if (accountNumber1.match(/^\d{6}$/)) {
                        data.bankInfo.accountNumber = accountNumber1;
                    } else if (accountNumber2.match(/^\d{6}$/)) {
                        data.bankInfo.accountNumber = accountNumber2;
                    }

                    console.log('Selected account number:', data.bankInfo.accountNumber);
                    break;
                case "02": // Bank ID
                    data.bankInfo.bankId = "MBBANK";
                    break;
                case "53": // Currency
                    data.currency = value;
                    break;
                case "54": // Amount
                    data.amount = parseInt(value);
                    break;
                case "58": // Country
                    data.country = value;
                    break;
                case "59": // Merchant Name
                    data.merchantName = value;
                    break;
                case "60": // Merchant City
                    data.merchantCity = value;
                    break;
                case "62": // Additional Data
                    data.additionalData = value;
                    break;
                case "63": // CRC
                    data.crc = value;
                    break;
            }
            currentIndex += 4 + length;
        }

        // Set default bank name if not set
        if (!data.bankInfo.bankId) {
            data.bankInfo.bankId = "MBBANK";
        }

        console.log('Final parsed data:', data);
        return data;
    } catch (error) {
        console.error('Error parsing QR code:', error);
        return data;
    }
} 