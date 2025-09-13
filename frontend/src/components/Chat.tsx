import React, { useState } from "react";
import { View, Box, Text, Card, Colors, VStack, Divider, ScrollView, Input, Button, HStack, Icon } from 'react-native-native-ui';
import Markdown from 'react-native-markdown-display';
import { useChatAPI, useSessionAPI } from "../api/ApiHooks";
import { firestore, auth } from "../FirebaseConfig";

function MessageBox({ isIncoming = false, message = 'Test message', showAvatar = false })
{
	return (
		<View
			style={{ 
				alignItems: isIncoming ? 'flex-start' : 'flex-end',
				marginVertical: 8
			}}
		>
			<HStack style={{ 
				maxWidth: '85%',
				alignItems: 'flex-end',
				flexDirection: isIncoming ? 'row' : 'row-reverse',
				width: '100%'
			}}>
				{showAvatar && (
					<View style={{
						width: 40,
						height: 40,
						borderRadius: 20,
						backgroundColor: isIncoming ? Colors.primary : Colors.secondary,
						alignItems: 'center',
						justifyContent: 'center',
						marginHorizontal: 8
					}}>
						{isIncoming ? (
							<Icon name="robot" size={20} color={Colors.white} />
						) : (
							<Icon name="account" size={20} color={Colors.white} />
						)}
					</View>
				)}
				<View style={{
					backgroundColor: isIncoming ? Colors.light : Colors.primary,
					padding: 16,
					borderRadius: 20,
					marginLeft: isIncoming && !showAvatar ? 48 : 0,
					marginRight: !isIncoming && !showAvatar ? 48 : 0,
					flex: 1
				}}>
					{!isIncoming && (
						<Text style={{ 
							color: Colors.white,
							flexWrap: 'wrap'
						}}>
							{message}
						</Text>
					)}
					{isIncoming && (
						<View style={{ flex: 1 }}>
							<Markdown style={{
								body: { 
									color: Colors.black, 
									fontSize: 14, 
									lineHeight: 20,
									flexWrap: 'wrap',
									maxWidth: '100%'
								}
							}}>
								{message}
							</Markdown>
						</View>
					)}
				</View>
			</HStack>
		</View>
	)
}

function ServiceCategorySelector({ onSelectService }: { onSelectService: (service: string) => void }) {
	const serviceCategories = [
		{ 
			title: 'Moving & Relocation', 
			icon: 'truck', 
			color: Colors.primary,
			examples: ['Local moving', 'Long distance', 'Packing services', 'Storage']
		},
		{ 
			title: 'Telecom & Internet', 
			icon: 'phone', 
			color: Colors.secondary,
			examples: ['Internet plans', 'Mobile plans', 'TV packages', 'Bundle deals']
		},
		{ 
			title: 'Insurance', 
			icon: 'shield-check', 
			color: Colors.success,
			examples: ['Auto insurance', 'Home insurance', 'Health insurance', 'Life insurance']
		},
		{ 
			title: 'Home Services', 
			icon: 'wrench', 
			color: Colors.warning,
			examples: ['Repairs', 'Cleaning', 'HVAC', 'Plumbing']
		},
		{ 
			title: 'Auto Services', 
			icon: 'car', 
			color: Colors.error,
			examples: ['Car repairs', 'Oil changes', 'Tire services', 'Car rentals']
		},
		{ 
			title: 'Healthcare', 
			icon: 'medical-bag', 
			color: '#9C27B0',
			examples: ['Medical bills', 'Dental services', 'Prescription costs', 'Lab tests']
		},
		{ 
			title: 'Education', 
			icon: 'school', 
			color: '#FF9800',
			examples: ['Tuition fees', 'Training courses', 'Certification programs', 'Textbooks']
		},
		{ 
			title: 'Pet Services', 
			icon: 'dog', 
			color: '#795548',
			examples: ['Veterinary care', 'Pet grooming', 'Pet training', 'Pet boarding']
		},
		{ 
			title: 'Utilities', 
			icon: 'lightning-bolt', 
			color: '#607D8B',
			examples: ['Electricity', 'Gas', 'Water', 'Waste management']
		}
	];

	return (
		<Card style={{ marginBottom: 20 }}>
			<VStack space={16}>
				<Text variant="subtitle" style={{ color: Colors.primary, textAlign: 'center' }}>
					Quick Start - Choose a Service Category
				</Text>
				
				<View style={{ 
					flexDirection: 'row', 
					flexWrap: 'wrap', 
					justifyContent: 'space-between',
					gap: 8
				}}>
					{serviceCategories.map((category, index) => (
						<Button
							key={index}
							variant="ghost"
							onPress={() => onSelectService(`I need help with ${category.title.toLowerCase()}`)}
							style={{
								width: '48%',
								marginBottom: 8,
								borderColor: category.color + '30',
								borderWidth: 1,
								minHeight: 80
							}}
						>
							<VStack style={{ alignItems: 'center', padding: 8 }}>
								<Icon name={category.icon} size={24} color={category.color} />
								<Text style={{ 
									color: category.color, 
									fontSize: 11, 
									fontWeight: 'bold',
									textAlign: 'center',
									marginTop: 4
								}}>
									{category.title}
								</Text>
								<Text style={{ 
									color: Colors.grey, 
									fontSize: 8, 
									textAlign: 'center',
									marginTop: 2
								}}>
									{category.examples.slice(0, 2).join(' • ')}
								</Text>
							</VStack>
						</Button>
					))}
				</View>
			</VStack>
		</Card>
	);
}

