import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User, PlanType } from '../types';
import { Loader2, Check, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, CreditCard, Smartphone, Banknote, Calendar, KeyRound } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

type AuthView = 'login' | 'pricing' | 'payment' | 'register' | 'verify' | 'forgot-password' | 'reset-password';

// --- Sub-Components Defined OUTSIDE to prevent re-render focus loss ---

const AlertCircle = ({className}: {className: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);

const AuthWrapper: React.FC<{ title: string; subtitle: string; children: React.ReactNode; error?: string | null; success?: string | null }> = ({ title, subtitle, children, error, success }) => (
     <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-xl mb-4">
                <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <p className="text-slate-500 mt-1">{subtitle}</p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center animate-pulse">
                <AlertCircle className="w-4 h-4 mr-2" /> {error}
            </div>
        )}
        {success && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg flex items-center">
                <Check className="w-4 h-4 mr-2" /> {success}
            </div>
        )}

        {children}
     </div>
);

const InputField = ({ icon: Icon, ...props }: any) => (
    <div className="relative mb-4">
        <Icon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <input className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" {...props} />
    </div>
);

// --- Main Component ---

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('pricing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('Starter');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('transfer');
  
  // Custom Security State
  const [securityPin, setSecurityPin] = useState('');
  const [showSecurityStep, setShowSecurityStep] = useState(false);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handlePlanSelection = (plan: PlanType) => {
      setSelectedPlan(plan);
      setView('payment');
      setShowSecurityStep(false);
      setSecurityPin('');
  };

  const initiatePayment = (e: React.FormEvent) => {
      e.preventDefault();
      clearMessages();
      setLoading(true);
      // Simulate checking credentials before asking for PIN
      setTimeout(() => {
          setLoading(false);
          setShowSecurityStep(true);
      }, 500);
  };

  const confirmPaymentWithPin = (e: React.FormEvent) => {
      e.preventDefault();
      if (securityPin.length < 4) {
          setError("Invalid Security PIN. Must be at least 4 digits.");
          return;
      }
      setLoading(true);
      setError(null);
      // Finalize Payment
      setTimeout(() => {
          setLoading(false);
          setSuccess("Transaction Authorized & Confirmed.");
          setTimeout(() => {
              setSuccess(null);
              setView('register');
          }, 1500);
      }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const res = await authService.register(email, fullName, password, selectedPlan);
    setLoading(false);
    if (res.success) {
      setSuccess(res.message);
      setView('verify');
    } else {
      setError(res.message);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const res = await authService.verifyAccount(email, verificationCode);
    setLoading(false);
    if (res.success) {
      setSuccess(res.message);
      setTimeout(() => setView('login'), 1500);
    } else {
      setError(res.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const res = await authService.login(email, password);
    setLoading(false);
    if (res.success && res.user) {
      onLogin(res.user);
    } else {
      setError(res.message);
      if (res.message.includes('not verified')) {
          setView('verify');
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const res = await authService.requestPasswordReset(email);
    setLoading(false);
    if (res.success) {
      setSuccess(res.message);
      setTimeout(() => setView('reset-password'), 2000);
    } else {
      setError(res.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const res = await authService.resetPassword(email, resetToken, newPassword);
    setLoading(false);
    if (res.success) {
        setSuccess(res.message);
        setTimeout(() => setView('login'), 2000);
    } else {
        setError(res.message);
    }
  };

  // --- Render Pricing Table ---
  const renderPricing = () => (
    <div className="w-full max-w-4xl animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Choose your intelligence level</h1>
        <p className="text-slate-500 text-lg">Start analyzing sentiment and health metrics today.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Starter Plan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-300 group-hover:bg-slate-500 transition-colors"></div>
            <h3 className="text-xl font-bold text-slate-800">Starter</h3>
            <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-slate-900">$3</span>
                <span className="text-slate-500">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-slate-600">
                <li className="flex"><Check className="w-4 h-4 mr-2 text-green-500" /> 100 Analyses / mo</li>
                <li className="flex"><Check className="w-4 h-4 mr-2 text-green-500" /> Basic Text & Image</li>
                <li className="flex"><Check className="w-4 h-4 mr-2 text-green-500" /> Email Support</li>
            </ul>
            <button onClick={() => handlePlanSelection('Starter')} className="w-full py-3 rounded-lg bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 transition-colors">
                Select Starter
            </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-indigo-600 p-6 rounded-2xl shadow-xl transform md:-translate-y-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-orange-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
            <h3 className="text-xl font-bold text-white">Professional</h3>
            <div className="mt-4 mb-6 text-white">
                <span className="text-4xl font-bold">$15</span>
                <span className="text-indigo-200">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-indigo-100">
                <li className="flex"><Check className="w-4 h-4 mr-2 text-white" /> 1,000 Analyses / mo</li>
                <li className="flex"><Check className="w-4 h-4 mr-2 text-white" /> Medical Diagnostics</li>
                <li className="flex"><Check className="w-4 h-4 mr-2 text-white" /> Video Recording</li>
                <li className="flex"><Check className="w-4 h-4 mr-2 text-white" /> Priority Support</li>
            </ul>
            <button onClick={() => handlePlanSelection('Pro')} className="w-full py-3 rounded-lg bg-white text-indigo-600 font-bold hover:bg-indigo-50 transition-colors shadow-lg">
                Select Professional
            </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-300 group-hover:bg-slate-500 transition-colors"></div>
            <h3 className="text-xl font-bold text-slate-800">Enterprise</h3>
            <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-slate-900">Custom</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-slate-600">
                <li className="flex"><Check className="w-4 h-4 mr-2 text-green-500" /> Unlimited Volume</li>
                <li className="flex"><Check className="w-4 h-4 mr-2 text-green-500" /> Custom Integrations</li>
                <li className="flex"><Check className="w-4 h-4 mr-2 text-green-500" /> Dedicated Account Mgr</li>
            </ul>
            <button onClick={() => handlePlanSelection('Enterprise')} className="w-full py-3 rounded-lg bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 transition-colors">
                Contact Sales
            </button>
        </div>
      </div>
      
      <div className="mt-12 text-center">
          <p className="text-slate-500">Already have an account? <button onClick={() => setView('login')} className="text-indigo-600 font-bold hover:underline">Log In</button></p>
      </div>
    </div>
  );

  // --- RENDER LOGIC ---

  if (view === 'pricing') return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">{renderPricing()}</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        
        {/* Payment View */}
        {view === 'payment' && (
             <AuthWrapper title="Secure Payment" subtitle={`Total: $${selectedPlan === 'Starter' ? '3' : '15'}/mo for ${selectedPlan} Plan`} error={error} success={success}>
                {!showSecurityStep ? (
                    <>
                        <div className="flex space-x-2 mb-6 p-1 bg-slate-100 rounded-lg">
                            <button 
                            onClick={() => setPaymentMethod('transfer')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center ${paymentMethod === 'transfer' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                            >
                                <Smartphone className="w-4 h-4 mr-2" /> EasyPaisa / JazzCash
                            </button>
                            <button 
                            onClick={() => setPaymentMethod('card')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center ${paymentMethod === 'card' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                            >
                                <CreditCard className="w-4 h-4 mr-2" /> Credit Card
                            </button>
                        </div>

                        {paymentMethod === 'transfer' ? (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 text-center">
                            <p className="text-sm text-slate-500 mb-2">Send payment to the following number:</p>
                            <p className="text-xl font-bold text-slate-800 tracking-wider mb-1">+92 320 1847179</p>
                            <p className="text-xs text-slate-400">Account Title: Mohsin Akram</p>
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <InputField icon={Banknote} placeholder="Enter Transaction ID / Ref No." required />
                            </div>
                        </div>
                        ) : (
                            <div className="space-y-4 mb-6">
                                <InputField icon={CreditCard} placeholder="Card Number" type="text" autoComplete="cc-number" />
                                <div className="flex space-x-4">
                                    <InputField icon={Calendar} placeholder="MM/YY" type="text" autoComplete="cc-exp" />
                                    <InputField icon={Lock} placeholder="CVC" type="text" autoComplete="cc-csc" />
                                </div>
                            </div>
                        )}

                        <button onClick={initiatePayment} disabled={loading} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all flex items-center justify-center shadow-lg">
                            {loading ? <Loader2 className="animate-spin" /> : <>Verify Details & Proceed <ArrowRight className="w-4 h-4 ml-2" /></>}
                        </button>
                    </>
                ) : (
                    // Security PIN Step
                    <div className="animate-in fade-in slide-in-from-right-4">
                        <div className="bg-amber-50 p-4 rounded-lg mb-6 border border-amber-200">
                            <h4 className="font-bold text-amber-800 text-sm mb-1 flex items-center">
                                <KeyRound className="w-4 h-4 mr-2" /> Custom Security Check
                            </h4>
                            <p className="text-xs text-amber-700">Please enter your 4-digit security PIN to authorize this transaction.</p>
                        </div>
                        <InputField 
                             icon={Lock} 
                             placeholder="Enter 4-Digit Security PIN" 
                             type="password" 
                             value={securityPin} 
                             onChange={(e: any) => setSecurityPin(e.target.value)} 
                             maxLength={6}
                             autoFocus
                        />
                        <button onClick={confirmPaymentWithPin} disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg">
                            {loading ? <Loader2 className="animate-spin" /> : <>Authorize Transaction <Check className="w-4 h-4 ml-2" /></>}
                        </button>
                         <div className="mt-4 text-center">
                            <button onClick={() => setShowSecurityStep(false)} className="text-slate-500 text-xs hover:text-slate-700">Back to Payment Details</button>
                        </div>
                    </div>
                )}
                
                {!showSecurityStep && (
                    <div className="mt-4 text-center">
                        <button onClick={() => setView('pricing')} className="text-slate-500 text-sm hover:text-slate-700">Cancel</button>
                    </div>
                )}
             </AuthWrapper>
        )}

        {/* Register View */}
        {view === 'register' && (
            <AuthWrapper title="Create Account" subtitle={`Sign up for ${selectedPlan} Plan`} error={error} success={success}>
                <form onSubmit={handleRegister}>
                    <InputField 
                        icon={UserIcon} 
                        placeholder="Full Name" 
                        value={fullName} 
                        onChange={(e: any) => setFullName(e.target.value)} 
                        required 
                        autoComplete="name"
                    />
                    <InputField 
                        icon={Mail} 
                        placeholder="Gmail Address" 
                        type="email" 
                        value={email} 
                        onChange={(e: any) => setEmail(e.target.value)} 
                        required 
                        autoComplete="email"
                        spellCheck="false"
                    />
                    <InputField 
                        icon={Lock} 
                        placeholder="Password" 
                        type="password" 
                        value={password} 
                        onChange={(e: any) => setPassword(e.target.value)} 
                        required 
                        autoComplete="new-password"
                    />
                    
                    <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center">
                        {loading ? <Loader2 className="animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>}
                    </button>
                </form>
                <div className="mt-6 text-center text-sm">
                    <button onClick={() => setView('pricing')} className="text-slate-500 hover:text-indigo-600">Change Plan</button>
                    <span className="mx-2 text-slate-300">|</span>
                    <button onClick={() => setView('login')} className="text-slate-500 hover:text-indigo-600">Log In</button>
                </div>
            </AuthWrapper>
        )}

        {/* Login View */}
        {view === 'login' && (
            <AuthWrapper title="Welcome Back" subtitle="Log in to access your dashboard" error={error} success={success}>
                <form onSubmit={handleLogin}>
                    <InputField 
                        icon={Mail} 
                        placeholder="Gmail Address" 
                        type="email" 
                        value={email} 
                        onChange={(e: any) => setEmail(e.target.value)} 
                        required 
                        autoComplete="email"
                        spellCheck="false"
                    />
                    <InputField 
                        icon={Lock} 
                        placeholder="Password" 
                        type="password" 
                        value={password} 
                        onChange={(e: any) => setPassword(e.target.value)} 
                        required 
                        autoComplete="current-password"
                    />
                    
                    <div className="text-right mb-4">
                        <button type="button" onClick={() => setView('forgot-password')} className="text-xs text-indigo-600 hover:underline">Forgot password?</button>
                    </div>

                    <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center">
                        {loading ? <Loader2 className="animate-spin" /> : "Log In"}
                    </button>
                </form>
                <div className="mt-6 text-center text-sm">
                    Don't have an account? <button onClick={() => setView('pricing')} className="text-indigo-600 font-bold hover:underline">Sign Up</button>
                </div>
            </AuthWrapper>
        )}

        {/* Verify View */}
        {view === 'verify' && (
             <AuthWrapper title="Verify Email" subtitle={`Enter code sent to ${email}`} error={error} success={success}>
                <div className="mb-4 text-center p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100">
                    <span className="font-bold">TIP:</span> Check the Bell Icon 🔔 on the dashboard or check console for the simulated code.
                </div>
                <form onSubmit={handleVerify}>
                    <InputField icon={ShieldCheck} placeholder="6-Digit Code" value={verificationCode} onChange={(e: any) => setVerificationCode(e.target.value)} required autoComplete="one-time-code" />
                    <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center">
                        {loading ? <Loader2 className="animate-spin" /> : "Verify Account"}
                    </button>
                </form>
             </AuthWrapper>
        )}

        {/* Forgot Password View */}
        {view === 'forgot-password' && (
            <AuthWrapper title="Reset Password" subtitle="Enter your Gmail to receive a link" error={error} success={success}>
                <form onSubmit={handleForgotPassword}>
                    <InputField 
                        icon={Mail} 
                        placeholder="Gmail Address" 
                        type="email" 
                        value={email} 
                        onChange={(e: any) => setEmail(e.target.value)} 
                        required 
                        autoComplete="email"
                        spellCheck="false"
                    />
                    <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center">
                        {loading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
                    </button>
                </form>
                <div className="mt-6 text-center text-sm">
                   <button onClick={() => setView('login')} className="text-slate-500 hover:text-indigo-600">Back to Login</button>
                </div>
            </AuthWrapper>
        )}

        {/* Reset Password View (After Token) */}
        {view === 'reset-password' && (
             <AuthWrapper title="Set New Password" subtitle="Secure your account" error={error} success={success}>
                <form onSubmit={handleResetPassword}>
                    <InputField icon={ShieldCheck} placeholder="Paste Token from Email" value={resetToken} onChange={(e: any) => setResetToken(e.target.value)} required />
                    <InputField icon={Lock} placeholder="New Password" type="password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} required autoComplete="new-password" />
                    <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center">
                        {loading ? <Loader2 className="animate-spin" /> : "Change Password"}
                    </button>
                </form>
             </AuthWrapper>
        )}
    </div>
  );
};

export default Auth;