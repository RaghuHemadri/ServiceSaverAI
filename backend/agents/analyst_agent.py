from typing import Dict
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from .config import Config
from . import firebase
from ..prompts.prompt_manager import prompt_manager

class AnalystAgent:
    def __init__(self, user_id: str, service_category: str = 'movers', model: str = Config.ANALYST_MODEL):
        self.llm = ChatOpenAI(model=model)
        self.user_id = user_id
        self.service_category = service_category
        
        # Load service-specific analyst prompt
        analyst_prompt = prompt_manager.get_prompt(service_category, 'analyst_system')
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", analyst_prompt),
            ("human", "Based on the call transcripts: {transcripts}, provide your analysis and recommendation.")
        ])

class AnalystAgent:
    def __init__(self, user_id: str, service_category: str = 'movers', model: str = Config.ANALYST_MODEL):
        self.llm = ChatOpenAI(model=model)
        self.user_id = user_id
        self.service_category = service_category
        
        # Load service-specific analyst prompt
        analyst_prompt = prompt_manager.get_prompt(service_category, 'analyst_system')
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", analyst_prompt),
            ("human", "Customer Info: {customer_info}\nCall Transcripts: {transcripts}")
        ])

    def __call__(self, state: Dict) -> Dict:
        customer_info = state.get("customer_info", None)
        transcripts = state.get("call_transcripts", None)

        print(f"Analysing quotes")

        chain = self.prompt | self.llm
        response = chain.invoke({"customer_info": customer_info,"transcripts": transcripts})

        print(f"FINAL RECOMMENDATION: {response.content}")

        firebase.update_data(self.user_id, {
            "status": firebase.AppStatus.COMPLETED,
            "recommendation": response.content,
            # "messages": response,
        })

        return {
            "messages": response,
            "final_recommendation": response.content
        }