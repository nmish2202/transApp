import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import type {ConversationItem, ConversationSession} from '@app-types/conversation';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatConversation(session: ConversationSession, items: ConversationItem[]): string {
  return [
    session.title,
    '',
    ...items.flatMap(item => [
      `Speaker ${item.speakerNumber}:`,
      `Nepali: ${item.nepaliText}`,
      `Hindi: ${item.hindiText || 'Pending translation'}`,
      `Timestamp: ${item.timestamp}`,
      ''
    ])
  ].join('\n');
}

function buildPdfHtml(session: ConversationSession, items: ConversationItem[]): string {
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #1f2937; }
          h1 { color: #1E4D40; margin-bottom: 24px; }
          .item { border: 1px solid #d6c7b2; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
          .speaker { font-weight: bold; color: #B46A35; margin-bottom: 8px; }
          .label { font-weight: bold; margin-top: 8px; }
          .timestamp { color: #6b7280; font-size: 12px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(session.title)}</h1>
        ${items
          .map(
            item => `
              <div class="item">
                <div class="speaker">Speaker ${item.speakerNumber}</div>
                <div class="label">Nepali</div>
                <div>${escapeHtml(item.nepaliText)}</div>
                <div class="label">Hindi</div>
                <div>${escapeHtml(item.hindiText || 'Pending translation')}</div>
                <div class="timestamp">${escapeHtml(item.timestamp)}</div>
              </div>
            `
          )
          .join('')}
      </body>
    </html>
  `;
}

async function ensureDirectory(directoryName: string): Promise<string> {
  const path = `${RNFS.DocumentDirectoryPath}/${directoryName}`;
  const exists = await RNFS.exists(path);
  if (!exists) {
    await RNFS.mkdir(path);
  }
  return path;
}

export const exportService = {
  async exportAsTxt(
    session: ConversationSession,
    items: ConversationItem[],
    directoryName: string
  ): Promise<string> {
    const directoryPath = await ensureDirectory(directoryName);
    const filePath = `${directoryPath}/${session.title.replace(/\s+/g, '_')}.txt`;
    await RNFS.writeFile(filePath, formatConversation(session, items), 'utf8');
    return filePath;
  },

  async exportAsPdf(
    session: ConversationSession,
    items: ConversationItem[],
    directoryName: string
  ): Promise<string> {
    await ensureDirectory(directoryName);
    const result = await RNHTMLtoPDF.convert({
      directory: directoryName,
      fileName: session.title.replace(/\s+/g, '_'),
      html: buildPdfHtml(session, items)
    });

    if (!result.filePath) {
      throw new Error('PDF export failed.');
    }

    return result.filePath;
  },

  async shareFile(filePath: string, type: string): Promise<void> {
    await Share.open({
      failOnCancel: false,
      type,
      url: `file://${filePath}`
    });
  }
};