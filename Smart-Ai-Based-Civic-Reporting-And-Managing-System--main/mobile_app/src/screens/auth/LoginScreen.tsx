import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AuthScreenProps } from '../../types/navigation';
import { RootState, AppDispatch } from '../../store/store';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { COLORS, TYPOGRAPHY, SPACING, VALIDATION } from '../../utils/constants';

type Props = AuthScreenProps<'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isEngineerLogin, setIsEngineerLogin] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setPhoneError('');
    setPasswordError('');

    if (isEngineerLogin) {
      // Validate email for engineers
      if (!phone.trim()) {
        setPhoneError('Email is required');
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(phone.trim())) {
        setPhoneError('Please enter a valid email address');
        isValid = false;
      }
    } else {
      // Validate phone for citizens
      if (!phone.trim()) {
        setPhoneError('Phone number is required');
        isValid = false;
      } else if (!VALIDATION.PHONE_REGEX.test(phone.trim())) {
        setPhoneError('Please enter a valid 10-digit phone number');
        isValid = false;
      }
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      setPasswordError(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`);
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      if (isEngineerLogin) {
        // Engineer login - try API first, fallback to mock data
        try {
          console.log('Attempting to fetch engineer data from API...');
          const response = await fetch('http://192.168.214.228:9000/api/engineers');
          const result = await response.json();
          
          if (result.success) {
            const engineer = result.data.find((eng: any) => eng.email === phone.trim());
            
            if (engineer && password === 'engineer123') {
              // Store engineer data in auth state
              await dispatch(loginUser({ 
                phone: engineer.phone, 
                password,
                userType: 'engineer',
                engineerId: engineer._id,
                name: engineer.name,
                email: engineer.email,
                department: engineer.department,
                specialization: engineer.specialization
              })).unwrap();
            } else {
              throw new Error('Invalid engineer credentials');
            }
          } else {
            throw new Error('API returned error: ' + result.error);
          }
        } catch (apiError) {
          console.log('API failed, using mock engineer data:', apiError);
          
          // Fallback to mock engineer data with real database IDs
          const mockEngineers = {
            'rajesh.roads@gov.in': {
              _id: '68d54da1a13d33a1c23b4cfc',
              name: 'Rajesh Kumar',
              phone: '+91-9876543210',
              email: 'rajesh.roads@gov.in',
              department: 'roads',
              specialization: 'Road Construction & Repair'
            },
            'amit.roads@gov.in': {
              _id: '68d54da1a13d33a1c23b4cfd',
              name: 'Amit Sharma',
              phone: '+91-9876543211',
              email: 'amit.roads@gov.in',
              department: 'roads',
              specialization: 'Traffic Management'
            },
            'priya.water@gov.in': {
              _id: '68d54da1a13d33a1c23b4cfe',
              name: 'Priya Patel',
              phone: '+91-9876543212',
              email: 'priya.water@gov.in',
              department: 'water',
              specialization: 'Pipeline Maintenance'
            },
            'suresh.water@gov.in': {
              _id: '68d54da1a13d33a1c23b4cff',
              name: 'Suresh Joshi',
              phone: '+91-9876543213',
              email: 'suresh.water@gov.in',
              department: 'water',
              specialization: 'Water Quality Testing'
            },
            'vikram.elec@gov.in': {
              _id: '68d54da1a13d33a1c23b4d00',
              name: 'Vikram Singh',
              phone: '+91-9876543214',
              email: 'vikram.elec@gov.in',
              department: 'electricity',
              specialization: 'Power Line Maintenance'
            },
            'anita.waste@gov.in': {
              _id: '68d54da1a13d33a1c23b4d01',
              name: 'Anita Desai',
              phone: '+91-9876543215',
              email: 'anita.waste@gov.in',
              department: 'waste',
              specialization: 'Waste Collection & Disposal'
            },
            'ravi.public@gov.in': {
              _id: '68d54da1a13d33a1c23b4d02',
              name: 'Ravi Gupta',
              phone: '+91-9876543216',
              email: 'ravi.public@gov.in',
              department: 'public',
              specialization: 'Building Maintenance'
            }
          };
          
          const engineer = mockEngineers[phone.trim() as keyof typeof mockEngineers];
          
          if (engineer && password === 'engineer123') {
            await dispatch(loginUser({ 
              phone: engineer.phone, 
              password,
              userType: 'engineer',
              engineerId: engineer._id,
              name: engineer.name,
              email: engineer.email,
              department: engineer.department,
              specialization: engineer.specialization
            })).unwrap();
          } else {
            throw new Error('Invalid engineer credentials');
          }
        }
      } else {
        // Citizen login
        await dispatch(loginUser({ phone: phone.trim(), password })).unwrap();
      }
      // Navigation will be handled automatically by AppNavigator
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || error || 'Please check your credentials and try again.';
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const handleRegisterPress = () => {
    dispatch(clearError());
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            {isEngineerLogin ? 'Engineer Portal - Manage Tasks' : 'Sign in to report civic issues'}
          </Text>
          
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, !isEngineerLogin && styles.toggleActive]}
              onPress={() => setIsEngineerLogin(false)}
            >
              <Text style={[styles.toggleText, !isEngineerLogin && styles.toggleTextActive]}>Citizen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, isEngineerLogin && styles.toggleActive]}
              onPress={() => setIsEngineerLogin(true)}
            >
              <Text style={[styles.toggleText, isEngineerLogin && styles.toggleTextActive]}>Engineer</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{isEngineerLogin ? 'Engineer Email' : 'Phone Number'}</Text>
            <TextInput
              style={[styles.input, phoneError ? styles.inputError : null]}
              placeholder={isEngineerLogin ? 'Enter your engineer email' : 'Enter your phone number'}
              value={phone}
              onChangeText={setPhone}
              keyboardType={isEngineerLogin ? 'email-address' : 'phone-pad'}
              maxLength={isEngineerLogin ? 50 : 10}
              autoCapitalize="none"
            />
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, passwordError ? styles.inputError : null]}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleRegisterPress}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  linkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 4,
    marginTop: SPACING.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default LoginScreen;