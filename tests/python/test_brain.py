import json
from unittest.mock import MagicMock

import pytest

from neural_brain import NeuralCore


@pytest.fixture
def mock_memory_engine():
    engine = MagicMock()
    engine.retrieve_relevant_memory.return_value = []
    return engine

@pytest.fixture
def mock_endocrine_system():
    system = MagicMock()
    system.get_cognitive_modifiers.return_value = {"processing_mode": "NORMAL"}
    return system

def test_neural_core_init(mock_memory_engine, mock_endocrine_system):
    core = NeuralCore(mock_memory_engine, mock_endocrine_system)
    assert core.risk_tolerance == 0.5

def test_neural_core_process_input(mock_memory_engine, mock_endocrine_system):
    core = NeuralCore(mock_memory_engine, mock_endocrine_system)
    result_json = core.process_input("This is a long perception string", "test_intent", is_danger=False)
    result = json.loads(result_json)

    assert "action" in result
    assert "details" in result
    assert result["action"] == "NORMAL_OPERATION"
    mock_endocrine_system.update_hormones.assert_called_once_with(is_stressful=False, is_rewarding=True)

def test_neural_core_danger_mode(mock_memory_engine, mock_endocrine_system):
    mock_endocrine_system.get_cognitive_modifiers.return_value = {"processing_mode": "REACTIVE"}
    core = NeuralCore(mock_memory_engine, mock_endocrine_system)

    result_json = core.process_input("DANGER!", "flee", is_danger=True)
    result = json.loads(result_json)

    assert result["action"] == "EMERGENCY_ACTION_TRIGGERED"
    assert core.risk_tolerance < 0.5
