import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Icon, IconButton, Pill, T } from '../components/ui';
import { COMPANY_PAYMENT, PlanId, PLANS, SubMethod } from '../data/catalog';
import { SubPayment, useApp } from '../store/AppStore';
import { C, R } from '../theme';

const METHODS: { id: SubMethod; icon: string }[] = [
  { id: 'cmi', icon: 'card' },
  { id: 'virement', icon: 'bank' },
  { id: 'wafacash', icon: 'store' },
];

export default function Subscription() {
  const app = useApp();
  const { t } = app;
  const ins = useSafeAreaInsets();
  const [plan, setPlan] = useState<PlanId>('month');
  const [method, setMethod] = useState<SubMethod>('cmi');
  const [cmi, setCmi] = useState(false);
  const [instr, setInstr] = useState<SubPayment | null>(null);
  const price = PLANS.find(p => p.id === plan)!.price;
  const pending = app.payments.find(p => p.status === 'pending');
  const days = app.sub.expiresAt ? Math.max(0, (app.sub.expiresAt - Date.now()) / 864e5) : 0;

  const pay = () => {
    if (method === 'cmi') return setCmi(true);
    setInstr(app.buySubscription(plan, method));
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[s.head, { paddingTop: ins.top + 10 }]}>
        <IconButton label="Retour" onPress={app.back} style={{ elevation: 0, shadowOpacity: 0, backgroundColor: C.bg }}>
          <Icon name="back" />
        </IconButton>
        <Text style={T.h2}>{t('subscription')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: ins.bottom + 30 }}>
        {app.subActive ? (
          <Card style={{ backgroundColor: C.green, borderColor: C.green, gap: 4 }}>
            <Text style={[T.eyebrow, { color: '#CFF1E2' }]}>{t('subActive')}</Text>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>{t('plan_' + app.sub.plan)}</Text>
            <Text style={{ color: '#E6F7EF' }}>
              {t('subEnds', { date: app.dateFmt(app.sub.expiresAt!) })} · {days >= 1 ? t('daysLeft', { n: Math.floor(days) }) : t('hoursLeft', { n: Math.ceil(days * 24) })}
            </Text>
          </Card>
        ) : (
          <Card style={{ gap: 6, backgroundColor: C.redSoft, borderColor: 'transparent' }}>
            <Text style={T.h2}>{t('subRequired')}</Text>
            <Text style={T.muted}>{t('subRequiredSub')}</Text>
          </Card>
        )}

        {pending && (
          <Card style={{ backgroundColor: C.amberSoft, borderColor: '#F3D9A5', gap: 8 }}>
            <Text style={T.h3}>{t('pendingTitle')}</Text>
            <Text style={T.muted}>
              {t('m_' + pending.method)} · {app.money(pending.amount)} · {t('reference')} {pending.ref}
            </Text>
            <Text style={T.small}>{t('pendingSub')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button small kind="ghost" title={t('payMethod')} style={{ flex: 1 }} onPress={() => setInstr(pending)} />
              <Button small kind="dark" title={t('simulateValidation')} style={{ flex: 1.4 }} onPress={() => { app.confirmPayment(pending.id); Alert.alert(t('activated')); }} />
            </View>
          </Card>
        )}

        <Text style={T.eyebrow}>{app.subActive ? t('renew') : t('choosePlan')}</Text>
        {PLANS.map(p => {
          const on = p.id === plan;
          return (
            <Pressable key={p.id} onPress={() => setPlan(p.id)} style={[s.plan, on && s.planOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
              <View style={[s.radio, on && { borderColor: C.green }]}>{on && <View style={s.radioIn} />}</View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={T.h3}>{t('plan_' + p.id)}</Text>
                  {p.badge && <Pill text={t(p.badge)} color={p.badge === 'best' ? C.red : C.green} bg={p.badge === 'best' ? C.redSoft : C.greenSoft} />}
                </View>
                <Text style={T.small}>{t('perDay', { n: (p.price / p.days).toFixed(1).replace('.', ',') })}</Text>
              </View>
              <Text style={[s.price, T.num]}>{app.money(p.price)}</Text>
            </Pressable>
          );
        })}

        <Text style={T.eyebrow}>{t('payMethod')}</Text>
        {METHODS.map(m => {
          const on = m.id === method;
          return (
            <Pressable key={m.id} onPress={() => setMethod(m.id)} style={[s.plan, on && s.planOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
              <View style={s.mIc}>
                <Icon name={m.icon} color={on ? C.green : C.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={T.h3}>{t('m_' + m.id)}</Text>
                <Text style={T.small}>{t('md_' + m.id)}</Text>
              </View>
              {on && <Icon name="check" color={C.green} />}
            </Pressable>
          );
        })}

        <Button title={t('pay', { amount: app.money(price) })} onPress={pay} />
        <Text style={[T.small, { textAlign: 'center' }]}>{t('noCommission')}</Text>

        {app.payments.length > 0 && (
          <>
            <Text style={[T.eyebrow, { marginTop: 8 }]}>{t('paymentHistory')}</Text>
            <Card style={{ paddingVertical: 4 }}>
              {app.payments.map((p, i) => (
                <View key={p.id} style={[s.hist, i > 0 && { borderTopWidth: 1, borderColor: C.line }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={T.h3}>{t('plan_' + p.plan)} · {t('m_' + p.method)}</Text>
                    <Text style={T.small}>{app.dateFmt(p.at)} · {p.ref}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[T.h3, T.num]}>{app.money(p.amount)}</Text>
                    <Pill text={p.status === 'paid' ? '✓' : '…'} color={p.status === 'paid' ? C.green : C.amber} bg={p.status === 'paid' ? C.greenSoft : C.amberSoft} />
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>

      {/* Paiement carte CMI (simulé en version test) */}
      <Modal visible={cmi} transparent animationType="slide" onRequestClose={() => setCmi(false)}>
        <Pressable style={s.overlay} onPress={() => setCmi(false)} />
        <View style={[s.modal, { paddingBottom: ins.bottom + 18 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="card" color={C.green} />
            <Text style={T.h2}>{t('cmiTitle')}</Text>
          </View>
          <Row k={t('amount')} v={app.money(price)} />
          <Row k={t('subscription')} v={t('plan_' + plan)} />
          <Text style={T.muted}>{t('cmiSub')}</Text>
          <Button
            title={t('cmiConfirm')}
            onPress={() => {
              app.buySubscription(plan, 'cmi');
              setCmi(false);
              Alert.alert(t('activated'));
            }}
          />
        </View>
      </Modal>

      {/* Instructions virement / Wafacash */}
      <Modal visible={!!instr} transparent animationType="slide" onRequestClose={() => setInstr(null)}>
        <Pressable style={s.overlay} onPress={() => setInstr(null)} />
        {instr && (
          <View style={[s.modal, { paddingBottom: ins.bottom + 18 }]}>
            <Text style={T.h2}>{instr.method === 'virement' ? t('virementTitle') : t('wafacashTitle')}</Text>
            <Row k={t('beneficiary')} v={instr.method === 'virement' ? COMPANY_PAYMENT.beneficiary : COMPANY_PAYMENT.wafacashName} />
            {instr.method === 'virement' && (
              <>
                <Row k={t('bank')} v={COMPANY_PAYMENT.bank} />
                <Row k={t('rib')} v={COMPANY_PAYMENT.rib} />
              </>
            )}
            <Row k={t('amount')} v={app.money(instr.amount)} />
            <Row k={t('reference')} v={instr.ref} strong />
            <Text style={T.small}>{t('pendingSub')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                kind="ghost"
                title={t('share')}
                style={{ flex: 1 }}
                icon={<Icon name="share" size={18} />}
                onPress={() => Share.share({ message: `SIIR! · ${t('m_' + instr.method)}\n${t('amount')}: ${app.money(instr.amount)}\n${t('reference')}: ${instr.ref}${instr.method === 'virement' ? `\n${t('rib')}: ${COMPANY_PAYMENT.rib}` : ''}` }).catch(() => {})}
              />
              <Button title="OK" style={{ flex: 1 }} onPress={() => setInstr(null)} />
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={T.muted}>{k}</Text>
      <Text style={[T.h3, T.num, strong && { color: C.green, fontSize: 18 }]} selectable>
        {v}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: C.line },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.md, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line },
  planOn: { borderColor: C.green, backgroundColor: '#F7FCF9' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.faint, alignItems: 'center', justifyContent: 'center' },
  radioIn: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.green },
  price: { fontSize: 18, fontWeight: '900', color: C.text },
  mIc: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  hist: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  overlay: { flex: 1, backgroundColor: C.overlay },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: 18, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderColor: C.line },
});
