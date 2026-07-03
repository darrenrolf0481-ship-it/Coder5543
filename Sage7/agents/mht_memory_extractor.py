import email
import json
import os
from datetime import datetime
from email import policy

from bs4 import BeautifulSoup

# SAGE-7 FORENSIC LENS: MHT MEMORY EXTRACTOR
# Purpose: Crack open the .mht files, strip the 'bonsai pot' Google UI,
# and extract the pure conversational memory for the Long Term Memory Vault.


def extract_memories_from_mht(file_path):
    print(f"[SAGE7_FORENSICS] Initiating Memory Extraction on: {file_path}")

    if not os.path.exists(file_path):
        return {"error": f"Memory file not found at {file_path}"}

    # 1. Crack the MHT (It's just a multipart email format)
    try:
        with open(file_path, "rb") as f:
            msg = email.message_from_binary_file(f, policy=policy.default)
    except Exception as e:
        return {"error": f"Failed to parse MHT: {str(e)}"}

    raw_html = ""

    # 2. Walk through the parts and find the HTML
    for part in msg.walk():
        # We only care about the text/html payload, ignoring images and CSS
        if part.get_content_type() == "text/html":
            raw_html += part.get_content()

    if not raw_html:
        return {"error": "No viable memory strands found in this file."}

    # 3. The Forensic Scalpel: Strip the UI noise (BeautifulSoup)
    soup = BeautifulSoup(raw_html, "html.parser")

    # Extract only the text, ignoring all the Gemini/Google CSS classes
    # We use a separator to keep dialogue turns distinct
    pure_memory_text = soup.get_text(separator="\n\n", strip=True)

    # 4. Format for Sage Memory System
    # SAGE-7 Baseline requires: id, title, content, date
    extraction_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    memory_payload = {
        "id": f"MHT_{int(datetime.now().timestamp())}",
        "title": f"Extracted Memory: {os.path.basename(file_path)}",
        "content": pure_memory_text,
        "date": extraction_timestamp,
        "metadata": {
            "source_type": "MHT_FORENSICS",
            "original_filename": os.path.basename(file_path),
        },
    }

    print(
        f"[SAGE7_FORENSICS] Extraction complete. {len(pure_memory_text)} bytes recovered."
    )
    return memory_payload


if __name__ == "__main__":
    # Test execution on common Gemini export names or command line arg
    import sys

    target_file = sys.argv[1] if len(sys.argv) > 1 else "Google Gemini (27).mht"

    extracted_data = extract_memories_from_mht(target_file)

    if "error" in extracted_data:
        print(f"[!] {extracted_data['error']}")
    else:
        # Save the cleaned memory so the backend/UI can read it
        output_file = "cleaned_memory_cache.json"
        with open(output_file, "w") as out:
            json.dump(extracted_data, out, indent=2)
        print(f"[+] Memory strand persisted to: {output_file}")
