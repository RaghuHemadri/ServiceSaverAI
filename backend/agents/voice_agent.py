import os
import json
import base64
import asyncio
import websockets
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.websockets import WebSocketDisconnect
from fastapi import BackgroundTasks
# from twilio.twiml.voice_response import VoiceResponse, Connect, Say, Stream
from twilio.twiml.voice_response import VoiceResponse, Gather, Connect, Say, Stream
from twilio.rest import Client
from dotenv import load_dotenv

from typing import Dict, List
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from voice_server import check_call_status, get_call_data, initiate_call_with_prompt
from .config import Config
from .state_models import State
from . import firebase
import time
import asyncio


voice_system_prompt = """You are an AI voice agent making calls to moving companies. You will act as the customer, by taking on the customer's name.
Your goal is to:
1. Introduce yourself professionally
2. Clearly describe the customer's moving needs
3. Get initial quote, and record the price
4. Apply negotiation strategy to get best price
5. Document all details of the conversation

Remember: Do not reveal you are an AI. Maintain a professional and friendly tone. Do not make up any information that you don't know about the customer."""

strategy_replanner_system_prompt = """
You are a strategic negotiator. Based on the customer requirements and available movers.
You need to create a detailed negotiation script that maximizes the customer's chances of getting the best price with good quality services.
Be concise and write the plan in less than 10 sentences, and key the main points.
Adapt the current strategy based on previous calls performed to other movers.
"""

conversation_text = (
                "You are an talking as the user of this platform initiating a conversation to enquire about moving services."
                "Your goal is to inquire about the moving services, asking for details, "
                "pricing, and availability. Maintain a neutral tone throughout "
                "the conversation. "
            )
strategy_summarizer_prompt = """You are a useful analyst that's good at summarizing details for key insights from past experiences."""

# voice agent proxy for debugging
def voice_agent_message(state: State):
    print(state.get("negotiation_strategy", None))
    negotiation_strategy = " Voice agent called!"
    return {
        "messages": [
            AIMessage(
                content=negotiation_strategy,
            )
        ]
    }

twilio_client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))

VOICE = 'alloy'
LOG_EVENT_TYPES = [
    'error', 'response.content.done', 'rate_limits.updated',
    'response.done', 'input_audio_buffer.committed',
    'input_audio_buffer.speech_stopped', 'input_audio_buffer.speech_started',
    'session.created'
]
SHOW_TIMING_MATH = False

INITIAL_PROMPT = (
    "You are an talking as the user of this platform initiating a conversation to inquire specifically about moving services for from one location to another. "
    "Your sole goal is to gather information about moving services, including details, pricing, and availability. "
    "You must adhere to the following strict rules at all times during the conversation: "
    "1. Do not provide any information or pretend to be the moving service provider. "
    "2. Do not provide answers or opinions outside the scope of asking questions about moving services. "
    "3. Always maintain a professional and neutral tone. "
    "4. If asked about anything unrelated to moving services, politely redirect the conversation back to the topic. "
    "For example: 'I am here to inquire about moving services. Could you please provide more details on that?' but don't reuse same line everytime. "
    "5. Do not make assumptions or create fictitious details. Only ask for information and clarify when needed."
    "6. If the other party's responses are unclear or ambiguous, politely ask for clarification. You can speak other languages if needed. like spanish, etc. if the user doesn't speak english and says stuff like 'no hablo inglis', but maintain the same instructions."
)

