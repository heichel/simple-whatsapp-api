import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * Validate send message request
 */
export const validateSendMessage = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const { to, message } = req.body;

  const errors: string[] = [];

  // Validate 'to' field
  if (!to) {
    errors.push('Field "to" is required');
  } else if (typeof to !== 'string') {
    errors.push('Field "to" must be a string');
  } else if (!/^\+?\d{10,15}(@s\.whatsapp\.net)?$/.test(to)) {
    errors.push('Field "to" must be a valid phone number (10-15 digits)');
  }

  // Validate 'message' field
  if (!message) {
    errors.push('Field "message" is required');
  } else if (typeof message !== 'string') {
    errors.push('Field "message" must be a string');
  } else if (message.trim().length === 0) {
    errors.push('Field "message" cannot be empty');
  } else if (message.length > 4096) {
    errors.push('Field "message" must not exceed 4096 characters');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: errors.join('; ')
    });
    return;
  }

  next();
};

/**
 * Validate webhook registration
 */
export const validateWebhookRegistration = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const { url, events } = req.body;

  const errors: string[] = [];

  // Validate URL
  if (!url) {
    errors.push('Field "url" is required');
  } else if (typeof url !== 'string') {
    errors.push('Field "url" must be a string');
  } else {
    try {
      new URL(url);
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        errors.push('Field "url" must be a valid HTTP/HTTPS URL');
      }
    } catch {
      errors.push('Field "url" must be a valid URL');
    }
  }

  // Validate events (optional)
  if (events !== undefined) {
    if (!Array.isArray(events)) {
      errors.push('Field "events" must be an array');
    } else if (events.length === 0) {
      errors.push('Field "events" cannot be empty if provided');
    } else if (!events.every(e => typeof e === 'string')) {
      errors.push('All items in "events" must be strings');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: errors.join('; ')
    });
    return;
  }

  next();
};
