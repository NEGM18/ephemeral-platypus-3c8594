import sys

def clean_text(text):
    # Remove null bytes just in case
    text = text.replace('\x00', '')
    # If it looks like "O m a r", try to fix it
    if text.count(' ') > len(text) / 3: # Heuristic
        # It might be wide char printing
        pass
    return text

try:
    # Try reading as utf-16 (PowerShell default for > redirection)
    with open("d:/my prot/cv_content.txt", "r", encoding="utf-16") as f:
        content = f.read()
        
    # Check if we need to remove extra spaces (simple heuristic)
    # If "O m a r" -> "Omar"
    # But be careful not to remove real spaces.
    # Let's just print it properly first.
    
    sys.stdout.reconfigure(encoding='utf-8')
    print(content)

except Exception as e:
    print(f"Error: {e}")
