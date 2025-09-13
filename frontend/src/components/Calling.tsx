import React, { useState } from "react";
import { View, Box, Text, Card, Colors, VStack, Divider, ScrollView, Button, OverlaySpinner, HStack, Icon } from 'react-native-native-ui';
import Markdown from 'react-native-markdown-display';
import { useSessionAPI } from "../api/ApiHooks";
import axios from "axios";
import { firestore, auth } from "../FirebaseConfig";

interface CallConversationProps {
	provider: any;
	conversation: string[];
	isActive?: boolean;
}

function CallConversationCard({ provider, conversation, isActive = false }: CallConversationProps) {
	const [expanded, setExpanded] = useState(false);
	
	return (
		<Card style={{ 
			marginBottom: 16,
			borderColor: isActive ? Colors.primary : Colors.grey,
			borderWidth: isActive ? 2 : 1,
		}}>
			<VStack space={12}>
				<HStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
					<HStack style={{ alignItems: 'center', flex: 1 }}>
						<View style={{
							width: 40,
							height: 40,
							borderRadius: 20,
							backgroundColor: isActive ? Colors.success : Colors.grey,
							alignItems: 'center',
							justifyContent: 'center'
						}}>
							<Icon 
								name={isActive ? "phone" : "phone-check"} 
								size={20} 
								color={Colors.white} 
							/>
						</View>
						<View style={{ marginLeft: 12, flex: 1 }}>
							<Text variant="subtitle" style={{ fontWeight: 'bold' }}>
								{provider.name}
							</Text>
							<Text style={{ fontSize: 12, color: Colors.grey }}>
								{provider.phone || provider.contact}
							</Text>
						</View>
					</HStack>
					
					{isActive && (
						<View style={{
							paddingHorizontal: 8,
							paddingVertical: 4,
							backgroundColor: Colors.success,
							borderRadius: 12
						}}>
							<Text style={{ color: Colors.white, fontSize: 10, fontWeight: 'bold' }}>
								LIVE
							</Text>
						</View>
					)}
				</HStack>

				{conversation && conversation.length > 0 && (
					<View>
						<Button 
							variant="ghost" 
							onPress={() => setExpanded(!expanded)}
							style={{ alignSelf: 'flex-start' }}
						>
							<HStack style={{ alignItems: 'center' }}>
								<Icon 
									name={expanded ? "chevron-up" : "chevron-down"} 
									size={16} 
								/>
								<Text style={{ marginLeft: 4 }}>
									{expanded ? 'Hide' : 'Show'} Conversation
								</Text>
							</HStack>
						</Button>
						
						{expanded && (
							<View style={{ 
								backgroundColor: Colors.background,
								borderRadius: 8,
								padding: 12,
								marginTop: 8
							}}>
								<ScrollView style={{ maxHeight: 300 }}>
									{conversation.map((message, index) => {
										const isAI = message.startsWith('AI:') || message.startsWith('ServiceSaver:');
										return (
											<View key={index} style={{ 
												marginBottom: 8,
												alignItems: isAI ? 'flex-start' : 'flex-end'
											}}>
												<View style={{
													backgroundColor: isAI ? Colors.primary : Colors.light,
													padding: 8,
													borderRadius: 12,
													maxWidth: '80%'
												}}>
													<Text style={{ 
														color: isAI ? Colors.white : Colors.black,
														fontSize: 12 
													}}>
														{message.replace(/^(AI:|ServiceSaver:|Customer:)/, '')}
													</Text>
												</View>
											</View>
										);
									})}
								</ScrollView>
							</View>
						)}
					</View>
				)}

				{isActive && (
					<View style={{ alignItems: 'center', padding: 16 }}>
						<View style={{
							width: 60,
							height: 60,
							borderRadius: 30,
							backgroundColor: Colors.success,
							alignItems: 'center',
							justifyContent: 'center',
							marginBottom: 8
						}}>
							<Icon name="phone" size={24} color={Colors.white} />
						</View>
						<Text style={{ fontSize: 12, color: Colors.grey }}>
							AI is negotiating...
						</Text>
					</View>
				)}
			</VStack>
			
			{isActive && <OverlaySpinner message={`Negotiating with ${provider.name}...`} />}
		</Card>
	);
}

