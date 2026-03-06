import { Request, Response, NextFunction } from 'express';
import { ApiResponse, RegisterWebhookRequest, Webhook } from '../types/index.js';
import webhookService from '../services/webhookService.js';

export const registerWebhook = async (
  req: Request<{}, {}, RegisterWebhookRequest>,
  res: Response<ApiResponse<Webhook>>,
  next: NextFunction
) => {
  try {
    const { url, events = ['message'] } = req.body;
    const webhook = webhookService.registerWebhook(url, events);

    const response: ApiResponse<Webhook> = {
      success: true,
      data: webhook
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const unregisterWebhook = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const removed = webhookService.unregisterWebhook(id);

    if (!removed) {
      const error = new Error(`Webhook ${id} not found`) as Error & { statusCode?: number };
      error.statusCode = 404;
      throw error;
    }

    const response: ApiResponse = {
      success: true,
      data: { message: `Webhook ${id} unregistered successfully. NOTE: Do not reply immediately to messages to avoid being flagged as spam.` }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const listWebhooks = async (
  req: Request,
  res: Response<ApiResponse<Webhook[]>>,
  next: NextFunction
) => {
  try {
    const webhooks = webhookService.listWebhooks();

    const response: ApiResponse<Webhook[]> = {
      success: true,
      data: webhooks
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
