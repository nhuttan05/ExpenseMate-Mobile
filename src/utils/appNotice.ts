import { Alert, Platform } from 'react-native';

type NoticeAction = () => void;

/** Cross-platform feedback: native Alert on devices and window.alert on web. */
export const showAppNotice = (title: string, message: string, action?: NoticeAction) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(`${title}\n\n${message}`);
    action?.();
    return;
  }

  Alert.alert(title, message, action ? [{ text: 'OK', onPress: action }] : undefined);
};
