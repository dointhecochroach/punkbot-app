import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Switch, ScrollView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/ThemeContext';
import { AlertConfig, getAlertsForSymbol, saveAlert, deleteAlert, toggleAlert, generateAlertId } from '@/lib/alertsStorage';

interface AlertConfigModalProps {
  visible: boolean;
  onClose: (alerts: AlertConfig[]) => void;
  symbol: string;
  currentPrice: number | null;
}

export function AlertConfigModal({ visible, onClose, symbol, currentPrice }: AlertConfigModalProps) {
  const { theme } = useTheme();
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [priceAbove, setPriceAbove] = useState('');
  const [priceBelow, setPriceBelow] = useState('');
  const [rsiAbove, setRsiAbove] = useState('');
  const [rsiBelow, setRsiBelow] = useState('');
  const [adxAbove, setAdxAbove] = useState('');
  const [macdCrossover, setMacdCrossover] = useState(false);
  
  useEffect(() => {
    if (visible) {
      loadAlerts();
      setShowAddForm(false);
    }
  }, [visible, symbol]);
  
  const loadAlerts = async () => {
    try {
      const data = await getAlertsForSymbol(symbol);
      console.log('[ALERTS] Loaded alerts:', data.length);
      setAlerts(data);
    } catch (err) {
      console.log('[ALERTS] Error loading:', err);
    }
  };
  
  const handleAddAlert = useCallback(async () => {
    console.log('[ALERTS] handleAddAlert called - priceAbove:', JSON.stringify(priceAbove), 'priceBelow:', JSON.stringify(priceBelow), 'rsiAbove:', JSON.stringify(rsiAbove), 'macdCrossover:', macdCrossover);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    
    const newAlert: AlertConfig = {
      id: generateAlertId(),
      symbol,
      enabled: true,
      priceAbove: priceAbove.trim() ? parseFloat(priceAbove.trim()) : undefined,
      priceBelow: priceBelow.trim() ? parseFloat(priceBelow.trim()) : undefined,
      rsiAbove: rsiAbove.trim() ? parseFloat(rsiAbove.trim()) : undefined,
      rsiBelow: rsiBelow.trim() ? parseFloat(rsiBelow.trim()) : undefined,
      adxAbove: adxAbove.trim() ? parseFloat(adxAbove.trim()) : undefined,
      macdCrossover: macdCrossover || undefined,
      createdAt: Date.now(),
    };
    
    console.log('[ALERTS] Saving alert:', JSON.stringify(newAlert));
    await saveAlert(newAlert);
    console.log('[ALERTS] Alert saved successfully');
    await loadAlerts();
    setPriceAbove('');
    setPriceBelow('');
    setRsiAbove('');
    setRsiBelow('');
    setAdxAbove('');
    setMacdCrossover(false);
    setShowAddForm(false);
  }, [priceAbove, priceBelow, rsiAbove, rsiBelow, adxAbove, macdCrossover, symbol]);
  
  const handleToggle = async (alertId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleAlert(alertId);
    await loadAlerts();
  };
  
  const handleDelete = async (alertId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteAlert(alertId);
    await loadAlerts();
  };
  
  const getAlertConditions = (alert: AlertConfig): { label: string; value: string }[] => {
    const conditions: { label: string; value: string }[] = [];
    if (alert.priceAbove != null && !isNaN(Number(alert.priceAbove))) conditions.push({ label: 'Price Above', value: `$${Number(alert.priceAbove).toLocaleString()}` });
    if (alert.priceBelow != null && !isNaN(Number(alert.priceBelow))) conditions.push({ label: 'Price Below', value: `$${Number(alert.priceBelow).toLocaleString()}` });
    if (alert.rsiAbove != null) conditions.push({ label: 'RSI Above', value: `${alert.rsiAbove}` });
    if (alert.rsiBelow != null) conditions.push({ label: 'RSI Below', value: `${alert.rsiBelow}` });
    if (alert.adxAbove != null) conditions.push({ label: 'ADX Above', value: `${alert.adxAbove}` });
    if (alert.macdCrossover) conditions.push({ label: 'MACD', value: 'Bullish Cross' });
    return conditions;
  };
  
  const handleClose = useCallback(async () => {
    console.log('[ALERTS] handleClose called');
    Keyboard.dismiss();
    const freshAlerts = await getAlertsForSymbol(symbol);
    console.log('[ALERTS] Passing back alerts:', freshAlerts.length);
    onClose(freshAlerts);
  }, [symbol, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={[styles.modal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>Alert Configuration</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>{symbol}</Text>
            </View>
            <TouchableOpacity 
              onPress={handleClose} 
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              style={[styles.closeX, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Ionicons name="close" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
          >
            {alerts.length > 0 && (
              <View style={styles.alertsList}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ACTIVE ALERTS</Text>
                {alerts.map(alert => {
                  const conditions = getAlertConditions(alert);
                  return (
                    <View
                      key={alert.id}
                      style={[
                        styles.alertCard,
                        {
                          backgroundColor: alert.enabled ? theme.accent + '18' : theme.backgroundSecondary,
                          borderColor: alert.enabled ? theme.accent + '80' : theme.cardBorder,
                        },
                      ]}
                    >
                      <View style={styles.alertCardHeader}>
                        <View style={styles.alertCardStatus}>
                          <View style={[styles.alertDot, { backgroundColor: alert.enabled ? theme.accent : theme.textMuted }]} />
                          <Text style={[styles.alertStatusText, { color: alert.enabled ? theme.accent : theme.textMuted }]}>
                            {alert.enabled ? 'ACTIVE' : 'OFF'}
                          </Text>
                        </View>
                        <View style={styles.alertCardActions}>
                          <Switch
                            value={alert.enabled}
                            onValueChange={() => handleToggle(alert.id)}
                            trackColor={{ false: theme.backgroundTertiary, true: theme.accentGlow }}
                            thumbColor={alert.enabled ? theme.accent : theme.textMuted}
                            style={{ transform: [{ scale: 0.7 }] }}
                          />
                          <TouchableOpacity onPress={() => handleDelete(alert.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="trash-outline" size={16} color="#ff4466" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {conditions.length > 0 ? (
                        <View style={styles.alertConditions}>
                          {conditions.map((cond, idx) => (
                            <View key={idx} style={[styles.conditionRow, { borderBottomColor: theme.cardBorder }]}>
                              <Text style={[styles.conditionLabel, { color: theme.textSecondary }]}>{cond.label}</Text>
                              <Text style={[styles.conditionValue, { color: alert.enabled ? theme.text : theme.textMuted }]}>{cond.value}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.alertConditions}>
                          <Text style={{ fontSize: 11, color: theme.textMuted, fontFamily: 'Inter_400Regular' }}>Alert active (no price conditions)</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
            
            {!showAddForm ? (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.accent }]}
                onPress={() => {
                  console.log('[ALERTS] Add Alert button pressed');
                  setShowAddForm(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color="#000" />
                <Text style={styles.addButtonText}>Add New Alert</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.form}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>NEW ALERT</Text>
                
                <View style={styles.formGrid}>
                  <View style={styles.formHalf}>
                    <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Price Above</Text>
                    <TextInput
                      style={[styles.inputCompact, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.cardBorder }]}
                      placeholder={currentPrice ? `${Math.round(currentPrice * 1.05)}` : '50000'}
                      placeholderTextColor={theme.textMuted}
                      keyboardType="decimal-pad"
                      value={priceAbove}
                      onChangeText={setPriceAbove}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.formHalf}>
                    <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Price Below</Text>
                    <TextInput
                      style={[styles.inputCompact, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.cardBorder }]}
                      placeholder={currentPrice ? `${Math.round(currentPrice * 0.95)}` : '40000'}
                      placeholderTextColor={theme.textMuted}
                      keyboardType="decimal-pad"
                      value={priceBelow}
                      onChangeText={setPriceBelow}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
                
                <View style={styles.formGrid}>
                  <View style={styles.formHalf}>
                    <Text style={[styles.formLabel, { color: theme.textSecondary }]}>RSI Above</Text>
                    <TextInput
                      style={[styles.inputCompact, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.cardBorder }]}
                      placeholder="70"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="decimal-pad"
                      value={rsiAbove}
                      onChangeText={setRsiAbove}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.formHalf}>
                    <Text style={[styles.formLabel, { color: theme.textSecondary }]}>RSI Below</Text>
                    <TextInput
                      style={[styles.inputCompact, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.cardBorder }]}
                      placeholder="30"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="decimal-pad"
                      value={rsiBelow}
                      onChangeText={setRsiBelow}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
                
                <View style={styles.formGrid}>
                  <View style={styles.formHalf}>
                    <Text style={[styles.formLabel, { color: theme.textSecondary }]}>ADX Above</Text>
                    <TextInput
                      style={[styles.inputCompact, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.cardBorder }]}
                      placeholder="25"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="decimal-pad"
                      value={adxAbove}
                      onChangeText={setAdxAbove}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.formHalf}>
                    <Text style={[styles.formLabel, { color: theme.textSecondary }]}>MACD Cross</Text>
                    <View style={[styles.switchCompact, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}>
                      <Text style={{ fontSize: 12, color: macdCrossover ? theme.accent : theme.textMuted, fontFamily: 'Inter_500Medium' }}>
                        {macdCrossover ? 'ON' : 'OFF'}
                      </Text>
                      <Switch
                        value={macdCrossover}
                        onValueChange={setMacdCrossover}
                        trackColor={{ false: theme.backgroundTertiary, true: theme.accentGlow }}
                        thumbColor={macdCrossover ? theme.accent : theme.textMuted}
                        style={{ transform: [{ scale: 0.8 }] }}
                      />
                    </View>
                  </View>
                </View>
                
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary, borderWidth: 1, borderColor: theme.cardBorder }]}
                    onPress={() => {
                      setPriceAbove('');
                      setPriceBelow('');
                      setRsiAbove('');
                      setRsiBelow('');
                      setAdxAbove('');
                      setMacdCrossover(false);
                      setShowAddForm(false);
                      Keyboard.dismiss();
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={16} color={theme.textSecondary} />
                    <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.accent }]}
                    onPress={handleAddAlert}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark" size={16} color="#000" />
                    <Text style={styles.saveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
          
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.accent + '20', borderWidth: 1, borderColor: theme.accent + '60' }]}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeButtonText, { color: theme.accent }]}>Close & Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 24 : 34,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '85%',
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  closeX: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  scrollContent: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollInner: {
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  alertsList: {
    marginBottom: 16,
    gap: 8,
  },
  alertCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  alertCardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertStatusText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  alertCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertConditions: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
  },
  conditionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  conditionValue: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  addButtonText: {
    color: '#000',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  form: {
    marginBottom: 8,
  },
  formGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  formHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  inputCompact: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
  },
  switchCompact: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 2,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  cancelText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveText: {
    color: '#000',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
