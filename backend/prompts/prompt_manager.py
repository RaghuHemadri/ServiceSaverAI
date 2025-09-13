"""
Prompt Manager - Centralized prompt loading and management for different service categories
"""

import os
from typing import Dict, Optional
import json
from pathlib import Path

class PromptManager:
    """Manages loading and access to service-specific prompts"""
    
    def __init__(self, prompts_dir: str = None):
        if prompts_dir is None:
            prompts_dir = Path(__file__).parent
        self.prompts_dir = Path(prompts_dir)
        self._prompts_cache = {}
    
    def get_prompt(self, service_category: str, prompt_type: str) -> str:
        """
        Get a specific prompt for a service category.
        
        Args:
            service_category: e.g., 'movers', 'telecom', 'insurance'
            prompt_type: e.g., 'chat_system', 'voice_system', 'strategist_system'
        
        Returns:
            The prompt string
        """
        cache_key = f"{service_category}_{prompt_type}"
        
        if cache_key in self._prompts_cache:
            return self._prompts_cache[cache_key]
        
        # Try to load from service-specific file first
        prompt_file = self.prompts_dir / service_category / f"{prompt_type}.txt"
        
        if prompt_file.exists():
            with open(prompt_file, 'r', encoding='utf-8') as f:
                prompt = f.read().strip()
                self._prompts_cache[cache_key] = prompt
                return prompt
        
        # Fallback to default movers prompts if service-specific doesn't exist
        fallback_file = self.prompts_dir / "movers" / f"{prompt_type}.txt"
        if fallback_file.exists():
            with open(fallback_file, 'r', encoding='utf-8') as f:
                prompt = f.read().strip()
                # Adapt the prompt for the current service
                adapted_prompt = self._adapt_prompt_for_service(prompt, service_category)
                self._prompts_cache[cache_key] = adapted_prompt
                return adapted_prompt
        
        raise FileNotFoundError(f"Prompt not found: {service_category}/{prompt_type}")
    
    def get_all_prompts(self, service_category: str) -> Dict[str, str]:
        """Get all prompts for a service category"""
        service_dir = self.prompts_dir / service_category
        prompts = {}
        
        if service_dir.exists():
            for prompt_file in service_dir.glob("*.txt"):
                prompt_type = prompt_file.stem
                prompts[prompt_type] = self.get_prompt(service_category, prompt_type)
        
        return prompts
    
    def _adapt_prompt_for_service(self, prompt: str, service_category: str) -> str:
        """Adapt a generic prompt for a specific service category"""
        service_mappings = {
            'movers': {
                'service_name': 'moving companies',
                'service_type': 'moving services',
                'provider_name': 'movers',
                'action_verb': 'move'
            },
            'telecom': {
                'service_name': 'telecom providers',
                'service_type': 'telecom services',
                'provider_name': 'providers',
                'action_verb': 'provide service'
            },
            'insurance': {
                'service_name': 'insurance companies',
                'service_type': 'insurance services',
                'provider_name': 'insurers',
                'action_verb': 'provide coverage'
            },
            'home_services': {
                'service_name': 'home service providers',
                'service_type': 'home services',
                'provider_name': 'contractors',
                'action_verb': 'provide services'
            },
            'auto_services': {
                'service_name': 'auto service shops',
                'service_type': 'auto services',
                'provider_name': 'mechanics',
                'action_verb': 'service vehicles'
            },
            'healthcare': {
                'service_name': 'healthcare providers',
                'service_type': 'healthcare services',
                'provider_name': 'providers',
                'action_verb': 'provide care'
            },
            'education': {
                'service_name': 'educational institutions',
                'service_type': 'educational services',
                'provider_name': 'institutions',
                'action_verb': 'provide education'
            },
            'pet_services': {
                'service_name': 'pet service providers',
                'service_type': 'pet services',
                'provider_name': 'providers',
                'action_verb': 'care for pets'
            },
            'finance': {
                'service_name': 'financial institutions',
                'service_type': 'financial services',
                'provider_name': 'institutions',
                'action_verb': 'provide financial services'
            }
        }
        
        mapping = service_mappings.get(service_category, service_mappings['movers'])
        
        # Replace generic terms with service-specific ones
        adapted_prompt = prompt
        adapted_prompt = adapted_prompt.replace('moving companies', mapping['service_name'])
        adapted_prompt = adapted_prompt.replace('moving services', mapping['service_type'])
        adapted_prompt = adapted_prompt.replace('movers', mapping['provider_name'])
        adapted_prompt = adapted_prompt.replace('Movers', mapping['provider_name'].title())
        
        return adapted_prompt
    
    def list_available_services(self) -> list:
        """List all available service categories"""
        return [d.name for d in self.prompts_dir.iterdir() if d.is_dir() and not d.name.startswith('_')]
    
    def validate_prompts(self, service_category: str) -> Dict[str, bool]:
        """Validate that all required prompts exist for a service"""
        required_prompts = [
            'chat_system',
            'strategist_system', 
            'voice_system',
            'analyst_system',
            'voice_initial',
            'provider_filter'
        ]
        
        validation = {}
        for prompt_type in required_prompts:
            try:
                self.get_prompt(service_category, prompt_type)
                validation[prompt_type] = True
            except FileNotFoundError:
                validation[prompt_type] = False
        
        return validation


# Global instance
prompt_manager = PromptManager()
