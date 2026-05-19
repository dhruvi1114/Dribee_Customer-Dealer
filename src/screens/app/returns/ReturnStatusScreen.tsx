import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { CheckCircle, Clock, AlertCircle, XCircle, Package, Download } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useAppSelector } from '@/store/hooks';
import { useReturn } from '@/services/returns/returns.query';
import { env } from '@/config/env';
import { getToken } from '@/lib/keychain';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { resolveMediaUrl } from '@/utils/resolveMediaUrl';
import { shareAuthenticatedPdf } from '@/utils/downloadAuthenticatedPdf';
import { getApiErrorMessage } from '@/utils/common-functions';
import { logger } from '@/lib/logger';
import { API_BASE_URL } from '@/utils/constants/api.constant';
import type { ReturnStatus } from '@/types/return';
import type { OrdersStackParamList } from '@/navigation/types';

type Route = RouteProp<{ ReturnStatus: OrdersStackParamList['ReturnStatus'] }, 'ReturnStatus'>;

function EvidenceReturnThumbnail({
  uri,
  headers,
  containerStyle,
  imageStyle,
}: {
  uri: string;
  headers?: Record<string, string>;
  containerStyle: StyleProp<ViewStyle>;
  imageStyle: StyleProp<ImageStyle>;
}) {
  const [useFallback, setUseFallback] = useState(false);
  const source = headers ? { uri, headers } : { uri };
  if (useFallback) {
    return (
      <View style={containerStyle}>
        <Image
          source={source}
          style={imageStyle}
          resizeMode="cover"
          onError={() => {
            if (__DEV__) {
              logger.warn('[ReturnEvidence][RN Image error]', { uri, hadHeaders: !!headers });
            }
          }}
        />
      </View>
    );
  }
  return (
    <View style={containerStyle}>
      <FastImage
        source={
          headers
            ? { uri, headers, priority: FastImage.priority.normal }
            : { uri, priority: FastImage.priority.normal }
        }
        style={imageStyle as import('react-native-fast-image').ImageStyle}
        resizeMode={FastImage.resizeMode.cover}
        onError={() => {
          if (__DEV__) {
            logger.warn('[ReturnEvidence][FastImage error]', { uri, hadHeaders: !!headers });
          }
          setUseFallback(true);
        }}
      />
    </View>
  );
}

