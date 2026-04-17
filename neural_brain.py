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

        Args:
            memories (List[Dict[str, Any]]): A list of past experiences.
            risk_tolerance (float): The current risk tolerance level.

        Returns:
            str: The final decision string.
        """
        negative_memories = [m for m in memories if m.get('outcome_value', 0) < 0]
        return self._evaluate_risk(negative_memories, risk_tolerance)

    def _evaluate_risk(self, negative_memories: List[Dict[str, Any]], risk_tolerance: float) -> str:
        """
        Evaluates risk based on negative memories and tolerance.

        Args:
            negative_memories (List[Dict[str, Any]]): A list of negative experiences.
            risk_tolerance (float): The current risk tolerance level.

        Returns:
            str: The decision string.
        """
        if negative_memories and risk_tolerance < 0.3:
            return "CAUTIOUS_APPROACH"
        return "NORMAL_OPERATION"

    def _trace_neural_path(self, path_identifier: str) -> None:
        """
        Simulates tracing neural activity by logging timestamps and a path identifier.

        Args:
            path_identifier (str): The identifier for the neural process being traced.
        """
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        print(f"[{timestamp}] TRACE: {path_identifier}")

class MemoryInterface:
    """
    Interface for memory retrieval operations.
    """

    def retrieve_relevant_memory(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """
        Simulates retrieving relevant memories based on a query.

        Args:
            query (str): The search query or intent.
            limit (int): The maximum number of memories to retrieve.

        Returns:
            List[Dict[str, Any]]: A list of simulated memory dictionaries.
        """
        # Placeholder simulation with diverse memories
        memories = [
            {"id": 1, "intent": query, "outcome_value": 0.8, "context": "Successful task completion in low-stress environment.", "timestamp": time.time() - 100},
            {"id": 2, "intent": query, "outcome_value": -0.6, "context": "Failed attempt due to resource constraints.", "timestamp": time.time() - 3600},
            {"id": 3, "intent": query, "outcome_value": 0.2, "context": "Neutral outcome, minor efficiency gain.", "timestamp": time.time() - 7200},
            {"id": 4, "intent": query, "outcome_value": -0.9, "context": "Critical failure, system instability detected.", "timestamp": time.time() - 86400},
            {"id": 5, "intent": query, "outcome_value": 0.5, "context": "Moderate success, optimized path found.", "timestamp": time.time() - 172800}
        ]
        return memories[:limit]
