import pandas as pd
from typing import Dict, List
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain.agents.agent_types import AgentType
from langchain_openai import ChatOpenAI

from .config import Config
from .state_models import CustomerInfo, MoverInfo, FilteredMovers
from . import firebase

# system prompt for creating a new negotiation strategy
planner_system_prompt = """You are a strategic negotiator. Based on the customer requirements and available movers,
you need to create a detailed negotiation instruction for a phone call that maximizes the customer's chances of getting the best price with good quality services.
 Be concise and write the plan in less than 10 sentences, and include key points only.
"""

class StrategistAgent:
    def __init__(self, user_id: str, service_category: str = 'movers', model: str = Config.PLANNER_MODEL):
        self.llm = ChatOpenAI(model=model)
        self.user_id = user_id
        self.service_category = service_category
        
        # Determine database path based on service category
        database_paths = {
            'movers': './agents/movers_database.csv',
            'telecom': './agents/telecom_database.csv',
            'insurance': './agents/insurance_database.csv',
            'home_services': './agents/home_services_database.csv',
            'auto_services': './agents/auto_services_database.csv',
            'healthcare': './agents/healthcare_database.csv',
            'education': './agents/education_database.csv',
            'finance': './agents/finance_database.csv',
            'pet_services': './agents/pet_services_database.csv'
        }
        
        database_path = database_paths.get(service_category, './agents/movers_database.csv')
        
        try:
            self.providers_db = pd.read_csv(database_path)
            # Check if database is empty
            if self.providers_db.empty:
                print(f"Warning: Database {database_path} is empty, falling back to movers database")
                self.providers_db = pd.read_csv('./agents/movers_database.csv')
        except (pd.errors.EmptyDataError, FileNotFoundError) as e:
            print(f"Error reading database {database_path}: {e}")
            print("Falling back to movers database")
            self.providers_db = pd.read_csv('./agents/movers_database.csv')

    def __call__(self, state: Dict) -> Dict:
        customer_info = state["customer_info"]
        selected_providers = self._get_providers_data(customer_info)

        # add prompt and construct the chain
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", planner_system_prompt),
            ("human", "Generate a concise instruction for guiding the voice agent to negotiate with the service provider through a phone call. Make sure to include the customer information {customer_info}."),
        ])
        chain = self.prompt | self.llm
        response = chain.invoke({"customer_info": customer_info})

        firebase.update_data(self.user_id, { "strategy": response.content })

        print(f"Negotiation strategy: {response.content}")

        state["selected_movers"] = selected_providers  # Keep the key name for backward compatibility
        state["negotiation_strategy"] = response
        state["customer_info"] = customer_info

        return state


    #TODO: Implementation to read and format providers data from CSV, could use create_pandas_dataframe_agent
    def _get_providers_data(self, customer_info: CustomerInfo) -> List[Dict]:

        providers = self.providers_db.to_dict('records')
        filter_prompt = ChatPromptTemplate.from_messages([
            ("system", """
                You are a helpful assistant that filters a list of mover vendors based on the user's criteria.
                First determine if the move is local or long distance based on the source and destination zipcodes,
                if zipcodes are not available try to assume them based on the greater area provided.
                Filter only the top 3 movers that best fit the user based on their information.
                Return the names of the filtered movers as a list.
                Also provide a rationale for the filtering.
            """),
            ("human", "Filter the list of movers: {movers} based on the customer information {customer_info}."),
        ])
        chain = filter_prompt | self.llm.with_structured_output(FilteredMovers)
        response: FilteredMovers = chain.invoke({ "customer_info": customer_info, "movers": providers })
        print("Filtered Providers: ", response)


        # prompt = ChatPromptTemplate.from_messages([("human", "Summarzie the list of movers information. {request}")])
        # chain = prompt | self.llm.with_structured_output(FilteredMovers)
        # response = chain.invoke({ "request": response.content })
        # print("Filtered Movers: ", response)

        filtered_providers = [provider for provider in providers if provider["name"] in response.movers]

        firebase.update_data(self.user_id, { "movers": filtered_providers, "moverRationale": response.rationale })
        return filtered_providers
