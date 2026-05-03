import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radius, shadows, spacing } from '@/src/shared/theme/design-tokens';

type SnackbarTone = 'success' | 'error' | 'info';

type SnackbarOptions = {
  message: string;
  tone?: SnackbarTone;
  durationMs?: number;
};

type SnackbarContextValue = {
  showSnackbar: (options: SnackbarOptions) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [snackbar, setSnackbar] = useState<Required<SnackbarOptions> | null>(null);
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideSnackbar = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 120,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setSnackbar(null));
  }, [opacity, translateY]);

  const showSnackbar = useCallback(
    ({ message, tone = 'success', durationMs = 3000 }: SnackbarOptions) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setSnackbar({ message, tone, durationMs });
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();

      timeoutRef.current = setTimeout(hideSnackbar, durationMs);
    },
    [hideSnackbar, opacity, translateY],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {snackbar && (
        <View
          pointerEvents="box-none"
          style={[styles.host, { bottom: Math.max(insets.bottom, 12) + 74 }]}
        >
          <Animated.View
            style={[
              styles.snackbar,
              {
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={[styles.statusDot, styles[snackbar.tone]]} />
            <Text style={styles.message}>{snackbar.message}</Text>
            <TouchableOpacity onPress={hideSnackbar} hitSlop={12}>
              <Text style={styles.dismiss}>Dismiss</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);

  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1000,
  },
  snackbar: {
    minHeight: 54,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    marginRight: spacing.md,
  },
  success: {
    backgroundColor: palette.income,
  },
  error: {
    backgroundColor: palette.expense,
  },
  info: {
    backgroundColor: palette.primary,
  },
  message: {
    flex: 1,
    color: palette.text,
    fontSize: 14,
    fontWeight: '800',
  },
  dismiss: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
