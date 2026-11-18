export interface CepResult {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

const STORE_ADDRESS = 'Jardim São Domingos, Guarulhos, São Paulo, Brasil';

let storeCoordinatesCache: Coordinates | null = null;

export async function lookupCep(cep: string): Promise<CepResult | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return {
      logradouro: data.logradouro ?? '',
      bairro: data.bairro ?? '',
      localidade: data.localidade ?? '',
      uf: data.uf ?? '',
    };
  } catch {
    return null;
  }
}

async function nominatimSearch(params: Record<string, string>): Promise<Coordinates | null> {
  try {
    const query = new URLSearchParams({ format: 'json', limit: '1', ...params });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${query.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export interface AddressParts {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  cep?: string;
}

async function geocodeStructured(parts: AddressParts): Promise<Coordinates | null> {
  const streetWithNumber = [parts.street, parts.number].filter(Boolean).join(' ');

  // Tentativa 1: rua + número + cidade
  if (streetWithNumber && parts.city) {
    const coords = await nominatimSearch({
      street: streetWithNumber,
      city: parts.city,
      country: 'Brazil',
    });
    if (coords) return coords;
  }

  // Tentativa 2: rua + cidade (sem número)
  if (parts.street && parts.city) {
    const coords = await nominatimSearch({
      street: parts.street,
      city: parts.city,
      country: 'Brazil',
    });
    if (coords) return coords;
  }

  // Tentativa 3: bairro + cidade
  if (parts.neighborhood && parts.city) {
    const coords = await nominatimSearch({
      q: `${parts.neighborhood}, ${parts.city}, Brazil`,
    });
    if (coords) return coords;
  }

  // Tentativa 4: CEP + país
  if (parts.cep) {
    const cleanCep = parts.cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      const coords = await nominatimSearch({
        postalcode: cleanCep,
        country: 'Brazil',
      });
      if (coords) return coords;
    }
  }

  // Tentativa 5: busca livre com tudo
  const fullText = [
    streetWithNumber,
    parts.neighborhood,
    parts.city,
    'Brazil',
  ].filter(Boolean).join(', ');
  if (fullText) {
    const coords = await nominatimSearch({ q: fullText });
    if (coords) return coords;
  }

  return null;
}

async function geocodeAddress(address: string): Promise<Coordinates | null> {
  return nominatimSearch({ q: address });
}

export async function getStoreCoordinates(): Promise<Coordinates | null> {
  if (storeCoordinatesCache) return storeCoordinatesCache;
  const coords = await geocodeAddress(STORE_ADDRESS);
  if (coords) storeCoordinatesCache = coords;
  return coords;
}

export async function geocodeAddressFallback(address: string, parts?: AddressParts): Promise<Coordinates | null> {
  if (parts) {
    const coords = await geocodeStructured(parts);
    if (coords) return coords;
  }
  return geocodeAddress(address);
}

function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function calculateDistanceKm(
  origin: Coordinates,
  destination: Coordinates,
): Promise<number> {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`,
    );
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        return data.routes[0].distance / 1000;
      }
    }
  } catch {
    // fall through to haversine
  }
  return haversineKm(origin, destination);
}

export function calculateDeliveryFee(distanceKm: number): number {
  if (distanceKm < 1) return 4;
  return 4 + Math.ceil(distanceKm);
}
