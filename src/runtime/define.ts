import type { ErrorHandler } from '@apollo/client/link/error'
import type { ClientConfig } from './types'

export const defineApolloClient = (config: ClientConfig) => config

export const defineApolloErrorHandler = (handler: ErrorHandler) => handler
