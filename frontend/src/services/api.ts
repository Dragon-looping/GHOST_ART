import type {
  ArtworksListResponse,
  CandidateArtwork,
  HealthResponse,
  RegisterArtworkResponse,
  RegisteredArtwork,
  TraceResponse,
  ZKProveResponse,
  ZKStatusResponse,
  ZKVerifyResponse,
} from '../types/api';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Returns the public image URL for a registered artwork candidate or database item.
 * Supports both /artworks/{id}/image and /uploads/{filename}.
 */
export function getArtworkImageUrl(item: CandidateArtwork | RegisteredArtwork): string {
  if (!item) return '';
  // Try clean filename from path
  const filename = item.image_path ? item.image_path.replace(/\\/g, '/').split('/').pop() : '';
  if (filename) {
    return `${API_BASE_URL}/uploads/${filename}`;
  }
  return `${API_BASE_URL}/artworks/${item.id}/image`;
}

/**
 * Check backend health status.
 */
export async function checkBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Backend health check failed with status: ${response.status}`);
  }
  return response.json();
}

/**
 * Trace suspected artwork against registered database.
 * IMPORTANT: Exact FastAPI endpoint parameter name is `file`.
 */
export async function traceArtwork(imageFile: File, limit = 5): Promise<TraceResponse> {
  const formData = new FormData();
  formData.append('file', imageFile);

  const response = await fetch(`${API_BASE_URL}/trace?limit=${limit}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `Trace request failed with status: ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * List all registered reference artworks.
 */
export async function fetchArtworks(): Promise<ArtworksListResponse> {
  const response = await fetch(`${API_BASE_URL}/artworks`);
  if (!response.ok) {
    throw new Error(`Failed to fetch artworks list with status: ${response.status}`);
  }
  return response.json();
}

/**
 * Register a new reference artwork.
 */
export async function registerArtwork(
  imageFile: File,
  title: string,
  creator: string
): Promise<RegisterArtworkResponse> {
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('title', title.trim() || 'Untitled');
  formData.append('creator', creator.trim() || 'Anonymous');

  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `Registration failed with status: ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Fetch Zero-Knowledge proof subsystem status.
 */
export async function fetchZKStatus(): Promise<ZKStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/zk/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ZK status with status: ${response.status}`);
  }
  return response.json();
}

/**
 * Request server-side generation of a Groth16 zero-knowledge proof for a registered artwork.
 * Proves knowledge of the secret without revealing it.
 */
export async function generateZKProof(
  artworkId: string,
  secret?: string
): Promise<ZKProveResponse> {
  const response = await fetch(`${API_BASE_URL}/zk/prove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      artwork_id: artworkId,
      secret: secret || undefined,
    }),
  });

  if (!response.ok) {
    let errorDetail = `ZK proof generation failed with status: ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Verify a Groth16 zero-knowledge proof against the verification key and registered commitment.
 */
export async function verifyZKProof(
  artworkId: string,
  proof: Record<string, unknown>,
  publicSignals: string[],
  commitment?: string
): Promise<ZKVerifyResponse> {
  const response = await fetch(`${API_BASE_URL}/zk/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      artwork_id: artworkId,
      proof,
      public_signals: publicSignals,
      commitment,
    }),
  });

  if (!response.ok) {
    let errorDetail = `ZK verification failed with status: ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

