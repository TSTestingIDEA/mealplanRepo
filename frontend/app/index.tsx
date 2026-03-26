import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { auth } from '../src/config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { colors, spacing } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const AUTH_BG = 'https://static.prod-images.emergentagent.com/jobs/3abfe753-7d87-44d4-9874-01a7e1b53b6f/images/12b66b929b4f236abcdbd7c692c3b4d26ad2dedcff7498d6854d82e718dfd886.png';

export default function AuthScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)/recipes');
    }
  }, [user, loading]);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setError('');
    try {
      const redirectUri = AuthSession.makeRedirectUri({ preferLocalhost: false });
      const clientId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
      
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };

      const request = new AuthSession.AuthRequest({
        clientId: `${clientId ? clientId : '92385648492'}-${getWebClientSuffix()}.apps.googleusercontent.com`,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.IdToken,
        extraParams: { nonce: Math.random().toString(36).substring(2) },
      });

      const result = await request.promptAsync(discovery);
      
      if (result.type === 'success' && result.params?.id_token) {
        const credential = GoogleAuthProvider.credential(result.params.id_token);
        await signInWithCredential(auth, credential);
      } else {
        setError('Google sign-in was cancelled');
      }
    } catch (e: any) {
      console.log('Google sign-in error:', e);
      setError('Google sign-in failed. Try email login below.');
    }
    setAuthLoading(false);
  };

  function getWebClientSuffix() {
    return '';
  }

  const handleDemoLogin = async () => {
    setAuthLoading(true);
    setError('');
    try {
      // Try to sign in with a demo account
      try {
        await signInWithEmailAndPassword(auth, 'demo@mealplanner.com', 'Demo123!');
      } catch {
        // If not exists, create it
        await createUserWithEmailAndPassword(auth, 'demo@mealplanner.com', 'Demo123!');
      }
    } catch (e: any) {
      console.log('Demo login error:', e);
      setError(e.message || 'Login failed');
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
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: AUTH_BG }}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <SafeAreaView style={styles.content}>
          <View style={styles.topSection}>
            <Text style={styles.appName}>Our Kitchen</Text>
            <Text style={styles.tagline}>Plan meals together,{'\n'}cook with love</Text>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              testID="google-sign-in-btn"
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.7}
              disabled={authLoading}
            >
              {authLoading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID="demo-login-btn"
              style={styles.demoButton}
              onPress={handleDemoLogin}
              activeOpacity={0.7}
              disabled={authLoading}
            >
              <Text style={styles.demoButtonText}>Try Demo Account</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.hint}>
              Share this login with your partner{'\n'}for synced meal plans
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  bgImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  topSection: { paddingTop: 60 },
  appName: {
    fontSize: 44,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -1,
    fontStyle: 'italic',
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.sm,
    lineHeight: 26,
  },
  bottomSection: {
    paddingBottom: 40,
    gap: 14,
  },
  googleButton: {
    backgroundColor: colors.brandPrimary,
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: 'transparent',
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontSize: 13,
  },
  hint: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
});
