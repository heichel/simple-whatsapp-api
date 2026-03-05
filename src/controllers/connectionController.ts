import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ConnectionStatus } from '../types/index.js';
import whatsappService from '../services/whatsappService.js';
import QRCode from 'qrcode';

export const getConnectionStatus = async (
  req: Request,
  res: Response<ApiResponse<ConnectionStatus>>,
  next: NextFunction
) => {
  try {
    const serviceStatus = whatsappService.getConnectionStatus();
    
    const status: ConnectionStatus = {
      connected: serviceStatus.connected,
      sessionExists: serviceStatus.sessionExists,
      qrCode: serviceStatus.qrCode ?? undefined
    };

    const response: ApiResponse<ConnectionStatus> = {
      success: true,
      data: status
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getQRCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const qrCodeData = whatsappService.getQRCode();

    if (!qrCodeData) {
      const response: ApiResponse = {
        success: false,
        error: 'No QR code available. WhatsApp may already be connected or not yet initialized.'
      };
      return res.status(404).json(response);
    }

    // Convert QR code data to PNG image buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      type: 'png',
      width: 300,
      margin: 2
    });

    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(qrCodeBuffer);
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    await whatsappService.logout();
    
    const response: ApiResponse = {
      success: true,
      data: { message: 'Logged out successfully' }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
