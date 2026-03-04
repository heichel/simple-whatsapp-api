import { Request, Response, NextFunction } from 'express';
import { ApiResponse, RegisterWebhookRequest, Webhook } from '../types';

export const registerWebhook = async (
  req: Request<{}, {}, RegisterWebhookRequest>,
  res: Response<ApiResponse<Webhook>>,
  next: NextFunction
) => {
  try {
    const { url, events = ['message'] } = req.body;

    // TODO: Implement actual webhook registration
    const webhook: Webhook = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      events,
      createdAt: new Date().toISOString()
    };

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

    // TODO: Implement actual webhook deletion
    const response: ApiResponse = {
      success: true,
      data: { message: `Webhook ${id} unregistered successfully` }
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
    // TODO: Implement actual webhook listing
    const webhooks: Webhook[] = [
      {
        id: 'wh_example_123',
        url: 'https://example.com/webhook',
        events: ['message', 'status'],
        createdAt: new Date().toISOString()
      }
    ];

    const response: ApiResponse<Webhook[]> = {
      success: true,
      data: webhooks
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
