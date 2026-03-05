import { Request, Response, NextFunction } from 'express';
import { ApiResponse, SendMessageRequest, SendMessageResponse, MessageStatusResponse } from '../types/index.js';
import whatsappService from '../services/whatsappService.js';

export const sendMessage = async (
  req: Request<{}, {}, SendMessageRequest>,
  res: Response<ApiResponse<SendMessageResponse>>,
  next: NextFunction
) => {
  try {
    const { to, message } = req.body;

    // Send message via WhatsApp service
    const result = await whatsappService.sendMessage(to, message);

    const response: ApiResponse<SendMessageResponse> = {
      success: true,
      data: {
        messageId: result.messageId,
        status: result.status
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getMessageStatus = async (
  req: Request<{ messageId: string }>,
  res: Response<ApiResponse<MessageStatusResponse>>,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;

    // TODO: Implement actual status checking
    const response: ApiResponse<MessageStatusResponse> = {
      success: true,
      data: {
        messageId,
        status: 'delivered',
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
