export interface EmbeddingClient {
  embed(texts: string[]): Promise<number[][]>;
}

export const EMBEDDING_CLIENT = "EMBEDDING_CLIENT";
