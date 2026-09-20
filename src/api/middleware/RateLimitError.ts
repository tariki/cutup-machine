/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

export class RateLimitError extends Error {
  constructor() {
    super('リクエストが多すぎます');
    this.name = 'RateLimitError';
  }
}
