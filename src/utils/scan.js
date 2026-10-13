import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

export async function scanCode() {
  // Ensure camera permission
  const { camera } = await BarcodeScanner.checkPermissions();
  if (!camera || camera !== 'granted') {
    const result = await BarcodeScanner.requestPermissions();
    if (result.camera !== 'granted') {
      throw new Error('Camera permission denied');
    }
  }

  // Perform scan
  const { barcodes } = await BarcodeScanner.scan();
  if (barcodes && barcodes.length > 0) {
    // Return first barcode raw value
    return barcodes[0].rawValue || barcodes[0].displayValue || '';
  }
  throw new Error('No barcode detected');
}
