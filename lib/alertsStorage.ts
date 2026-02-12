import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AlertConfig {
  id: string;
  symbol: string;
  enabled: boolean;
  priceAbove?: number;
  priceBelow?: number;
  rsiAbove?: number;
  rsiBelow?: number;
  adxAbove?: number;
  macdCrossover?: boolean;
  createdAt: number;
}

const ALERTS_STORAGE_KEY = 'traderpunk_alerts';

export async function getAlerts(): Promise<AlertConfig[]> {
  try {
    const data = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading alerts:', error);
    return [];
  }
}

export async function getAlertsForSymbol(symbol: string): Promise<AlertConfig[]> {
  const alerts = await getAlerts();
  return alerts.filter(a => a.symbol === symbol);
}

export async function saveAlert(alert: AlertConfig): Promise<void> {
  try {
    const alerts = await getAlerts();
    const existingIndex = alerts.findIndex(a => a.id === alert.id);
    if (existingIndex >= 0) {
      alerts[existingIndex] = alert;
    } else {
      alerts.push(alert);
    }
    await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.error('Error saving alert:', error);
  }
}

export async function deleteAlert(alertId: string): Promise<void> {
  try {
    const alerts = await getAlerts();
    const filtered = alerts.filter(a => a.id !== alertId);
    await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting alert:', error);
  }
}

export async function toggleAlert(alertId: string): Promise<void> {
  try {
    const alerts = await getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      alert.enabled = !alert.enabled;
      await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    }
  } catch (error) {
    console.error('Error toggling alert:', error);
  }
}

export function generateAlertId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
