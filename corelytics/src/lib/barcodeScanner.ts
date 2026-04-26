import { Capacitor } from "@capacitor/core";
import { BarcodeFormat, BarcodeScanner, BarcodeValueType, LensFacing, Resolution } from "@capacitor-mlkit/barcode-scanning";

type ScanListener = { remove: () => Promise<void> };

type DetectedBarcode = {
  rawValue?: string;
  displayValue?: string;
  bytes?: number[];
  format: BarcodeFormat;
  valueType?: BarcodeValueType;
};

const preferredProductFormats = new Set<BarcodeFormat>([
  BarcodeFormat.Ean13,
  BarcodeFormat.Ean8,
  BarcodeFormat.UpcA,
  BarcodeFormat.UpcE,
  BarcodeFormat.Code128,
  BarcodeFormat.Code39,
  BarcodeFormat.Codabar,
  BarcodeFormat.Itf,
]);

const scanFormats: BarcodeFormat[] = [
  BarcodeFormat.Ean13,
  BarcodeFormat.Ean8,
  BarcodeFormat.UpcA,
  BarcodeFormat.UpcE,
  BarcodeFormat.Code128,
  BarcodeFormat.Code39,
  BarcodeFormat.Code93,
  BarcodeFormat.Codabar,
  BarcodeFormat.Itf,
  BarcodeFormat.QrCode,
  BarcodeFormat.DataMatrix,
  BarcodeFormat.Pdf417,
  BarcodeFormat.Aztec,
];

export const normalizeBarcodeValue = (value: string): string => {
  const trimmed = value.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");
  const hasOnlyNumericSeparators = /^[\d\s\-_.]+$/.test(trimmed);

  if (hasOnlyNumericSeparators && digitsOnly.length >= 6) {
    return digitsOnly;
  }

  return trimmed;
};

export const isLikelyBarcodeInput = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 512) {
    return false;
  }

  const normalized = normalizeBarcodeValue(trimmed);
  const hasDigitsOnly = /^\d+$/.test(normalized);

  return hasDigitsOnly && normalized.length >= 6 && normalized.length <= 20;
};

const extractBarcodeValue = (barcode: Pick<DetectedBarcode, "rawValue" | "displayValue" | "bytes">): string => {
  const raw = barcode.rawValue?.trim();
  if (raw) {
    return normalizeBarcodeValue(raw);
  }

  const display = barcode.displayValue?.trim();
  if (display) {
    return normalizeBarcodeValue(display);
  }

  if (barcode.bytes && barcode.bytes.length > 0) {
    const fromBytes = String.fromCharCode(...barcode.bytes).trim();
    if (fromBytes) {
      return normalizeBarcodeValue(fromBytes);
    }
  }

  return "";
};

const scoreBarcode = (barcode: DetectedBarcode): number => {
  const value = extractBarcodeValue(barcode);
  const digits = value.replace(/\D/g, "");

  return (
    (barcode.valueType === BarcodeValueType.Product ? 100 : 0) +
    (preferredProductFormats.has(barcode.format) ? 30 : 0) +
    (digits.length >= 8 && digits.length <= 14 ? 20 : 0) +
    Math.min(value.length, 20)
  );
};

const pickBestBarcodeValue = (barcodes: DetectedBarcode[]): string => {
  if (!barcodes.length) {
    return "";
  }

  const sorted = [...barcodes].sort((a, b) => scoreBarcode(b) - scoreBarcode(a));

  for (const barcode of sorted) {
    const value = extractBarcodeValue(barcode);
    if (value) {
      return value;
    }
  }

  return "";
};

const isAndroidEmulator = (): boolean => {
  if (Capacitor.getPlatform() !== "android") {
    return false;
  }

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  return /Emulator|Android SDK built for x86|google_sdk/i.test(ua);
};

const setScannerPreviewMode = (enabled: boolean): void => {
  if (typeof document === "undefined") {
    return;
  }

  const method = enabled ? "add" : "remove";
  document.documentElement.classList[method]("barcode-scanner-active");
  document.body.classList[method]("barcode-scanner-active");
};

const scanUsingContinuousMode = async (timeoutMs: number): Promise<string> => {
  let listener: ScanListener | null = null;

  const startScanWithFallback = async (): Promise<void> => {
    try {
      await BarcodeScanner.startScan({
        formats: scanFormats,
        lensFacing: LensFacing.Back,
        resolution: Resolution["1920x1080"],
      });
      return;
    } catch (highResError) {
      console.warn("High-resolution scanner start failed, retrying default resolution.", highResError);
    }

    try {
      await BarcodeScanner.startScan({
        formats: scanFormats,
        lensFacing: LensFacing.Back,
      });
      return;
    } catch (backCameraError) {
      console.warn("Back-camera scanner start failed, retrying plugin defaults.", backCameraError);
    }

    await BarcodeScanner.startScan();
  };

  return new Promise<string>((resolve) => {
    let settled = false;

    const finish = async (value: string) => {
      if (settled) {
        return;
      }

      settled = true;

      try {
        await BarcodeScanner.stopScan();
      } catch (stopError) {
        console.error("Failed to stop continuous barcode scan:", stopError);
      }

      if (listener) {
        await listener.remove();
      }

      resolve(value);
    };

    void (async () => {
      const timeout = setTimeout(() => {
        void finish("");
      }, timeoutMs);

      try {
        listener = await BarcodeScanner.addListener("barcodesScanned", (event) => {
          const value = pickBestBarcodeValue((event.barcodes ?? []) as DetectedBarcode[]);
          if (value) {
            clearTimeout(timeout);
            void finish(value);
          }
        });

        await startScanWithFallback();
      } catch (error) {
        console.error("Continuous barcode scan failed:", error);
        clearTimeout(timeout);
        await finish("");
      }
    })();
  });
};

const ensureCameraPermission = async (): Promise<boolean> => {
  const permissionStatus = await BarcodeScanner.checkPermissions();
  let cameraPermission = permissionStatus.camera;

  if (cameraPermission !== "granted") {
    const requestedPermissions = await BarcodeScanner.requestPermissions();
    cameraPermission = requestedPermissions.camera;
  }

  return cameraPermission === "granted";
};

export const isBarcodeScannerSupported = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const { supported } = await BarcodeScanner.isSupported();
    return supported;
  } catch {
    return false;
  }
};

export interface ScanBarcodeResult {
  value: string;
  usedContinuousFallback: boolean;
  likelyEmulator: boolean;
}

export const scanBarcodeLax = async (continuousTimeoutMs = 12000): Promise<ScanBarcodeResult> => {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("A vonalkod szkenner csak mobilalkalmazasban erheto el.");
  }

  const supported = await isBarcodeScannerSupported();
  if (!supported) {
    throw new Error("A vonalkod olvasas nem tamogatott ezen az eszkozon.");
  }

  const likelyEmulator = isAndroidEmulator();

  const hasPermission = await ensureCameraPermission();
  if (!hasPermission) {
    throw new Error("A vonalkod olvasashoz kamerahasznalati engedely szukseges.");
  }

  let scanErrorListener: ScanListener | null = null;

  try {
    setScannerPreviewMode(true);

    scanErrorListener = await BarcodeScanner.addListener("scanError", (event) => {
      if (event) {
        console.error("Barcode scan native error event:", event);
      }
    });

    const continuousValue = await scanUsingContinuousMode(continuousTimeoutMs);

    return {
      value: continuousValue,
      usedContinuousFallback: false,
      likelyEmulator,
    };
  } finally {
    setScannerPreviewMode(false);

    if (scanErrorListener) {
      await scanErrorListener.remove();
    }
  }
};
