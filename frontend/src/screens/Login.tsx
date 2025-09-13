import React, { useState } from "react";
import { Text, View, KeyboardAvoidScrollView, Input, Button, OverlaySpinner, useMessage, Divider, Card, VStack, HStack, Icon, Colors } from "react-native-native-ui";
import { auth } from '../FirebaseConfig';

export default function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const { showMessage } = useMessage();

    const onSubmit = async () => {
        setLoading(true);
        try {
            if (mode == 'register') {
                if (password != confirmPassword)
                    throw new Error('Passwords do not match');
                await auth().createUserWithEmailAndPassword(email, password);
            }
            else {
                await auth().signInWithEmailAndPassword(email, password);
            }
        }
        catch (error) {
            setLoading(false);
            let message = 'Error signing in';
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'User was not found. Consider registering.';
                    break;
                case 'auth/wrong-password':
                    message = 'Invalid password';
                    break;
                case 'auth/invalid-email':
                    message = 'Invalid email address';
                    break;
                case 'auth/email-already-in-use':
                    message = 'Email already in use';
                    break;
                case 'auth/user-disabled':
                    message = 'User has been disabled';
                    break;
            }
            showMessage({ title: 'Auth Error', text: message, status: "error" });
        }
    }

    return (
        <KeyboardAvoidScrollView style={{ 
			flex: 1, 
			backgroundColor: `linear-gradient(135deg, ${Colors.primary}05 0%, ${Colors.secondary}05 100%)`
		}}>
            <View style={{ 
				flex: 1, 
				justifyContent: 'center', 
				alignItems: 'center',
				padding: 20
			}}>
				{/* Hero Section */}
				<View style={{ 
					alignItems: 'center', 
					marginBottom: 40,
					maxWidth: 500
				}}>
					<View style={{
						width: 80,
						height: 80,
						borderRadius: 40,
						backgroundColor: Colors.primary,
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: 24
					}}>
						<Icon name="robot" size={40} color={Colors.white} />
					</View>
					
					<Text style={{ 
						fontSize: 32, 
						fontWeight: 'bold', 
						color: Colors.primary,
						marginBottom: 8,
						textAlign: 'center'
					}}>
						ServiceSaver AI
					</Text>
					
					<Text style={{ 
						fontSize: 16, 
						color: Colors.grey,
						textAlign: 'center',
						lineHeight: 24,
						marginBottom: 8
					}}>
						Your AI-powered negotiation assistant for getting the best deals on ANY service - from moving and utilities to insurance, healthcare, and beyond
					</Text>
					
					<HStack style={{ flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 16 }}>
						{[
							{ icon: 'phone-in-talk', text: 'AI Negotiates for You' },
							{ icon: 'brain', text: 'Smart Strategies' },
							{ icon: 'currency-usd', text: 'Save on Any Service' }
						].map((feature, index) => (
							<HStack key={index} style={{ alignItems: 'center' }}>
								<Icon name={feature.icon} size={16} color={Colors.primary} />
								<Text style={{ 
									marginLeft: 4, 
									fontSize: 12, 
									color: Colors.grey
								}}>
									{feature.text}
								</Text>
							</HStack>
						))}
					</HStack>
				</View>

				{/* Auth Form */}
                <Card style={{ 
					maxWidth: 400, 
					width: '100%',
					padding: 24
				}}>
                    <VStack space={20}>
                        <View style={{ alignItems: 'center' }}>
                            <Text variant='heading' style={{ color: Colors.primary, fontSize: 24 }}>
								{mode == 'register' ? 'Create Account' : 'Welcome Back'}
							</Text>
							<Text style={{ color: Colors.grey, fontSize: 14, marginTop: 4 }}>
								{mode == 'register' 
									? 'Join thousands saving money with AI' 
									: 'Sign in to continue saving with AI'
								}
							</Text>
                        </View>

						<VStack space={16}>
							<Input 
								label='Email Address' 
								placeholder="Enter your email" 
								value={email} 
								onChangeText={setEmail}
								keyboardType="email-address"
								autoCapitalize="none"
							/>
							<Input 
								label='Password' 
								placeholder="Enter your password" 
								secureTextEntry 
								value={password} 
								onChangeText={setPassword} 
							/>
							{mode == 'register' && (
								<Input 
									label='Confirm Password' 
									placeholder="Confirm your password" 
									secureTextEntry 
									value={confirmPassword} 
									onChangeText={setConfirmPassword} 
								/>
							)}
						</VStack>

						<Button 
							onPress={onSubmit}
							disabled={!email || !password || (mode === 'register' && !confirmPassword)}
							style={{ marginTop: 8 }}
						>
							<HStack style={{ alignItems: 'center', justifyContent: 'center' }}>
								<Icon 
									name={mode === 'register' ? 'account-plus' : 'login'} 
									size={16} 
									color={Colors.white} 
								/>
								<Text style={{ marginLeft: 8, color: Colors.white, fontWeight: 'bold' }}>
									{mode == 'register' ? 'Create Account' : 'Sign In'}
								</Text>
							</HStack>
						</Button>

                        <View style={{ alignItems: 'center' }}>
							<Text style={{ color: Colors.grey, fontSize: 12, marginBottom: 8 }}>
								{mode == 'register' ? 'Already have an account?' : 'New to ServiceSaver AI?'}
							</Text>
							<Button 
								variant='ghost'
								onPress={() => setMode(mode == 'register' ? 'login' : 'register')}
							>
								<Text style={{ color: Colors.primary, fontWeight: '500' }}>
									{mode == 'register' ? 'Sign In Instead' : 'Create Free Account'}
								</Text>
							</Button>
						</View>
                    </VStack>
                </Card>

				{/* Trust Indicators */}
				<View style={{ 
					marginTop: 32,
					alignItems: 'center',
					maxWidth: 400
				}}>
					<HStack style={{ alignItems: 'center', marginBottom: 16 }}>
						<Icon name="shield-check" size={16} color={Colors.success} />
						<Text style={{ marginLeft: 4, fontSize: 12, color: Colors.grey }}>
							Secure & Private
						</Text>
						<View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.grey, marginHorizontal: 8 }} />
						<Icon name="star" size={16} color={Colors.warning} />
						<Text style={{ marginLeft: 4, fontSize: 12, color: Colors.grey }}>
							Trusted by Thousands
						</Text>
					</HStack>
					<Text style={{ 
						fontSize: 10, 
						color: Colors.grey, 
						textAlign: 'center',
						lineHeight: 14
					}}>
						Your data is encrypted and we never share your information with third parties
					</Text>
				</View>
            </View>
            {loading && <OverlaySpinner message="Signing you in..." />}
        </KeyboardAvoidScrollView>
    );
}