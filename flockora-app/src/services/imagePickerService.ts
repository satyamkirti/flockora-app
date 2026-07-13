import * as ImagePicker from 'expo-image-picker';
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

function toCapturedPhoto(asset: ImagePicker.ImagePickerAsset): CapturedPhoto {
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileName: asset.fileName ?? `bird-photo-${Date.now()}.jpg`,
  };
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

  return { status: 'success', photo: toCapturedPhoto(result.assets[0]) };
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

  return { status: 'success', photo: toCapturedPhoto(result.assets[0]) };
}
