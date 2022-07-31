declare module '*.gql' {
  import { DocumentNode } from 'graphql'
  const Schema: DocumentNode
  export = Schema
}

declare module '*.graphql' {
  import { DocumentNode } from 'graphql'
  const Schema: DocumentNode
  export = Schema
}
