import Tesseract from 'tesseract.js';

/**
 * Perform real optical character recognition (OCR) on an image file or data URL.
 * @param {File|Blob|string} imageSource - File object, Blob, or base64 DataURL
 * @param {Function} onProgress - Optional callback for live progress ({ status, progress })
 * @returns {Promise<{ rawText: string, lines: string[], confidence: number }>}
 */
export async function performOcrScan(imageSource, onProgress = null) {
  try {
    const result = await Tesseract.recognize(
      imageSource,
      'eng',
      {
        logger: (m) => {
          if (onProgress && m.status) {
            onProgress({
              status: m.status,
              progress: Math.round((m.progress || 0) * 100)
            });
          }
        }
      }
    );

    const rawText = result.data.text || '';
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 2);

    return {
      rawText,
      lines,
      confidence: result.data.confidence || 90
    };
  } catch (error) {
    console.error('[OCR Service] Tesseract recognition failed:', error);
    return {
      rawText: '',
      lines: [],
      confidence: 0,
      error: error.message
    };
  }
}
