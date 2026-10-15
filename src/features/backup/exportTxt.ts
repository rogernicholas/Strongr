import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Writes the text to a .txt file and opens Android's share sheet (Drive, email, Files…). */
export async function shareTextFile(fileName: string, text: string, dialogTitle: string) {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(text);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/plain',
    dialogTitle,
    UTI: 'public.plain-text',
  });
}
