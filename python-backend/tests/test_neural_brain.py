"""Smoke tests for the NeuralCore and MemoryInterface classes."""

import json
from unittest.mock import MagicMock

import pytest

from neural_brain import MemoryInterface, NeuralCore


class TestNeuralCore:
    """Tests for the NeuralCore class."""

    @pytest.fixture
    def mock_memory(self):
        """Return a mock memory engine."""
        engine = MagicMock()
        engine.retrieve_relevant_memory.return_value = []
        return engine

    @pytest.fixture
    def mock_endocrine(self):
        """Return a mock endocrine system."""
        system = MagicMock()
        system.get_cognitive_modifiers.return_value = {"processing_mode": "ANALYTICAL"}
        return system

    @pytest.fixture
    def core(self, mock_memory, mock_endocrine):
        """Return a NeuralCore instance with mocked dependencies."""
        return NeuralCore(memory_engine=mock_memory, endocrine_system=mock_endocrine)

    def test_instantiation(self, core):
        """NeuralCore should instantiate with default risk tolerance."""
        assert core.risk_tolerance == 0.5

    def test_process_input_returns_json(self, core, mock_endocrine):
        """process_input should return a valid JSON string."""
        mock_endocrine.get_cognitive_modifiers.return_value = {"processing_mode": "ANALYTICAL"}
        result = core.process_input("hello world", "greeting", is_danger=False)
        parsed = json.loads(result)
        assert "action" in parsed
        assert "details" in parsed

    def test_process_input_reactive_mode(self, core, mock_endocrine):
        """process_input should trigger emergency action in reactive mode."""
        mock_endocrine.get_cognitive_modifiers.return_value = {"processing_mode": "REACTIVE"}
        result = core.process_input("danger", "alert", is_danger=True)
        parsed = json.loads(result)
        assert parsed["action"] == "EMERGENCY_ACTION_TRIGGERED"

    def test_adjust_risk_tolerance_stress(self, core):
        """Stress should decrease risk tolerance."""
        core.risk_tolerance = 0.5
        core._adjust_risk_tolerance(is_stressful=True, is_rewarding=False)
        assert core.risk_tolerance < 0.5

    def test_adjust_risk_tolerance_reward(self, core):
        """Reward should increase risk tolerance."""
        core.risk_tolerance = 0.5
        core._adjust_risk_tolerance(is_stressful=False, is_rewarding=True)
        assert core.risk_tolerance > 0.5

    def test_adjust_risk_tolerance_bounds(self, core):
        """Risk tolerance should stay within [0.1, 1.0]."""
        core.risk_tolerance = 0.15
        core._adjust_risk_tolerance(is_stressful=True, is_rewarding=False)
        assert core.risk_tolerance >= 0.1

        core.risk_tolerance = 0.95
        core._adjust_risk_tolerance(is_stressful=False, is_rewarding=True)
        assert core.risk_tolerance <= 1.0

    def test_handle_reactive_mode(self, core):
        """_handle_reactive_mode should return emergency action."""
        action, details = core._handle_reactive_mode()
        assert action == "EMERGENCY_ACTION_TRIGGERED"
        assert "reason" in details

    def test_analyze_and_decide_cautious(self, core):
        """Low risk tolerance with negative memories should yield caution."""
        memories = [{"outcome_value": -1.0}]
        result = core._analyze_and_decide(memories, risk_tolerance=0.2)
        assert result == "CAUTIOUS_APPROACH"

    def test_analyze_and_decide_normal(self, core):
        """High risk tolerance should yield normal operation."""
        memories = [{"outcome_value": -1.0}]
        result = core._analyze_and_decide(memories, risk_tolerance=0.5)
        assert result == "NORMAL_OPERATION"

    def test_analyze_and_decide_no_negative_memories(self, core):
        """No negative memories should yield normal operation."""
        memories = [{"outcome_value": 0.5}]
        result = core._analyze_and_decide(memories, risk_tolerance=0.1)
        assert result == "NORMAL_OPERATION"


class TestMemoryInterface:
    """Tests for the MemoryInterface class."""

    def test_retrieve_relevant_memory_structure(self):
        """retrieve_relevant_memory should return a list of dicts with expected keys."""
        mem = MemoryInterface()
        results = mem.retrieve_relevant_memory("test query", limit=3)
        assert isinstance(results, list)
        assert len(results) == 3
        for item in results:
            assert "id" in item
            assert "intent" in item
            assert "outcome_value" in item
            assert "context" in item
            assert "timestamp" in item
            assert "relevance" in item

    def test_retrieve_relevant_memory_decay(self):
        """More recent memories should have higher relevance than older ones."""
        mem = MemoryInterface()
        results = mem.retrieve_relevant_memory("query", limit=5)
        # Results are sorted by relevance descending
        for i in range(len(results) - 1):
            assert results[i]["relevance"] >= results[i + 1]["relevance"]

    def test_retrieve_relevant_memory_respects_limit(self):
        """The limit parameter should be respected."""
        mem = MemoryInterface()
        results = mem.retrieve_relevant_memory("query", limit=2)
        assert len(results) == 2
