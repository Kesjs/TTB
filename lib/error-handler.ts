// Types d'erreurs personnalisés
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

// Fonction utilitaire pour gérer les erreurs de manière cohérente
export function handleError(error: unknown): {
  message: string;
  statusCode: number;
  code?: string;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      statusCode: 500,
    };
  }

  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
  };
}

// Fonction pour wrapper les async functions avec error handling
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (errorMessage) {
      throw new AppError(errorMessage);
    }
    throw error;
  }
}

// Fonction pour logger les erreurs de manière structurée
export function logError(error: unknown, context?: Record<string, unknown>) {
  const errorInfo = handleError(error);
  
  if (process.env.NODE_ENV === 'production') {
    // En production, logger seulement les informations essentielles
    console.error(JSON.stringify({
      error: errorInfo.code || 'UNKNOWN_ERROR',
      message: errorInfo.message,
      statusCode: errorInfo.statusCode,
      timestamp: new Date().toISOString(),
      ...context,
    }));
  } else {
    // En développement, logger l'erreur complète
    console.error('Error:', error);
    if (context) {
      console.error('Context:', context);
    }
  }
}
