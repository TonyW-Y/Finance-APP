import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { X, CreditCard, User as UserIcon, LogOut, Key, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ACCENT } from '@/constants';

export default function AccountScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, token, login, signup, logout, changePassword, deleteAccount } = useAuth();

  // Auth modals
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Account modals
  const [changePwModal, setChangePwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) return setAuthError('Email and password are required');
    if (authModal === 'signup' && password !== confirmPassword) return setAuthError('Passwords do not match');
    setAuthLoading(true);
    setAuthError('');
    try {
      if (authModal === 'login') await login(email, password);
      else await signup(email, password);
      setAuthModal(null);
      setEmail(''); setPassword(''); setConfirmPassword('');
    } catch (e: any) {
      setAuthError(e.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleChangePw = async () => {
    if (!currentPw || !newPw || !confirmPw) return setPwError('All fields are required');
    if (newPw !== confirmPw) return setPwError('New passwords do not match');
    if (newPw.length < 6) return setPwError('Password must be at least 6 characters');
    setPwLoading(true); setPwError('');
    try {
      await changePassword(currentPw, newPw);
      setChangePwModal(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) {
      setPwError(e.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try { await deleteAccount(); } catch {}
    setDeleteLoading(false);
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Account" />
        <View style={styles.loggedOutContainer}>
          <View style={[styles.logoBox, { backgroundColor: ACCENT.blue + '22', borderColor: ACCENT.blue + '44' }]}>
            <CreditCard color={ACCENT.blue} size={40} />
          </View>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>Finance Tracker</Text>
          <Text style={[styles.appTagline, { color: colors.textSecondary }]}>Track your money, reach your goals</Text>

          <View style={styles.authButtons}>
            <TouchableOpacity
              style={[styles.authBtn, styles.loginBtn, { backgroundColor: ACCENT.blue }]}
              onPress={() => { setAuthModal('login'); setAuthError(''); }}>
              <Text style={styles.authBtnText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authBtn, styles.signupBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { setAuthModal('signup'); setAuthError(''); }}>
              <Text style={[styles.authBtnText, { color: colors.textPrimary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={authModal !== null} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  {authModal === 'login' ? 'Log In' : 'Create Account'}
                </Text>
                <TouchableOpacity onPress={() => { setAuthModal(null); setEmail(''); setPassword(''); setConfirmPassword(''); setAuthError(''); }}>
                  <X color={colors.textSecondary} size={22} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Email" placeholderTextColor={colors.textSecondary}
                keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Password" placeholderTextColor={colors.textSecondary}
                secureTextEntry value={password} onChangeText={setPassword} />
              {authModal === 'signup' && (
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="Confirm password" placeholderTextColor={colors.textSecondary}
                  secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
              )}
              {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: ACCENT.blue, opacity: authLoading ? 0.6 : 1 }]}
                onPress={handleAuth} disabled={authLoading}>
                <Text style={styles.submitText}>{authModal === 'login' ? 'Log In' : 'Sign Up'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAuthModal(authModal === 'login' ? 'signup' : 'login')}>
                <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                  {authModal === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Account" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Account Section */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.accountInfo}>
            <View style={[styles.avatarCircle, { backgroundColor: ACCENT.blue + '22' }]}>
              <UserIcon color={ACCENT.blue} size={24} />
            </View>
            <View>
              <Text style={[styles.userEmail, { color: colors.textPrimary }]}>{user.email}</Text>
              <Text style={[styles.userLabel, { color: colors.textSecondary }]}>Signed in</Text>
            </View>
          </View>
        </View>

        {/* Theme toggle */}
        <View style={[styles.accountActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.accountActionText, { color: colors.textPrimary, flex: 1 }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ccc', true: ACCENT.blue + '88' }}
            thumbColor={isDark ? ACCENT.blue : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.accountActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={logout}>
          <LogOut color={ACCENT.red} size={18} />
          <Text style={[styles.accountActionText, { color: ACCENT.red }]}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.accountActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => { setChangePwModal(true); setPwError(''); }}>
          <Key color={colors.textPrimary} size={18} />
          <Text style={[styles.accountActionText, { color: colors.textPrimary }]}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.accountActionBtn, { backgroundColor: colors.surface, borderColor: ACCENT.red + '44' }]}
          onPress={() => setDeleteModal(true)}>
          <AlertTriangle color={ACCENT.red} size={18} />
          <Text style={[styles.accountActionText, { color: ACCENT.red }]}>Delete Account</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={changePwModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Change Password</Text>
              <TouchableOpacity onPress={() => { setChangePwModal(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwError(''); }}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Current password" placeholderTextColor={colors.textSecondary}
              secureTextEntry value={currentPw} onChangeText={setCurrentPw} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="New password" placeholderTextColor={colors.textSecondary}
              secureTextEntry value={newPw} onChangeText={setNewPw} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Confirm new password" placeholderTextColor={colors.textSecondary}
              secureTextEntry value={confirmPw} onChangeText={setConfirmPw} />
            {pwError ? <Text style={styles.errorText}>{pwError}</Text> : null}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: ACCENT.blue, opacity: pwLoading ? 0.6 : 1 }]}
              onPress={handleChangePw} disabled={pwLoading}>
              <Text style={styles.submitText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={deleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AlertTriangle color={ACCENT.red} size={36} />
            <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>Delete Account?</Text>
            <Text style={[styles.confirmBody, { color: colors.textSecondary }]}>
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: ACCENT.red, opacity: deleteLoading ? 0.6 : 1 }]}
              onPress={handleDeleteAccount} disabled={deleteLoading}>
              <Text style={styles.submitText}>Yes, Delete My Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => setDeleteModal(false)}>
              <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  sectionLabel: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, marginBottom: 2 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  accountInfo: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  userEmail: { fontSize: 15, fontWeight: '600' },
  userLabel: { fontSize: 12, marginTop: 2 },
  accountActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  accountActionText: { fontSize: 15, fontWeight: '500' },
  loggedOutContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  logoBox: { width: 80, height: 80, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  appName: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  appTagline: { fontSize: 15, marginBottom: 32, textAlign: 'center' },
  authButtons: { width: '100%', gap: 12 },
  authBtn: { width: '100%', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  loginBtn: {},
  signupBtn: { borderWidth: 1 },
  authBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  switchText: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  confirmSheet: { margin: 24, borderRadius: 16, borderWidth: 1, padding: 24, gap: 12, alignItems: 'center' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  input: { height: 46, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  confirmTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  confirmBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  errorText: { color: '#D85A30', fontSize: 13 },
  submitBtn: { height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4, width: '100%' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, width: '100%' },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
});
