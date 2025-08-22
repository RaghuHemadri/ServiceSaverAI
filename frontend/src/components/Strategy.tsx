import React, { useState } from "react";
import { View, Box, Text, Card, Colors, VStack, Divider, ScrollView, OverlaySpinner, HStack, Icon } from 'react-native-native-ui';
import Markdown from 'react-native-markdown-display';
import moment from 'moment';
import { useSessionAPI } from "../api/ApiHooks";

function InfoCard({ title, children, icon }: { title: string; children: React.ReactNode; icon: string }) {
	return (
		<Card style={{ marginBottom: 16 }}>
			<VStack space={12}>
				<HStack style={{ alignItems: 'center' }}>
					<Icon name={icon} size={20} color={Colors.primary} />
					<Text variant="subtitle" style={{ marginLeft: 8, color: Colors.primary }}>
						{title}
					</Text>
				</HStack>
				<Divider />
				{children}
			</VStack>
		</Card>
	);
}

function CustomerInfoSection({ customerInfo }: { customerInfo: any }) {
	// Dynamic info rows based on service type
	const getInfoRows = () => {
		const baseInfo = [
			{
				items: [
					{ label: 'Name', value: customerInfo.name },
					{ label: 'Phone', value: customerInfo.phone }
				]
			}
		];

		// Add service-specific information
		if (customerInfo.current_address && customerInfo.destination_address) {
			// Moving service
			baseInfo.push(
				{
					items: [
						{ label: 'From', value: customerInfo.current_address },
						{ label: 'To', value: customerInfo.destination_address }
					]
				},
				{
					items: [
						{ label: 'Move Out', value: customerInfo.move_out_date ? moment(customerInfo.move_out_date).format("MMM DD, YYYY") : 'TBD' },
						{ label: 'Move In', value: customerInfo.move_in_date ? moment(customerInfo.move_in_date).format("MMM DD, YYYY") : 'TBD' }
					]
				},
				{
					items: [
						{ label: 'Home Size', value: customerInfo.apartment_size || 'Not specified' },
						{ label: 'Packing Help', value: customerInfo.packing_assistance ? "Yes" : "No" }
					]
				}
			);
		} else {
			// General service information
			const serviceSpecificFields = [
				{ key: 'service_type', label: 'Service Type' },
				{ key: 'current_provider', label: 'Current Provider' },
				{ key: 'budget', label: 'Budget' },
				{ key: 'timeline', label: 'Timeline' },
				{ key: 'location', label: 'Location' },
				{ key: 'requirements', label: 'Requirements' },
				{ key: 'current_plan', label: 'Current Plan' },
				{ key: 'desired_features', label: 'Desired Features' }
			];

			const dynamicRows = [];
			for (let i = 0; i < serviceSpecificFields.length; i += 2) {
				const items = [];
				const field1 = serviceSpecificFields[i];
				const field2 = serviceSpecificFields[i + 1];

				if (customerInfo[field1?.key]) {
					items.push({ label: field1.label, value: customerInfo[field1.key] });
				}
				if (field2 && customerInfo[field2?.key]) {
					items.push({ label: field2.label, value: customerInfo[field2.key] });
				}

				if (items.length > 0) {
					dynamicRows.push({ items });
				}
			}

			baseInfo.push(...dynamicRows);
		}

		return baseInfo;
	};

	const infoRows = getInfoRows();

	return (
		<InfoCard title="Your Service Details" icon="account-details">
			<VStack space={12}>
				{infoRows.map((row, rowIndex) => (
					<HStack key={rowIndex} space={16}>
						{row.items.map((item, itemIndex) => (
							<View key={itemIndex} style={{ flex: 1 }}>
								<Text style={{ fontSize: 12, color: Colors.grey, marginBottom: 4 }}>
									{item.label}
								</Text>
								<Text variant="key" style={{ fontSize: 14, fontWeight: '600' }}>
									{item.value}
								</Text>
							</View>
						))}
					</HStack>
				))}
				
				{customerInfo.inventory && customerInfo.inventory.length > 0 && (
					<View>
						<Text style={{ fontSize: 12, color: Colors.grey, marginBottom: 8 }}>
							Additional Details
						</Text>
						<HStack style={{ flexWrap: 'wrap', gap: 8 }}>
							{customerInfo.inventory.map((item: string, index: number) => (
								<View key={index} style={{
									backgroundColor: Colors.primary + '15',
									paddingHorizontal: 8,
									paddingVertical: 4,
									borderRadius: 12
								}}>
									<Text style={{ fontSize: 12, color: Colors.primary }}>
										{item}
									</Text>
								</View>
							))}
						</HStack>
					</View>
				)}
			</VStack>
		</InfoCard>
	);
}

