import sys
from pathlib import Path

# Add project root to PYTHONPATH so `neural_brain` can be imported
_PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))
