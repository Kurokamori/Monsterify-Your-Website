import type { ChatInputCommandInteraction } from 'discord.js';
import type { CommandMiddleware, MiddlewareNext } from '../types/command.types.js';
import { EmbedColor } from '../constants/colors.js';

// ============================================================================
// Bot-specific error classes
// ============================================================================

/**
 * Base error for bot commands. Includes a user-facing message and optional
 * embed title. Throwing a `BotError` (or subclass) from a command handler
 * will cause the error middleware to reply with a styled embed.
 */
export class BotError extends Error {
  readonly title: string;
  readonly ephemeral: boolean;

  constructor(message: string, title = 'Error', ephemeral = true) {
    super(message);
    this.name = 'BotError';
    this.title = title;
    this.ephemeral = ephemeral;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** The user's account isn't linked. */
export class AccountNotLinkedError extends BotError {
  constructor() {
    super(
      'Your Discord account is not linked to a Dusk & Dawn account.\n' +
        'Use `/link-account` or visit the website to link your account.',
      'Account Not Linked',
    );
    this.name = 'AccountNotLinkedError';
  }
}

/** A resource (trainer, monster, item, etc.) wasn't found. */
export class NotFoundError extends BotError {
  constructor(resource = 'Resource') {
    super(`${resource} not found.`, 'Not Found');
    this.name = 'NotFoundError';
  }
}

/** The user doesn't have permission. */
export class PermissionError extends BotError {
  constructor(message = 'You do not have permission to do that.') {
    super(message, 'Permission Denied');
    this.name = 'PermissionError';
  }
}

/** Input validation failed. */
export class ValidationError extends BotError {
  constructor(message: string) {
    super(message, 'Invalid Input');
    this.name = 'ValidationError';
  }
}

/** The backend API returned an error. */
export class ApiError extends BotError {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message, 'API Error');
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// ============================================================================
// Error reply helper
// ============================================================================

/**
 * Safely reply to an interaction with an error embed.
 * Handles the case where the interaction was already replied/deferred.
 */
async function replyWithError(
  interaction: ChatInputCommandInteraction,
  title: string,
  description: string,
  ephemeral: boolean,
): Promise<void> {
  const payload = {
    embeds: [{
      color: EmbedColor.ERROR,
      title,
      description,
    }],
    ephemeral,
  };

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch (replyErr) {
    console.error('Failed to send error reply:', replyErr);
  }
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Error-handling middleware. Wraps `next()` in a try/catch so any error
 * thrown by downstream middleware or the command handler is caught and
 * surfaced to the user as a styled embed.
 *
 * Place this as the **first** middleware in the pipeline so it catches
 * errors from all subsequent middleware and the command handler.
 *
 * Recognises:
 * - `BotError` (and subclasses) — shows their custom title + message.
 * - Axios errors — extracts the API response message.
 * - Unknown errors — shows a generic "something went wrong" message.
 */
export const errorHandler: CommandMiddleware = async (
  interaction: ChatInputCommandInteraction,
  next: MiddlewareNext,
): Promise<void> => {
  try {
    await next();
  } catch (err: unknown) {
    // Known bot errors
    if (err instanceof BotError) {
      await replyWithError(interaction, err.title, err.message, err.ephemeral);
      return;
    }

    // Axios API errors
    if (isAxiosError(err)) {
      const status = err.response?.status ?? 0;
      const apiMessage =
        (err.response?.data as { message?: string } | undefined)?.message ??
        err.message;

      console.error(
        `API error in /${interaction.commandName}: ${status} ${apiMessage}`,
      );

      if (status === 404) {
        await replyWithError(interaction, 'Not Found', apiMessage || 'The requested resource was not found.', true);
      } else if (status === 429) {
        await replyWithError(interaction, 'Rate Limited', 'Too many requests — please wait a moment and try again.', true);
      } else if (status >= 400 && status < 500) {
        await replyWithError(interaction, 'Error', apiMessage || 'The request could not be completed.', true);
      } else {
        await replyWithError(interaction, 'Server Error', apiMessage || 'Something went wrong on the server. Please try again.', true);
      }
      return;
    }

    // Unknown errors
    console.error(`Unhandled error in /${interaction.commandName}:`, err);
    await replyWithError(
      interaction,
      'Something Went Wrong',
      'An unexpected error occurred. Please try again later.',
      true,
    );
  }
};

// ============================================================================
// Helpers
// ============================================================================

interface AxiosLikeError {
  isAxiosError: boolean;
  response?: {
    status: number;
    data: unknown;
  };
  message: string;
}

function isAxiosError(err: unknown): err is AxiosLikeError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'isAxiosError' in err &&
    (err as AxiosLikeError).isAxiosError === true
  );
}
