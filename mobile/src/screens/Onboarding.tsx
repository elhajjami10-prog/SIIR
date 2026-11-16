import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, Mark, T, Wordmark } from '../components/ui';
import { LANGS } from '../i18n';
import { useApp } from '../store/AppStore';
import { C, R } from '../theme';

export default function Onboarding() {
  const app = useApp();
  const { t } = app;
  const ins = useSafeAreaInsets();
  const [step, setStep] = useState<'lang' | 'phone' | 'otp' | 'name'>('lang');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const digits = phone.replace(/\D/g, '').replace(/^212/, '').replace(/^0/, '');
  const phoneOk = /^[5-7]\d{8}$/.test(digits);
  const pretty = '+212 ' + digits.replace(/(\d)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');

  const back = step === 'phone' ? 'lang' : step === 'otp' ? 'phone' : step === 'name' ? 'otp' : null;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[s.wrap, { paddingTop: ins.top + 16, paddingBottom: ins.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={s.top}>
          {back ? (
            <IconButton label="Retour" onPress={() => { setErr(''); setStep(back); }} style={{ elevation: 0, shadowOpacity: 0, backgroundColor: C.bg }}>
              <Icon name="back" />
            </IconButton>
          ) : (
            <View style={{ height: 46 }} />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, direction: 'ltr' }}>
            <Mark size={28} />
            <Wordmark size={24} />
          </View>
          <View style={{ width: 46 }} />
        </View>

        {step === 'lang' && (
          <View style={s.body}>
            <Text style={T.h1}>{t('welcomeTitle')}</Text>
            <Text style={[T.muted, { fontSize: 15 }]}>{t('welcomeSub')}</Text>
            <Text style={[T.eyebrow, { marginTop: 18 }]}>{t('chooseLang')}</Text>
            {LANGS.map(l => (
              <Pressable key={l.id} onPress={() => app.setLang(l.id)} style={[s.opt, app.lang === l.id && s.optOn]} accessibilityRole="radio" accessibilityState={{ selected: app.lang === l.id }}>
                <Text style={[T.h3, { flex: 1 }]}>{l.label}</Text>
                {app.lang === l.id && <Icon name="check" color={C.green} />}
              </Pressable>
            ))}
            <Button title={t('continue')} onPress={() => setStep('phone')} style={{ marginTop: 'auto' }} />
          </View>
        )}

        {step === 'phone' && (
          <View style={s.body}>
            <Text style={T.h1}>{t('phoneTitle')}</Text>
            <Text style={T.muted}>{t('phoneSub')}</Text>
            <View style={[s.phoneRow, { direction: 'ltr' }]}>
              <View style={s.cc}>
                <Text style={{ fontSize: 18 }}>🇲🇦</Text>
                <Text style={T.h3}>+212</Text>
              </View>
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={v => { setPhone(v); setErr(''); }}
                placeholder={t('phonePh')}
                keyboardType="phone-pad"
                autoFocus
                maxLength={14}
                placeholderTextColor={C.faint}
              />
            </View>
            {!!err && <Text style={{ color: C.red }}>{err}</Text>}
            <Button title={t('continue')} style={{ marginTop: 'auto' }} onPress={() => (phoneOk ? setStep('otp') : setErr(t('invalidPhone')))} />
          </View>
        )}

        {step === 'otp' && (
          <View style={s.body}>
            <Text style={T.h1}>{t('otpTitle')}</Text>
            <Text style={T.muted}>{t('otpSub', { phone: pretty })}</Text>
            <TextInput
              style={[s.input, s.otp]}
              value={otp}
              onChangeText={v => setOtp(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              autoFocus
              maxLength={4}
              placeholder="• • • •"
              placeholderTextColor={C.faint}
              textContentType="oneTimeCode"
            />
            <Button title={t('continue')} disabled={otp.length !== 4} style={{ marginTop: 'auto' }} onPress={() => setStep('name')} />
          </View>
        )}

        {step === 'name' && (
          <View style={s.body}>
            <Text style={T.h1}>{t('nameTitle')}</Text>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t('namePh')} autoFocus autoCapitalize="words" placeholderTextColor={C.faint} />
            <Button
              title={t('start')}
              disabled={name.trim().length < 2}
              style={{ marginTop: 'auto' }}
              onPress={() => app.set({ onboarded: true, phone: pretty, name: name.trim() })}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, paddingHorizontal: 20 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  body: { flex: 1, gap: 12 },
  opt: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: R.md, borderWidth: 1.5, borderColor: C.line, backgroundColor: '#fff' },
  optOn: { borderColor: C.green, backgroundColor: C.greenSoft },
  phoneRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cc: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderRadius: R.md, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line },
  input: { flex: 1, fontSize: 18, fontWeight: '600', paddingHorizontal: 14, paddingVertical: 14, borderRadius: R.md, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, color: C.text },
  otp: { flex: 0, textAlign: 'center', fontSize: 30, letterSpacing: 18, marginTop: 10 },
});