export function ReturnStatusScreen() {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const { returnId, initialReturn } = route.params;
  const userRole = useAppSelector((s) => s.auth.user?.role);
  const [creditPdfLoading, setCreditPdfLoading] = useState(false);
  const [evidenceImageHeaders, setEvidenceImageHeaders] = useState<Record<string, string> | undefined>(undefined);

  const { data: ret, isPending, isError, isFetching } = useReturn(returnId, initialReturn);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await getToken();
      if (cancelled || !token) return;
      setEvidenceImageHeaders({
        Authorization: `Bearer ${token}`,
        'x-tenant-host': `${env.ORG_SLUG}.dribee.com`,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const evidenceDisplayUrls = useMemo(() => {
    if (!ret) return [];
    const raw = ret.evidenceUrls ?? [];
    return raw
      .map((u) => resolveMediaUrl(u) ?? u)
      .filter((u): u is string => typeof u === 'string' && u.length > 0);
  }, [ret]);

  useEffect(() => {
    if (!__DEV__ || !ret) return;
    const raw = ret.evidenceUrls ?? [];
    const pairs = raw.map((u) => ({ original: u, resolved: resolveMediaUrl(u) ?? u }));
    logger.debug('[ReturnEvidence][screen]', {
      returnId,
      apiBaseUrl: API_BASE_URL,
      evidenceUrlsFromModel: raw,
      resolvedForDisplay: evidenceDisplayUrls,
      resolvePairs: pairs,
      hasAuthHeaders: !!evidenceImageHeaders,
    });
  }, [returnId, ret?.id, ret?.evidenceUrls, evidenceDisplayUrls, evidenceImageHeaders]);

  const statusConfig: Record<ReturnStatus, { label: string; color: string; Icon: typeof Clock }> = {
    requested: { label: 'Pending Review', color: colors.statusPlaced, Icon: Clock },
    approved: { label: 'Approved', color: colors.statusDelivered, Icon: CheckCircle },
    partial_approved: { label: 'Partially Approved', color: colors.brandBlue, Icon: AlertCircle },
    rejected: { label: 'Rejected', color: colors.statusReturned, Icon: XCircle },
    received: { label: 'Received', color: colors.brandBlue, Icon: Package },
    completed: { label: 'Completed', color: colors.statusDelivered, Icon: CheckCircle },
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    statusCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.xl,
      margin: Spacing.lg,
      alignItems: 'center',
      gap: Spacing.md,
    },
    statusLabel: { fontSize: Typography.fsSection, fontWeight: Typography.fwBold },
    metaMuted: { fontSize: Typography.fsBody, color: colors.textSecondary, textAlign: 'center' },
    metaFine: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    refreshNote: { fontSize: Typography.fsLabel, color: colors.textTertiary, marginTop: Spacing.xs },
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    cardTitle: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwSemibold,
      color: colors.textPrimary,
      marginBottom: Spacing.sm,
    },
    bodyText: { fontSize: Typography.fsBody, color: colors.textSecondary, lineHeight: 22 },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderDivider,
    },
    itemRowLast: { borderBottomWidth: 0 },
    thumb: {
      width: 48,
      height: 48,
      borderRadius: Radius.sm,
      backgroundColor: colors.bgSection,
      marginRight: Spacing.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.borderDivider,
      justifyContent: 'center',
      alignItems: 'center',
    },
    thumbImage: { width: '100%', height: '100%' },
    thumbFallback: { fontSize: Typography.fsLabel, fontWeight: Typography.fwBold, color: colors.brandNavy },
    itemBody: { flex: 1, minWidth: 0 },
    itemName: { fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwSemibold },
    itemMeta: { fontSize: Typography.fsLabel, color: colors.textSecondary, marginTop: 2 },
    itemQty: { fontSize: Typography.fsLabel, color: colors.textTertiary, marginTop: 2 },
    itemBadge: {
      alignSelf: 'flex-start',
      marginTop: 4,
      fontSize: Typography.fsLabel,
      color: colors.textTertiary,
      textTransform: 'capitalize',
    },
    evidenceRow: { gap: Spacing.sm, alignItems: 'center', paddingVertical: 2 },
    evidenceThumb: {
      width: 96,
      height: 96,
      borderRadius: Radius.md,
      backgroundColor: colors.bgSection,
      borderWidth: 1,
      borderColor: colors.borderDivider,
      overflow: 'hidden',
    },
    evidenceImage: { width: '100%', height: '100%' },
    invoiceLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: Spacing.md,
      alignSelf: 'flex-start',
    },
    invoiceText: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.statusDelivered },
  });

  if (isPending && ret == null) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Return Status" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError && ret == null) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Return Status" showBack />
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg }}>
            Could not load return details. Pull to refresh or open again from your returns list.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ret) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Return Status" showBack />
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>Return not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { label, color, Icon } = statusConfig[ret.status] ?? statusConfig.requested;
  const createdText = (() => {
    try {
      return format(parseISO(ret.createdAt), 'dd MMM yyyy, hh:mm a');
    } catch {
      return ret.createdAt;
    }
  })();

  const reviewedText = (() => {
    if (!ret.reviewedAt) return null;
    try {
      return format(parseISO(ret.reviewedAt), 'dd MMM yyyy, hh:mm a');
    } catch {
      return ret.reviewedAt;
    }
  })();

  const items = ret.items ?? [];

  const canDownloadCreditNote =
    ret.status !== 'rejected' &&
    (ret.status === 'completed' || !!(ret.creditNoteNumber && String(ret.creditNoteNumber).trim()));

  const handleDownloadCreditNote = useCallback(async () => {
    if (!returnId) return;
    const path =
      userRole === 'customer'
        ? API_ENDPOINTS.RETURNS.CUSTOMER_CREDIT_NOTE_DOWNLOAD(returnId)
        : API_ENDPOINTS.RETURNS.DEALER_CREDIT_NOTE_DOWNLOAD(returnId);
    setCreditPdfLoading(true);
    try {
      await shareAuthenticatedPdf(path, `Credit note — ${ret.returnNumber || ret.id}`);
      Toast.show({ type: 'success', text1: 'Credit note ready to share or save' });
    } catch (e) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(e, 'Could not download credit note') });
    } finally {
      setCreditPdfLoading(false);
    }
  }, [returnId, ret.id, ret.returnNumber, userRole]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Return Status" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.statusCard}>
          <Icon size={48} color={color} strokeWidth={1.5} />
          <Text style={[styles.statusLabel, { color }]}>{label}</Text>
          <Text style={styles.metaMuted}>
            Return ref: {ret.returnNumber || ret.id}
            {ret.orderNumber ? ` · Order ${ret.orderNumber}` : ''}
          </Text>
          <Text style={styles.metaFine}>Submitted {createdText}</Text>
          {isFetching ? <Text style={styles.refreshNote}>Updating…</Text> : null}
        </View>

        {evidenceDisplayUrls.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Evidence photos</Text>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.evidenceRow}
            >
              {evidenceDisplayUrls.map((uri, idx) => (
                <EvidenceReturnThumbnail
                  key={`${uri}-${idx}`}
                  uri={uri}
                  headers={uri.includes('/uploads/') ? undefined : evidenceImageHeaders}
                  containerStyle={styles.evidenceThumb}
                  imageStyle={styles.evidenceImage}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items in this return</Text>
          {items.length === 0 ? (
            ret.returnReasonLabel ? (
              <Text style={styles.bodyText}>
                Product lines are loading from the server. Reason:{' '}
                <Text style={{ fontWeight: Typography.fwSemibold, color: colors.textPrimary }}>
                  {ret.returnReasonLabel}
                </Text>
              </Text>
            ) : (
              <Text style={styles.bodyText}>No line items were returned from the server yet.</Text>
            )
          ) : (
            items.map((it, index) => (
              <View
                key={it.id ?? it.orderItemId}
                style={[styles.itemRow, index === items.length - 1 && styles.itemRowLast]}
              >
                <View style={styles.thumb}>
                  {it.image ? (
                    <FastImage
                      source={{ uri: it.image, priority: FastImage.priority.normal }}
                      style={styles.thumbImage}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  ) : (
                    <Text style={styles.thumbFallback}>{(it.productName || '—').slice(0, 2).toUpperCase()}</Text>
                  )}
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {it.productName}
                    {it.variantName ? ` · ${it.variantName}` : ''}
                  </Text>
                  {it.reason ? <Text style={styles.itemMeta}>Reason: {it.reason}</Text> : null}
                  <Text style={styles.itemQty}>
                    Requested qty: {it.requestedQty}
                    {it.approvedQty !== undefined && it.approvedQty !== it.requestedQty
                      ? ` · Approved: ${it.approvedQty}`
                      : it.approvedQty !== undefined
                        ? ` · Approved: ${it.approvedQty}`
                        : ''}
                  </Text>
                  {it.lineStatus ? (
                    <Text style={styles.itemBadge}>Line status: {it.lineStatus}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* {ret.resolution ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resolution</Text>
            <Text style={styles.bodyText}>{ret.resolution}</Text>
          </View>
        ) : null} */}

        {ret.totalRefund !== undefined && ret.totalRefund > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Refund</Text>
            <Text style={styles.bodyText}>
              Refund amount: ₹{ret.totalRefund.toLocaleString('en-IN')}
              {/* {ret.creditNoteNumber ? `. Credit note: ${ret.creditNoteNumber}.` : '.'} */}
            </Text>
            {canDownloadCreditNote ? (
              <TouchableOpacity
                style={styles.invoiceLink}
                activeOpacity={0.85}
                onPress={handleDownloadCreditNote}
                disabled={creditPdfLoading}
              >
                {creditPdfLoading ? (
                  <ActivityIndicator size="small" color={colors.statusDelivered} />
                ) : (
                  <>
                    <Text style={styles.invoiceText}>Download credit note (PDF)</Text>
                    <Download size={16} color={colors.statusDelivered} strokeWidth={1.8} />
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        ) : ret.creditNoteNumber ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Credit note</Text>
            <Text style={styles.bodyText}>{ret.creditNoteNumber}</Text>
            {canDownloadCreditNote ? (
              <TouchableOpacity
                style={styles.invoiceLink}
                activeOpacity={0.85}
                onPress={handleDownloadCreditNote}
                disabled={creditPdfLoading}
              >
                {creditPdfLoading ? (
                  <ActivityIndicator size="small" color={colors.statusDelivered} />
                ) : (
                  <>
                    <Text style={styles.invoiceText}>Download credit note (PDF)</Text>
                    <Download size={16} color={colors.statusDelivered} strokeWidth={1.8} />
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        ) : ret.status !== 'rejected' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Refund</Text>
            <Text style={styles.bodyText}>
              The API does not include a finalized refund total yet. Amounts usually appear after the return is
              approved and processed.
            </Text>
            {canDownloadCreditNote ? (
              <TouchableOpacity
                style={styles.invoiceLink}
                activeOpacity={0.85}
                onPress={handleDownloadCreditNote}
                disabled={creditPdfLoading}
              >
                {creditPdfLoading ? (
                  <ActivityIndicator size="small" color={colors.statusDelivered} />
                ) : (
                  <>
                    <Text style={styles.invoiceText}>Download credit note (PDF)</Text>
                    <Download size={16} color={colors.statusDelivered} strokeWidth={1.8} />
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {reviewedText ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reviewed</Text>
            <Text style={styles.bodyText}>{reviewedText}</Text>
          </View>
        ) : null}

        {ret.rejectionReason ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rejection reason</Text>
            <Text style={styles.bodyText}>{ret.rejectionReason}</Text>
          </View>
        ) : null}

        {ret.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your notes</Text>
            <Text style={styles.bodyText}>{ret.notes}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
