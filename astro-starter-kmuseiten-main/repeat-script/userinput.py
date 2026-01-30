# userinput.py - DIRECT ACCESS VERSION - No waiting needed!
# ALWAYS looks for user_input.txt in the PROJECT ROOT, not subdirectories
import os

print("🔄 Direct File Access Mode")
print("📝 AI can read user_input.txt immediately - no waiting!")
print("💡 Just save your message in 'user_input.txt' before running script")
print("-" * 50)

# IMPORTANT: Always use the PROJECT ROOT for user_input.txt
# This ensures we find it regardless of which subdirectory we're in
# The project root is the parent of the repeat-script folder
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

# Always use absolute path to project root's user_input.txt
input_file = os.path.join(project_root, "user_input.txt")
processed_file = os.path.join(project_root, "input_processed.txt")

# Check if user_input.txt already exists (user prepared it)
if os.path.exists(input_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        user_input = f.read().strip()
    
    if user_input.lower() == "stop":
        print("🛑 Stop command received")
    else:
        print(f"✅ Received: {user_input}")
        print("🤖 AI can now process this request immediately!")
        print("-" * 50)
        
        # Create processed marker in project root
        with open(processed_file, 'w', encoding='utf-8') as f:
            f.write("processed")
    
    # Delete the user_input.txt after reading to prevent re-reading
    os.remove(input_file)
else:
    print("⚠️ No user_input.txt found. Please create it with your message first.")
    print(f"📂 Expected location: {input_file}")
    print("💡 The AI will read it directly - no waiting needed!")
