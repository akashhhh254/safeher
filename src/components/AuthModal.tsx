import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  X,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Smartphone,
  KeyRound,
  RotateCw,
  Trash2,
  ChevronRight,
  ShieldAlert,
  Copy,
  Check,
} from 'lucide-react';
import {
  getSavedAccounts,
  saveAccount,
  removeSavedAccount,
  requestOtp,
  verifyOtpCode,
  loginWithVerifiedCredentials,
} from '../services/authService';
import { AntiBotVerification } from './AntiBotVerification';
import { SavedAccount } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  // Method selection: 'email-otp' | 'email-password' | 'phone-otp'
  const [activeTab, setActiveTab] = useState<'email-otp' | 'email-password' | 'phone-otp'>('email-otp');

  // Multi-account management
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showAccountList, setShowAccountList] = useState<boolean>(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [simulatedInboxOtp, setSimulatedInboxOtp] = useState<{ code: string; target: string; type: string } | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Email Password mode: 'signin' | 'signup' | 'forgot'
  const [passwordSubMode, setPasswordSubMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Anti-Bot Human Verification
  const [isHumanVerified, setIsHumanVerified] = useState(false);
  const [humanToken, setHumanToken] = useState<string | null>(null);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Load saved accounts on open
  useEffect(() => {
    if (isOpen) {
      const accounts = getSavedAccounts();
      setSavedAccounts(accounts);
      if (accounts.length > 0 && !email) {
        // Pre-fill with the most recent account
        setEmail(accounts[0].identifier);
        setDisplayName(accounts[0].displayName);
      }
      setIsHumanVerified(false);
      setHumanToken(null);
      setErrorMsg('');
      setInfoMsg('');
      setIsOtpSent(false);
      setOtpCode('');
      setSimulatedInboxOtp(null);
    }
  }, [isOpen]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: any;
    if (resendSeconds > 0) {
      timer = setInterval(() => {
        setResendSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendSeconds]);

  if (!isOpen) return null;

  // Handle Account Switch / Selection from Saved Accounts
  const handleSelectSavedAccount = (acc: SavedAccount) => {
    if (acc.type === 'email') {
      setEmail(acc.identifier);
      setDisplayName(acc.displayName);
      setActiveTab('email-otp');
    } else {
      setPhoneNumber(acc.identifier.replace('+91', '').trim());
      setActiveTab('phone-otp');
    }
    setShowAccountList(false);
    setErrorMsg('');
  };

  const handleRemoveAccount = (e: React.MouseEvent, identifier: string) => {
    e.stopPropagation();
    const updated = removeSavedAccount(identifier);
    setSavedAccounts(updated);
  };

  // 1. Send OTP (Email or Phone)
  const handleSendOtp = async () => {
    setErrorMsg('');
    setInfoMsg('');

    if (!isHumanVerified) {
      setErrorMsg('Please complete the Anti-Bot "I am not a robot" check first.');
      return;
    }

    const target = activeTab === 'email-otp' ? email.trim() : `${phoneCountryCode}${phoneNumber.trim()}`;
    const type = activeTab === 'email-otp' ? 'email' : 'phone';

    if (type === 'email') {
      if (!email || !email.includes('@') || !email.includes('.')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
    } else {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await requestOtp(target, type);
      setIsOtpSent(true);
      setResendSeconds(60);
      setInfoMsg(`A 6-digit security code has been sent to ${target}.`);

      if (result.code) {
        setSimulatedInboxOtp({
          code: result.code,
          target,
          type: type === 'email' ? 'Email Inbox' : 'SMS Message',
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify OTP & Authenticate
  const handleVerifyOtpAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!isHumanVerified) {
      setErrorMsg('Please complete the Anti-Bot "I am not a robot" check first.');
      return;
    }

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    const target = activeTab === 'email-otp' ? email.trim() : `${phoneCountryCode}${phoneNumber.trim()}`;
    const type = activeTab === 'email-otp' ? 'email' : 'phone';

    setIsLoading(true);
    try {
      const verifyRes = await verifyOtpCode(target, otpCode);
      if (!verifyRes.success) {
        setErrorMsg(verifyRes.message || 'Invalid or expired verification code.');
        setIsLoading(false);
        return;
      }

      // Log in or register into Firebase with verified session
      await loginWithVerifiedCredentials(target, type, displayName.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify the code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Email & Password Standard Auth
  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!isHumanVerified) {
      setErrorMsg('Please complete the Anti-Bot "I am not a robot" check first.');
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      if (passwordSubMode === 'signin') {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        saveAccount({
          id: email.trim().toLowerCase(),
          type: 'email',
          identifier: email.trim().toLowerCase(),
          displayName: cred.user.displayName || email.trim().split('@')[0],
        });
        onSuccess();
        onClose();
      } else if (passwordSubMode === 'signup') {
        if (!displayName.trim()) {
          setErrorMsg('Please enter your full name.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: displayName.trim() });
        saveAccount({
          id: email.trim().toLowerCase(),
          type: 'email',
          identifier: email.trim().toLowerCase(),
          displayName: displayName.trim(),
        });
        onSuccess();
        onClose();
      } else if (passwordSubMode === 'forgot') {
        await sendPasswordResetEmail(auth, email.trim());
        setInfoMsg(`Password reset email has been sent to ${email.trim()}.`);
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      let msg = 'Authentication error. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. If you are new, switch to "Create Account" below.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please Sign In instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySimulatedOtp = () => {
    if (simulatedInboxOtp?.code) {
      navigator.clipboard.writeText(simulatedInboxOtp.code);
      setOtpCode(simulatedInboxOtp.code);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  SafeHer Secure Sign In
                </h2>
                <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  Protected Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose any email ID or mobile number to access safe navigation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Informational Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {infoMsg && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-900 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{infoMsg}</div>
            </div>
          )}

          {/* Simulated Inbox / SMS Delivery Banner */}
          {simulatedInboxOtp && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-300/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{simulatedInboxOtp.type}: Incoming Security Code</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Just Now</span>
              </div>
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-sm">
                <div>
                  <p className="text-[10px] text-slate-500">Security Verification Code:</p>
                  <p className="text-base font-black tracking-widest font-mono text-slate-900">
                    {simulatedInboxOtp.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySimulatedOtp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  {copiedOtp ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Filled!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Auto-Fill Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Multi-Account Selector (for users with 4-5 accounts) */}
          {savedAccounts.length > 0 && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Accounts on this device ({savedAccounts.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAccountList(!showAccountList)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {showAccountList ? 'Hide accounts' : 'Switch / Choose account'}
                </button>
              </div>

              {showAccountList && (
                <div className="mt-2.5 space-y-1.5 border-t border-slate-200/80 pt-2 max-h-40 overflow-y-auto">
                  {savedAccounts.map((acc) => (
                    <div
                      key={acc.identifier}
                      onClick={() => handleSelectSavedAccount(acc)}
                      className="p-2 bg-white hover:bg-indigo-50/60 rounded-xl border border-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {acc.type === 'email' ? <Mail className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">{acc.displayName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{acc.identifier}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleRemoveAccount(e, acc.identifier)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Remove from saved accounts"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Authentication Method Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('email-otp');
                setIsOtpSent(false);
                setErrorMsg('');
              }}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'email-otp'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Email OTP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('phone-otp');
                setIsOtpSent(false);
                setErrorMsg('');
              }}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'phone-otp'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Mobile OTP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('email-password');
                setErrorMsg('');
              }}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'email-password'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Password</span>
            </button>
          </div>

          {/* TAB 1: EMAIL OTP AUTH */}
          {activeTab === 'email-otp' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter any of your personal or work email IDs"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Name (Optional / For Emergency Circle)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="E.g. Akash Thakare"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                  />
                </div>
              </div>

              {/* Anti-Bot Human Verification */}
              <AntiBotVerification
                isVerified={isHumanVerified}
                onVerify={(tok) => {
                  setIsHumanVerified(true);
                  setHumanToken(tok);
                  setErrorMsg('');
                }}
              />

              {/* Step 1: Send OTP Button */}
              {!isOtpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading || !isHumanVerified || !email}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isLoading ? 'Generating OTP...' : 'Send 6-Digit Email OTP'}</span>
                </button>
              ) : (
                /* Step 2: Enter & Verify OTP */
                <form onSubmit={handleVerifyOtpAndLogin} className="space-y-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Enter 6-Digit Verification Code
                      </label>
                      {resendSeconds > 0 ? (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Resend in {resendSeconds}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.4em] font-mono font-black text-xl bg-slate-50 border-2 border-indigo-300 rounded-xl py-2.5 text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isLoading ? 'Verifying...' : 'Verify OTP & Launch SafeHer'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: MOBILE NUMBER OTP AUTH */}
          {activeTab === 'phone-otp' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-2 py-2.5 text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-center gap-1">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="E.g. Akash Thakare"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                  />
                </div>
              </div>

              {/* Anti-Bot Human Verification */}
              <AntiBotVerification
                isVerified={isHumanVerified}
                onVerify={(tok) => {
                  setIsHumanVerified(true);
                  setHumanToken(tok);
                  setErrorMsg('');
                }}
              />

              {/* Step 1: Send SMS OTP Button */}
              {!isOtpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading || !isHumanVerified || phoneNumber.length < 10}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{isLoading ? 'Sending SMS...' : 'Send 6-Digit SMS OTP'}</span>
                </button>
              ) : (
                /* Step 2: Enter & Verify SMS OTP */
                <form onSubmit={handleVerifyOtpAndLogin} className="space-y-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Enter SMS OTP Code
                      </label>
                      {resendSeconds > 0 ? (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Resend SMS in {resendSeconds}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Resend SMS Code
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.4em] font-mono font-black text-xl bg-slate-50 border-2 border-indigo-300 rounded-xl py-2.5 text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isLoading ? 'Verifying...' : 'Verify SMS & Enter SafeHer'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: EMAIL + PASSWORD AUTH */}
          {activeTab === 'email-password' && (
            <form onSubmit={handlePasswordAuth} className="space-y-3.5">
              {passwordSubMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="E.g. Akash Thakare"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                  />
                </div>
              </div>

              {passwordSubMode !== 'forgot' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    {passwordSubMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setPasswordSubMode('forgot')}
                        className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Anti-Bot Human Verification */}
              <AntiBotVerification
                isVerified={isHumanVerified}
                onVerify={(tok) => {
                  setIsHumanVerified(true);
                  setHumanToken(tok);
                  setErrorMsg('');
                }}
              />

              <button
                type="submit"
                disabled={isLoading || !isHumanVerified}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>
                  {isLoading
                    ? 'Authenticating...'
                    : passwordSubMode === 'signin'
                    ? 'Sign In with Password'
                    : passwordSubMode === 'signup'
                    ? 'Create Account & Sign In'
                    : 'Send Password Reset Email'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Toggle Sign In / Sign Up */}
              <div className="text-center pt-1 text-xs text-slate-600">
                {passwordSubMode === 'signin' ? (
                  <span>
                    New to SafeHer?{' '}
                    <button
                      type="button"
                      onClick={() => setPasswordSubMode('signup')}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setPasswordSubMode('signin')}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>
            </form>
          )}

          {/* Privacy & Anti-bot Guarantee Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-indigo-500" />
              <span>Zero bot tolerance • Data strictly encrypted</span>
            </span>
            <span>India-First Safety</span>
          </div>
        </div>
      </div>
    </div>
  );
};
