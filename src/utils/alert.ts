import { Alert as RNAlert, Platform } from 'react-native';

interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: any
  ) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 0) {
        // Find non-cancel button as default action
        const cancelBtn = buttons.find((b) => b.style === 'cancel');
        const primaryBtn = buttons.find((b) => b.style !== 'cancel') || buttons[0];

        if (cancelBtn) {
          const confirmed = window.confirm(`${title}${message ? `\n\n${message}` : ''}`);
          if (confirmed) {
            if (primaryBtn && primaryBtn.onPress) {
              primaryBtn.onPress();
            }
          } else {
            if (cancelBtn && cancelBtn.onPress) {
              cancelBtn.onPress();
            }
          }
        } else {
          window.alert(`${title}${message ? `\n\n${message}` : ''}`);
          if (primaryBtn && primaryBtn.onPress) {
            primaryBtn.onPress();
          }
        }
      } else {
        window.alert(`${title}${message ? `\n\n${message}` : ''}`);
      }
    } else {
      RNAlert.alert(title, message, buttons, options);
    }
  },
};