function AIWelcomeSection() {
	return (
		<Card style={{ 
			marginBottom: 20, 
			borderColor: Colors.primary,
			borderWidth: 1
		}}>
			<VStack space={16}>
				<HStack style={{ alignItems: 'center', justifyContent: 'center' }}>
					<Icon name="robot" size={32} color={Colors.primary} />
					<View style={{ marginLeft: 12 }}>
						<Text variant="heading" style={{ color: Colors.primary, fontSize: 24 }}>
							ServiceSaver AI
						</Text>
						<Text style={{ color: Colors.grey, fontSize: 12 }}>
							Your Personal Negotiation Assistant
						</Text>
					</View>
				</HStack>
				
				<View style={{ 
					backgroundColor: Colors.white,
					borderRadius: 12,
					padding: 16,
					borderLeftWidth: 4,
					borderLeftColor: Colors.primary
				}}>
					<Text style={{ fontSize: 14, lineHeight: 22, color: Colors.black }}>
						I'm your AI negotiation assistant for ANY service! From moving and utilities to 
						insurance, healthcare, auto services, and more - I'll create personalized strategies 
						and negotiate on your behalf to get you the best deals possible.
					</Text>
				</View>

				<HStack style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
					{[
						{ icon: 'truck', text: 'Moving', color: Colors.primary },
						{ icon: 'phone', text: 'Telecom', color: Colors.secondary },
						{ icon: 'shield-check', text: 'Insurance', color: Colors.success },
						{ icon: 'wrench', text: 'Home Services', color: Colors.warning },
						{ icon: 'car', text: 'Auto Services', color: Colors.error },
						{ icon: 'medical-bag', text: 'Healthcare', color: '#9C27B0' },
						{ icon: 'school', text: 'Education', color: '#FF9800' },
						{ icon: 'store', text: 'Retail', color: '#607D8B' }
					].map((item, index) => (
						<View key={index} style={{ 
							alignItems: 'center', 
							padding: 2,
							flex: 1,
							maxWidth: 70,
							minWidth: 50
						}}>
							<Icon name={item.icon} size={20} color={item.color} />
							<Text style={{ 
								fontSize: 9, 
								textAlign: 'center', 
								marginTop: 2,
								color: Colors.grey,
								lineHeight: 10
							}}>
								{item.text}
							</Text>
						</View>
					))}
				</HStack>
			</VStack>
		</Card>
	);
}