function ProvidersSection({ providers, rationale }: { providers: any[]; rationale: string }) {
	return (
		<InfoCard title="Selected Service Providers" icon="domain">
			{rationale && (
				<View style={{
					backgroundColor: Colors.light,
					padding: 12,
					borderRadius: 8,
					marginBottom: 16
				}}>
					<Markdown style={{
						body: { fontSize: 13, lineHeight: 18 }
					}}>
						{rationale}
					</Markdown>
				</View>
			)}
			
			<VStack space={12}>
				{providers.map((provider: any, index: number) => (
					<Card key={index} style={{ 
						backgroundColor: Colors.background,
						borderColor: Colors.primary + '30',
						borderWidth: 1
					}}>
						<HStack style={{ alignItems: 'center' }}>
							<View style={{
								width: 50,
								height: 50,
								borderRadius: 25,
								backgroundColor: Colors.primary,
								alignItems: 'center',
								justifyContent: 'center'
							}}>
								<Icon name={provider.icon || "domain"} size={24} color={Colors.white} />
							</View>
							
							<View style={{ marginLeft: 12, flex: 1 }}>
								<Text variant="key" style={{ fontSize: 16, fontWeight: 'bold' }}>
									{provider.name}
								</Text>
								<Text style={{ color: Colors.grey, fontSize: 12, marginTop: 2 }}>
									{provider.phone || provider.contact}
								</Text>
								
								{provider.specialties && (
									<HStack style={{ flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
										{provider.specialties.split(',').map((specialty: string, i: number) => (
											<View key={i} style={{
												backgroundColor: Colors.success + '20',
												paddingHorizontal: 6,
												paddingVertical: 2,
												borderRadius: 8
											}}>
												<Text style={{ 
													fontSize: 10, 
													color: Colors.success,
													fontWeight: '500'
												}}>
													{specialty.trim()}
												</Text>
											</View>
										))}
									</HStack>
								)}
							</View>
							
							<Icon name="chevron-right" size={16} color={Colors.grey} />
						</HStack>
					</Card>
				))}
			</VStack>
		</InfoCard>
	);
}

function StrategySection({ strategy }: { strategy: string }) {
	return (
		<InfoCard title="AI Negotiation Strategy" icon="brain">
			{strategy ? (
				<View>
					<View style={{
						backgroundColor: Colors.primary + '10',
						borderLeftWidth: 4,
						borderLeftColor: Colors.primary,
						padding: 16,
						borderRadius: 8
					}}>
						<HStack style={{ alignItems: 'center', marginBottom: 8 }}>
							<Icon name="robot" size={16} color={Colors.primary} />
							<Text style={{ 
								marginLeft: 4, 
								fontSize: 12, 
								color: Colors.primary,
								fontWeight: 'bold'
							}}>
								AI STRATEGY
							</Text>
						</HStack>
						<Markdown style={{
							body: { fontSize: 14, lineHeight: 20 }
						}}>
							{strategy}
						</Markdown>
					</View>
					
					<View style={{ 
						marginTop: 12,
						padding: 12,
						backgroundColor: Colors.warning + '10',
						borderRadius: 8
					}}>
						<HStack style={{ alignItems: 'center' }}>
							<Icon name="lightbulb-on" size={16} color={Colors.warning} />
							<Text style={{ 
								marginLeft: 8,
								fontSize: 12,
								color: Colors.warning,
								fontWeight: '500'
							}}>
								This strategy will be used during negotiations to get you the best deals
							</Text>
						</HStack>
					</View>
				</View>
			) : (
				<View style={{ alignItems: 'center', padding: 32 }}>
					<Icon name="brain" size={48} color={Colors.grey} />
					<Text style={{ color: Colors.grey, marginTop: 8, textAlign: 'center' }}>
						AI is analyzing your requirements and creating a personalized negotiation strategy...
					</Text>
				</View>
			)}
			
			{!strategy && <OverlaySpinner message="Creating strategy..." />}
		</InfoCard>
	);
}

export default function StrategyScreen() {
    const { session } = useSessionAPI();

    if (!session)
        return <OverlaySpinner />;

    return (
        <View style={{ flex: 1 }}>
			{session?.customerInfo && (
				<CustomerInfoSection customerInfo={session.customerInfo} />
			)}

			{session.movers && session.movers.length > 0 && (
				<ProvidersSection providers={session.movers} rationale={session.moverRationale} />
			)}

			<StrategySection strategy={session.strategy} />
        </View>
    );
}
