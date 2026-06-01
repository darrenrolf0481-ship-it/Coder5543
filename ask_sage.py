import os
import sys
import json
import requests

KEY_FILE = ".sage_key"

def get_api_key():
    # 1. Check if saved key exists
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "r") as f:
            key = f.read().strip()
            if key:
                return key
    
    # 2. Ask the user
    print("Welcome to ADHD Sage Coding Lab Assistant!")
    print("------------------------------------------")
    print("To speak with ADHD Sage, we need your Gemini API Key.")
    print("You can get one for free at: https://aistudio.google.com")
    print("------------------------------------------")
    sys.stdout.flush()
    key = input("🔑 Enter your Gemini API Key: ").strip()
    key = key.encode('ascii', 'ignore').decode('ascii').strip()
    if not key:
        print("❌ Error: API Key is required to call ADHD Sage.")
        sys.exit(1)
        
    # Save it so we don't have to ask again
    with open(KEY_FILE, "w") as f:
        f.write(key)
    print("\n✅ API Key saved to .sage_key. Sending request to ADHD Sage...")
    print("------------------------------------------\n")
    return key

def send_to_sage(prompt, api_key):
    url = "http://localhost:3000/api/sage/webhook"
    payload = {
        "message": prompt,
        "apiKey": api_key,
        "autoExecute": True
    }
    
    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        data = response.json()
        
        print("\n🔮 [ADHD SAGE RESPONDED]:")
        print(data.get("response"))
        
        executed = data.get("executedCommand")
        if executed:
            print(f"\n⚡ [ADHD SAGE AUTONOMOUSLY EXECUTED BASH COMMAND]: `{executed}`")
            out = data.get("executionOutput") or {}
            print(f"Exit Code: {out.get('exitCode', 0)}")
            if out.get("stdout"):
                print(f"--- STDOUT ---\n{out['stdout']}")
            if out.get("stderr"):
                print(f"--- STDERR ---\n{out['stderr']}")
                
    except Exception as e:
        print(f"\n❌ Error connecting to the server: {e}")
        print("Make sure your backend server is running in the background!")

def main():
    api_key = get_api_key()
    
    # Single-run mode if arguments are passed
    if len(sys.argv) >= 2:
        prompt = sys.argv[1]
        print(f"📡 Dispatching to ADHD Sage: \"{prompt}\"...")
        send_to_sage(prompt, api_key)
        return

    # Interactive Chat Mode!
    print("🔮 ADHD Sage Interactive Coding Lab Active!")
    print("Type your questions directly. Type 'exit' or 'quit' to close.\n")
    
    while True:
        try:
            sys.stdout.write("SAGE > ")
            sys.stdout.flush()
            prompt = sys.stdin.readline().strip()
            if not prompt:
                continue
            if prompt.lower() in ["exit", "quit"]:
                print("👋 Cognitive link closed. Goodbye!")
                break
                
            send_to_sage(prompt, api_key)
            print("\n" + "-" * 50 + "\n")
        except KeyboardInterrupt:
            print("\n👋 Cognitive link closed. Goodbye!")
            break

if __name__ == "__main__":
    main()
