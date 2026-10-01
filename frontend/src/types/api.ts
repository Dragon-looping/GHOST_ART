export interface CandidateArtwork {
  id: string;
  title: string;
  creator: string;
  similarity_score: number;
  phash_distance: number;
  image_path: string;
  sha256: string;
  phash: string;
  created_at: string;
  zk_commitment?: string | null;
}

export interface GeminiAnalysis {
  summary: string;
  similarities: string[];
  differences: string[];
  possible_modifications: string[];
}

export interface TraceResponse {
  status: string;
  message: string;
  query_phash: string;
  candidates: CandidateArtwork[];
  gemini_analysis: GeminiAnalysis | null;
  gemini_status: string;
}

export interface RegisteredArtwork {
  id: string;
  title: string;
  creator: string;
  sha256: string;
  phash: string;
  image_path: string;
  created_at: string;
  zk_commitment?: string | null;
}

export interface ArtworksListResponse {
  status: string;
  artworks: RegisteredArtwork[];
}

export interface RegisterArtworkResponse {
  status: string;
  message: string;
  artwork: RegisteredArtwork;
}

export interface HealthResponse {
  status: string;
  message: string;
}

export interface ZKStatusResponse {
  status: string;
  circuit: string;
  protocol: string;
  curve: string;
  has_wasm: boolean;
  has_zkey: boolean;
  has_vkey: boolean;
  vault_records_count: number;
  wasm_path?: string;
  vkey_path?: string;
}

export interface ZKProveResponse {
  valid: boolean;
  artwork_id: string;
  commitment: string;
  proof: Record<string, unknown>;
  public_signals: string[];
  message: string;
}

export interface ZKVerifyResponse {
  valid: boolean;
  artwork_id?: string | null;
  commitment?: string | null;
  message: string;
}