export default function ChatScreen() {

	const [prompt, setPrompt] = useState('');
	const [isStartingOver, setIsStartingOver] = useState(false);
	const [selectedServiceCategory, setSelectedServiceCategory] = useState<string | null>(null);
	const { messages, addMessage } = useChatAPI();
	const { session } = useSessionAPI();

	const handleServiceSelect = (serviceText: string) => {
		// Extract service category from the text
		const categoryMap: Record<string, string> = {
			'moving & relocation': 'movers',
			'telecom & internet': 'telecom',
			'insurance': 'insurance',
			'home services': 'home_services',
			'auto services': 'auto_services',
			'healthcare': 'healthcare',
			'education': 'education',
			'pet services': 'pet_services',
			'utilities': 'finance' // Utilities can be grouped under finance for now
		};
		
		const selectedCategory = serviceText.toLowerCase().replace('i need help with ', '');
		const serviceKey = categoryMap[selectedCategory] || 'movers'; // fallback to movers
		
		setSelectedServiceCategory(serviceKey);
		setPrompt(serviceText);
		
		// Immediately send the message with service category
		if (serviceText.trim()) {
			addMessage(serviceText, serviceKey);
			setPrompt('');
		}
	};

	const handleStartOver = async () => {
		setIsStartingOver(true);
		try {
			const userId = auth().currentUser?.uid;
			if (!userId) return;

			// Reset the user's session in Firestore
			await firestore().collection('users').doc(userId).delete();
		} catch (error) {
			console.error('Error starting over:', error);
		} finally {
			setIsStartingOver(false);
		}
	};

	return (
        <View style={{ flex: 1 }}>
			{messages.length <= 1 && <AIWelcomeSection />}
			{messages.length <= 1 && <ServiceCategorySelector onSelectService={handleServiceSelect} />}
			
			<Card style={{ flex: 1, marginBottom: 20 }}>
				<VStack style={{ height: '100%' }}>
					<HStack style={{ alignItems: 'center', marginBottom: 16 }}>
						<Icon name="chat" size={20} color={Colors.primary} />
						<Text variant="subtitle" style={{ marginLeft: 8, color: Colors.primary, flex: 1 }}>
							Chat with AI Assistant
						</Text>
						{messages.length > 1 && (
							<Button 
								variant="ghost" 
								onPress={handleStartOver}
								disabled={isStartingOver}
								style={{ paddingHorizontal: 8 }}
							>
								<HStack style={{ alignItems: 'center' }}>
									{isStartingOver ? (
										<Icon name="loading" size={14} color={Colors.grey} />
									) : (
										<Icon name="refresh" size={14} color={Colors.grey} />
									)}
									<Text style={{ 
										marginLeft: 4, 
										color: Colors.grey, 
										fontSize: 12 
									}}>
										{isStartingOver ? 'Resetting...' : 'Start Over'}
									</Text>
								</HStack>
							</Button>
						)}
					</HStack>
					
					<ScrollView style={{ flex: 1, marginBottom: 16 }}>
						<MessageBox 
							isIncoming={true}
							message="Hi! I'm your ServiceSaver AI assistant. I can help you negotiate better deals on ANY service - moving, internet/phone, insurance, healthcare, auto services, home repairs, education, and more! Just tell me what service you need help with and I'll create a custom strategy. For example: 'I need cheaper car insurance' or 'Help me negotiate moving costs' or 'I want a better phone plan.'"
							showAvatar={messages.length == 0}
						/>
						{messages.map((message, index) => (
							<MessageBox key={index}
								isIncoming={message.role == 'assistant'} 
								message={message.content}
								showAvatar={message.role == 'assistant' && index >= messages.length - 2}
							/>
						))}
					</ScrollView>
					
					<VStack space={12}>
						<Divider />
						<HStack space={8} style={{ alignItems: 'flex-end' }}>
							<Input 
								placeholder="Describe what service you need help with..." 
								value={prompt} 
								onChangeText={setPrompt}
								style={{ flex: 1 }}
								multiline
								numberOfLines={2}
							/>
							<Button 
								onPress={() => { 
									if (prompt.trim()) {
										addMessage(prompt, selectedServiceCategory || undefined); 
										setPrompt(''); 
									}
								}}
								disabled={!prompt.trim()}
							>
								<HStack style={{ alignItems: 'center' }}>
									<Icon name="send" size={16} color={Colors.white} />
									<Text style={{ marginLeft: 4, color: Colors.white }}>Send</Text>
								</HStack>
							</Button>
						</HStack>
						<Text style={{ 
							fontSize: 10, 
							color: Colors.grey, 
							textAlign: 'center' 
						}}>
							💡 Tip: Be specific about your needs, timeline, and budget for better results
						</Text>
					</VStack>
				</VStack>
			</Card>
        </View>
	)
}