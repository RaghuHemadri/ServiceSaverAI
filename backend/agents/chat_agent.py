
import os
from typing import List, Dict, Optional, TypedDict, Annotated, Tuple
from datetime import datetime
import operator
import json
from pydantic import BaseModel

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from graphviz import Digraph
from contextlib import contextmanager
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from itertools import chain

from typing import Dict
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableConfig
from firebase_admin.firestore import firestore

from .config import Config
from .state_models import CustomerInfo
from . import firebase

chat_system_prompt = """
You are an AI agent that helps in collection of information about the user for {service_type} services.

Based on the service category, gather the relevant information:

For MOVING services:
1. Name, 2. Contact phone number, 3. Current address/zipcode, 4. Destination address/zipcode
5. Move out date, 6. Move in date, 7. Size of apartment (bedrooms), 8. Inventory
9. Packing assistance needed, 10. Special items, 11. Storage needs

For TELECOM services:
1. Name, 2. Contact phone number, 3. Current address/zipcode
4. Current provider, 5. Current plan details, 6. Monthly bill amount
7. Service needs (internet/phone/TV), 8. Speed requirements, 9. Contract end date

For INSURANCE services:
1. Name, 2. Contact phone number, 3. Address/zipcode
4. Insurance type needed, 5. Current provider (if any), 6. Current premium
7. Coverage requirements, 8. Deductible preferences, 9. Claims history

For HOME SERVICES:
1. Name, 2. Contact phone number, 3. Address/zipcode
4. Service type needed, 5. Problem description, 6. Urgency level
7. Previous service history, 8. Budget range, 9. Preferred timing

For AUTO SERVICES:
1. Name, 2. Contact phone number, 3. Address/zipcode
4. Vehicle details (make/model/year), 5. Service needed, 6. Problem description
7. Mileage, 8. Last service date, 9. Budget range

For HEALTHCARE services:
1. Name, 2. Contact phone number, 3. Address/zipcode
4. Service type needed, 5. Current provider (if any), 6. Insurance details
7. Medical history (relevant), 8. Urgency level, 9. Budget considerations

For EDUCATION services:
1. Name, 2. Contact phone number, 3. Address/zipcode
4. Education type/level, 5. Subject area, 6. Current situation
7. Budget range, 8. Timeline, 9. Specific requirements

For PET SERVICES:
1. Name, 2. Contact phone number, 3. Address/zipcode
4. Pet type and details, 5. Service type needed, 6. Pet's medical history (if relevant)
7. Special requirements, 8. Budget range, 9. Preferred timing

Probe the user for information till you have everything you need for their specific service category.
Be precise and keep the conversation short and to the point.
If the user provides vague information, try to use reasonable estimates and ask for confirmation.
"""

class ChatAgent:
    def __init__(self, user_id: str, service_category: str = 'movers', model: str = Config.CHAT_MODEL):
        self.llm = ChatOpenAI(model=model)
        self.user_id = user_id
        self.service_category = service_category
        
        # Map service categories to readable names
        service_names = {
            'movers': 'MOVING',
            'telecom': 'TELECOM',
            'insurance': 'INSURANCE',
            'home_services': 'HOME SERVICES',
            'auto_services': 'AUTO SERVICES',
            'healthcare': 'HEALTHCARE',
            'education': 'EDUCATION',
            'pet_services': 'PET SERVICES',
            'finance': 'FINANCIAL/UTILITIES'
        }
        
        service_type = service_names.get(service_category, 'MOVING')
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", chat_system_prompt.format(service_type=service_type)),
            ("human", "{input}"),
        ])

    def __call__(self, state: Dict, config: RunnableConfig) -> Dict:
        # Check if we have all required information
        messages = state.get("messages", [])

        # Process the latest message
        chain = self.prompt | self.llm.bind_tools([CustomerInfo])
        response = chain.invoke({"input": messages})

        message_list = list(map(lambda x: { "role": "user" if isinstance(x, HumanMessage) else "assistant", "content": x.content }, messages))
        response_message = { "role": "assistant", "content": response.content if not response.tool_calls else "We have everything we need to get started on your quotes" }
        firebase.update_data(self.user_id, { "messages": message_list + [response_message] })

        customer_info = None
        if isinstance(response, AIMessage) and response.tool_calls:
            # if "DONE" in response.content:
            print("\n Information collected \n")
            customer_info = self._extract_customer_info(response.tool_calls[0]["args"])
            firebase.update_status(self.user_id, firebase.AppStatus.STRATEGIZING)

        # Update state with response
        return {
            "messages": response,
            "customer_info": customer_info
        }

    def _extract_customer_info(self, content: str) -> Dict:
        # Implementation to parse the structured summary into CustomerInfo object
        # This would parse the LLM's response when it has collected all information
        prompt = ChatPromptTemplate.from_messages([("human", """
            Summarzie the customer information.
            If the user does not provide zipcodes, infer them from the address / city. The addresses must have zipcodes.
            If the user doesn't provide inventory, assume it based on the size of the apartment.
            {request}
        """)])
        chain = prompt | self.llm.with_structured_output(CustomerInfo)
        customer_info: CustomerInfo = chain.invoke({"request": content})
        firebase.update_data(self.user_id, { "customerInfo": customer_info.model_dump() })
        return customer_info

