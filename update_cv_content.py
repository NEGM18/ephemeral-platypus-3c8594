import re
from bs4 import BeautifulSoup

def clean_text(text):
    # Remove null bytes
    text = text.replace('\x00', '')
    # Fix "O m a r" spacing issue
    if re.search(r'(\w\s){5,}', text): # If many single chars followed by space
        # Try to collapse spaces between letters but keep between words
        # Heuristic: if valid words form by removing spaces?
        # Simpler: just collapse all double spaces to single space, remove single spaces between chars? Too risky.
        # Let's assume standard extraction just added spaces between chars. 
        # "t e x t" -> "text"
        # "t e x t   w o r d" -> "text word"
        text = re.sub(r'(?<=\w) (?=\w)', '', text) # Remove space between word chars
        text = re.sub(r'  +', ' ', text) # Collapse multiple spaces
    return text

def parse_cv(cv_text):
    data = {}
    
    # Simple extraction logic based on keywords
    # This is a best-effort extraction
    
    # Name
    name_match = re.search(r'([A-Z][a-z]+ [A-Z][a-z]+)', cv_text)
    if name_match:
        data['name'] = name_match.group(1)
        
    # About / Profile
    profile_match = re.search(r'(Profile|Summary|About)([\s\S]*?)(Experience|Education|Skills|Projects)', cv_text, re.IGNORECASE)
    if profile_match:
        data['about'] = profile_match.group(2).strip()
    else:
        # Fallback: take first paragraph
        lines = [l for l in cv_text.split('\n') if l.strip()]
        if len(lines) > 2:
            data['about'] = lines[1] + " " + lines[2] # Guessing

    # Skills
    skills_match = re.search(r'Skills([\s\S]*?)(Experience|Education|Projects)', cv_text, re.IGNORECASE)
    if skills_match:
        skills_text = skills_match.group(1).strip()
        data['skills'] = [s.strip() for s in re.split(r'[,•\n]', skills_text) if s.strip()]

    return data

try:
    # Read CV
    with open("d:/my prot/cv_content.txt", "r", encoding="utf-16") as f:
        cv_content = f.read()
    
    clean_cv = clean_text(cv_content)
    print("Cleaned CV Start:", clean_cv[:100])
    
    cv_data = parse_cv(clean_cv)
    print("Extracted Data:", cv_data)

    # Update HTML
    with open("d:/my prot/index.html", "r", encoding="utf-8") as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')

    # Update About Section
    if 'about' in cv_data and cv_data['about']:
        about_p = soup.select_one('#about .about-text p')
        if about_p:
            about_p.string = cv_data['about']
            
    # Update Skills
    if 'skills' in cv_data and cv_data['skills']:
        skills_ul = soup.select_one('.skills-list')
        if skills_ul:
            skills_ul.clear()
            for skill in cv_data['skills'][:10]: # Limit to 10
                li = soup.new_tag('li')
                li.string = skill
                skills_ul.append(li)

    # Save HTML
    with open("d:/my prot/index.html", "w", encoding="utf-8") as f:
        f.write(str(soup))
        
    print("index.html updated successfully.")

except Exception as e:
    print(f"Error: {e}")
