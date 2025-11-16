import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class QrService {
    private readonly logger = new Logger(QrService.name);
    private readonly hmacSecret: string;

    constructor(private readonly configService: ConfigService) {
        this.hmacSecret = this.configService.get<string>('HMAC_SECRET') || 'default-secret';
    }

    /**
     * Генерирует QR-код для входа в чат (для постеров)
     */
    async generateEntryQR(): Promise<string> {
        try {
            const whatsappNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || '+14155238886';
            const entryText = 'START T&F';
            const deepLink = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(entryText)}`;

            const qrCodeDataURL = await QRCode.toDataURL(deepLink, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            this.logger.log('Generated entry QR code');
            return qrCodeDataURL;
        } catch (error) {
            this.logger.error(`Failed to generate entry QR: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Генерирует персональный QR-код семьи для сканирования кассиром
     */
    async generateFamilyQR(familyId: string, clientCode: string): Promise<string> {
        try {
            const qrData = {
                familyId,
                clientCode,
                timestamp: Date.now(),
                type: 'family_visit'
            };

            // Создаем HMAC подпись для безопасности
            const signature = this.createHMAC(JSON.stringify(qrData));
            const signedData = {
                ...qrData,
                signature
            };

            const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(signedData), {
                width: 200,
                margin: 2,
                color: {
                    dark: '#FF6B35', // Цвет Teddy & Friends
                    light: '#FFFFFF'
                }
            });

            this.logger.log(`Generated family QR for ${clientCode}`);
            return qrCodeDataURL;
        } catch (error) {
            this.logger.error(`Failed to generate family QR: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Валидирует персональный QR-код семьи
     */
    validateFamilyQR(qrDataString: string): { isValid: boolean; familyId?: string; clientCode?: string; error?: string } {
        try {
            const qrData = JSON.parse(qrDataString);

            // Проверяем структуру данных
            if (!qrData.familyId || !qrData.clientCode || !qrData.signature || !qrData.timestamp) {
                return { isValid: false, error: 'Invalid QR data structure' };
            }

            // Проверяем тип
            if (qrData.type !== 'family_visit') {
                return { isValid: false, error: 'Invalid QR type' };
            }

            // Проверяем время (QR действителен 24 часа)
            const now = Date.now();
            const qrTime = qrData.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

            if (now - qrTime > maxAge) {
                return { isValid: false, error: 'QR code expired' };
            }

            // Проверяем подпись
            const { signature, ...dataToVerify } = qrData;
            const expectedSignature = this.createHMAC(JSON.stringify(dataToVerify));

            if (signature !== expectedSignature) {
                return { isValid: false, error: 'Invalid QR signature' };
            }

            return {
                isValid: true,
                familyId: qrData.familyId,
                clientCode: qrData.clientCode
            };
        } catch (error) {
            this.logger.error(`Failed to validate family QR: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { isValid: false, error: 'Invalid QR format' };
        }
    }

    /**
     * Создает HMAC подпись для данных
     */
    private createHMAC(data: string): string {
        return crypto.createHmac('sha256', this.hmacSecret).update(data).digest('hex');
    }

    /**
     * Генерирует QR-код для ваучера
     */
    async generateVoucherQR(voucherId: string, voucherCode: string): Promise<string> {
        try {
            const qrData = {
                voucherId,
                voucherCode,
                timestamp: Date.now(),
                type: 'voucher'
            };

            const signature = this.createHMAC(JSON.stringify(qrData));
            const signedData = {
                ...qrData,
                signature
            };

            const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(signedData), {
                width: 250,
                margin: 2,
                color: {
                    dark: '#4CAF50', // Зеленый цвет для ваучеров
                    light: '#FFFFFF'
                }
            });

            this.logger.log(`Generated voucher QR for ${voucherCode}`);
            return qrCodeDataURL;
        } catch (error) {
            this.logger.error(`Failed to generate voucher QR: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Валидирует QR-код ваучера
     */
    validateVoucherQR(qrDataString: string): { isValid: boolean; voucherId?: string; voucherCode?: string; error?: string } {
        try {
            const qrData = JSON.parse(qrDataString);

            if (!qrData.voucherId || !qrData.voucherCode || !qrData.signature || !qrData.timestamp) {
                return { isValid: false, error: 'Invalid voucher QR data structure' };
            }

            if (qrData.type !== 'voucher') {
                return { isValid: false, error: 'Invalid voucher QR type' };
            }

            // Проверяем время (ваучер действителен 30 дней)
            const now = Date.now();
            const qrTime = qrData.timestamp;
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 дней в миллисекундах

            if (now - qrTime > maxAge) {
                return { isValid: false, error: 'Voucher QR expired' };
            }

            const { signature, ...dataToVerify } = qrData;
            const expectedSignature = this.createHMAC(JSON.stringify(dataToVerify));

            if (signature !== expectedSignature) {
                return { isValid: false, error: 'Invalid voucher QR signature' };
            }

            return {
                isValid: true,
                voucherId: qrData.voucherId,
                voucherCode: qrData.voucherCode
            };
        } catch (error) {
            this.logger.error(`Failed to validate voucher QR: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { isValid: false, error: 'Invalid voucher QR format' };
        }
    }
}