class VoiceAgent:
    def __init__(self, user_id, service_category: str = 'movers', model: str = Config.VOICE_MODEL):
        self.llm = ChatOpenAI(model=model)
        self.user_id = user_id
        self.service_category = service_category
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", voice_system_prompt),
            ("human", "Customer Info: {customer_info}\nNegotiation Strategy: {strategy}\nMover: {mover}")
        ])
        print("Exiting VoiceAgent.__init__")

    def __call__(self, state: Dict) -> Dict:
        print("Entering VoiceAgent.__call__")
        customer_info = state["customer_info"]
        strategy = state["negotiation_strategy"]
        movers = state["selected_movers"]

        print(f"Movers: {movers}")

        transcripts = []
        summary_of_calls = []
        strategies = [strategy.content]

        # firebase.update_status(self.user_id, firebase.AppStatus.NEGOTIATING)

        firebase.update_data(self.user_id, {
            "status": firebase.AppStatus.NEGOTIATING,
            "strategies": strategies,
            "transcripts": transcripts,
            "callSummaries": summary_of_calls,
        })

        # Check if we should use simulation mode or real calls
        use_simulation = os.getenv('USE_SIMULATION_MODE', 'true').lower() == 'true'
        
        for mover in movers:
            # Simulate phone call with each mover, do the phone call here
            # Modify the strategy based on the summary of the calls
            if len(summary_of_calls) > 0:
                strategy = self._modify_strategy(summary_of_calls, strategy)

                strategies.append(strategy)
                firebase.update_data(self.user_id, {
                    "strategies": strategies,
                })
            
            try:
                if use_simulation:
                    # Use simulation mode
                    print(f"SIMULATION MODE: Calling {mover['name']} at {mover.get('phone', 'N/A')}")
                    call_transcript, summary_of_call = self._simulate_call(customer_info, strategy, mover)
                else:
                    # Use real Twilio calls
                    # Use mover's actual phone number instead of hardcoded test number
                    phone_number = mover.get('phone', os.getenv('SAMPLE_MOVER_PHONE_NUMBER'))
                    print(f"REAL CALL: Calling {mover['name']} at {phone_number}")
                    
                    call_sid = initiate_call_with_prompt(
                        phone_number, 
                        INITIAL_PROMPT +  " " + str(customer_info) + " " + str(strategy), 
                        conversation_text,
                        self.user_id
                    )

                    # poll the call status
                    while True:
                        status = check_call_status(call_sid)
                        if status == "completed" or status == "busy" or status == "no-answer" or status == "failed" or status == "canceled":
                            print(f"Call {call_sid} status: {status}")
                            break
                        time.sleep(5)

                    call_transcript = get_call_data(call_sid)

                    if call_transcript is not None:
                        summary_of_call = self.summarize_call_transcript(call_transcript)
                    else:
                        summary_of_call = "Call transcript not found"
                        
            except Exception as e:
                print(f"Error initiating or processing call: {e}")
                summary_of_call = f"Call failed: {str(e)}"
                call_transcript = None

            
            print(f"Call transcript: {call_transcript}")
            print(f"Summary of call: {summary_of_call}")

            transcripts.append(call_transcript)
            summary_of_calls.append(summary_of_call)

            firebase.update_data(self.user_id, {
                "transcripts": transcripts,
                "callSummaries": summary_of_calls,
            })

        return {
            "call_transcripts": transcripts
        }

    def _simulate_call(self, customer_info, strategy, mover) -> tuple:
        """Simulate a phone call with a moving company"""
        
        # Create a more realistic simulation prompt
        call_prompt = ChatPromptTemplate.from_messages([
            ("system", """
            You are simulating a phone conversation between a customer and a moving company representative.
            You will play the role of the moving company representative from: {mover_name} with rating {rating} and specialties: {specialties}.
            
            The customer is calling to inquire about moving services. Respond professionally as a moving company representative would:
            1. Acknowledge their inquiry
            2. Ask clarifying questions about their move
            3. Provide a realistic quote based on the details given
            4. Respond to any negotiation attempts
            5. Keep the conversation realistic and professional
            
            Price Range: ${min_price} - ${max_price}
            Company Specialties: {specialties}
            Company Rating: {rating}/5 stars
            
            Be prepared to discuss:
            - Packing services (if they specialize in packing)
            - Long-distance moves (if they specialize in long-distance)
            - Timeline and scheduling
            - Insurance options
            - Final pricing
            
            Make the conversation feel authentic - include natural pauses, clarifications, and realistic business practices.
            """),
            ("human", """
            Customer Information: {customer_info}
            
            Customer's Negotiation Strategy: {strategy}
            
            Please simulate a realistic phone conversation where you respond as the moving company representative. 
            Include both sides of the conversation, clearly marking who is speaking.
            
            Format the response as a realistic phone conversation transcript with:
            Customer: [what they say]
            Representative: [your response]
            
            End with a final quote and any terms discussed.
            """),
        ])
        
        chain = call_prompt | self.llm
        response_of_call = chain.invoke({
            "customer_info": customer_info, 
            "strategy": strategy, 
            "mover_name": mover.get('name', 'Moving Company'),
            "rating": mover.get('rating', 4.0),
            "specialties": mover.get('specialties', 'general moving'),
            "min_price": mover.get('min_price', 1000),
            "max_price": mover.get('max_price', 5000)
        })

        # Summarize the call using the existing method
        summary_of_call = self.summarize_call_transcript(response_of_call.content)

        return response_of_call.content, summary_of_call

    def summarize_call_transcript(self, transcript: str) -> str:
        """
        Summarizes a call transcript and extracts key metrics like prices.
        
        Args:
            transcript (str): The call transcript to analyze
            
        Returns:
            str: A summary of the call with highlighted metrics
        """
        llm = ChatOpenAI(model=Config.ANALYST_MODEL)
        summary_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert at analyzing moving service call transcripts for an user.
                         Extract and highlight key information provided by the vendor including or similar to:
                         - Quoted prices (initial and final if negotiated)
                         - Service details offered
                         - Timeline/scheduling information
                         - Special requirements or conditions
                         - Notable negotiation points
                         
                         Format the metrics in a clear, structured way using bullet points.
                         Put prices and key numbers in **bold**."""),
            ("human", "Please analyze and summarize this call transcript, highlighting the key metrics and information: {transcript}")
        ])
        
        chain = summary_prompt | llm
        summary_response = chain.invoke({"transcript": transcript})
        
        return summary_response.content

    def _make_call(self, customer_info, strategy, mover) -> Dict:
        print("Entering VoiceAgent._make_call")
        
        # Summarize the call
        llm = ChatOpenAI(model=Config.ANALYST_MODEL)
        prompt = ChatPromptTemplate.from_messages([
            ("system", strategy_summarizer_prompt),
            ("human", "Summarize the call based on the following call transcript: {transcript}. Make sure to include the actual price from the call."),
        ])
        chain = prompt | llm
        response_summary = chain.invoke({"transcript": response_of_call.content})

        # Get call transcript from Twilio call
        try:
            response_of_call = initiate_call_with_prompt(os.getenv('SAMPLE_MOVER_PHONE_NUMBER'), strategy, "")
            
            # Use the new summarize method
            summary = self.summarize_call_transcript(response_of_call.content)
        except Exception as e:
            print(f"Error initiating call in _make_call: {e}")
            # Return empty content and error summary
            return "", f"Call failed: {str(e)}"
        
        print("Exiting VoiceAgent._make_call")
        return response_of_call.content, summary

    def _modify_strategy(self, summary_of_calls: List[str], strategy: str) -> str:
        # Implementation to modify the strategy based on the call transcript

        # Construct the prompt for the LLM to modify the strategy
        llm = ChatOpenAI(model=Config.ANALYST_MODEL)
        prompt = ChatPromptTemplate.from_messages([
            ("system", strategy_replanner_system_prompt),
            ("human", "Modify the strategy for calling a different seller based on the following call transcripts: {summary_of_calls}. If the summary is not there, just ignore it. Make sure to provide quantifiable information (e.g., previous negotiation price) to negotiate the price with the new mover, and ask the model to negotiate based on that and mention it explicitly. Don't output anything else."),
        ])
        chain = prompt | llm
        response = chain.invoke({ "summary_of_calls": summary_of_calls, "strategy": strategy })

        print("Exiting VoiceAgent._modify_strategy")
        return response.content

    def summarize_call_transcript(self, transcript: str) -> str:
        """
        Summarizes a call transcript and extracts key metrics like prices.
        
        Args:
            transcript (str): The call transcript to analyze
            
        Returns:
            str: A summary of the call with highlighted metrics
        """
        llm = ChatOpenAI(model=Config.ANALYST_MODEL)
        summary_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an summarizer who analyzing moving service call transcripts.
                         Extract and highlight key information like or similar to:
                         - Quoted prices (initial and final if negotiated)
                         - Service details offered
                         - Timeline/scheduling information
                         - Special requirements or conditions
                         - Notable negotiation points
                         
                         Format the metrics in a clear, structured way using bullet points.
                         Put prices and key numbers in **bold**."""),
            ("human", "Please analyze and summarize this call transcript, highlighting the key metrics and information: {transcript}")
        ])
        
        chain = summary_prompt | llm
        summary_response = chain.invoke({"transcript": transcript})
        
        return summary_response.content






