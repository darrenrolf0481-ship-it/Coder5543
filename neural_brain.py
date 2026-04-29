from typing import List, Dict, Optional, Any, Tuple
import time
import json

class NeuralCore:
    """
    Core neural processing unit for the AI brain.
    
    This class handles the primary cognitive functions, including input processing,
    memory retrieval, and decision-making based on the current hormonal state.
    """

    def __init__(self, memory_engine: Any, endocrine_system: Any):
        """
        Initializes the NeuralCore.

        Args:
            memory_engine (Any): The engine responsible for memory persistence and retrieval.
            endocrine_system (Any): The system managing hormonal states and chemical regulation.
        """
        self.memory_engine = memory_engine
        self.endocrine_system = endocrine_system
        self.risk_tolerance = 0.5  # Default risk tolerance

    def process_input(self, perception: str, intent: str, is_danger: bool) -> str:
        """
        Processes sensory input and determines the appropriate response.

        Args:
            perception (str): The raw sensory perception.
            intent (str): The interpreted intent of the perception.
            is_danger (bool): Flag indicating if the input is perceived as dangerous.

        Returns:
            str: The determined action or response as a JSON string.
        """
        # 1. Chemical Reaction & Feedback Loop
        is_rewarding = not is_danger and len(perception) > 10 # Simulated reward
        self.endocrine_system.update_hormones(is_stressful=is_danger, is_rewarding=is_rewarding)
        modifiers = self.endocrine_system.get_cognitive_modifiers()
        
        # Adjust risk tolerance based on feedback
        self._adjust_risk_tolerance(is_danger, is_rewarding)

        # 2. Memory Retrieval
        past_experiences = self.memory_engine.retrieve_relevant_memory(intent, limit=5)

        # 3. Reasoning
        if modifiers.get('processing_mode') == "REACTIVE":
            action, details = self._handle_reactive_mode()
        else:
            action = self._analyze_and_decide(past_experiences, self.risk_tolerance)
            details = {"reason": "Analyzed past experiences", "risk_tolerance": self.risk_tolerance}
        
        return json.dumps({"action": action, "details": details})

    def _adjust_risk_tolerance(self, is_stressful: bool, is_rewarding: bool):
        """
        Simulates adjusting risk tolerance based on stress or reward signals.
        """
        if is_stressful:
            self.risk_tolerance = max(0.1, self.risk_tolerance - 0.1) # Stress reduces risk tolerance
        elif is_rewarding:
            self.risk_tolerance = min(1.0, self.risk_tolerance + 0.05) # Reward increases risk tolerance
        else:
            # Gradually return to baseline
            if self.risk_tolerance < 0.5:
                self.risk_tolerance = min(0.5, self.risk_tolerance + 0.02)
            elif self.risk_tolerance > 0.5:
                self.risk_tolerance = max(0.5, self.risk_tolerance - 0.02)


    def _handle_reactive_mode(self) -> Tuple[str, Dict[str, str]]:
        """
        Handles reactive processing mode.

        Returns:
            Tuple[str, Dict[str, str]]: The action and details for reactive mode.
        """
        return "EMERGENCY_ACTION_TRIGGERED", {"reason": "Reactive mode triggered due to danger"}

    def _analyze_and_decide(self, memories: List[Dict[str, Any]], risk_tolerance: float) -> str:
        """
        Analyzes past memories and risk tolerance to make a decision.
        """
        negative_memories = [m for m in memories if m.get('outcome_value', 0) < 0]
        if negative_memories and risk_tolerance < 0.3:
            return "CAUTIOUS_APPROACH"
        return "NORMAL_OPERATION"

class MemoryInterface:
    """
    Interface for memory retrieval operations.
    """

    def retrieve_relevant_memory(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """
        Simulates retrieving relevant memories based on a query with memory decay.
        Older memories have reduced relevance compared to newer, similar memories.

        Args:
            query (str): The search query or intent.
            limit (int): The maximum number of memories to retrieve.

        Returns:
            List[Dict[str, Any]]: A list of simulated memory dictionaries.
        """
        import math
        current_time = time.time()
        
        # Placeholder simulation with diverse memories
        # Added base_relevance to simulate matching score before decay
        memories = [
            {"id": 1, "intent": query, "outcome_value": 0.8, "context": "Successful task completion in low-stress environment.", "timestamp": current_time - 100, "base_relevance": 0.9},
            {"id": 2, "intent": query, "outcome_value": -0.6, "context": "Failed attempt due to resource constraints.", "timestamp": current_time - 3600, "base_relevance": 0.85},
            {"id": 3, "intent": query, "outcome_value": 0.2, "context": "Neutral outcome, minor efficiency gain.", "timestamp": current_time - 7200, "base_relevance": 0.7},
            {"id": 4, "intent": query, "outcome_value": -0.9, "context": "Critical failure, system instability detected.", "timestamp": current_time - 86400, "base_relevance": 0.95},
            {"id": 5, "intent": query, "outcome_value": 0.5, "context": "Moderate success, optimized path found.", "timestamp": current_time - 172800, "base_relevance": 0.8}
        ]
        
        # Apply exponential temporal decay
        decay_rate = 0.00005
        for mem in memories:
            age_seconds = max(0, current_time - mem["timestamp"])
            mem["relevance"] = mem["base_relevance"] * math.exp(-decay_rate * age_seconds)
            
        # Sort memories by the computed decayed relevance score
        memories.sort(key=lambda x: x["relevance"], reverse=True)
        
        return memories[:limit]