export default function CallingScreen() {
    const { session } = useSessionAPI();
    const [isStartingNew, setIsStartingNew] = useState(false);

    const handleStartNewNegotiation = async () => {
        setIsStartingNew(true);
        try {
            const userId = auth().currentUser?.uid;
            if (!userId) return;

            // Reset the user's session in Firestore
            await firestore().collection('users').doc(userId).delete();
            
            // Also call the API to create a new session
            await axios.get(`${globalThis.BASE_URL}/api/chat/new`);
            
            // The component will automatically re-render when Firestore updates
        } catch (error) {
            console.error('Error starting new negotiation:', error);
        } finally {
            setIsStartingNew(false);
        }
    };

    if (!session)
        return <OverlaySpinner />;

    return (
        <View style={{ flex: 1 }}>
			{/* Completion Status */}
            {session.status == 'completed' && (
				<Card style={{ 
					marginBottom: 20, 
					backgroundColor: Colors.success + '10',
					borderColor: Colors.success,
					borderWidth: 1
				}}>
					<HStack style={{ alignItems: 'center' }}>
						<Icon name="check-circle" size={32} color={Colors.success} />
						<View style={{ marginLeft: 12, flex: 1 }}>
							<Text variant="heading" style={{ color: Colors.success }}>
								Negotiation Complete!
							</Text>
							<Text style={{ color: Colors.grey, marginTop: 4 }}>
								Here are your best options:
							</Text>
						</View>
					</HStack>
					
					{session.recommendation && (
						<View style={{ 
							marginTop: 16,
							padding: 16,
							backgroundColor: Colors.white,
							borderRadius: 8
						}}>
							<Markdown style={{
								body: { fontSize: 14, lineHeight: 20 }
							}}>
								{session.recommendation}
							</Markdown>
						</View>
					)}
				</Card>
			)}

			{/* Active Negotiation Status */}
			{session.status == 'negotiating' && (
				<Card style={{ 
					marginBottom: 20,
					backgroundColor: Colors.warning + '10',
					borderColor: Colors.warning,
					borderWidth: 1
				}}>
					<HStack style={{ alignItems: 'center' }}>
						<Icon name="phone-in-talk" size={24} color={Colors.warning} />
						<View style={{ marginLeft: 12 }}>
							<Text variant="subtitle" style={{ color: Colors.warning, fontWeight: 'bold' }}>
								AI is Negotiating Live
							</Text>
							<Text style={{ color: Colors.grey, fontSize: 12 }}>
								Calling service providers to get you the best deals...
							</Text>
						</View>
					</HStack>
				</Card>
			)}

			{/* Call Results */}
			<Card>
				<VStack space={16}>
					<HStack style={{ alignItems: 'center' }}>
						<Icon name="phone-log" size={20} color={Colors.primary} />
						<Text variant="subtitle" style={{ marginLeft: 8, color: Colors.primary }}>
							Call Results & Conversations
						</Text>
					</HStack>

					{(!session.movers || session.movers.length === 0) && (
						<View style={{ alignItems: 'center', padding: 32 }}>
							<Icon name="phone-off" size={48} color={Colors.grey} />
							<Text style={{ color: Colors.grey, marginTop: 8 }}>
								No providers contacted yet
							</Text>
						</View>
					)}

					{session.movers && session.movers.map((provider: any, index: number) => {
						const isActive = session.status === 'negotiating' && 
							session.callSummaries && 
							session.callSummaries.length === index;
						
						// Mock conversation data - in real app this would come from session
						const conversation = session.callSummaries && session.callSummaries[index] 
							? session.callSummaries[index].split('\n').filter((line: string) => line.trim())
							: [];

						return (
							<CallConversationCard
								key={index}
								provider={provider}
								conversation={conversation}
								isActive={isActive}
							/>
						);
					})}
				</VStack>
			</Card>

			{/* Action Buttons */}
			{session.status == 'completed' && (
				<Card style={{ marginTop: 20 }}>
					<VStack space={12}>
						<Text variant="subtitle">What's next?</Text>
						<HStack space={12}>
							<Button 
								variant="solid"
								onPress={handleStartNewNegotiation}
								disabled={isStartingNew}
								style={{ flex: 1 }}
							>
								<HStack style={{ alignItems: 'center' }}>
									{isStartingNew ? (
										<>
											<Icon name="loading" size={16} color={Colors.white} />
											<Text style={{ marginLeft: 4, color: Colors.white }}>
												Starting...
											</Text>
										</>
									) : (
										<>
											<Icon name="plus" size={16} color={Colors.white} />
											<Text style={{ marginLeft: 4, color: Colors.white }}>
												New Negotiation
											</Text>
										</>
									)}
								</HStack>
							</Button>
							<Button 
								variant="outline"
								style={{ flex: 1 }}
							>
								<HStack style={{ alignItems: 'center' }}>
									<Icon name="share" size={16} color={Colors.primary} />
									<Text style={{ marginLeft: 4, color: Colors.primary }}>
										Share Results
									</Text>
								</HStack>
							</Button>
						</HStack>
					</VStack>
				</Card>
			)}
        </View>
    );
}
