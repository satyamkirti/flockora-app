import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { CapturedPhoto } from '../types/onboarding';

export type PickPhotoOutcome =
  | { status: 'success'; photo: CapturedPhoto }
  | { status: 'canceled' }
  | { status: 'permission_denied'; canAskAgain: boolean };

const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

/** Bird photos and health-record documents are only ever shown at small-to-medium sizes
 *  (badges, thumbnails, one detail-card image) — capping the longest edge avoids storing and
 *  re-decoding multi-megapixel camera output for images that are never displayed that large. */
const MAX_IMAGE_DIMENSION = 1600;

async function toCapturedPhoto(asset: ImagePicker.ImagePickerAsset): Promise<CapturedPhoto> {
  const fileName = asset.fileName ?? `bird-photo-${Date.now()}.jpg`;
  const exceedsMaxDimension = asset.width > MAX_IMAGE_DIMENSION || asset.height > MAX_IMAGE_DIMENSION;
  if (!exceedsMaxDimension) {
    return { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg', fileName };
  }

  try {
    const image = await ImageManipulator.manipulate(asset.uri).resize({ width: MAX_IMAGE_DIMENSION }).renderAsync();
    const resized = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
    return { uri: resized.uri, mimeType: 'image/jpeg', fileName };
  } catch {
    // Resize is a size optimization, not a correctness requirement — fall back to the
    // picker's own (already quality-compressed) output rather than blocking the capture.
    return { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg', fileName };
  }
}

/** Requests camera permission only when this is called (not on screen mount) and, if granted,
 *  opens the native camera. Never requests media-library permission — that's a separate flow. */
export async function captureFromCamera(): Promise<PickPhotoOutcome> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return { status: 'permission_denied', canAskAgain: permission.canAskAgain };
  }

  const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTIONS);
  if (result.canceled || result.assets.length === 0) {
    return { status: 'canceled' };
  }

  return { status: 'success', photo: await toCapturedPhoto(result.assets[0]) };
}

/** Requests photo-library permission only when this is called and, if granted, opens the
 *  native gallery picker. Never requests camera permission — that's a separate flow. */
export async function pickFromGallery(): Promise<PickPhotoOutcome> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { status: 'permission_denied', canAskAgain: permission.canAskAgain };
  }

  const result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTIONS);
  if (result.canceled || result.assets.length === 0) {
    return { status: 'canceled' };
  }

  return { status: 'success', photo: await toCapturedPhoto(result.assets[0]) };
}
