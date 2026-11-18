// Web Bluetooth ESC/POS printing for thermal printers (e.g. Elgin, Bematech).
// Sends raw ESC/POS commands directly to the printer over BLE.

// Common BLE service/characteristic for Elgin and generic thermal printers
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '00001101-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
];

const PRINTER_CHAR_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
];

// ESC/POS command helpers
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

function cmd(...bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

function text(str: string): Uint8Array {
  // Convert to bytes (latin1-ish, strips accents for thermal printers)
  const normalized = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return new TextEncoder().encode(normalized);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

let connectedDevice: BluetoothDevice | null = null;
let connectedCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export function isPrinterConnected(): boolean {
  return connectedCharacteristic !== null && connectedDevice !== null;
}

export async function connectPrinter(): Promise<boolean> {
  if (!isWebBluetoothSupported()) {
    throw new Error('Web Bluetooth nao suportado neste navegador. Use Chrome ou Edge no Android.');
  }

  // Disconnect previous if any
  if (connectedDevice?.gatt?.connected) {
    try {
      connectedDevice.gatt.disconnect();
    } catch {
      // ignore
    }
  }
  connectedDevice = null;
  connectedCharacteristic = null;

  const bt = navigator.bluetooth;
  if (!bt) {
    throw new Error('Web Bluetooth nao disponivel neste navegador.');
  }
  const device = await bt.requestDevice({
    acceptAllDevices: true,
    optionalServices: PRINTER_SERVICE_UUIDS,
  });

  if (!device.gatt) {
    throw new Error('Dispositivo nao possui GATT.');
  }

  const server = await device.gatt.connect();

  // Try each known service/characteristic pair
  let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  for (const svcUuid of PRINTER_SERVICE_UUIDS) {
    try {
      const service = await server.getPrimaryService(svcUuid);
      for (const charUuid of PRINTER_CHAR_UUIDS) {
        try {
          characteristic = await service.getCharacteristic(charUuid);
          if (characteristic) break;
        } catch {
          // try next characteristic
        }
      }
      if (characteristic) break;
    } catch {
      // try next service
    }
  }

  if (!characteristic) {
    // Fallback: scan all services and characteristics for a writable one
    const services = await server.getPrimaryServices();
    for (const service of services) {
      const chars = await service.getCharacteristics();
      const writable = chars.find(
        (c) => c.properties.write || c.properties.writeWithoutResponse,
      );
      if (writable) {
        characteristic = writable;
        break;
      }
    }
  }

  if (!characteristic) {
    throw new Error('Nenhuma caracteristica de escrita encontrada na impressora.');
  }

  connectedDevice = device;
  connectedCharacteristic = characteristic;

  device.addEventListener('gattserverdisconnected', () => {
    connectedDevice = null;
    connectedCharacteristic = null;
  });

  return true;
}

export function getConnectedPrinterName(): string | null {
  return connectedDevice?.name ?? null;
}

export async function disconnectPrinter(): Promise<void> {
  if (connectedDevice?.gatt?.connected) {
    connectedDevice.gatt.disconnect();
  }
  connectedDevice = null;
  connectedCharacteristic = null;
}

async function writeData(data: Uint8Array): Promise<void> {
  if (!connectedCharacteristic) {
    throw new Error('Impressora nao conectada.');
  }

  // Split into chunks (BLE has ~180 byte MTU limit typically)
  const CHUNK_SIZE = 180;
  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const chunk = data.slice(offset, offset + CHUNK_SIZE);
    if (connectedCharacteristic.properties.writeWithoutResponse) {
      await connectedCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await connectedCharacteristic.writeValueWithResponse(chunk);
    }
  }
}

export interface ReceiptLine {
  text: string;
  bold?: boolean;
  center?: boolean;
  large?: boolean;
}

export async function printReceipt(lines: ReceiptLine[]): Promise<void> {
  // Initialize printer
  const parts: Uint8Array[] = [cmd(ESC, 0x40)]; // ESC @ — init

  for (const line of lines) {
    // Alignment
    if (line.center) {
      parts.push(cmd(ESC, 0x61, 0x01)); // center
    } else {
      parts.push(cmd(ESC, 0x61, 0x00)); // left
    }

    // Bold
    parts.push(cmd(ESC, 0x45, line.bold ? 0x01 : 0x00));

    // Size
    if (line.large) {
      parts.push(cmd(GS, 0x21, 0x11)); // double width + height
    } else {
      parts.push(cmd(GS, 0x21, 0x00)); // normal
    }

    parts.push(text(line.text));
    parts.push(cmd(LF));
  }

  // Feed 3 lines and cut
  parts.push(cmd(ESC, 0x64, 0x03)); // feed 3 lines
  parts.push(cmd(GS, 0x56, 0x01)); // partial cut

  await writeData(concat(...parts));
}

export async function printTestReceipt(): Promise<void> {
  await printReceipt([
    { text: 'MABELLY BURGUERS', center: true, bold: true, large: true },
    { text: 'TESTE DE IMPRESSAO', center: true },
    { text: 'Bluetooth conectado', center: true },
    { text: '--------------------------------' },
    { text: 'A impressora esta pronta.' },
    { text: '--------------------------------' },
  ]);
}
