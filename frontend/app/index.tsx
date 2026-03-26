import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { auth } from '../src/config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { colors, spacing } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function AuthScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)/recipes');
    }
  }, [user, loading]);

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/invalid-email': return 'Invalid email address';
      case 'auth/user-disabled': return 'This account has been disabled';
      case 'auth/user-not-found': return 'No account found with this email';
      case 'auth/wrong-password': return 'Incorrect password';
      case 'auth/invalid-credential': return 'Incorrect email or password';
      case 'auth/email-already-in-use': return 'An account already exists with this email';
      case 'auth/weak-password': return 'Password should be at least 6 characters';
      case 'auth/too-many-requests': return 'Too many attempts. Try again later';
      default: return 'Something went wrong. Please try again';
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    setAuthLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e: any) {
      setError(getErrorMessage(e.code || ''));
    }
    setAuthLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  if (user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Branding */}
          <View style={styles.brandSection}>
            <Text style={styles.emoji}>🍽️</Text>
            <Text style={styles.appName}>Our Kitchen</Text>
            <Text style={styles.tagline}>Plan meals together,{'\n'}cook with love</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Mail size={18} color={colors.textTertiary} />
              <TextInput
                testID="auth-email-input"
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Lock size={18} color={colors.textTertiary} />
              <TextInput
                testID="auth-password-input"
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                secureTextEntry={!showPassword}
                textContentType="password"
              />
              <TouchableOpacity testID="toggle-password-btn" onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={18} color={colors.textTertiary} /> : <Eye size={18} color={colors.textTertiary} />}
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Submit */}
            <TouchableOpacity
              testID="auth-submit-btn"
              style={[styles.submitBtn, authLoading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.7}
              disabled={authLoading}
            >
              {authLoading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.submitBtnText}>{isSignUp ? 'Sign Up' : 'Log In'}</Text>
              )}
            </TouchableOpacity>

            {/* Toggle */}
            <TouchableOpacity testID="auth-toggle-btn" onPress={() => { setIsSignUp(!isSignUp); setError(''); }} style={styles.toggleBtn}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={styles.toggleLink}>{isSignUp ? 'Log In' : 'Sign Up'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hint */}
          <Text style={styles.hint}>
            Use the same email & password on both{'\n'}phones to share your meal plans
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  brandSection: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 56, marginBottom: spacing.md },
  appName: { fontSize: 40, fontWeight: '300', color: colors.textPrimary, fontStyle: 'italic', letterSpacing: -1 },
  tagline: { fontSize: 16, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 24 },
  formSection: { gap: 14 },
  formTitle: { fontSize: 22, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 12, paddingHorizontal: 16, height: 54, borderWidth: 1, borderColor: colors.border,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: colors.textPrimary },
  eyeBtn: { padding: 6 },
  errorText: { color: colors.error, fontSize: 13, marginTop: -4 },
  submitBtn: {
    backgroundColor: colors.brandPrimary, height: 54, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: colors.textInverse, fontSize: 17, fontWeight: '600' },
  toggleBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  toggleText: { fontSize: 14, color: colors.textSecondary },
  toggleLink: { color: colors.accent, fontWeight: '600' },
  hint: { color: colors.textTertiary, textAlign: 'center', fontSize: 13, lineHeight: 20, marginTop: 32 },
});
