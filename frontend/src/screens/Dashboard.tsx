import React, { useState } from "react";
import { View, Colors, Text, HStack, VStack, Card, Button, Icon, ScrollView } from 'react-native-native-ui';
import { useSessionAPI } from "../api/ApiHooks";

import Chat from "../components/Chat";
import Strategy from "../components/Strategy";
import Calling from "../components/Calling";

type Step = 'chat' | 'strategy' | 'call';

interface StepperProps {
	currentStep: Step;
	session: any;
}

function AIProgressStepper({ currentStep, session }: StepperProps) {
	const steps = [
		{ 
			key: 'chat' as Step, 
			title: 'Describe Your Need', 
			subtitle: 'Tell AI about the service you need',
			icon: 'chat-processing',
			status: session?.status === 'info_collection' ? 'active' : 
					(['strategizing', 'negotiating', 'completed'].includes(session?.status)) ? 'completed' : 'pending'
		},
		{ 
			key: 'strategy' as Step, 
			title: 'AI Creates Strategy', 
			subtitle: 'Smart negotiation plan generated',
			icon: 'brain',
			status: session?.status === 'strategizing' ? 'active' : 
					(['negotiating', 'completed'].includes(session?.status)) ? 'completed' : 'pending'
		},
		{ 
			key: 'call' as Step, 
			title: 'AI Negotiates for You', 
			subtitle: 'Live negotiation & results',
			icon: 'phone-in-talk',
			status: ['negotiating', 'completed'].includes(session?.status) ? 'active' : 'pending'
		}
	];

	return (
		<Card style={{ marginBottom: 20, padding: 16 }}>
			<VStack space={16}>
				<HStack style={{ alignItems: 'center', marginBottom: 8 }}>
					<Icon name="robot" size={24} color={Colors.primary} />
					<Text variant="heading" style={{ marginLeft: 8, color: Colors.primary }}>
						ServiceSaver AI Assistant
					</Text>
				</HStack>
				
				<HStack style={{ justifyContent: 'space-between' }}>
					{steps.map((step, index) => (
						<View key={step.key} style={{ flex: 1, alignItems: 'center' }}>
							<View style={{ 
								width: 56, 
								height: 56, 
								borderRadius: 28,
								backgroundColor: step.status === 'completed' ? Colors.success : 
											   step.status === 'active' ? Colors.primary : Colors.grey200,
								alignItems: 'center', 
								justifyContent: 'center',
								marginBottom: 8
							}}>
								{step.status === 'completed' ? (
									<Icon name="check" size={24} color={Colors.white} />
								) : (
									<Icon 
										name={step.icon} 
										size={24} 
										color={step.status === 'active' ? Colors.white : Colors.grey500} 
									/>
								)}
							</View>
							
							<Text variant="subtitle" style={{ 
								textAlign: 'center', 
								fontSize: 12, 
								fontWeight: step.status === 'active' ? 'bold' : 'normal',
								color: step.status === 'active' ? Colors.primary : Colors.textSecondary
							}}>
								{step.title}
							</Text>
							<Text style={{ 
								textAlign: 'center', 
								fontSize: 10, 
								color: Colors.textSecondary,
								marginTop: 2
							}}>
								{step.subtitle}
							</Text>
							
							{index < steps.length - 1 && (
								<View style={{
									position: 'absolute',
									top: 28,
									right: -20,
									width: 40,
									height: 2,
									backgroundColor: steps[index + 1].status !== 'pending' ? Colors.success : Colors.grey300
								}} />
							)}
						</View>
					))}
				</HStack>
			</VStack>
		</Card>
	);
}

export default function Dashboard()
{
	const { session } = useSessionAPI();
	const [activeTab, setActiveTab] = useState<Step>('chat');

	// Auto-navigate based on session status
	React.useEffect(() => {
		if (!session) return;
		
		switch (session.status) {
			case 'info_collection':
				setActiveTab('chat');
				break;
			case 'strategizing':
				setActiveTab('strategy');
				break;
			case 'negotiating':
			case 'completed':
				setActiveTab('call');
				break;
		}
	}, [session?.status]);

	const renderContent = () => {
		switch (activeTab) {
			case 'chat':
				return <Chat />;
			case 'strategy':
				return <Strategy />;
			case 'call':
				return <Calling />;
			default:
				return <Chat />;
		}
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: Colors.background }}>
			<View style={{ padding: 20, maxWidth: 1200, alignSelf: 'center', width: '100%' }}>
				<AIProgressStepper currentStep={activeTab} session={session} />
				
				{/* Navigation Tabs - Modern pill style */}
				<Card style={{ marginBottom: 20, padding: 4 }}>
					<HStack space={4}>
						{[
							{ key: 'chat' as Step, label: 'Discuss Need', icon: 'chat' },
							{ key: 'strategy' as Step, label: 'AI Strategy', icon: 'lightbulb-on' },
							{ key: 'call' as Step, label: 'Negotiate', icon: 'phone' }
						].map((tab) => (
							<Button
								key={tab.key}
								variant={activeTab === tab.key ? "solid" : "ghost"}
								onPress={() => setActiveTab(tab.key)}
								style={{ flex: 1 }}
								leftIcon={<Icon name={tab.icon} size={16} />}
							>
								{tab.label}
							</Button>
						))}
					</HStack>
				</Card>

				{/* Content Area */}
				<View style={{ minHeight: 400 }}>
					{renderContent()}
				</View>
			</View>
		</ScrollView>
	);
}